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
 * `clienteId` é o **id do nosso `businesses`**, e vai no corpo como
 * `cliente_id`. Ele NÃO é o dono do lado de lá — é a marca de ida, a
 * única coisa nossa que cabe na requisição, e a única forma de
 * reencontrar uma execução cuja resposta se perdeu. A decisão está em
 * `docs/disparo-pipeline.md` §4.2, e ela revisou o `perfil-empresa.md`
 * §4. A regra que sai dali, e que não pode ser esquecida aqui:
 *
 *   `business_id` é o vínculo. `cliente_id` é o eco do que a gente
 *   mandou. Nenhuma consulta de produto lê `cliente_id`.
 */
export async function enviarCadastro(
  payload: CadastroCompleto,
  clienteId: string,
): Promise<Resultado<Cadastrado>> {
  const resposta = await enviar(
    "/cadastro",
    { ...payload, cliente_id: clienteId },
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
