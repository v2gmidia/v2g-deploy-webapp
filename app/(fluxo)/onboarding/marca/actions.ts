"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gravarCamposDoCliente, type CampoParaGravar } from "@/lib/cadastro/procedencia";
import { documento, type RespostasDaMarca } from "@/lib/onboarding/marca";
import { respostasBasicas, type PerguntaBasica } from "@/lib/onboarding/bloco-um";
import { estadoDaConclusao } from "@/lib/onboarding/conclusao";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { validarInstagram, validarSite } from "@/lib/onboarding/enderecos";

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
  siteNaoTenhoDeclarado: boolean;
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
  recarregar?: boolean;
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
  const { marca, faltamBasicas, contasProntas, concluido } = estadoDaConclusao(linha);
  return {
    businessId: linha.id,
    site: linha.site_url ?? "",
    instagram: linha.instagram_handle ?? "",
    siteNaoTenhoDeclarado: (doc.respostas as Record<string, { texto?: string }> | undefined)?.site?.texto === "Não tenho site",
    marca,
    concluido,
    respostasBasicas: respostasBasicas(doc),
    faltamBasicas,
    contasProntas,
  };
}

export async function carregarMarcaAction(): Promise<{ erro: string } | EstadoMarca> {
  const r = await obter();
  return "erro" in r ? r : estado(r.linha);
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

  const aparencia = entrada.aparencia.trim();
  if (!entrada.aparenciaNaoSei && !aparencia) {
    return { ok: false, erro: "Conte como é sua marca ou marque que ainda não sabe." };
  }
  if (aparencia.length > 500) return { ok: false, erro: "Resuma o visual da marca em até 500 caracteres." };
  if (entrada.siteNaoTenho && entrada.site.trim()) {
    return { ok: false, erro: "Para marcar que não tem site, deixe o endereço vazio." };
  }
  const site = entrada.site.trim() ? validarSite(entrada.site.trim()) : null;
  if (entrada.site.trim() && !site) return { ok: false, erro: "Confira o endereço do site." };
  if (!entrada.siteNaoTenho && !site) {
    return { ok: false, erro: "Informe o site ou marque que não tem um." };
  }
  const instagram = entrada.instagram.trim() ? validarInstagram(entrada.instagram) : null;
  if (entrada.instagram.trim() && !instagram) return { ok: false, erro: "Confira o @ do Instagram." };
  const campos: CampoParaGravar[] = [];
  if (site && site !== anterior.site) campos.push({ campo: "site_url", valor: site });
  if (instagram && instagram !== anterior.instagram) campos.push({ campo: "instagram_handle", valor: instagram });
  const esvaziar = [
    ...(entrada.siteNaoTenho && anterior.site ? ["site_url"] : []),
    ...(!instagram && anterior.instagram ? ["instagram_handle"] : []),
  ];
  const visual = entrada.aparenciaNaoSei ? "" : aparencia;
  if (anterior.concluido && campos.length === 0 && esvaziar.length === 0 && anterior.marca &&
      anterior.marca.aparencia === visual &&
      anterior.marca.aparenciaNaoSei === entrada.aparenciaNaoSei &&
      anterior.marca.siteNaoTenho === entrada.siteNaoTenho)
    return { ok: true, estado: anterior };
  if (campos.length) {
    const gravacao = await gravarCamposDoCliente({ profileId: r.profileId, businessId: r.linha.id, tabela: "businesses", campos });
    if (!gravacao.ok) return { ok: false, erro: gravacao.erro, recarregar: true };
  }

  const agora = new Date().toISOString();
  const supabase = await createClient();
  if (esvaziar.length) {
    const limpeza = await supabase.rpc("esvaziar_campos_do_cliente", {
      p_business_id: r.linha.id, p_campos: esvaziar,
    });
    if (limpeza.error || limpeza.data !== esvaziar.length) {
      console.error("[marca] falha ao esvaziar campos ::", limpeza.error?.message ?? "resultado inesperado");
      return { ok: false, erro: "Não conseguimos confirmar a atualização do site ou Instagram.", recarregar: true };
    }
  }
  const { data: mesclado, error } = await supabase.rpc("mesclar_blocos_onboarding", {
    p_business_id: r.linha.id,
    p_patch: {
      marca: { aparencia: visual,
        aparenciaNaoSei: entrada.aparenciaNaoSei, siteNaoTenho: entrada.siteNaoTenho, em: agora },
      ...(anterior.concluido ? {} : { conclusao: { em: agora, proximoPasso: "agendamento_pendente" } }),
    },
  });
  if (error || mesclado !== true) {
    console.error("[marca] falha ao salvar ::", error?.message ?? "negócio indisponível");
    return { ok: false, erro: "Não conseguimos confirmar a gravação desta etapa.", recarregar: true };
  }
  revalidatePath("/onboarding/marca");
  revalidatePath("/onboarding/concluido");
  const depois = await obter();
  return { ok: true, estado: "erro" in depois ? undefined : estado(depois.linha) };
}
