"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOME_PROVISORIO } from "@/lib/cadastro/montar";
import { gravarCamposDoCliente, type CampoParaGravar } from "@/lib/cadastro/procedencia";
import { listarNichos } from "@/lib/backend";
import {
  conferirEscolhaDeNicho,
  PROCEDENCIA_DA_LISTA_VIVA,
  PROCEDENCIA_DA_RESERVA,
} from "@/lib/nichos/escolha";
import { migrarChaves, perguntaPorId, RAIO_KM } from "./perguntas";
import { dispararSeCompleto } from "@/lib/pipeline/disparar";

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
    .insert({ profile_id: user.id, name: NOME_PROVISORIO })
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
 * (`name`, `niche`, `description`, `city`, `radius_km`) para poderem ser
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

  // `let` porque a conferência do nicho pode reescrever isto com a grafia
  // canônica do backend — ver `conferirEscolhaDeNicho`.
  let texto = entrada.texto.trim();
  if (!texto) return { ok: false, erro: "Escreva uma resposta antes de enviar." };

  // A procedência do `niche`, quando esta resposta grava um. Vira
  // `aproximacao` só no caminho dos chips de reserva; ver o bloco abaixo.
  let origemDoNicho: typeof PROCEDENCIA_DA_LISTA_VIVA | typeof PROCEDENCIA_DA_RESERVA =
    PROCEDENCIA_DA_LISTA_VIVA;

  // Resposta por chip precisa bater com uma opção real da pergunta —
  // o cliente não escolhe o que quiser só porque manda o campo `origem`.
  if (entrada.origem === "chip") {
    if (pergunta.seletorDeNicho) {
      // ============================================================
      // A LISTA DESTA PERGUNTA NÃO ESTÁ EM `pergunta.opcoes`.
      //
      // Ela vem do `GET /nichos`, então conferir contra as `opcoes`
      // recusaria toda escolha válida — e a tentação seguinte seria
      // apagar a checagem, o que reabriria o buraco de forjar
      // `origem: "chip"` que ela existe para fechar. Confere-se contra a
      // MESMA lista viva que a tela mostrou.
      //
      // Custa um `GET /nichos` por resposta de ramo: 17 ms, medido, e uma
      // vez por cliente na vida. Barato pelo que compra.
      // ============================================================
      const lista = await listarNichos();
      const conferencia = conferirEscolhaDeNicho({
        lista: lista.ok ? lista.dados : null,
        // A reserva é o que a tela mostra quando o backend está fora. Se
        // ela é que está no ar, é contra ela que se confere — senão o
        // cliente escolhe um chip que existe e ouve que ele não existe.
        reserva: pergunta.opcoes.map((o) => o.echo),
        texto,
      });
      if (!conferencia.ok) return { ok: false, erro: conferencia.erro };
      texto = conferencia.texto;
      // A escolha saiu dos chips de reserva: o valor fica, mas marcado
      // como palpite. Ver `PROCEDENCIA_DA_RESERVA`.
      if (conferencia.viaReserva) origemDoNicho = PROCEDENCIA_DA_RESERVA;
    } else if (!pergunta.opcoes.some((o) => o.echo === texto)) {
      // Numa pergunta `soTexto` a lista é vazia, então isto recusa
      // qualquer chip forjado sem precisar de um caso à parte.
      return { ok: false, erro: "Essa opção não existe nesta pergunta." };
    }
  }

  // O piso de caracteres é do SCHEMA do backend (`descricao_livre`,
  // `minLength: 10`), e é conferido aqui porque o cliente não pode
  // descobrir isso como 422 três telas adiante. O recado não cita o
  // número — ver `perguntas.ts`.
  if (pergunta.minimo && texto.length < pergunta.minimo.tamanho) {
    return { ok: false, erro: pergunta.minimo.recado };
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
  if (entrada.qid === "ramo") {
    // A origem viaja JUNTO com o campo, não solta no lote: a resposta de
    // `praca` grava dois campos de uma vez, e marcar o lote inteiro
    // mentiria sobre o que não foi aproximado.
    //
    // O TEXTO LIVRE FICA `confirmado`, inclusive durante a degradação, e
    // é decisão: quem escreveu o próprio ramo com as próprias palavras
    // deu uma resposta de verdade. Palpite é o chip que cobre três nichos
    // de uma vez, não a frase que a pessoa escreveu.
    const origem = entrada.origem === "chip" ? origemDoNicho : PROCEDENCIA_DA_LISTA_VIVA;
    campos.push({ campo: "niche", valor: texto, origem });
  }
  if (entrada.qid === "descricao") campos.push({ campo: "description", valor: texto });
  if (entrada.qid === "praca") {
    // Cidade só existe quando veio do campo dedicado. Na resposta
    // escrita à mão ("atendo o interior todo") não dá para inferir sem
    // chutar, então a coluna fica nula e o texto vive no jsonb.
    if (cidade) campos.push({ campo: "city", valor: cidade });
    if (entrada.origem === "chip") {
      const raio = RAIO_KM[texto];
      if (raio != null) campos.push({ campo: "radius_km", valor: raio });
    }
  }

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
    if (!gravacao.ok) return { ok: false, erro: gravacao.erro };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ onboarding: { versao: 1, passo: 1, respostas } })
    .eq("id", linha.id);

  if (error) {
    console.error("[onboarding] falha ao salvar resposta ::", error.message);
    return { ok: false, erro: "Não conseguimos salvar sua resposta. Tente de novo." };
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
