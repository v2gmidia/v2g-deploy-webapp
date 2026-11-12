import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GrupoDaGaleria, ItemDaGaleria } from "@/app/(protected)/criativos/GaleriaCriativos";
import { BUCKET_REVISAO, caminhoConfereComRevisao, rotuloDaRevisao, type StatusRevisao } from "./revisao";
import { resumoDaIntencao } from "./intencao-envio";
import { urlImagemGerada } from "./geracao/imagem-privada";
import { UUID_GERACAO } from "./geracao/contrato-fila";
import { COLUNAS_PUBLICACAO, lerPublicacao, textoDaPublicacao } from "./publicacao";
import { caminhoDaPecaPertenceAoCliente } from "@/lib/agencia/caminho-da-peca";
import { hrefDoCliente, type ContextoAgencia, type RetornoCarteira } from "@/lib/agencia/contexto";

type PecaDaCampanha = {
  id: string;
  business_id: string;
  copy: { generation?: { requestId?: string; simulated?: boolean } } | null;
  file_name: string | null;
  storage_path: string | null;
  status: string | null;
  external_ad_id: string | null;
  created_at: string;
  updated_at: string;
  arquivado_em: string | null;
};

function pecaGerada(peca: PecaDaCampanha): boolean {
  return Boolean(peca.copy?.generation || peca.storage_path?.startsWith("geracao/"));
}

type PedidoDeRevisao = {
  id: string;
  business_id: string;
  original_name: string;
  file_path: string;
  sha256: string;
  status: StatusRevisao;
  review_note: string | null;
  upload_intent: unknown;
  created_at: string;
  reviewed_at?: string | null;
};

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function grupoDaPeca(peca: PecaDaCampanha): GrupoDaGaleria {
  if (peca.arquivado_em || peca.status === "paused" || peca.status === "rejected") return "arquivados";
  if (pecaGerada(peca)) return "biblioteca";
  // Vínculo registrado não atesta exibição atual; a situação é do negócio.
  if (peca.external_ad_id) return "biblioteca";
  return "revisao";
}

function estadoDaPeca(status: string | null): Pick<ItemDaGaleria, "estado" | "tom"> {
  switch (status) {
    case "approved": return { estado: "Aprovado", tom: "positivo" };
    case "pending_review": return { estado: "Revisão da plataforma", tom: "atencao" };
    case "rejected": return { estado: "Recusado", tom: "critico" };
    case "paused": return { estado: "Pausado", tom: "atencao" };
    default: return { estado: "Em preparo", tom: "neutro" };
  }
}

function grupoDaRevisao(status: StatusRevisao): GrupoDaGaleria {
  if (status === "approved_for_manual_publish") return "biblioteca";
  if (status === "rejected" || status === "upload_failed") return "arquivados";
  return "revisao";
}

function tomDaRevisao(status: StatusRevisao): ItemDaGaleria["tom"] {
  if (status === "approved_for_manual_publish") return "positivo";
  if (status === "rejected" || status === "upload_failed") return "critico";
  if (status === "changes_requested") return "atencao";
  return "neutro";
}

/** Galeria por negócio: Auth + titular exato antes de consultar peças ou assinar arquivos.
 * Usada também pela carteira, sem trocar o cookie e sem buscar resultados Meta. */
export async function carregarGaleriaDoNegocio(negocioId: string, opcoes: {
  revisaoHabilitada: boolean; geracaoHabilitada: boolean; contextoAgencia?: ContextoAgencia; retorno?: RetornoCarteira;
}) {
  const vazio = { itens: [] as ItemDaGaleria[], hoje: "", falhaDaGaleria: true,
    revisaoInconsistente: false, filaTruncada: false, caminhoLegadoInconsistente: false, falhaPublicacoes: false };
  const supabase = await createClient();
  const auth = await supabase.auth.getUser();
  const user = auth.data.user;
  if (auth.error || !user || !UUID_GERACAO.test(negocioId)) return vazio;
  const titular = await supabase.from("businesses").select("id, profile_id")
    .eq("id", negocioId).eq("profile_id", user.id).maybeSingle();
  if (titular.error || titular.data?.id !== negocioId || titular.data?.profile_id !== user.id) return vazio;
  const { revisaoHabilitada, geracaoHabilitada, contextoAgencia } = opcoes;
  if (contextoAgencia && contextoAgencia.businessId !== negocioId) return vazio;
  const partesHoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const parteHoje = (nome: Intl.DateTimeFormatPartTypes) => partesHoje.find((p) => p.type === nome)!.value;
  const hoje = `${parteHoje("year")}-${parteHoje("month")}-${parteHoje("day")}`;

  const [pecasResposta, revisoesResposta] = negocioId ? await Promise.all([
    supabase.from("creatives")
      .select("id, business_id, copy, file_name, storage_path, status, external_ad_id, created_at, updated_at, arquivado_em")
      .eq("business_id", negocioId).eq("uso", "campanha")
      .order("created_at", { ascending: false }).limit(contextoAgencia ? 121 : 120),
    revisaoHabilitada
      ? supabase.from("creative_review_requests")
        .select("id, business_id, original_name, file_path, sha256, status, review_note, created_at, upload_intent, reviewed_at")
        .eq("business_id", negocioId).order("created_at", { ascending: false }).limit(contextoAgencia ? 121 : 120)
      : Promise.resolve({ data: [] as PedidoDeRevisao[], error: null }),
  ]) : [
    { data: [] as PecaDaCampanha[], error: null },
    { data: [] as PedidoDeRevisao[], error: null },
  ];

  const filaTruncada = Boolean(contextoAgencia && ((pecasResposta.data?.length ?? 0) > 120 || (revisoesResposta.data?.length ?? 0) > 120));
  const pecas = ((pecasResposta.data ?? []) as PecaDaCampanha[]).filter((peca) => peca.business_id === negocioId).slice(0, 120);
  const revisoesRecebidas = (revisoesResposta.data ?? []) as PedidoDeRevisao[];
  const revisoes = revisoesRecebidas.filter((pedido) => pedido.business_id === negocioId);
  const publicacoes = revisoes.length ? await supabase.from("creative_publication_confirmations").select(COLUNAS_PUBLICACAO)
    .eq("business_id", negocioId).in("review_request_id", revisoes.map(p => p.id)) : { data: [], error: null };
  const publicacaoPorRevisao = new Map((publicacoes.data ?? []).map(p => [p.review_request_id, p]));
  const revisaoInconsistente = revisoes.length !== revisoesRecebidas.length
    || revisoes.some((pedido) => pedido.status !== "uploading" && pedido.status !== "upload_failed"
      && !caminhoConfereComRevisao(pedido));
  const admin = user && negocioId ? createAdminClient() : null;
  // Arquivos gerados não entram no assinador genérico. A leitura autenticada
  // revalida pedido, backend, caminho canônico e hash a cada abertura.
  const caminhoLegadoInconsistente = Boolean(contextoAgencia && pecas.some(p => !pecaGerada(p) && p.storage_path
    && !caminhoDaPecaPertenceAoCliente(negocioId!, p.storage_path)));
  const caminhosDasPecas = pecas.filter((peca) => !pecaGerada(peca)
    && (!contextoAgencia || caminhoDaPecaPertenceAoCliente(negocioId!, peca.storage_path))).map((peca) => peca.storage_path).filter((c): c is string => Boolean(c));
  const caminhosDasRevisoes = revisoes
    .filter((pedido) => pedido.status !== "uploading" && pedido.status !== "upload_failed"
      && caminhoConfereComRevisao(pedido))
    .map((pedido) => pedido.file_path);

  const [urlsDasPecas, urlsDasRevisoes] = admin ? await Promise.all([
    caminhosDasPecas.length
      ? admin.storage.from("v2g-midia").createSignedUrls(caminhosDasPecas, 900)
      : Promise.resolve({ data: [], error: null }),
    caminhosDasRevisoes.length
      ? admin.storage.from(BUCKET_REVISAO).createSignedUrls(caminhosDasRevisoes, 900)
      : Promise.resolve({ data: [], error: null }),
  ]) : [{ data: [], error: null }, { data: [], error: null }];

  const urlPorPeca = new Map((urlsDasPecas.data ?? []).map((item) => [item.path, item.signedUrl]));
  const urlPorRevisao = new Map((urlsDasRevisoes.data ?? []).map((item) => [item.path, item.signedUrl]));
  const itens: ItemDaGaleria[] = [
    ...pecas.map((peca) => ({
      id: `peca-${peca.id}`,
      nome: peca.file_name || "Criativo sem nome",
      imagemUrl: pecaGerada(peca)
        ? geracaoHabilitada && typeof peca.copy?.generation?.requestId === "string" && UUID_GERACAO.test(peca.copy.generation.requestId)
          ? urlImagemGerada(peca.copy.generation.requestId, negocioId!) : null
        : peca.storage_path ? (urlPorPeca.get(peca.storage_path) ?? null) : null,
      grupo: grupoDaPeca(peca),
      ...(pecaGerada(peca) ? { estado: peca.copy?.generation?.simulated === true ? "Imagem fictícia de teste" : "Arquivo gerado — conferir acesso", tom: "neutro" as const } : estadoDaPeca(peca.status)),
      criadoEm: `Criado em ${dataCurta.format(new Date(peca.created_at))}`,
      detalhe: peca.arquivado_em ? `Arquivado em ${dataCurta.format(new Date(peca.arquivado_em))}` : null,
      acao: pecaGerada(peca) ? null : { rotulo: "Ver anúncio", href: "/anuncios" },
      associacoes: peca.external_ad_id
        ? [{ nome: "Vínculo registrado com anúncio", href: "/anuncios" }]
        : [],
    })),
    ...revisoes.map((pedido) => {
      const registro = publicacaoPorRevisao.get(pedido.id);
      const publicacao = lerPublicacao(registro, pedido);
      return {
      id: `revisao-${pedido.id}`,
      nome: pedido.original_name,
      imagemUrl: caminhoConfereComRevisao(pedido)
        ? (urlPorRevisao.get(pedido.file_path) ?? null) : null,
      grupo: grupoDaRevisao(pedido.status),
      estado: rotuloDaRevisao(pedido.status),
      publicacao: textoDaPublicacao(publicacao, Boolean(publicacoes.error || (registro && !publicacao))),
      revisao: { status: pedido.status, revisadoEm: pedido.reviewed_at ?? null, publicacaoConfirmada: Boolean(publicacao),
        falhaPublicacao: Boolean(publicacoes.error || (registro && !publicacao)) },
      tom: tomDaRevisao(pedido.status),
      criadoEm: `Enviado em ${dataCurta.format(new Date(pedido.created_at))}`,
      detalhe: [resumoDaIntencao(pedido.upload_intent, hoje),
        pedido.review_note ? `Retorno do gestor: ${pedido.review_note}` : null].filter(Boolean).join(" "),
      acao: pedido.status === "approved_for_manual_publish"
        ? { rotulo: "Ver anúncios", href: "/anuncios" }
        : null,
      associacoes: publicacao ? [{ nome: `Anúncio ${publicacao.ad_id} · vínculo informado pelo gestor`,
        href: `/anuncios?conta=${publicacao.ad_account_id}` }] : [],
    }; }),
  ];

  // URLs de anúncio conservam o anunciante. Conta externa é sempre revalidada pelo leitor Meta.
  if (contextoAgencia) for (const item of itens) {
    if (item.acao?.href.startsWith("/anuncios")) item.acao = { ...item.acao,
      href: hrefDoCliente("/anuncios", negocioId, opcoes.retorno) };
    item.associacoes = item.associacoes?.map(a => {
      const conta = new URL(a.href, "https://v2g.invalid").searchParams.get("conta");
      return { ...a, href: hrefDoCliente("/anuncios", negocioId, opcoes.retorno)
        + (conta && /^act_[0-9]+$/.test(conta) ? `&conta=${conta}` : "") };
    });
  }
  const falhaDaGaleria = Boolean(pecasResposta.error || revisoesResposta.error
    || (pecasResposta.data ?? []).some(p => p.business_id !== negocioId));
  return { itens, hoje, falhaDaGaleria, revisaoInconsistente, filaTruncada,
    caminhoLegadoInconsistente, falhaPublicacoes: Boolean(publicacoes.error) };
}
