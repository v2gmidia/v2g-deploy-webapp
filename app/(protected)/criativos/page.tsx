import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { tituloDaAba } from "@/lib/titulos";
import { BUCKET_REVISAO, caminhoConfereComRevisao, rotuloDaRevisao, type StatusRevisao } from "@/lib/criativos/revisao";
import { Analisar } from "./Analisar";
import { AmostraDeVereditos } from "./Amostra";
import { PedirRevisao } from "./PedirRevisao";
import { TelaDeCriativos } from "./TelaDeCriativos";
import type { GrupoDaGaleria, ItemDaGaleria } from "./GaleriaCriativos";
import { carregarPedidosDaSessao } from "@/lib/criativos/pedidos-da-sessao";
import { PedidoDeImagem } from "./PedidoDeImagem";
import { resumoDaIntencao } from "@/lib/criativos/intencao-envio";

export const metadata = tituloDaAba("/criativos");

type PecaDaCampanha = {
  id: string;
  file_name: string | null;
  storage_path: string | null;
  status: string | null;
  published_at: string | null;
  external_ad_id: string | null;
  created_at: string;
  updated_at: string;
  arquivado_em: string | null;
};

type PedidoDeRevisao = {
  id: string;
  business_id: string;
  original_name: string;
  file_path: string;
  status: StatusRevisao;
  review_note: string | null;
  upload_intent: unknown;
  created_at: string;
};

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function grupoDaPeca(peca: PecaDaCampanha): GrupoDaGaleria {
  if (peca.arquivado_em || peca.status === "paused" || peca.status === "rejected") return "arquivados";
  if (peca.published_at || peca.external_ad_id) return "biblioteca";
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

export default async function CriativosPage() {
  const estado = await estadoDoCliente(new Date());
  const revisaoHabilitada = process.env.V2G_CREATIVE_REVIEW_ENABLED === "true";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const negocioId = estado.negocioId;
  const pedidosHabilitados = process.env.V2G_CREATIVE_REQUESTS_ENABLED === "true" && Boolean(negocioId);
  const pedidosCriacao = pedidosHabilitados
    ? await carregarPedidosDaSessao(negocioId!) : { pedidos: [], falhou: false };
  const partesHoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const parteHoje = (nome: Intl.DateTimeFormatPartTypes) => partesHoje.find((p) => p.type === nome)!.value;
  const hoje = `${parteHoje("year")}-${parteHoje("month")}-${parteHoje("day")}`;

  const [pecasResposta, revisoesResposta] = negocioId ? await Promise.all([
    supabase.from("creatives")
      .select("id, file_name, storage_path, status, published_at, external_ad_id, created_at, updated_at, arquivado_em")
      .eq("business_id", negocioId).eq("uso", "campanha")
      .order("created_at", { ascending: false }).limit(120),
    revisaoHabilitada
      ? supabase.from("creative_review_requests")
        .select("id, business_id, original_name, file_path, status, review_note, created_at, upload_intent")
        .eq("business_id", negocioId).order("created_at", { ascending: false }).limit(120)
      : Promise.resolve({ data: [] as PedidoDeRevisao[], error: null }),
  ]) : [
    { data: [] as PecaDaCampanha[], error: null },
    { data: [] as PedidoDeRevisao[], error: null },
  ];

  const pecas = (pecasResposta.data ?? []) as PecaDaCampanha[];
  const revisoesRecebidas = (revisoesResposta.data ?? []) as PedidoDeRevisao[];
  const revisoes = revisoesRecebidas.filter((pedido) => pedido.business_id === negocioId);
  const revisaoInconsistente = revisoes.length !== revisoesRecebidas.length
    || revisoes.some((pedido) => pedido.status !== "uploading" && pedido.status !== "upload_failed"
      && !caminhoConfereComRevisao(pedido));
  const admin = user && negocioId ? createAdminClient() : null;
  const caminhosDasPecas = pecas.map((peca) => peca.storage_path).filter((c): c is string => Boolean(c));
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
      imagemUrl: peca.storage_path ? (urlPorPeca.get(peca.storage_path) ?? null) : null,
      grupo: grupoDaPeca(peca),
      ...estadoDaPeca(peca.status),
      criadoEm: `Criado em ${dataCurta.format(new Date(peca.created_at))}`,
      detalhe: peca.arquivado_em ? `Arquivado em ${dataCurta.format(new Date(peca.arquivado_em))}` : null,
      acao: { rotulo: "Ver anúncio", href: "/anuncios" },
      associacoes: peca.published_at || peca.external_ad_id
        ? [{ nome: "Usado em anúncio", href: "/anuncios" }]
        : [],
    })),
    ...revisoes.map((pedido) => ({
      id: `revisao-${pedido.id}`,
      nome: pedido.original_name,
      imagemUrl: caminhoConfereComRevisao(pedido)
        ? (urlPorRevisao.get(pedido.file_path) ?? null) : null,
      grupo: grupoDaRevisao(pedido.status),
      estado: rotuloDaRevisao(pedido.status),
      tom: tomDaRevisao(pedido.status),
      criadoEm: `Enviado em ${dataCurta.format(new Date(pedido.created_at))}`,
      detalhe: [resumoDaIntencao(pedido.upload_intent, hoje),
        pedido.review_note ? `Retorno do gestor: ${pedido.review_note}` : null].filter(Boolean).join(" "),
      acao: pedido.status === "approved_for_manual_publish"
        ? { rotulo: "Ver anúncios", href: "/anuncios" }
        : null,
      associacoes: [],
    })),
  ];

  const amostra = process.env.NODE_ENV !== "production" ? (process.env.V2G_FIXTURE_ANALISE ?? null) : null;
  const podeAnalisar = estado.diaSeguinte.execucao !== null;
  const falhaDaGaleria = pecasResposta.error || revisoesResposta.error;

  return <>
    {falhaDaGaleria ? <p className="form-warning">Parte da biblioteca não pôde ser carregada agora. Tente novamente mais tarde.</p> : null}
    {revisaoInconsistente ? <p className="form-warning">Uma peça está com o vínculo do arquivo inconsistente; sua prévia não foi aberta. Peça ajuda à equipe para conferir o envio.</p> : null}
    <TelaDeCriativos
      itens={itens}
      criacao={pedidosHabilitados ? <PedidoDeImagem key={negocioId} businessId={negocioId!}
        requestId={randomUUID()} hoje={hoje} pedidos={pedidosCriacao.pedidos}
        falhou={pedidosCriacao.falhou} /> : null}
      envioDisponivel={revisaoHabilitada && Boolean(negocioId)}
      envio={revisaoHabilitada && negocioId
        ? <PedirRevisao key={negocioId} businessId={negocioId} hoje={hoje} />
        : null}
      analise={amostra
        ? <AmostraDeVereditos qual={amostra} />
        : <Analisar podeEnviar={podeAnalisar} businessId={negocioId ?? ""} />}
    />
  </>;
}
