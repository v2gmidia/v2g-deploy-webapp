import "server-only";
import { enviar, TIMEOUTS } from "./cliente";
import { falha, registrarErroBackend, type Resultado } from "./erros";

/**
 * `POST /campanhas/{id_execucao}/ativar` e `.../pausar`.
 *
 * ============================================================
 * ESTAS SÃO AS DUAS ÚNICAS CHAMADAS DO WEBAPP QUE FAZEM DINHEIRO SAIR.
 *
 * Tudo que a V2G cria nasce `PAUSED` — a invariante 1 de
 * `lib/meta/publicar.ts` e a seção 10 item 1 do CLAUDE.md do backend. A
 * rota de ativar é a primeira do produto inteiro que liga a entrega.
 *
 * Por isso o corpo não é opcional nem decorativo. O backend recusa, ANTES
 * de qualquer chamada à Meta (`rotas.py:3508-3526`):
 *
 *   - `confirmo` ausente ou `false`  → 422
 *   - `por` vazio                    → 422
 *   - `motivo` vazio em PAUSAR       → 422
 *
 * O `confirmo: true` é escrito aqui dentro, uma vez, porque a decisão já
 * foi tomada na tela — quem chama estas funções já passou pelo portão de
 * papel e pela confirmação. Deixá-lo como parâmetro seria oferecer a
 * alguém a chance de chamar sem confirmar, que é exatamente o que o
 * backend existe para recusar.
 * ============================================================
 *
 * ============================================================
 * O QUE ESTAS FUNÇÕES **NÃO** AFIRMAM.
 *
 * Elas não dizem que a campanha está no ar. Dizem que a Meta aceitou o
 * pedido. Quem afirma que está no ar é o coletor do backend, por
 * observação da plataforma (`coleta.py::_registrar_status`), e é isso que
 * `execucoes.status_na_plataforma` guarda.
 *
 * O próprio backend escreve a distinção em `rotas.py:3496-3503`: *"Uma
 * rota que escrevesse 'ativa' no clique faria 'a Meta ativou' e 'nos
 * mandamos ativar' sairem iguais."* A tela tem que repetir essa
 * disciplina, e repete.
 * ============================================================
 */

/** O que aconteceu com UM objeto da estrutura (campanha, conjunto, anúncio). */
export interface NivelDaAcao {
  /** `campanha` | `conjunto` | `anuncio` — string crua do backend */
  nivel: string;
  /** o id do objeto na Meta */
  id: string;
  /** o veredito daquele nível, cru */
  veredito: string;
  /** o que a Meta disse, quando disse. Vazio quando deu certo. */
  erro: string;
}

export interface AcaoNaCampanha {
  idExecucao: string;
  /** `ativar` | `pausar` */
  acao: string;
  idCampanha: string;
  /**
   * Um item por objeto — **inclusive os que nem chegaram a ser tentados.**
   *
   * `RespostaAcaoNaCampanha` (`modelos.py:1074-1082`) explica por que a
   * lista carrega o veredito de cada nível e não só os que deram certo: a
   * Meta não tem operação atômica aqui, são três chamadas em sequência, e
   * "parou no conjunto" e "parou no anúncio" levam a consertos diferentes.
   */
  niveis: NivelDaAcao[];
  /**
   * Os três níveis foram. **`false` nunca chega com HTTP 200.**
   *
   * O backend devolve 409 com este mesmo corpo dentro de `detail`
   * (`rotas.py:3595-3600`), e o comentário de lá diz o motivo: *"Sucesso
   * com um campo dizendo que nao foi sucesso e a forma mais barata de a
   * tela renderizar 'pronto' sobre meia campanha."*
   *
   * É por causa deste campo que a chamada abaixo pede o corpo do erro.
   */
  completo: boolean;
  avisos: string[];
  /** `true` quando o backend rodou contra o mock, não contra a Meta real. */
  mock: boolean;
}

/**
 * Valida o que chegou, sem confiar no formato.
 *
 * Mesmo motivo escrito em `pre-requisitos.ts:52-58`: `as AcaoNaCampanha` é
 * uma promessa que o TypeScript acredita e o runtime não cumpre. Aqui pesa
 * mais, porque quem lê o resultado decide se mostra "no ar" para o
 * operador — e um `completo` que veio como string `"false"` é `truthy`.
 */
function validar(bruto: unknown): AcaoNaCampanha | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const o = bruto as Record<string, unknown>;

  if (typeof o.completo !== "boolean") return null;
  if (typeof o.id_execucao !== "string") return null;

  const niveisBrutos = o.niveis === undefined || o.niveis === null ? [] : o.niveis;
  if (!Array.isArray(niveisBrutos)) return null;

  const niveis: NivelDaAcao[] = [];
  for (const item of niveisBrutos) {
    if (typeof item !== "object" || item === null) return null;
    const n = item as Record<string, unknown>;
    if (typeof n.nivel !== "string" || typeof n.veredito !== "string") return null;
    niveis.push({
      nivel: n.nivel,
      id: typeof n.id === "string" ? n.id : "",
      veredito: n.veredito,
      erro: typeof n.erro === "string" ? n.erro : "",
    });
  }

  const avisos =
    o.avisos === undefined || o.avisos === null
      ? []
      : Array.isArray(o.avisos) && o.avisos.every((x) => typeof x === "string")
        ? (o.avisos as string[])
        : null;
  if (avisos === null) return null;

  return {
    idExecucao: o.id_execucao,
    acao: typeof o.acao === "string" ? o.acao : "",
    idCampanha: typeof o.id_campanha === "string" ? o.id_campanha : "",
    niveis,
    completo: o.completo,
    avisos,
    mock: o.mock === true,
  };
}

/**
 * O corpo comum das duas. A única diferença é o caminho e o que é
 * obrigatório — e as duas obrigatoriedades são do backend, não nossas.
 */
async function agir(
  acao: "ativar" | "pausar",
  idExecucao: string,
  por: string,
  motivo: string,
): Promise<Resultado<AcaoNaCampanha>> {
  const caminho = `/campanhas/${encodeURIComponent(idExecucao)}/${acao}`;
  const contexto = `campanha-${acao}`;

  const resposta = await enviar(
    caminho,
    // O backend usa snake_case; o resto do nosso código usa camelCase. A
    // tradução acontece AQUI, na fronteira, e em nenhum outro lugar —
    // mesma regra de `pre-requisitos.ts:104-106`.
    {
      confirmo: true,
      por,
      motivo,
    },
    {
      contexto,
      // ============================================================
      // POR QUE NÃO `TIMEOUTS.rapido`, E POR QUE NÃO `TIMEOUTS.campanha`.
      //
      // São TRÊS chamadas à Graph API em sequência (campanha, conjunto,
      // anúncios), e os 15s do `rapido` são para uma leitura. Mas também
      // não são os 300s de `campanha`: aquele tempo é de CRIAÇÃO, que
      // sobe mídia e espera processamento — ativar só muda status.
      //
      // NÃO MEDIDO: nenhuma dessas chamadas rodou contra a Meta real
      // ainda. 60s é escolha de projeto, não número observado, e o
      // primeiro teste de verdade é quem vai dizer se está certo.
      //
      // Estourar aqui NÃO quer dizer que nada aconteceu: o bloco de
      // `enviar()` em `cliente.ts:181-186` é explícito sobre isso, e a
      // tela precisa dizer "não sei", nunca "não foi".
      // ============================================================
      timeoutMs: 60_000,
      // ============================================================
      // O CORPO DO ERRO IMPORTA, E SÓ AQUI.
      //
      // Esta é a única rota do backend que devolve 409 com informação que
      // o usuário precisa ler. Sem isto, sucesso parcial — a campanha
      // ligou, o conjunto recusou — chegaria à tela como a frase genérica
      // de `conflito`: *"Esse passo já foi feito, ou ainda não é a vez
      // dele."* Que é falso, e é falso na direção cara: o operador
      // concluiria que não precisa fazer nada, com metade da estrutura
      // ligada.
      // ============================================================
      corpoDoErro: true,
    },
  );

  if (!resposta.ok) {
    // ---------- o 409 que carrega o resultado parcial ----------
    // `detalhe` só existe porque pedimos acima. O backend embrulha o
    // corpo em `detail` (`rotas.py:3598`), então é lá dentro que ele está.
    if (resposta.categoria === "conflito" && resposta.detalhe !== undefined) {
      const dentro = (resposta.detalhe as { detail?: unknown })?.detail;
      const parcial = validar(dentro ?? resposta.detalhe);
      if (parcial) return { ok: true, dados: parcial };
    }
    return resposta;
  }

  const validado = validar(resposta.dados);
  if (!validado) {
    registrarErroBackend(contexto, {
      metodo: "POST",
      caminho,
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }

  return { ok: true, dados: validado };
}

/**
 * LIGAR A ENTREGA. De cima para baixo: campanha, conjunto, anúncios.
 *
 * `motivo` é opcional aqui e obrigatório em `pausarCampanha` — a
 * assimetria é do backend (`modelos.py:1059-1064`) e tem razão de produto:
 * o sistema nunca pausa sozinho, então toda pausa é a pedido de alguém, e
 * o motivo escrito é o que registra de quem partiu o pedido.
 */
export async function ativarCampanha(
  idExecucao: string,
  por: string,
  motivo = "",
): Promise<Resultado<AcaoNaCampanha>> {
  return agir("ativar", idExecucao, por, motivo);
}

/**
 * DESLIGAR A ENTREGA. De baixo para cima, e com motivo obrigatório.
 *
 * O `motivo` vazio é recusado com 422 do outro lado. A tela não deve
 * chegar aqui sem ele — mas se chegar, o backend recusa antes de tocar em
 * qualquer coisa, que é a ordem certa das duas travas.
 */
export async function pausarCampanha(
  idExecucao: string,
  por: string,
  motivo: string,
): Promise<Resultado<AcaoNaCampanha>> {
  return agir("pausar", idExecucao, por, motivo);
}

/**
 * Uma linha por nível, legível, para a tela e para o log.
 *
 * Espelha `_resumo_dos_niveis` (`rotas.py:3603-3613`) de propósito: é o
 * mesmo texto que o backend grava em `aprovacoes.motivo`, e ter as duas
 * pontas dizendo a mesma frase é o que faz o rastro bater quando alguém
 * comparar meses depois.
 */
export function resumoDosNiveis(resultado: AcaoNaCampanha): string {
  const partes = resultado.niveis.map((n) => `${n.nivel}=${n.veredito}`);
  const erro = resultado.niveis.find((n) => n.erro)?.erro ?? "";
  const linha = partes.join("; ");
  return erro ? `${linha} | Meta: ${erro}` : linha;
}
