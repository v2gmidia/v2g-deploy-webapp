import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { preVooPorNegocio, type PreVoo } from "@/lib/campanha/pre-voo";
import { validarOrcamento } from "@/lib/meta/orcamento";

/**
 * A TRAVA DE IDENTIDADE DA ATIVAÇÃO DE CAMPANHA.
 *
 * ============================================================
 * A FONTE MUDOU EM 24/09/2026. A TRAVA, NÃO.
 *
 * Até aqui este arquivo lia `campaigns`, a tabela do webapp. Medido em
 * 23/09, contra o banco de produção: **zero linhas, e nenhum código em
 * nenhum dos dois repositórios insere ali.** `publicarCampanha()`
 * (`lib/meta/publicar.ts:273`) nunca foi chamada por rota nem por action
 * — o repositório já registrava isso em três lugares, entre eles
 * `docs/buraco-creatives-campanhas-sem-dono.md:1-8`.
 *
 * A campanha real existe do lado do backend, em `execucoes.campanha_meta`.
 * É de lá que esta tela passa a ler, e é `execucoes.id` — o `id_execucao`
 * — que identifica a campanha daqui para a frente.
 *
 * O QUE **NÃO** MUDOU, e é o que importa:
 *
 *   - o `business_id` continua saindo da LINHA, lida por id, e nunca de
 *     parâmetro;
 *   - toda leitura seguinte continua escopada por ele;
 *   - o operador continua vendo de quem é e quanto custa ANTES do botão.
 * ============================================================
 *
 * ============================================================
 * O QUE ESTE ARQUIVO PROTEGE, E POR QUE ELE É DIFERENTE DO RESTO.
 *
 * Toda outra escrita deste app é do DONO sobre o que é dele, e o RLS
 * (`owns_business`) sozinho já separa um cliente do outro. Aqui não:
 *
 *   - quem clica é o OPERADOR, que não possui negócio nenhum;
 *   - `execucoes` tem RLS ligada e **zero políticas** (`0019` do backend,
 *     e a `0022:100-104` explica a postura: negar tudo enquanto quem lê e
 *     escreve é o backend com a `service_role`), então sob RLS normal ele
 *     não enxerga uma linha sequer;
 *   - então a leitura usa o cliente ADMIN, que ignora RLS.
 *
 * Com o admin na mão, **o que separa a campanha de um cliente da de
 * outro é o `.eq()` escrito à mão** — e mais nada. É o arquétipo que
 * `lib/seguranca/excecoes.ts` descreve sobre `identidade-actions.ts`:
 * *"Apagar aquela linha não quebra teste, typecheck nem build."*
 * ============================================================
 *
 * ============================================================
 * TRÊS PORTAS, NÃO UMA. O mesmo desenho de `/revisar-perfil`:
 *
 *   1. `proxy.ts:76` guarda o prefixo `/ativar-campanha` inteiro, por
 *      `OPERADOR_PREFIXES`;
 *   2. a página confere `papel !== "operador" → notFound()`;
 *   3. CADA action chama `operadorOuErro()` na primeira linha do corpo,
 *      antes de ler o `formData`.
 * ============================================================
 *
 * ESTE ARQUIVO NÃO ATIVA NADA. Ele só reúne o que a pessoa precisa ver
 * antes de decidir. Quem fala com a Meta é o backend, por
 * `lib/backend/ativacao.ts`.
 *
 * ============================================================
 * POR QUE O CORPO MORA EM `lib/` E NÃO NA `actions.ts`.
 *
 * Duas entradas precisam do mesmo dado: a PÁGINA, que desenha a
 * confirmação a partir do id que vem da URL, e a AÇÃO, que relê tudo
 * imediatamente antes de chamar o backend. Se cada uma consultasse por
 * conta, elas poderiam discordar — e a que discorda na hora errada é a
 * que gasta dinheiro.
 * ============================================================
 */

/** Por que a ativação não pode ser oferecida agora. */
export type MotivoDeBloqueio =
  /** a execução não existe, ou o id não é de execução nenhuma */
  | "execucao_inexistente"
  /** a execução existe mas nunca subiu campanha ao Meta */
  | "sem_campanha"
  /** a execução não aponta para negócio — não há dono a conferir */
  | "sem_negocio"
  /** o negócio da execução sumiu do banco */
  | "negocio_inexistente"
  /** o teto mensal não dá um diário válido */
  | "orcamento"
  /** o pré-voo devolveu bloqueio da Meta */
  | "pre_voo";

/**
 * Uma linha de `execucoes.aprovacoes` — o rastro que o BACKEND escreve.
 *
 * ============================================================
 * O LOG DA AÇÃO NÃO É NOSSO, E É ISSO QUE O TORNA CONFIÁVEL.
 *
 * Quem grava é `registrar_aprovacao` (`db/execucao.py:768`), **duas vezes
 * por chamada**: a intenção antes da primeira ida à Meta, e o retorno
 * depois (`rotas.py:3486-3495`). Com um registro só, gravado no fim, "a
 * rota morreu no meio" e "ninguém chamou a rota" sairiam idênticos.
 *
 * A trilha é append-only por desenho — recusa nunca apaga aprovação
 * anterior. A tela mostra; a tela nunca escreve aqui.
 * ============================================================
 */
export interface RegistroDeAprovacao {
  /** `ativacao` | `pausa` — os valores de `EtapaAprovacao` */
  etapa: string;
  /** `aprovado` | `recusado` */
  decisao: string;
  motivo: string;
  por: string;
  em: string;
}

export interface ConfirmacaoDeAtivacao {
  ok: true;
  /** `execucoes.id` — é ele que vai na URL da rota do backend */
  idExecucao: string;
  /** o dono, lido da própria linha da execução */
  negocioId: string;
  nomeDoCliente: string;
  /** o nome que o backend registrou para o negócio, quando registrou */
  nomeNaExecucao: string | null;
  /** o id da campanha na Meta, de `campanha_meta` */
  idCampanha: string;
  idConjunto: string | null;
  quantosAnuncios: number;
  idContaAnuncio: string | null;
  /**
   * O que o COLETOR leu na plataforma na última passagem, cru, com a hora.
   *
   * Não é o nosso pedido e não é afirmação da tela: é observação do
   * backend (`coleta.py::_registrar_status`). `null` quer dizer que
   * ninguém leu ainda — e "não sei" não vira "não".
   */
  statusNaPlataforma: string | null;
  statusLidoEm: string | null;
  /** `execucoes.status`, o passo do pipeline. Técnico, para o operador. */
  statusDoPipeline: string;
  /** quanto passa a gastar por dia, em centavos */
  diarioCentavos: number;
  /** o teto do mês que originou o diário, em reais */
  mensalReais: number;
  /** o pré-voo relido AGORA, não o que a tela tinha */
  preVoo: PreVoo;
  /** o que impede ativar, se impedir. Vazio = pode oferecer o botão. */
  bloqueios: { motivo: MotivoDeBloqueio; texto: string }[];
  /** o rastro do backend, da mais nova para a mais velha */
  rastro: RegistroDeAprovacao[];
}

export interface ConfirmacaoRecusada {
  ok: false;
  motivo: MotivoDeBloqueio;
  texto: string;
}

const recusa = (motivo: MotivoDeBloqueio, texto: string): ConfirmacaoRecusada => ({
  ok: false,
  motivo,
  texto,
});

/** Leitura defensiva do jsonb: nada aqui tem tipo gerado. */
function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}

/**
 * Só as etapas desta tela, da mais nova para a mais velha.
 *
 * `aprovacoes` acumula a trilha inteira da execução — texto, criativo,
 * canal, compliance. Mostrar tudo aqui afogaria as duas linhas que
 * importam no momento de apertar um botão que gasta dinheiro.
 */
function rastroDaAtivacao(bruto: unknown): RegistroDeAprovacao[] {
  if (!Array.isArray(bruto)) return [];
  const linhas: RegistroDeAprovacao[] = [];
  for (const item of bruto) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const etapa = texto(o.etapa);
    if (etapa !== "ativacao" && etapa !== "pausa") continue;
    linhas.push({
      etapa,
      decisao: texto(o.decisao) ?? "—",
      motivo: texto(o.motivo) ?? "—",
      por: texto(o.por) ?? "—",
      em: texto(o.em) ?? "",
    });
  }
  // Mais nova primeiro. O backend anexa no fim, então a ordem natural é a
  // inversa da que alguém quer ler.
  return linhas.reverse();
}

/**
 * O QUE O OPERADOR VÊ ANTES DE CONFIRMAR.
 *
 * ============================================================
 * ELA RELÊ TUDO, TODA VEZ. NÃO CONFIA EM ESTADO DE TELA.
 *
 * A tela pode estar aberta há meia hora. Entre ela carregar e o clique
 * acontecer, a conta de anúncio pode ter sido desativada, o token pode
 * ter morrido, o cliente pode ter mudado o teto do mês, e a campanha pode
 * ter sido ativada por outra pessoa do time. Nada disso avisa.
 *
 * Por isso esta função é chamada DUAS vezes: uma para desenhar a
 * confirmação, e de novo dentro da action, imediatamente antes de chamar
 * o backend. O que ela devolveu na primeira vez não vale como autorização
 * para a segunda.
 * ============================================================
 *
 * ============================================================
 * O PISO DO META NÃO É CONSULTADO AQUI, e é decisão.
 *
 * `validarOrcamento(teto, piso)` aceita `piso = null`, que quer dizer
 * "não consegui consultar" e pula a checagem de piso — ele NÃO é
 * substituído por um chute. Consultar o piso é uma ida à Meta por conta
 * de anúncio, e esta função roda a cada vez que a tela desenha.
 *
 * E há um motivo novo, de 24/09: ativar **não cria nada**. O piso mínimo
 * é regra de criação de conjunto, e o backend diz o mesmo sobre o pré-voo
 * inteiro em `rotas.py:3632-3635` — *"`prevoo()` confere o que a CRIACAO
 * exige, e ativar nao cria nada."* O número aqui serve para a pessoa LER
 * quanto vai gastar.
 * ============================================================
 */
export async function conferirAntesDeAtivar(
  idExecucao: string,
): Promise<ConfirmacaoDeAtivacao | ConfirmacaoRecusada> {
  const admin = createAdminClient();

  // ---------- 1. a execução, e SÓ por id ----------
  const { data: execucao } = await admin
    .from("execucoes")
    // Toda coluna lida abaixo está nesta lista. O cliente Supabase deste
    // repositório não usa tipos gerados: coluna lida e não selecionada
    // vira `undefined` em silêncio — o defeito de `docs/regra-inerte.md`.
    .select(
      "id, business_id, nome_negocio, status, campanha_meta, aprovacoes, status_na_plataforma, status_lido_em",
    )
    .eq("id", idExecucao)
    .maybeSingle();

  if (!execucao) {
    return recusa("execucao_inexistente", "Essa campanha não existe.");
  }

  // ---------- 2. tem campanha na Meta? ----------
  // `campanha_meta` é o dump de `RespostaSubidaCampanha` mais o
  // `id_conta_anuncio` (`rotas.py`, `POST /campanhas`). Sem ele não
  // existe objeto na plataforma — não há o que ligar.
  const meta = (execucao.campanha_meta ?? null) as Record<string, unknown> | null;
  const idCampanha = meta ? texto(meta.id_campanha) : null;
  if (!idCampanha) {
    return recusa(
      "sem_campanha",
      "Essa execução ainda não subiu campanha para o Meta. Não há objeto para ligar.",
    );
  }

  // ============================================================
  // AQUI ESTÁ A TRAVA. A linha abaixo é a que separa um cliente do outro.
  //
  // `negocioId` NÃO vem do formulário, da URL, nem de um parâmetro: ele é
  // lido da linha da execução que acabou de ser carregada por id. Todas as
  // leituras seguintes usam ESTE valor, e nenhuma aceita outro.
  //
  // Se alguém um dia acrescentar um parâmetro `negocioId` à assinatura
  // desta função "para evitar uma consulta", a trava morre: passaria a ser
  // possível ativar a campanha de um cliente com o contexto de outro.
  // ============================================================
  const negocioId: string | null = (execucao.business_id as string | null) ?? null;
  if (!negocioId) {
    // ============================================================
    // ESTE RAMO É COMUM NESTA TABELA, e não é defeito de código.
    //
    // Medido em 23/09/2026: das 28 execuções, **4 têm `business_id`**. E a
    // `0023` do backend torna `execucao_id` nulo legítimo em `campanhas_criacao`
    // quando a origem é backfill. Ou seja: existe campanha real cujo dono o
    // banco não sabe dizer.
    //
    // Recusar é a única resposta possível. A tela inteira existe para
    // mostrar de QUEM é antes de gastar; sem dono não há o que mostrar, e
    // "ative assim mesmo" seria gastar o dinheiro de alguém que ninguém
    // consegue nomear.
    // ============================================================
    return recusa(
      "sem_negocio",
      "Essa campanha não aponta para nenhum negócio. Sem dono não há o que conferir, e ativar às cegas está fora de questão.",
    );
  }

  // ---------- 3. o cliente, escopado pelo negócio da execução ----------
  const { data: negocio } = await admin
    .from("businesses")
    .select("id, name, monthly_budget")
    .eq("id", negocioId)
    .maybeSingle();

  if (!negocio) {
    return recusa("negocio_inexistente", "O negócio dessa campanha não está mais no banco.");
  }

  // ---------- 4. o dinheiro ----------
  const orcamento = validarOrcamento(negocio.monthly_budget, null);

  // ---------- 5. o pré-voo, AGORA ----------
  const preVoo = await preVooPorNegocio(negocioId, admin);

  // ---------- 6. o que impede ----------
  const bloqueios: ConfirmacaoDeAtivacao["bloqueios"] = [];

  if (!orcamento.ok) {
    bloqueios.push({ motivo: "orcamento", texto: orcamento.mensagem });
  }

  const pre = preVoo.preRequisitos;
  if (pre && pre.ok && !pre.dados.ok) {
    for (const b of pre.dados.bloqueios) {
      bloqueios.push({ motivo: "pre_voo", texto: b });
    }
    // `nao_verificados` não é bloqueio, mas também não é "tudo certo": é o
    // que a rota não conseguiu olhar. Aparece como bloqueio aqui de
    // propósito — antes de gastar dinheiro de terceiro, "não sei" pesa
    // como "não".
    for (const n of pre.dados.naoVerificados) {
      bloqueios.push({ motivo: "pre_voo", texto: `Não deu para conferir: ${n}` });
    }
  }
  if (pre && !pre.ok) {
    bloqueios.push({
      motivo: "pre_voo",
      texto: `Não consegui conferir os pré-requisitos agora: ${pre.mensagem}`,
    });
  }

  const anuncios = meta && Array.isArray(meta.ids_anuncios) ? meta.ids_anuncios.length : 0;

  return {
    ok: true,
    idExecucao: String(execucao.id),
    negocioId,
    nomeDoCliente:
      (typeof negocio.name === "string" ? negocio.name.trim() : "") || "(negócio sem nome)",
    nomeNaExecucao: texto(execucao.nome_negocio),
    idCampanha,
    idConjunto: meta ? texto(meta.id_conjunto) : null,
    quantosAnuncios: anuncios,
    idContaAnuncio: meta ? texto(meta.id_conta_anuncio) : null,
    statusNaPlataforma: texto(execucao.status_na_plataforma),
    statusLidoEm: texto(execucao.status_lido_em),
    statusDoPipeline: texto(execucao.status) ?? "—",
    diarioCentavos: orcamento.ok ? orcamento.diarioCentavos : 0,
    mensalReais: Number(negocio.monthly_budget ?? 0),
    preVoo,
    bloqueios,
    rastro: rastroDaAtivacao(execucao.aprovacoes),
  };
}
