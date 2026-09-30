import "server-only";
import { enviar, TIMEOUTS } from "./cliente";
import { falha, registrarErroBackend, type Resultado } from "./erros";
import type { CadastroCompleto } from "@/lib/cadastro/montar";

/**
 * `POST /cadastro` — a primeira escrita do webapp no backend V2G.
 *
 * Desenho em `docs/disparo-pipeline.md`. O que importa saber antes de
 * mexer aqui:
 *
 * ESTA CHAMADA CRIA UMA EXECUÇÃO, e uma execução criada pode ser pega
 * pelo n8n e virar gasto de LLM e de imagem. Não é `GET`. Não é
 * idempotente do lado de lá — duas chamadas fazem duas execuções.
 *
 * A idempotência é toda daqui, e mora em `lib/pipeline/disparar.ts`.
 * Nunca chame esta função direto de uma tela ou de uma Server Action:
 * ela não tem trava nenhuma, de propósito, porque a trava precisa
 * envolver a gravação de estado local que acontece em volta dela.
 */

/** Os seis estados que o backend declara em `EstadoExecucao`. */
export const ESTADOS_DE_EXECUCAO = [
  "cadastro_completo",
  "pipeline_texto_rodando",
  "aguardando_fotos",
  "gerando_criativo",
  "estrutura_pronta",
  "gerado",
] as const;

export type EstadoExecucao = (typeof ESTADOS_DE_EXECUCAO)[number];

/**
 * O status como ele chega. `{ desconhecido }` para o que não está na
 * lista — ver `validar()`.
 */
export type StatusRecebido = EstadoExecucao | { desconhecido: string };

export interface Cadastrado {
  idExecucao: string;
  status: StatusRecebido;
  /** o backend decide se manda o agente varrer o site; a gente só repassa */
  deveVarrerSite: boolean;
  siteUrl: string | null;
}

function ehEstado(v: string): v is EstadoExecucao {
  return (ESTADOS_DE_EXECUCAO as readonly string[]).includes(v);
}

/**
 * Valida a `RespostaCadastro`, sem `as`.
 *
 * UM STATUS FORA DOS SEIS **NÃO** INVALIDA A RESPOSTA. Este é o ponto
 * delicado do arquivo: se o backend ganhar um estado novo, recusar a
 * resposta inteira faria a função devolver falha DEPOIS de a execução já
 * ter nascido — e aí a gente perderia o `id_execucao` de um recurso que
 * existe. É o pior desfecho possível, pior que um status estranho na
 * tela: o órfão só seria reencontrado pela marca de ida (`cliente_id`).
 *
 * Então guarda o id, embrulha o status como desconhecido e grita no log.
 * O que É obrigatório é o `id_execucao`: sem ele não há nada a guardar.
 */
function validar(bruto: unknown): Cadastrado | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const o = bruto as Record<string, unknown>;

  const id = typeof o.id_execucao === "string" ? o.id_execucao.trim() : "";
  if (!id) return null;

  const statusCru = typeof o.status === "string" ? o.status : "";
  let status: StatusRecebido;
  if (ehEstado(statusCru)) {
    status = statusCru;
  } else {
    status = { desconhecido: statusCru || "(ausente)" };
    registrarErroBackend("cadastro", {
      metodo: "POST",
      caminho: `/cadastro (status fora do enum: ${statusCru || "ausente"})`,
      categoria: "resposta_ilegivel",
    });
  }

  // Sem `as`: o objeto é montado campo a campo e o compilador confere
  // contra `Cadastrado`. Um `as` aqui seria a promessa que o runtime não
  // cumpre — o mesmo argumento do `pre-requisitos.ts`, e o motivo de
  // esta função existir em vez de um cast.
  return {
    idExecucao: id,
    status,
    // `deve_varrer_site` é obrigatório no schema. Ausente vira `false`, e
    // não `true`: mandar varrer um site por causa de um campo que não
    // veio é gastar chamada de agente por engano.
    deveVarrerSite: o.deve_varrer_site === true,
    siteUrl:
      typeof o.site_url === "string" && o.site_url.trim() !== "" ? o.site_url : null,
  };
}

/**
 * Manda o cadastro. Devolve o `id_execucao` quando dá certo.
 *
 * ============================================================
 * O MESMO ID VAI EM DOIS CAMPOS, E ELES NÃO SIGNIFICAM A MESMA COISA.
 *
 *   `business_id`  o VÍNCULO. É por ele que toda consulta de produto
 *                  encontra a execução de um negócio.
 *   `cliente_id`   o ECO do que a gente mandou. Serve para reencontrar
 *                  uma execução cuja RESPOSTA se perdeu no timeout —
 *                  nenhuma consulta de produto o lê.
 *
 * A decisão está em `docs/disparo-pipeline.md` §4.2, e ela revisou o
 * `perfil-empresa.md` §4.
 *
 * MUDOU EM 29/09/2026: o backend (commit `3f42be6`) passou a EXIGIR
 * `business_id` no corpo e devolve 422 sem ele, salvo com
 * `fluxo_do_gestor: true` — que é a porta do gestor e o webapp não usa.
 *
 * Antes disso o vínculo era feito depois, num `PATCH` separado
 * (`ligarAoNegocio`, passo 8 de `disparar.ts`). Esse passo CONTINUA aqui,
 * de propósito: enquanto não se medir que o backend grava o vínculo por
 * conta, tirá-lo trocaria um problema conhecido por um silencioso. A
 * limpeza é outra rodada.
 * ============================================================
 */
export async function enviarCadastro(
  payload: CadastroCompleto,
  /** o id do nosso `businesses` — vira `business_id` E `cliente_id` */
  negocioId: string,
): Promise<Resultado<Cadastrado>> {
  // ============================================================
  // SEM NEGÓCIO, NÃO CHAMA. E o motivo é o que esta chamada faz.
  //
  // `POST /cadastro` CRIA uma execução, e execução criada pode ser pega
  // pelo n8n e virar token de LLM e imagem gerada. Uma execução sem dono
  // custa dinheiro e não pertence a ninguém — foi assim que as 8
  // execuções sem `business_id` de 23/09 nasceram.
  //
  // Bater no 422 do backend também não criaria nada, mas gastaria uma
  // viagem para ouvir de volta o que dá para saber aqui.
  //
  // `dados_invalidos` e não uma categoria nova: é exatamente o que o
  // backend responderia, e quem lê o log não precisa aprender um
  // vocabulário só nosso.
  // ============================================================
  if (typeof negocioId !== "string" || negocioId.trim() === "") {
    registrarErroBackend("cadastro", {
      metodo: "POST",
      caminho: "/cadastro (sem business_id — não chamado)",
      categoria: "dados_invalidos",
    });
    return falha("dados_invalidos");
  }

  const resposta = await enviar(
    "/cadastro",
    { ...payload, business_id: negocioId, cliente_id: negocioId },
    {
      contexto: "cadastro",
      // `rapido`, e é medido: o endpoint só abre a linha — quem roda os
      // agentes de 600s é o n8n, depois. Se um dia ele passar a demorar,
      // é sinal de que passou a fazer mais que abrir.
      timeoutMs: TIMEOUTS.rapido,
    },
  );

  if (!resposta.ok) return resposta;

  const validado = validar(resposta.dados);
  if (!validado) {
    registrarErroBackend("cadastro", {
      metodo: "POST",
      caminho: "/cadastro (resposta sem id_execucao)",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }

  return { ok: true, dados: validado };
}
