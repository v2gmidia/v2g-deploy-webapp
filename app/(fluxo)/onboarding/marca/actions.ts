"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gravarCamposDoCliente, type CampoParaGravar } from "@/lib/cadastro/procedencia";
import { lerConta, ticketEscalar, type RespostaDeConta } from "@/lib/cadastro/montar";
import { documento, lerConclusao, lerMarca, type RespostasDaMarca } from "@/lib/onboarding/marca";
import { faltamRespostasBasicas, respostasBasicas, type PerguntaBasica } from "@/lib/onboarding/bloco-um";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";

interface Linha {
  id: string;
  onboarding: unknown;
  site_url: string | null;
  instagram_handle: string | null;
  avg_ticket_min: number | null;
  avg_ticket_max: number | null;
  avg_direct_cost: number | null;
  target_profit_per_customer: number | null;
}

export interface EstadoMarca {
  businessId: string;
  site: string;
  instagram: string;
  marca: RespostasDaMarca | null;
  concluido: boolean;
  contasProntas: boolean;
  respostasBasicas: ReturnType<typeof respostasBasicas>;
  faltamBasicas: PerguntaBasica[];
}

export interface ResultadoMarca {
  ok: boolean;
  erro?: string;
  estado?: EstadoMarca;
}

async function obter(): Promise<{ erro: string } | { linha: Linha; profileId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado") return { erro: "Escolha um negócio para continuar." };
  const { data, error } = await supabase.from("businesses")
    .select("id, onboarding, site_url, instagram_handle, avg_ticket_min, avg_ticket_max, avg_direct_cost, target_profit_per_customer")
    .eq("profile_id", user.id).eq("id", ativo.negocio.id).maybeSingle();
  if (error) {
    console.error("[marca] falha ao buscar negócio ::", error.message);
    return { erro: "Não foi possível carregar seus dados agora." };
  }
  if (!data) return { erro: "Comece pelo onboarding antes desta etapa." };
  return { linha: data as Linha, profileId: user.id };
}

function estado(linha: Linha): EstadoMarca {
  const doc = documento(linha.onboarding);
  const faltamBasicas = faltamRespostasBasicas(doc);
  const contas = (doc.contas ?? {}) as Partial<Record<"ticket" | "custo" | "lucro", RespostaDeConta>>;
  const numero = (v: number | null) => v === null ? null : Number(v);
  const contasProntas = (
    [lerConta(ticketEscalar(numero(linha.avg_ticket_min), numero(linha.avg_ticket_max)), contas.ticket),
     lerConta(numero(linha.avg_direct_cost), contas.custo),
     lerConta(numero(linha.target_profit_per_customer), contas.lucro)]
  ).every((leitura) => leitura.estado === "respondida" || leitura.estado === "nao_sei");
  return {
    businessId: linha.id,
    site: linha.site_url ?? "",
    instagram: linha.instagram_handle ?? "",
    marca: lerMarca(doc),
    concluido: lerConclusao(doc) !== null && faltamBasicas.length === 0 && contasProntas,
    respostasBasicas: respostasBasicas(doc),
    faltamBasicas,
    contasProntas,
  };
}

export async function carregarMarcaAction(): Promise<{ erro: string } | EstadoMarca> {
  const r = await obter();
  return "erro" in r ? r : estado(r.linha);
}

function validarInstagram(bruto: string): string | null {
  const texto = bruto.trim().replace(/\s/g, "");
  const daUrl = texto.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i);
  const usuario = (daUrl ? daUrl[1]! : texto).replace(/^@/, "").replace(/\/+$/, "");
  return /^[a-zA-Z0-9._]{1,30}$/.test(usuario) ? `@${usuario.toLowerCase()}` : null;
}

function validarSite(bruto: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(url.hostname)) return null;
    return url.toString().replace(/\/$/, "");
  } catch { return null; }
}

export async function salvarMarcaAction(entrada: {
  businessId: string;
  site: string;
  siteNaoTenho: boolean;
  instagram: string;
  aparencia: string;
  aparenciaNaoSei: boolean;
}): Promise<ResultadoMarca> {
  const r = await obter();
  if ("erro" in r) return { ok: false, erro: r.erro };
  if (entrada.businessId !== r.linha.id) return { ok: false, erro: "O negócio selecionado mudou. Atualize esta página." };
  const anterior = estado(r.linha);
  if (anterior.faltamBasicas.length) return { ok: false, erro: "Termine as perguntas sobre seu negócio antes de concluir." };
  if (!anterior.contasProntas) return { ok: false, erro: "Termine suas contas antes de continuar." };
  if (anterior.concluido) return { ok: true, estado: anterior };

  const aparencia = entrada.aparencia.trim();
  if (!entrada.aparenciaNaoSei && !aparencia) {
    return { ok: false, erro: "Conte como é sua marca ou marque que ainda não sabe." };
  }
  if (aparencia.length > 500) return { ok: false, erro: "Resuma o visual da marca em até 500 caracteres." };
  if (entrada.siteNaoTenho && anterior.site) {
    return { ok: false, erro: "Há um site salvo no seu perfil. Corrija esse endereço antes de marcar que não tem site." };
  }
  if (entrada.siteNaoTenho && entrada.site.trim()) {
    return { ok: false, erro: "Para marcar que não tem site, deixe o endereço vazio." };
  }
  const site = entrada.site.trim() ? validarSite(entrada.site.trim()) : null;
  if (entrada.site.trim() && !site) return { ok: false, erro: "Confira o endereço do site." };
  if (!entrada.siteNaoTenho && !site && !anterior.site) {
    return { ok: false, erro: "Informe o site ou marque que não tem um." };
  }
  const instagram = entrada.instagram.trim() ? validarInstagram(entrada.instagram) : null;
  if (entrada.instagram.trim() && !instagram) return { ok: false, erro: "Confira o @ do Instagram." };
  const campos: CampoParaGravar[] = [];
  if (site && site !== anterior.site) campos.push({ campo: "site_url", valor: site });
  if (instagram && instagram !== anterior.instagram) campos.push({ campo: "instagram_handle", valor: instagram });
  if (campos.length) {
    const gravacao = await gravarCamposDoCliente({ profileId: r.profileId, businessId: r.linha.id, tabela: "businesses", campos });
    if (!gravacao.ok) return { ok: false, erro: gravacao.erro };
  }

  const agora = new Date().toISOString();
  const supabase = await createClient();
  const { data: mesclado, error } = await supabase.rpc("mesclar_blocos_onboarding", {
    p_business_id: r.linha.id,
    p_patch: {
      marca: { aparencia: entrada.aparenciaNaoSei ? "" : aparencia,
        aparenciaNaoSei: entrada.aparenciaNaoSei, siteNaoTenho: entrada.siteNaoTenho, em: agora },
      conclusao: { em: agora, proximoPasso: "agendamento_pendente" },
    },
  });
  if (error || mesclado !== true) {
    console.error("[marca] falha ao salvar ::", error?.message ?? "negócio indisponível");
    return { ok: false, erro: "Não conseguimos salvar esta etapa. Tente de novo." };
  }
  revalidatePath("/onboarding/marca");
  revalidatePath("/onboarding/concluido");
  const depois = await obter();
  return { ok: true, estado: "erro" in depois ? undefined : estado(depois.linha) };
}
