"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  perguntaPorId,
  numeroDoTexto,
  RAIO_KM,
  TICKET_ESTIMADO,
} from "./perguntas";

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
}

interface LinhaBusiness {
  id: string;
  onboarding: unknown;
}

function lerRespostas(onboarding: unknown): Record<string, RespostaGravada> {
  if (!onboarding || typeof onboarding !== "object") return {};
  const brutas = (onboarding as { respostas?: unknown }).respostas;
  if (!brutas || typeof brutas !== "object") return {};
  return brutas as Record<string, RespostaGravada>;
}

/**
 * O negócio do usuário logado, criando um se ainda não existir.
 *
 * O onboarding é o primeiro lugar do app que precisa de uma linha em
 * `businesses`, então é aqui que ela nasce. `name` entra com um
 * provisório: a pergunta 1 é sobre o ramo, não sobre o nome, e a coluna
 * é `not null`. O nome real vem numa tela posterior.
 *
 * Se houver mais de um negócio (possível pelo schema, ainda não pela
 * interface), assume o mais antigo.
 */
async function obterOuCriarBusiness(): Promise<
  { erro: string } | { linha: LinhaBusiness; userId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const { data: existente, error: erroBusca } = await supabase
    .from("businesses")
    .select("id, onboarding")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (erroBusca) {
    console.error("[onboarding] falha ao buscar business ::", erroBusca.message);
    return { erro: "Não foi possível carregar seus dados agora." };
  }
  if (existente) return { linha: existente as LinhaBusiness, userId: user.id };

  const { data: criado, error: erroCriacao } = await supabase
    .from("businesses")
    .insert({ profile_id: user.id, name: "Meu negócio" })
    .select("id, onboarding")
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
 * por pergunta, que para 5 perguntas é irrelevante.
 *
 * Os campos estruturados também vão para colunas de `businesses`
 * (`niche`, `avg_ticket`, `city`, `radius_km`) para poderem ser
 * consultados sem abrir o jsonb. O jsonb continua com a resposta crua:
 * a coluna é derivada, ele é a fonte.
 *
 * Leitura-modificação-escrita do jsonb: sem transação, porque quem
 * responde é uma pessoa, numa aba, em sequência. Duas abas abertas na
 * mesma conta podem sobrescrever uma à outra — aceitável neste fluxo,
 * e o jeito de resolver seria uma função no banco fazendo o merge.
 */
export async function salvarRespostaAction(entrada: {
  qid: string;
  texto: string;
  origem: "chip" | "texto";
  cidade?: string;
}): Promise<SalvarResultado> {
  const pergunta = perguntaPorId(entrada.qid);
  if (!pergunta) return { ok: false, erro: "Pergunta desconhecida." };

  const texto = entrada.texto.trim();
  if (!texto) return { ok: false, erro: "Escreva uma resposta antes de enviar." };

  // Resposta por chip precisa bater com uma opção real da pergunta —
  // o cliente não escolhe o que quiser só porque manda o campo `origem`.
  if (entrada.origem === "chip" && !pergunta.opcoes.some((o) => o.echo === texto)) {
    return { ok: false, erro: "Essa opção não existe nesta pergunta." };
  }

  const cidade = entrada.cidade?.trim();
  if (pergunta.pedeCidade && entrada.origem === "chip" && !cidade) {
    return { ok: false, erro: "Escreva sua cidade antes de escolher." };
  }

  const resultado = await obterOuCriarBusiness();
  if ("erro" in resultado) return { ok: false, erro: resultado.erro };

  const { linha } = resultado;
  const respostas = lerRespostas(linha.onboarding);

  const echo = cidade && entrada.origem === "chip" ? `${cidade} · ${texto}` : texto;
  respostas[entrada.qid] = {
    texto,
    origem: entrada.origem,
    ...(cidade ? { cidade } : {}),
    echo,
    em: new Date().toISOString(),
  };

  const atualizacao: Record<string, unknown> = {
    onboarding: { versao: 1, passo: 1, respostas },
  };

  // ---- campos estruturados que ganham coluna própria ----
  if (entrada.qid === "1") {
    atualizacao.niche = texto;
  }
  if (entrada.qid === "2") {
    const estimado =
      entrada.origem === "chip" ? TICKET_ESTIMADO[texto] : numeroDoTexto(texto);
    if (estimado != null) atualizacao.avg_ticket = estimado;
  }
  if (entrada.qid === "3") {
    // Cidade só existe quando veio do campo dedicado. Na resposta
    // escrita à mão ("atendo o interior todo") não dá para inferir sem
    // chutar, então a coluna fica nula e o texto vive no jsonb.
    if (cidade) atualizacao.city = cidade;
    if (entrada.origem === "chip") {
      const raio = RAIO_KM[texto];
      if (raio != null) atualizacao.radius_km = raio;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update(atualizacao)
    .eq("id", linha.id);

  if (error) {
    console.error("[onboarding] falha ao salvar resposta ::", error.message);
    return { ok: false, erro: "Não conseguimos salvar sua resposta. Tente de novo." };
  }

  revalidatePath("/onboarding");

  return {
    ok: true,
    estado: { businessId: linha.id, respostas },
  };
}
