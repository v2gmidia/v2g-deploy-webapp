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
}

export interface EstadoMarca {
  businessId: string;
  site: string;
  instagram: string;
  siteNaoTenhoDeclarado: boolean;
  marca: RespostasDaMarca | null;
  concluido: boolean;
  /** Compatibilidade de bancada; economia não é mais uma guarda. */
  contasProntas?: boolean;
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
    .select("id, onboarding, site_url, instagram_handle")
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
  const respostas = doc.respostas && typeof doc.respostas === "object" && !Array.isArray(doc.respostas)
    ? doc.respostas as Record<string, unknown> : {};
  const operador = respostas.operador && typeof respostas.operador === "object" && !Array.isArray(respostas.operador)
    ? (respostas.operador as { texto?: unknown }).texto : null;
  const agenciaOperadora = operador === "Uma agência ou gestor opera para o anunciante";
  const contatosBrutos = respostas._contatos_anunciante;
  const contatos = contatosBrutos && typeof contatosBrutos === "object" && !Array.isArray(contatosBrutos)
    ? contatosBrutos as Record<string, unknown> : {};
  const siteDoAnunciante = contatos.site_nao_tem === true ? ""
    : typeof contatos.site_url === "string" ? contatos.site_url : "";
  const instagramDoAnunciante = typeof contatos.instagram_handle === "string" ? contatos.instagram_handle : "";
  const { marca, faltamBasicas, concluido } = estadoDaConclusao(linha);
  return {
    businessId: linha.id,
    site: agenciaOperadora ? siteDoAnunciante : linha.site_url ?? "",
    instagram: agenciaOperadora ? instagramDoAnunciante : linha.instagram_handle ?? "",
    siteNaoTenhoDeclarado: agenciaOperadora ? contatos.site_nao_tem === true
      : (doc.respostas as Record<string, { texto?: string }> | undefined)?.site?.texto === "Não tenho site",
    marca,
    concluido,
    respostasBasicas: respostasBasicas(doc),
    faltamBasicas,
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
  coresConfirmadas?: string[];
  aparenciaNaoSei: boolean;
}): Promise<ResultadoMarca> {
  const r = await obter();
  if ("erro" in r) return { ok: false, erro: r.erro };
  if (entrada.businessId !== r.linha.id) return { ok: false, erro: "O negócio selecionado mudou. Atualize esta página." };
  const anterior = estado(r.linha);
  if (anterior.faltamBasicas.length) return { ok: false, erro: "Termine as perguntas sobre seu negócio antes de concluir." };

  const aparencia = entrada.aparencia.trim();
  if (entrada.coresConfirmadas !== undefined &&
      (!Array.isArray(entrada.coresConfirmadas) || entrada.coresConfirmadas.some((cor) => typeof cor !== "string")))
    return { ok: false, erro: "Confira as cores escolhidas." };
  const cores = (entrada.coresConfirmadas ?? []).map((cor) => cor.toUpperCase());
  if (cores.length > 6 || cores.some((cor) => !/^#[0-9A-F]{6}$/.test(cor)))
    return { ok: false, erro: "Confira as cores escolhidas." };
  if (!entrada.aparenciaNaoSei && !aparencia && cores.length === 0) {
    return { ok: false, erro: "Confirme as cores da marca ou indique que prefere defini-las com o gestor." };
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
  const docAnterior = documento(r.linha.onboarding);
  const respostasAnteriores = docAnterior.respostas && typeof docAnterior.respostas === "object" && !Array.isArray(docAnterior.respostas)
    ? docAnterior.respostas as Record<string, unknown> : {};
  const operadorAnterior = respostasAnteriores.operador && typeof respostasAnteriores.operador === "object" && !Array.isArray(respostasAnteriores.operador)
    ? (respostasAnteriores.operador as { texto?: unknown }).texto : null;
  const agenciaOperadora = operadorAnterior === "Uma agência ou gestor opera para o anunciante";
  if (!agenciaOperadora && site && site !== anterior.site) campos.push({ campo: "site_url", valor: site });
  if (!agenciaOperadora && instagram && instagram !== anterior.instagram) campos.push({ campo: "instagram_handle", valor: instagram });
  const esvaziar = agenciaOperadora ? [] : [
    ...(entrada.siteNaoTenho && anterior.site ? ["site_url"] : []),
    ...(!instagram && anterior.instagram ? ["instagram_handle"] : []),
  ];
  const visual = entrada.aparenciaNaoSei ? "" : aparencia;
  if (anterior.concluido && campos.length === 0 && esvaziar.length === 0 && anterior.marca &&
      anterior.site === (site ?? "") && anterior.instagram === (instagram ?? "") &&
      anterior.marca.aparencia === visual &&
      JSON.stringify(anterior.marca.coresConfirmadas) === JSON.stringify(cores) &&
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
      marca: { aparencia: visual, coresConfirmadas: cores,
        aparenciaNaoSei: entrada.aparenciaNaoSei, siteNaoTenho: entrada.siteNaoTenho, em: agora },
      ...(agenciaOperadora ? { versao: 2, respostas: { _contatos_anunciante: {
        ...((respostasAnteriores._contatos_anunciante && typeof respostasAnteriores._contatos_anunciante === "object"
          && !Array.isArray(respostasAnteriores._contatos_anunciante))
          ? respostasAnteriores._contatos_anunciante as Record<string, unknown> : {}),
        site_url: site || null,
        instagram_handle: instagram || null,
        site_nao_tem: entrada.siteNaoTenho,
        em: agora,
      } } } : {}),
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
