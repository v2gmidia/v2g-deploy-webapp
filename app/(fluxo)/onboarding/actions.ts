"use server";

import { patchDoBlocoUm } from "@/lib/onboarding/documento";
import { NAO_SEI_BRIEFING } from "@/lib/onboarding/briefing-trafego";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOME_PROVISORIO } from "@/lib/cadastro/montar";
import { gravarCamposDoCliente, type CampoParaGravar } from "@/lib/cadastro/procedencia";
import { migrarChaves, perguntaPorId, RAIO_KM } from "./perguntas";
import { dispararSeCompleto } from "@/lib/pipeline/disparar";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { validarInstagram, validarSite } from "@/lib/onboarding/enderecos";
import { cidadeDeclaradaValida } from "@/lib/onboarding/localizacao";

/**
 * Uma resposta como fica gravada em `businesses.onboarding`.
 *
 * `echo` é o que apareceu (e volta a aparecer) no balão do usuário.
 * Guardar o texto renderizado, e não só as partes, é o que faz a tela
 * retomar exatamente como estava — sem o servidor ter que remontar a
 * frase e correr o risco de montar diferente.
 */
export interface RespostaGravada {
  texto: string;
  origem: "chip" | "texto";
  cidade?: string;
  cep?: string;
  echo: string;
  em: string;
}

export interface EstadoOnboarding {
  businessId: string;
  respostas: Record<string, RespostaGravada>;
}

export interface SalvarResultado {
  ok: boolean;
  erro?: string;
  estado?: EstadoOnboarding;
  recarregar?: boolean;
}

interface LinhaBusiness {
  id: string;
  onboarding: unknown;
  city: string | null;
  cep: string | null;
  radius_km: number | null;
  site_url: string | null;
  instagram_handle: string | null;
}

function lerRespostas(onboarding: unknown): Record<string, RespostaGravada> {
  if (!onboarding || typeof onboarding !== "object") return {};
  const brutas = (onboarding as { respostas?: unknown }).respostas;
  if (!brutas || typeof brutas !== "object") return {};
  // As chaves numéricas antigas viram nome antes de qualquer leitura. Sem
  // isto, quem começou o onboarding antes deste lote veria a resposta de
  // ticket no lugar da descrição — ver `migrarChaves`.
  return migrarChaves(brutas as Record<string, RespostaGravada>);
}

/**
 * O negócio do usuário logado, criando um se ainda não existir.
 *
 * O onboarding é o primeiro lugar do app que precisa de uma linha em
 * `businesses`, então é aqui que ela nasce. `name` entra com um
 * provisório: a pergunta 1 é sobre o ramo, não sobre o nome, e a coluna
 * é `not null`. O nome real vem numa tela posterior.
 *
 * Com mais de um negócio, exige escolha explícita. O cookie é apenas
 * preferência: o resolvedor o valida sob a RLS da sessão antes da leitura.
 */
async function obterOuCriarBusiness(): Promise<
  { erro: string } | { linha: LinhaBusiness; userId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const ativo = await negocioAtivoDaSessao();
  if (ativo.status === "sem_sessao") return { erro: "Sua sessão expirou. Entre de novo." };
  if (ativo.status === "falha_consulta") return { erro: "Não foi possível conferir seus negócios agora." };
  if (ativo.status === "escolha_necessaria" || ativo.status === "selecao_invalida") {
    return { erro: "Escolha qual negócio deseja editar antes de continuar." };
  }

  const { data: existente, error: erroBusca } = ativo.status === "selecionado"
    ? await supabase.from("businesses").select("id, onboarding, city, cep, radius_km, site_url, instagram_handle")
      .eq("id", ativo.negocio.id).eq("profile_id", user.id).maybeSingle()
    : { data: null, error: null };

  if (erroBusca) {
    console.error("[onboarding] falha ao buscar business ::", erroBusca.message);
    return { erro: "Não foi possível carregar seus dados agora." };
  }
  if (existente) return { linha: existente as LinhaBusiness, userId: user.id };
  if (ativo.status === "selecionado") return { erro: "Não encontramos esse negócio na sua conta." };

  // `sem_negocio` também acontece se um pedido pendente já tiver criado
  // uma linha pertencente ao perfil. Não criar outra linha que contornaria
  // a aprovação daquele pedido.
  const { count, error: erroContagem } = await supabase.from("businesses")
    .select("id", { count: "exact", head: true }).eq("profile_id", user.id);
  if (erroContagem) return { erro: "Não foi possível conferir seu cadastro agora." };
  if ((count ?? 0) > 0) return { erro: "Este negócio ainda aguarda liberação. Confira o acesso ou fale com a equipe." };

  const { data: criado, error: erroCriacao } = await supabase
    .from("businesses")
    .insert({ profile_id: user.id, name: NOME_PROVISORIO })
    .select("id, onboarding, city, cep, radius_km, site_url, instagram_handle")
    .single();

  if (erroCriacao || !criado) {
    console.error("[onboarding] falha ao criar business ::", erroCriacao?.message);
    return { erro: "Não foi possível iniciar seu cadastro agora." };
  }

  return { linha: criado as LinhaBusiness, userId: user.id };
}

export async function carregarEstadoAction(): Promise<
  { erro: string } | EstadoOnboarding
> {
  const resultado = await obterOuCriarBusiness();
  if ("erro" in resultado) return resultado;

  return {
    businessId: resultado.linha.id,
    respostas: lerRespostas(resultado.linha.onboarding),
  };
}

/**
 * Grava UMA resposta, na hora em que ela é dada.
 *
 * Esta é a dívida que o protótipo tinha: lá as respostas viviam num
 * `var answers = {}` do navegador enquanto a interface prometia
 * "suas respostas ficam guardadas". Aqui cada resposta é um round-trip
 * ao banco — a promessa passa a ser verdade, ao custo de uma escrita
 * por pergunta, que neste bloco é aceitável para preservar a retomada.
 *
 * Os campos estruturados também vão para colunas de `businesses`
 * (`name`, `niche`, `description`, `city`, `radius_km`) para poderem ser
 * consultados sem abrir o jsonb. O jsonb continua com a resposta crua:
 * a coluna é derivada, ele é a fonte.
 *
 * A RPC mescla este bloco sobre o JSON atual numa única instrução no
 * banco. Outra aba que salvou contas ou marca depois desta leitura não
 * perde essas respostas.
 */
export async function salvarRespostaAction(entrada: {
  businessId: string;
  qid: string;
  texto: string;
  origem: "chip" | "texto";
  cidade?: string;
  cep?: string;
}): Promise<SalvarResultado> {
  // A resposta antiga continua legível no histórico, mas a decisão atual
  // deixa o primeiro anúncio com o gestor. Bloquear também na action impede
  // que uma aba velha ou chamada forjada grave uma escolha nova do cliente.
  if (entrada.qid === "oferta")
    return { ok: false, erro: "O foco do primeiro anúncio será definido com o gestor." };
  const pergunta = perguntaPorId(entrada.qid);
  if (!pergunta) return { ok: false, erro: "Pergunta desconhecida." };
  if (entrada.origem !== "chip" && entrada.origem !== "texto")
    return { ok: false, erro: "Origem da resposta inválida." };

  let texto = entrada.texto.trim();
  if (!texto) return { ok: false, erro: "Escreva uma resposta antes de enviar." };

  // Resposta por chip precisa bater com uma opção real da pergunta —
  // o cliente não escolhe o que quiser só porque manda o campo `origem`.
  if (entrada.origem === "chip") {
    if (!pergunta.opcoes.some((o) => o.echo === texto)) {
      // Numa pergunta `soTexto` a lista é vazia, então isto recusa
      // qualquer chip forjado. Atividades sugeridas também chegam como texto.
      return { ok: false, erro: "Essa opção não existe nesta pergunta." };
    }
  }

  // O piso de caracteres é do SCHEMA do backend (`descricao_livre`,
  // `minLength: 10`), e é conferido aqui porque o cliente não pode
  // descobrir isso como 422 três telas adiante. O recado não cita o
  // número — ver `perguntas.ts`.
  if (pergunta.minimo && !(pergunta.admiteNaoSei && entrada.origem === "chip" && texto === NAO_SEI_BRIEFING)
    && texto.length < pergunta.minimo.tamanho) {
    return { ok: false, erro: pergunta.minimo.recado };
  }
  if (["descricao", "oferta", "publico", "motivo", "resultado", "diferencial", "prova"].includes(entrada.qid) && texto.length > 800)
    return { ok: false, erro: "Resuma sua resposta em até 800 caracteres." };
  if (entrada.qid === "instagram" && !(entrada.origem === "chip" && texto === "Não tenho Instagram")) {
    const normalizado = validarInstagram(texto);
    if (!normalizado) return { ok: false, erro: "Confira o @ ou o link do Instagram." };
    texto = normalizado;
  }
  if (entrada.qid === "site" && !(entrada.origem === "chip" && texto === "Não tenho site")) {
    const normalizado = validarSite(texto);
    if (!normalizado) return { ok: false, erro: "Confira o endereço do site." };
    texto = normalizado;
  }

  const local = pergunta.pedeCidade && entrada.origem === "chip" && texto !== "Brasil inteiro";
  const cidade = local ? entrada.cidade?.trim().replace(/\s+/g, " ") : undefined;
  const cepDigitado = local && texto === "Só aqui perto (até 5 km)" ? entrada.cep?.trim() : undefined;
  const cep = cepDigitado ? cepDigitado.replace(/\D/g, "") : undefined;
  if (local && (!cidade || !cidadeDeclaradaValida(cidade))) {
    return { ok: false, erro: "Confira o nome da cidade, sem números." };
  }
  if (local && texto === "Só aqui perto (até 5 km)" && !cep) {
    return { ok: false, erro: "Informe o CEP para usar a área próxima." };
  }
  if (cepDigitado && (!/^\d{5}-?\d{3}$/.test(cepDigitado) || cep?.length !== 8)) {
    return { ok: false, erro: "Confira o CEP: use oito números." };
  }

  const resultado = await obterOuCriarBusiness();
  if ("erro" in resultado) return { ok: false, erro: resultado.erro };
  if (resultado.linha.id !== entrada.businessId) {
    return { ok: false, erro: "Você mudou de negócio em outra aba. Recarregue para continuar com segurança." };
  }

  const { linha } = resultado;
  const respostas = lerRespostas(linha.onboarding);
  const pracaAnterior = respostas.praca;

  const echo = cidade && entrada.origem === "chip" ? `${cidade} · ${texto}${cep ? ` · CEP ${cep.slice(0, 5)}-${cep.slice(5)}` : ""}` : texto;
  respostas[entrada.qid] = {
    texto,
    origem: entrada.origem,
    ...(cidade ? { cidade } : {}),
    ...(cep ? { cep } : {}),
    echo,
    em: new Date().toISOString(),
  };

  // ---- campos de perfil ----
  //
  // O TICKET SAIU DAQUI. Ele é a primeira conta do bloco 2
  // (`/onboarding/contas`), porque o backend quer um escalar e a faixa
  // sozinha não fecha — ver `docs/onboarding-expandido.md` §3.2 e §4.3.
  //
  // Nada aqui é `update` direto: cada campo vai pela
  // `confirmar_campo_do_cliente`, que grava valor e procedência juntos.
  // O cliente é a origem da afirmação, então a origem é `confirmado` —
  // ver §4.1 do desenho.
  const campos: CampoParaGravar[] = [];
  if (entrada.qid === "nome") campos.push({ campo: "name", valor: texto });
  // SEMPRE `confirmado`, e não existe mais nada além disso.
  //
  // A atividade vem como texto declarado, seja da lista de exemplos da
  // interface, seja da opção Outros. Não é ID técnico do catálogo vivo.
  // O gestor confere a correspondência antes de usar um nicho do backend.
  //
  // A `aproximacao` existiu por algumas horas em 22/08, para marcar
  // escolha feita numa lista de reserva. A reserva saiu (ver
  // `lib/nichos/escolha.ts`), e com ela a marcação e a migration `0021`.
  if (entrada.qid === "ramo") campos.push({ campo: "niche", valor: texto });
  if (entrada.qid === "descricao") campos.push({ campo: "description", valor: texto });
  if (entrada.qid === "instagram" && texto !== "Não tenho Instagram") campos.push({ campo: "instagram_handle", valor: texto });
  if (entrada.qid === "site" && texto !== "Não tenho site") campos.push({ campo: "site_url", valor: texto });
  if (entrada.qid === "praca") {
    // Cidade só existe quando veio do campo dedicado. Na resposta
    // escrita à mão ("atendo o interior todo") não dá para inferir sem
    // chutar, então a coluna fica nula e o texto vive no jsonb.
    if (cidade) campos.push({ campo: "city", valor: cidade });
    if (cep) campos.push({ campo: "cep", valor: cep });
    if (entrada.origem === "chip") {
      const raio = RAIO_KM[texto];
      if (raio != null) campos.push({ campo: "radius_km", valor: raio });
    }
  }

  // Uma resposta livre substitui a antiga escolha por raio. Se cidade e
  // raio ainda coincidem com aquela escolha, deixam de ser fatos atuais:
  // não inferimos números nem município da nova frase. Uma correção feita
  // depois em outra tela, com valor diferente, é preservada.
  const esvaziar = entrada.qid === "praca" && entrada.origem === "chip" && texto === "Brasil inteiro" &&
    pracaAnterior?.origem === "chip" ? [
      ...(pracaAnterior.cidade && linha.city === pracaAnterior.cidade ? ["city"] : []),
      ...(pracaAnterior.cep && linha.cep === pracaAnterior.cep ? ["cep"] : []),
      ...(RAIO_KM[pracaAnterior.texto] === linha.radius_km ? ["radius_km"] : []),
    ] : entrada.qid === "praca" && entrada.origem === "texto" &&
    pracaAnterior?.origem === "chip" ? [
      ...(pracaAnterior.cidade && linha.city === pracaAnterior.cidade ? ["city"] : []),
      ...(pracaAnterior.cep && linha.cep === pracaAnterior.cep ? ["cep"] : []),
      ...(RAIO_KM[pracaAnterior.texto] === linha.radius_km ? ["radius_km"] : []),
    ] : entrada.qid === "praca" && entrada.origem === "chip" && !cep &&
      pracaAnterior?.cep && linha.cep === pracaAnterior.cep ? ["cep"] : [
      ...(entrada.qid === "site" && texto === "Não tenho site" && linha.site_url ? ["site_url"] : []),
      ...(entrada.qid === "instagram" && texto === "Não tenho Instagram" && linha.instagram_handle ? ["instagram_handle"] : []),
    ];

  // PRIMEIRO as colunas, DEPOIS o jsonb. Se uma gravação falhar no meio,
  // a resposta não é marcada como dada e a pergunta continua aberta —
  // ele responde de novo e as colunas são reescritas juntas. Marcar o
  // jsonb antes deixaria a pergunta fechada por cima de uma coluna que
  // não gravou, e nada na tela contaria isso.
  if (campos.length > 0) {
    const gravacao = await gravarCamposDoCliente({
      profileId: resultado.userId,
      businessId: linha.id,
      tabela: "businesses",
      campos,
    });
    if (!gravacao.ok) return { ok: false, erro: gravacao.erro, recarregar: true };
  }

  const supabase = await createClient();
  if (esvaziar.length) {
    const limpeza = await supabase.rpc("esvaziar_campos_do_cliente", {
      p_business_id: linha.id, p_campos: esvaziar,
    });
    if (limpeza.error || limpeza.data !== esvaziar.length) {
      console.error("[onboarding] falha ao esvaziar praça ::", limpeza.error?.message ?? "resultado inesperado");
      return { ok: false, erro: "Não conseguimos confirmar a atualização da região de atendimento.", recarregar: true };
    }
  }
  const { data: mesclado, error } = await supabase.rpc("mesclar_blocos_onboarding", {
    p_business_id: linha.id,
    p_patch: patchDoBlocoUm({ [entrada.qid]: respostas[entrada.qid] }),
  });

  if (error || mesclado !== true) {
    console.error("[onboarding] falha ao salvar resposta ::", error?.message ?? "negócio indisponível");
    return { ok: false, erro: "Não conseguimos confirmar a gravação da resposta.", recarregar: true };
  }

  revalidatePath("/onboarding");

  // SIM, TAMBÉM AQUI — e não é excesso de zelo.
  //
  // O bloco 1 grava `name` e `description`, dois dos seis obrigatórios do
  // `/cadastro`. O caminho comum é bloco 1 → bloco 2 → /verba, e nesse
  // caminho o cadastro nunca fecha aqui. Mas as perguntas não são
  // obrigatoriamente respondidas em ordem: dá para responder ramo e praça,
  // seguir para as contas, definir a verba, e só então voltar e escrever o
  // nome. Aí o último dos seis entra NESTA ação.
  //
  // Sem esta linha, esse cliente teria o cadastro completo e nenhum
  // disparo — e nada na tela contaria isso, porque as pendências ficariam
  // vazias e o `/inicio` pararia de cobrar. Falha silenciosa, do tipo que
  // só aparece quando alguém pergunta por que a campanha não saiu.
  await dispararSeCompleto();

  return {
    ok: true,
    estado: { businessId: linha.id, respostas },
  };
}
