import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { criarNoMeta, lerMarketing } from "./marketing";
import { consultarPisoDiario, validarOrcamento } from "./orcamento";
import {
  coordenadaDaPagina,
  montarSegmentacao,
  raioValido,
  resolverCidade,
  type Local,
} from "./geo";
import { FalhaMeta } from "./oauth";
import { registrarErroMeta } from "./erros";

/**
 * A cadeia de publicação no Meta. Desenho em `docs/publicar-campanha.md`.
 *
 * ------------------------------------------------------------------
 * AS CINCO INVARIANTES. Se você for mexer aqui, elas não são sugestão.
 *
 *  1. Tudo nasce PAUSED. Não existe `status: 'ACTIVE'` neste arquivo, e
 *     não existe função que ative. Ativar é ação do cliente, na interface.
 *  2. Orçamento validado ANTES da primeira chamada (`orcamento.ts`).
 *  3. Idempotência em três camadas — estado local, marca no nome, trava
 *     de concorrência. Todas as três, não a que for mais conveniente.
 *  4. `decisions` escrito ANTES e DEPOIS de cada objeto. Se só existir o
 *     "antes", sabemos exatamente onde parou.
 *  5. Nada é apagado automaticamente em caso de falha. Objeto pausado não
 *     gasta; apagar numa corrida é pior que deixar o órfão.
 *
 * A invariante que sustenta as outras é a 1: enquanto tudo estiver
 * pausado, todo bug deste arquivo é lixo para limpar, não prejuízo.
 * ------------------------------------------------------------------
 */

/** Minutos até considerar que uma publicação travada pode ser retomada. */
const MINUTOS_ATE_DESTRAVAR = 10;

/**
 * As constantes da campanha. Decisões fechadas com o Gabriel, registradas
 * em `docs/publicar-campanha.md` §9.
 */
const CAMPANHA = {
  /** Conversa no WhatsApp é engajamento na taxonomia nova do Meta. */
  objective: "OUTCOME_ENGAGEMENT",
  buying_type: "AUCTION",
} as const;

const CONJUNTO = {
  /** Cobrança por impressão. É o `billing_event` que casa com o piso lido. */
  billing_event: "IMPRESSIONS",
  /** O evento otimizado: alguém abriu conversa. Não é clique, não é venda. */
  optimization_goal: "CONVERSATIONS",
  /** Sem teto de lance: o Meta busca o menor custo dentro do orçamento. */
  bid_strategy: "LOWEST_COST_WITHOUT_CAP",
  /** Manda para o WhatsApp, não para o Messenger nem para o Direct. */
  destination_type: "WHATSAPP",
} as const;

/**
 * 1 dia para clique, 0 para visualização.
 *
 * A DECISÃO APROVADA ERA 7 DIAS / 1 DIA, E O META NÃO ACEITA. Testado com
 * `validate_only` numa campanha OUTCOME_ENGAGEMENT real:
 *
 *   (#100 / 1885501) "Com base nos objetivos e metas de otimização
 *   selecionados, as combinações aceitas de valores da janela de
 *   atribuição de visualização e cliques são: (1, 0)"
 *
 * Não é uma faixa, é um único par: para `optimization_goal =
 * CONVERSATIONS`, o Meta impõe 1 dia de clique e nenhuma visualização.
 * Faz sentido — conversa iniciada acontece no clique, não depois; e
 * atribuir conversa a quem só viu o anúncio seria inventar causa.
 *
 * Consequência boa, e vale registrar: a janela curta é a mais honesta das
 * duas. Janela longa infla o número de conversas atribuídas e faz o
 * resultado parecer melhor do que é.
 */
const ATRIBUICAO = [
  { event_type: "CLICK_THROUGH", window_days: 1 },
  { event_type: "VIEW_THROUGH", window_days: 0 },
];

export type EtapaPublicacao = "campanha" | "conjunto" | "imagem" | "criativo" | "anuncio";

export interface ResultadoPublicacao {
  ok: boolean;
  /** o que o cliente lê quando deu errado */
  mensagem?: string;
  etapaQueFalhou?: EtapaPublicacao;
  externalCampaignId?: string;
  externalAdsetId?: string;
  externalCreativeId?: string;
  externalAdId?: string;
}

interface Contexto {
  supa: ReturnType<typeof createAdminClient>;
  businessId: string;
  campaignId: string;
  publishKey: string;
  /** o sufixo que marca todo objeto nosso: `[v2g:ab12cd34]` */
  marca: string;
  contaExterna: string;
  token: string;
}

// ============================================================
// Rastro
// ============================================================

async function registrarTentativa(
  ctx: Contexto,
  etapa: EtapaPublicacao,
  parametros: Record<string, unknown>,
): Promise<void> {
  await ctx.supa.from("decisions").insert({
    business_id: ctx.businessId,
    campaign_id: ctx.campaignId,
    kind: "publish_attempt",
    payload: { etapa, publish_key: ctx.publishKey, parametros },
  });
}

async function registrarResultado(
  ctx: Contexto,
  etapa: EtapaPublicacao,
  resultado: { id?: string | null; erro?: unknown; validacao?: boolean },
): Promise<void> {
  // Nunca o corpo cru da resposta: em várias rotas do Meta ele carrega o
  // próprio token. Só o erro já normalizado.
  const erro =
    resultado.erro instanceof FalhaMeta
      ? {
          code: resultado.erro.detalhe.code ?? null,
          subcode: resultado.erro.detalhe.subcode ?? null,
          type: resultado.erro.detalhe.type ?? null,
          fbtrace_id: resultado.erro.detalhe.fbtrace_id ?? null,
          mensagem_usuario: resultado.erro.detalhe.mensagemUsuario ?? null,
        }
      : resultado.erro
        ? { mensagem: String(resultado.erro) }
        : null;

  await ctx.supa.from("decisions").insert({
    business_id: ctx.businessId,
    campaign_id: ctx.campaignId,
    kind: "publish_result",
    payload: {
      etapa,
      publish_key: ctx.publishKey,
      validacao: resultado.validacao ?? false,
      external_id: resultado.id ?? null,
      erro,
    },
    status: erro ? "failed" : "done",
    needs_review: Boolean(erro),
  });
}

// ============================================================
// Camada 2 da idempotência: reencontrar pelo nome
// ============================================================

/**
 * Procura no Meta um objeto que já tenha a nossa marca no nome.
 *
 * É a rede que pega o caso em que a criação remota funcionou mas a
 * gravação local falhou — timeout, deploy no meio, aba fechada. Sem ela,
 * o retry cria um segundo objeto.
 *
 * Depende de o nome não ter sido editado no Gerenciador de Anúncios. Se
 * alguém renomear, a busca falha e o retry duplica — **pausado**, então
 * sem custo. A camada 1 cobre o caso comum; esta é rede, não garantia.
 */
async function acharPelaMarca(
  ctx: Contexto,
  edge: "campaigns" | "adsets",
): Promise<string | null> {
  try {
    const filtro = JSON.stringify([
      { field: "name", operator: "CONTAIN", value: ctx.marca },
    ]);
    const dados = await lerMarketing<{ data?: Array<{ id: string }> }>(
      `/${ctx.contaExterna}/${edge}?fields=id&limit=5&filtering=${encodeURIComponent(filtro)}`,
      ctx.token,
    );
    return dados.data?.[0]?.id ?? null;
  } catch (erro) {
    // Falha na busca não pode abortar: o pior caso dela é um duplicado
    // pausado, e abortar seria trocar isso por não publicar nada.
    registrarErroMeta(`publicar:buscar:${edge}`, erro);
    return null;
  }
}

// ============================================================
// Geo, resolvido uma vez e guardado
// ============================================================

/**
 * Onde entregar, resolvido uma vez e guardado.
 *
 * A ordem importa e não é arbitrária:
 *
 *  1. o que já está no banco (nada a resolver);
 *  2. o endereço da Página — dá coordenada, e coordenada é a ÚNICA forma
 *     de fazer raio de 5 km (`geo.ts` explica os limites medidos);
 *  3. a cidade do cadastro — cidade inteira, sem raio.
 *
 * O passo 2 antes do 3 porque um raio em volta da loja é o que o cliente
 * pediu; a cidade inteira é o consolo quando não dá.
 */
async function garantirGeo(
  ctx: Contexto,
  negocio: {
    id: string;
    city: string | null;
    geo_lat: unknown;
    geo_lng: unknown;
    geo_key: string | null;
    geo_label: string | null;
  },
  pageId: string | null,
): Promise<Local | null> {
  const lat = Number(negocio.geo_lat);
  const lng = Number(negocio.geo_lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { tipo: "ponto", lat, lng, label: negocio.geo_label ?? negocio.city ?? "" };
  }
  if (negocio.geo_key) {
    return { tipo: "cidade", key: negocio.geo_key, label: negocio.geo_label ?? negocio.city ?? "" };
  }

  if (pageId) {
    const ponto = await coordenadaDaPagina(pageId, ctx.token);
    if (ponto) {
      await ctx.supa
        .from("businesses")
        .update({
          geo_lat: ponto.lat,
          geo_lng: ponto.lng,
          geo_label: ponto.label,
          geo_resolved_at: new Date().toISOString(),
        })
        .eq("id", negocio.id);
      return { tipo: "ponto", ...ponto };
    }
  }

  if (!negocio.city) return null;

  const cidade = await resolverCidade(negocio.city, ctx.token);
  if (!cidade) return null;

  await ctx.supa
    .from("businesses")
    .update({
      geo_key: cidade.key,
      geo_label: cidade.label,
      geo_resolved_at: new Date().toISOString(),
    })
    .eq("id", negocio.id);

  return { tipo: "cidade", ...cidade };
}

// ============================================================
// A cadeia
// ============================================================

export async function publicarCampanha(campaignId: string): Promise<ResultadoPublicacao> {
  const supa = createAdminClient();

  const { data: campanha } = await supa
    .from("campaigns")
    // Uma string literal só: o cliente tipado do Supabase infere o
    // retorno a partir DO TEXTO do select. Quebrar em concatenação
    // devolve `GenericStringError` e some com todos os campos.
    .select("id, business_id, ad_account_id, name, publish_key, publish_state, publish_started_at, external_campaign_id, external_adset_id")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campanha) {
    return { ok: false, mensagem: "Não encontramos essa campanha." };
  }

  // ---------- Camada 3: trava de concorrência ----------
  if (campanha.publish_state === "publishing") {
    const desde = campanha.publish_started_at
      ? Date.now() - new Date(campanha.publish_started_at).getTime()
      : Infinity;
    if (desde < MINUTOS_ATE_DESTRAVAR * 60_000) {
      return {
        ok: false,
        mensagem: "Já estamos publicando essa campanha. Aguarde um instante.",
      };
    }
    // Passou dos 10 minutos: a execução anterior morreu no meio. Retomar
    // é seguro porque as camadas 1 e 2 reaproveitam o que já existe.
  }

  if (campanha.publish_state === "published") {
    return {
      ok: true,
      externalCampaignId: campanha.external_campaign_id ?? undefined,
      externalAdsetId: campanha.external_adset_id ?? undefined,
    };
  }

  const { data: negocio } = await supa
    .from("businesses")
    .select("id, name, city, radius_km, monthly_budget, geo_lat, geo_lng, geo_key, geo_label, dados_ficticios")
    .eq("id", campanha.business_id)
    .maybeSingle();

  if (!negocio) return { ok: false, mensagem: "Não encontramos seu negócio." };

  // ---------- Negócio de teste não publica ----------
  // A coluna `dados_ficticios` existe para permitir transcrição inventada
  // sem contaminar contagem, fila de operador e perfil (ver
  // docs/extracao-perfil.md §9). Sem ESTA checagem ela seria só
  // documentação: é a trava que torna impossível um negócio de teste virar
  // gasto no Meta.
  //
  // Vem ANTES do token e antes de marcar `publish_state = "publishing"`,
  // não junto do piso de orçamento: a resposta não depende de nada do
  // Meta, então gastar uma requisição — ou deixar a campanha marcada como
  // publicando — para descobrir isso seria trabalho jogado fora, e um
  // estado "publishing" que ninguém vai encerrar.
  if (negocio.dados_ficticios) {
    return {
      ok: false,
      mensagem:
        "Este negócio está marcado como dados fictícios e não pode publicar anúncio.",
    };
  }

  const { data: conta } = await supa
    .from("ad_accounts")
    .select("id, external_id")
    .eq("id", campanha.ad_account_id ?? "")
    .maybeSingle();

  if (!conta?.external_id) {
    return {
      ok: false,
      mensagem: "Escolha a conta de anúncio antes de publicar.",
    };
  }

  const { data: token } = await supa.rpc("obter_token_meta", {
    p_business_id: campanha.business_id,
  });

  // Token nulo aborta antes da primeira chamada, em vez de queimar
  // requisição para descobrir o óbvio.
  if (!token || typeof token !== "string") {
    return {
      ok: false,
      mensagem: "A conexão com o Facebook precisa ser refeita antes de publicar.",
    };
  }

  // ---------- Camada 1: a chave persistida ----------
  const publishKey = campanha.publish_key ?? randomUUID();
  const ctx: Contexto = {
    supa,
    businessId: campanha.business_id,
    campaignId: campanha.id,
    publishKey,
    marca: `[v2g:${publishKey.slice(0, 8)}]`,
    contaExterna: conta.external_id,
    token,
  };

  await supa
    .from("campaigns")
    .update({
      publish_key: publishKey,
      publish_state: "publishing",
      publish_started_at: new Date().toISOString(),
      publish_error: null,
    })
    .eq("id", campanha.id);

  try {
    // ---------- Pré-checagens, antes de qualquer criação ----------
    const piso = await consultarPisoDiario(ctx.contaExterna, token);
    if (piso !== null) {
      await supa
        .from("ad_accounts")
        .update({
          min_daily_budget_cents: piso,
          min_budget_checked_at: new Date().toISOString(),
        })
        .eq("id", conta.id);
    }

    const orcamento = validarOrcamento(negocio.monthly_budget, piso);
    if (!orcamento.ok) {
      return await abortar(ctx, "conjunto", orcamento.mensagem, orcamento.detalhe);
    }

    // A página é necessária ANTES do conjunto, não só do criativo:
    // `promoted_object.page_id` é obrigatório para otimizar por
    // CONVERSATIONS, e é o endereço dela que dá a coordenada do raio.
    const { data: conexao } = await supa
      .from("meta_connections")
      .select("meta_page_id")
      .eq("business_id", campanha.business_id)
      .maybeSingle();

    if (!conexao?.meta_page_id) {
      return await abortar(
        ctx,
        "conjunto",
        "Refaça a conexão com o Facebook para escolher de qual página o anúncio sai.",
        {},
      );
    }
    const pageId = conexao.meta_page_id;

    const geo = await garantirGeo(ctx, negocio, pageId);
    if (!geo) {
      return await abortar(
        ctx,
        "conjunto",
        negocio.city
          ? `Não encontramos "${negocio.city}" no Facebook. Confira a cidade do seu negócio em Conta.`
          : "Antes de publicar, informe a cidade do seu negócio em Conta.",
        { city: negocio.city },
      );
    }

    const raio = raioValido(negocio.radius_km);
    const nomeBase = campanha.name?.trim() || negocio.name;

    // ---------- Passo 2: campanha ----------
    const camposCampanha: Record<string, string> = {
      name: `${nomeBase} ${ctx.marca}`,
      objective: CAMPANHA.objective,
      buying_type: CAMPANHA.buying_type,
      status: "PAUSED",
      // Obrigatório mesmo vazio: omitir devolve erro.
      special_ad_categories: "[]",
      // O orçamento fica no conjunto, não na campanha. Sem este campo
      // explícito o Meta recusa com subcode 4834011.
      is_adset_budget_sharing_enabled: "false",
    };

    let externalCampaignId = campanha.external_campaign_id ?? null;

    if (!externalCampaignId) {
      externalCampaignId = await acharPelaMarca(ctx, "campaigns");
    }

    if (!externalCampaignId) {
      // Ensaio a seco antes de criar. Barato, e transforma "objeto
      // órfão no Meta" em "mensagem na tela".
      await registrarTentativa(ctx, "campanha", { ...camposCampanha, validacao: true });
      try {
        await criarNoMeta(`/${ctx.contaExterna}/campaigns`, token, camposCampanha, {
          validarApenas: true,
        });
        await registrarResultado(ctx, "campanha", { validacao: true });
      } catch (erro) {
        await registrarResultado(ctx, "campanha", { erro, validacao: true });
        return await abortar(ctx, "campanha", mensagemDeFalha(erro), {});
      }

      await registrarTentativa(ctx, "campanha", camposCampanha);
      try {
        externalCampaignId = await criarNoMeta(
          `/${ctx.contaExterna}/campaigns`,
          token,
          camposCampanha,
        );
        await registrarResultado(ctx, "campanha", { id: externalCampaignId });
      } catch (erro) {
        await registrarResultado(ctx, "campanha", { erro });
        return await abortar(ctx, "campanha", mensagemDeFalha(erro), {});
      }

      await supa
        .from("campaigns")
        .update({ external_campaign_id: externalCampaignId, objective: CAMPANHA.objective })
        .eq("id", campanha.id);
    }

    // ---------- Passo 3: conjunto. É AQUI que o dinheiro entra ----------
    const inicio = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const camposConjunto: Record<string, string> = {
      name: `${nomeBase} — conjunto ${ctx.marca}`,
      campaign_id: externalCampaignId as string,
      daily_budget: String(orcamento.diarioCentavos),
      billing_event: CONJUNTO.billing_event,
      optimization_goal: CONJUNTO.optimization_goal,
      bid_strategy: CONJUNTO.bid_strategy,
      destination_type: CONJUNTO.destination_type,
      // Obrigatório para CONVERSATIONS: diz ao Meta qual página recebe a
      // conversa. Sem ele o conjunto é recusado.
      promoted_object: JSON.stringify({ page_id: pageId }),
      targeting: JSON.stringify(montarSegmentacao(geo, raio)),
      attribution_spec: JSON.stringify(ATRIBUICAO),
      status: "PAUSED",
      start_time: inicio,
    };

    let externalAdsetId = campanha.external_adset_id ?? null;
    if (!externalAdsetId) externalAdsetId = await acharPelaMarca(ctx, "adsets");

    if (!externalAdsetId) {
      await registrarTentativa(ctx, "conjunto", {
        ...camposConjunto,
        validacao: true,
        orcamento_centavos: orcamento.diarioCentavos,
        piso_centavos: piso,
      });
      try {
        await criarNoMeta(`/${ctx.contaExterna}/adsets`, token, camposConjunto, {
          validarApenas: true,
        });
        await registrarResultado(ctx, "conjunto", { validacao: true });
      } catch (erro) {
        await registrarResultado(ctx, "conjunto", { erro, validacao: true });
        return await abortar(ctx, "conjunto", mensagemDeFalha(erro), {});
      }

      await registrarTentativa(ctx, "conjunto", {
        ...camposConjunto,
        orcamento_centavos: orcamento.diarioCentavos,
      });
      try {
        externalAdsetId = await criarNoMeta(
          `/${ctx.contaExterna}/adsets`,
          token,
          camposConjunto,
        );
        await registrarResultado(ctx, "conjunto", { id: externalAdsetId });
      } catch (erro) {
        await registrarResultado(ctx, "conjunto", { erro });
        return await abortar(ctx, "conjunto", mensagemDeFalha(erro), {});
      }

      await supa
        .from("campaigns")
        .update({
          external_adset_id: externalAdsetId,
          daily_budget_cents: orcamento.diarioCentavos,
        })
        .eq("id", campanha.id);
    }

    // ---------- Passos 1, 4 e 5: imagem, criativo e anúncio ----------
    const peca = await publicarPeca(ctx, {
      externalAdsetId: externalAdsetId as string,
      nomeBase,
      pageId,
    });

    if (!peca.ok) {
      return await abortar(ctx, peca.etapaQueFalhou ?? "criativo", peca.mensagem ?? "", {});
    }

    await supa
      .from("campaigns")
      .update({
        publish_state: "published",
        publish_error: null,
        published_at: new Date().toISOString(),
        status: "paused",
      })
      .eq("id", campanha.id);

    return {
      ok: true,
      externalCampaignId: externalCampaignId as string,
      externalAdsetId: externalAdsetId as string,
      externalCreativeId: peca.externalCreativeId,
      externalAdId: peca.externalAdId,
    };
  } catch (erro) {
    // Rede de segurança: qualquer coisa não prevista deixa a campanha em
    // `failed` com mensagem, nunca presa em `publishing`.
    registrarErroMeta("publicar:inesperado", erro);
    return await abortar(ctx, "campanha", mensagemDeFalha(erro), {});
  }
}

/**
 * Marca a campanha como falha e devolve o resultado.
 *
 * NÃO apaga nada no Meta. O que ficou lá está pausado, não gasta, e é
 * reaproveitado pelo `publish_key` na próxima tentativa. Ver §7 do
 * desenho: apagar é uma chamada a mais que pode falhar, e numa corrida
 * pode remover objeto que outra execução acabou de criar.
 */
async function abortar(
  ctx: Contexto,
  etapa: EtapaPublicacao,
  mensagem: string,
  detalhe: Record<string, unknown>,
): Promise<ResultadoPublicacao> {
  await ctx.supa
    .from("campaigns")
    .update({ publish_state: "failed", publish_error: mensagem })
    .eq("id", ctx.campaignId);

  if (Object.keys(detalhe).length > 0) {
    await registrarResultado(ctx, etapa, { erro: JSON.stringify(detalhe) });
  }

  return { ok: false, mensagem, etapaQueFalhou: etapa };
}

/**
 * A mensagem que o cliente lê.
 *
 * `error_user_msg` do Meta tem prioridade quando existe: já vem em
 * português e escrito para quem não é gestor de tráfego. É melhor que
 * qualquer texto genérico nosso, e foi o que o teste de `validate_only`
 * mostrou (`docs/publicar-campanha.md` §0.a).
 */
function mensagemDeFalha(erro: unknown): string {
  if (erro instanceof FalhaMeta && erro.detalhe.mensagemUsuario) {
    return erro.detalhe.mensagemUsuario;
  }
  return "Não conseguimos publicar seu anúncio agora. Nada foi ativado e nenhuma verba foi gasta — a gente já está olhando.";
}

// ============================================================
// Imagem, criativo e anúncio
// ============================================================

/**
 * ATENÇÃO: esta parte da cadeia NÃO TEM TESTE REAL ainda.
 *
 * `POST /adcreatives` falha com subcode 1885183 — "o app está em modo de
 * desenvolvimento, deve estar em modo público para criar este anúncio" —
 * antes de chegar a qualquer validação de conteúdo. É pré-requisito de
 * lançamento, não detalhe de teste. Ver `docs/publicar-campanha.md` §0.b.
 *
 * Está escrito porque o desenho pede a cadeia inteira e porque escrever
 * agora, com o contexto fresco, é mais barato que escrever depois. Mas
 * quando o app sair do modo de desenvolvimento, ISTO AQUI PRECISA SER
 * TESTADO antes de ir para cliente. Não assuma que funciona.
 */
async function publicarPeca(
  ctx: Contexto,
  args: { externalAdsetId: string; nomeBase: string; pageId: string },
): Promise<ResultadoPublicacao> {
  const { data: criativo } = await ctx.supa
    .from("creatives")
    .select("id, copy, storage_path, external_image_hash, external_creative_id, external_ad_id")
    .eq("campaign_id", ctx.campaignId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!criativo) {
    return {
      ok: false,
      etapaQueFalhou: "criativo",
      mensagem: "Essa campanha ainda não tem um anúncio aprovado para publicar.",
    };
  }

  // Leitura defensiva do jsonb: `creatives.copy` é saída de LLM e o
  // formato ainda não assentou. Faltar título ou corpo precisa falhar
  // AQUI, com mensagem clara, e não virar um anúncio vazio no ar.
  const copy = (criativo.copy ?? {}) as Record<string, unknown>;
  const titulo = typeof copy.titulo === "string" ? copy.titulo.trim() : "";
  const corpo = typeof copy.corpo === "string" ? copy.corpo.trim() : "";

  if (!titulo || !corpo) {
    return {
      ok: false,
      etapaQueFalhou: "criativo",
      mensagem: "O texto desse anúncio está incompleto. Aprove o anúncio antes de publicar.",
    };
  }

  const imageHash = criativo.external_image_hash;
  if (!imageHash) {
    // O upload da imagem (passo 1) sai do lote de geração de criativo.
    // Falhar explícito é melhor que publicar um anúncio só de texto que
    // o Meta rejeitaria depois, na revisão.
    return {
      ok: false,
      etapaQueFalhou: "imagem",
      mensagem: "A imagem desse anúncio ainda não foi enviada para o Facebook.",
    };
  }

  const storySpec = {
    page_id: args.pageId,
    link_data: {
      image_hash: imageHash,
      name: titulo,
      message: corpo,
      // O número não vai aqui: quem resolve o destino é o vínculo
      // WhatsApp↔Página do lado do Meta. Um número fixo na URL mandaria
      // todo cliente para o mesmo WhatsApp.
      link: "https://api.whatsapp.com/send",
      call_to_action: {
        type: "WHATSAPP_MESSAGE",
        value: { app_destination: "WHATSAPP" },
      },
    },
  };

  const camposCriativo: Record<string, string> = {
    name: `${args.nomeBase} — criativo ${ctx.marca}`,
    object_story_spec: JSON.stringify(storySpec),
    // Sem os "aprimoramentos automáticos": eles alteram texto e imagem
    // sem avisar, e o cliente aprovou uma peça específica.
    degrees_of_freedom_spec: JSON.stringify({
      creative_features_spec: { standard_enhancements: { enroll_status: "OPT_OUT" } },
    }),
  };

  let creativeId = criativo.external_creative_id ?? null;

  if (!creativeId) {
    await registrarTentativa(ctx, "criativo", camposCriativo);
    try {
      await criarNoMeta(`/${ctx.contaExterna}/adcreatives`, ctx.token, camposCriativo, {
        validarApenas: true,
      });
      creativeId = await criarNoMeta(
        `/${ctx.contaExterna}/adcreatives`,
        ctx.token,
        camposCriativo,
      );
      await registrarResultado(ctx, "criativo", { id: creativeId });
    } catch (erro) {
      await registrarResultado(ctx, "criativo", { erro });
      return { ok: false, etapaQueFalhou: "criativo", mensagem: mensagemDeFalha(erro) };
    }

    await ctx.supa
      .from("creatives")
      .update({ external_creative_id: creativeId, status: "pending_review" })
      .eq("id", criativo.id);
  }

  // ---------- Passo 5: o anúncio ----------
  const camposAnuncio: Record<string, string> = {
    name: `${args.nomeBase} — anúncio ${ctx.marca}`,
    adset_id: args.externalAdsetId,
    creative: JSON.stringify({ creative_id: creativeId }),
    status: "PAUSED",
  };

  let adId = criativo.external_ad_id ?? null;

  if (!adId) {
    await registrarTentativa(ctx, "anuncio", camposAnuncio);
    try {
      await criarNoMeta(`/${ctx.contaExterna}/ads`, ctx.token, camposAnuncio, {
        validarApenas: true,
      });
      adId = await criarNoMeta(`/${ctx.contaExterna}/ads`, ctx.token, camposAnuncio);
      await registrarResultado(ctx, "anuncio", { id: adId });
    } catch (erro) {
      await registrarResultado(ctx, "anuncio", { erro });
      return { ok: false, etapaQueFalhou: "anuncio", mensagem: mensagemDeFalha(erro) };
    }

    await ctx.supa
      .from("creatives")
      .update({ external_ad_id: adId, published_at: new Date().toISOString() })
      .eq("id", criativo.id);
  }

  return {
    ok: true,
    externalCreativeId: creativeId ?? undefined,
    externalAdId: adId ?? undefined,
  };
}
