"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ticketEscalar, type ChaveDeConta, type RespostaDeConta } from "@/lib/cadastro/montar";
import { gravarCamposDoCliente, type CampoParaGravar } from "@/lib/cadastro/procedencia";
import { montarCadastro, type NegocioParaCadastro } from "@/lib/cadastro/montar";
import { COLUNAS_DO_CADASTRO } from "@/lib/cadastro/consultar";
import { resumirPendencias, type ResumoDePendencias } from "@/lib/cadastro/pendencias";
import { dispararSeCompleto } from "@/lib/pipeline/disparar";
import {
  TICKET_FAIXA,
  custoDaSobra,
  lucroDaPostura,
  numeroDoTexto,
  opcaoDePostura,
  opcaoDeSobra,
} from "./regras";

export interface EstadoDasContas {
  businessId: string;
  contas: Partial<Record<ChaveDeConta, RespostaDeConta>>;
  /** o ticket que vale hoje, para as contas seguintes */
  ticket: number | null;
  margem: number | null;
  /**
   * O que ainda falta, JÁ EM TEXTO, calculado no servidor.
   *
   * Vem pronto de propósito: `resumirPendencias` precisa de um `agora`, e
   * um `new Date()` dentro do componente de cliente daria hidratação
   * divergente entre servidor e navegador. E como a ação devolve o estado
   * inteiro a cada resposta, o resumo nunca fica velho.
   */
  resumo: ResumoDePendencias;
}

export interface ResultadoDaConta {
  ok: boolean;
  erro?: string;
  estado?: EstadoDasContas;
}

/** Tudo que `montarCadastro` lê — ver `COLUNAS_DO_CADASTRO`. */
type LinhaNegocio = NegocioParaCadastro;

function num(b: number | string | null): number | null {
  if (b === null) return null;
  const n = typeof b === "number" ? b : Number(b);
  return Number.isFinite(n) ? n : null;
}

function lerContas(onboarding: unknown): Partial<Record<ChaveDeConta, RespostaDeConta>> {
  if (!onboarding || typeof onboarding !== "object") return {};
  const c = (onboarding as { contas?: unknown }).contas;
  if (!c || typeof c !== "object") return {};
  return c as Partial<Record<ChaveDeConta, RespostaDeConta>>;
}

/**
 * O negócio do usuário logado. NÃO cria — quem cria é o bloco 1, e chegar
 * aqui sem linha significa que alguém digitou a URL antes da hora.
 *
 * A leitura é com o cliente NORMAL, sujeito à RLS: é ela que garante que o
 * usuário só alcança o próprio negócio. Nada aqui usa `service_role`.
 */
async function obterNegocio(): Promise<{ erro: string } | { linha: LinhaNegocio; userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const { data, error } = await supabase
    .from("businesses")
    .select(COLUNAS_DO_CADASTRO)
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[contas] falha ao buscar negócio ::", error.message);
    return { erro: "Não foi possível carregar seus dados agora." };
  }
  if (!data) return { erro: "Comece pelo onboarding antes das contas." };
  return { linha: data as unknown as LinhaNegocio, userId: user.id };
}

function montarEstado(linha: LinhaNegocio): EstadoDasContas {
  const ticket = ticketEscalar(num(linha.avg_ticket_min), num(linha.avg_ticket_max));
  const custo = num(linha.avg_direct_cost);
  const cadastro = montarCadastro(linha);
  return {
    businessId: linha.id,
    contas: lerContas(linha.onboarding),
    ticket,
    margem: ticket !== null && custo !== null ? Math.round((ticket - custo) * 100) / 100 : null,
    resumo: resumirPendencias(cadastro.completo ? [] : cadastro.pendencias, new Date()),
  };
}

export async function carregarContasAction(): Promise<{ erro: string } | EstadoDasContas> {
  const r = await obterNegocio();
  if ("erro" in r) return r;
  return montarEstado(r.linha);
}

/**
 * Grava UMA conta.
 *
 * `escolha` é sempre um ID de opção ou um número — nunca o rótulo. O
 * rótulo é texto de tela e muda; o id é contrato. Validar contra a lista
 * de verdade é o que impede um POST forjado de gravar um custo direto
 * arbitrário: Server Action é endpoint, não é botão.
 *
 * TODA COLUNA DE PERFIL VAI PELA `confirmar_campo_do_cliente` (0015,
 * lista branca ampliada pela 0016), que grava valor e procedência na
 * mesma transação. Nenhum `update` direto: um segundo caminho de escrita
 * para a mesma coluna é como a `/conta` perdeu procedência.
 *
 * As colunas são gravadas ANTES do jsonb. Se uma falhar, a conta não é
 * marcada como fechada e a pergunta continua aberta — ver
 * `gravarCamposDoCliente`.
 */
export async function salvarContaAction(entrada: {
  conta: ChaveDeConta;
  /** id de chip, faixa, número digitado, ou o "não sei" */
  escolha: string;
  naoSei?: boolean;
  /** só na etapa de confirmação: o valor que ele viu na tela */
  confirmando?: boolean;
}): Promise<ResultadoDaConta> {
  const r = await obterNegocio();
  if ("erro" in r) return { ok: false, erro: r.erro };

  const { linha, userId } = r;
  const estado = montarEstado(linha);
  const contas = { ...estado.contas };
  const agora = new Date().toISOString();
  const campos: CampoParaGravar[] = [];

  // ---------------------------------------------------------------- C1
  if (entrada.conta === "ticket") {
    const faixa = TICKET_FAIXA[entrada.escolha];
    if (faixa) {
      campos.push({ campo: "avg_ticket_min", valor: faixa.min });
      // Faixa aberta para cima não tem topo. `max` fica como está — a
      // função do banco recusa valor em branco, e mandar null por ali
      // seria pedir para "confirmar" um campo vazio.
      if (faixa.max !== null) campos.push({ campo: "avg_ticket_max", valor: faixa.max });
      contas.ticket = {
        echo: entrada.escolha,
        calculado: ticketEscalar(faixa.min, faixa.max),
        confirmado: true,
        em: agora,
      };
    } else {
      const exato = numeroDoTexto(entrada.escolha);
      if (exato === null || exato <= 0) {
        return { ok: false, erro: "Escreva um valor maior que zero." };
      }
      // Valor exato é valor exato: min = max. A largura da faixa é sinal
      // de incerteza, e aqui não há incerteza a registrar.
      campos.push({ campo: "avg_ticket_min", valor: exato });
      campos.push({ campo: "avg_ticket_max", valor: exato });
      contas.ticket = { echo: String(exato), calculado: exato, confirmado: true, em: agora };
    }
  }

  // ---------------------------------------------------------------- C2
  if (entrada.conta === "custo") {
    if (entrada.naoSei) {
      // A coluna fica NULA de propósito. "Não sei" é informação, e ela
      // vive no jsonb — é o que distingue "ele não soube" de "ninguém
      // perguntou", e é o que manda a conversa para a entrevista.
      // A coluna NÃO é tocada. Zerá-la apagaria um valor que pode ter
      // procedência gravada, e deixaria a procedência afirmando origem de
      // um campo vazio. "Não sei" é registro no jsonb, não apagamento.
      contas.custo = { echo: "Não sei", calculado: null, confirmado: false, naoSei: true, em: agora };
    } else if (entrada.confirmando) {
      const anterior = contas.custo;
      const valor = numeroDoTexto(entrada.escolha);
      if (valor === null) return { ok: false, erro: "Escreva um valor." };
      if (estado.ticket !== null && valor > estado.ticket) {
        return { ok: false, erro: "O custo não pode ser maior que o valor da venda." };
      }
      campos.push({ campo: "avg_direct_cost", valor });
      contas.custo = {
        echo: anterior?.echo ?? String(valor),
        calculado: valor,
        confirmado: true,
        em: agora,
      };
    } else {
      const opcao = opcaoDeSobra(entrada.escolha);
      if (!opcao) return { ok: false, erro: "Essa opção não existe." };
      if (estado.ticket === null) return { ok: false, erro: "Responda antes quanto sai uma venda." };
      // Calculado, NÃO confirmado: a coluna só é escrita depois do "é
      // isso". Gravar aqui faria um número que ele ainda não viu virar
      // fato do perfil.
      contas.custo = {
        echo: opcao.rotulo,
        calculado: custoDaSobra(estado.ticket, opcao.sobraPct),
        confirmado: false,
        em: agora,
      };
    }
  }

  // ---------------------------------------------------------------- C3
  if (entrada.conta === "lucro") {
    if (entrada.naoSei) {
      contas.lucro = { echo: "Não sei", calculado: null, confirmado: false, naoSei: true, em: agora };
    } else if (entrada.confirmando) {
      const anterior = contas.lucro;
      const valor = numeroDoTexto(entrada.escolha);
      if (valor === null) return { ok: false, erro: "Escreva um valor." };
      if (estado.margem !== null && valor > estado.margem) {
        return { ok: false, erro: "Isso é mais do que sobra de cada venda. Escolha um valor menor." };
      }
      campos.push({ campo: "target_profit_per_customer", valor });
      contas.lucro = {
        echo: anterior?.echo ?? String(valor),
        calculado: valor,
        confirmado: true,
        em: agora,
      };
    } else {
      const opcao = opcaoDePostura(entrada.escolha);
      if (!opcao) return { ok: false, erro: "Essa opção não existe." };
      if (estado.margem === null) return { ok: false, erro: "Feche antes quanto sobra de cada venda." };
      contas.lucro = {
        echo: opcao.rotulo,
        calculado: lucroDaPostura(estado.margem, opcao.fracaoQueFica),
        confirmado: false,
        em: agora,
      };
    }
  }

  // O jsonb de `contas` fica ao lado de `respostas`, sem tocar nele. As
  // duas metades do passo 1 são gravadas por telas diferentes, e nenhuma
  // pode apagar a outra.
  // Colunas primeiro, jsonb depois. Ver `gravarCamposDoCliente`: a função
  // do banco é atômica por campo, não por lote, e o par
  // `avg_ticket_min`/`avg_ticket_max` meio gravado faria `ticketEscalar`
  // calcular um ponto médio entre um valor novo e um velho.
  if (campos.length > 0) {
    const gravacao = await gravarCamposDoCliente({
      profileId: userId,
      businessId: linha.id,
      tabela: "businesses",
      campos,
    });
    if (!gravacao.ok) return { ok: false, erro: gravacao.erro };
  }

  const onboardingAtual =
    linha.onboarding && typeof linha.onboarding === "object"
      ? (linha.onboarding as Record<string, unknown>)
      : {};

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ onboarding: { ...onboardingAtual, contas } })
    .eq("id", linha.id);

  if (error) {
    console.error("[contas] falha ao salvar ::", error.message);
    return { ok: false, erro: "Não conseguimos salvar agora. Tente de novo." };
  }

  revalidatePath("/onboarding/contas");

  // O cadastro pode ter acabado de ficar completo com esta resposta. A
  // função decide sozinha se há o que fazer, e NUNCA lança — o campo do
  // cliente já está salvo, e uma falha do disparo não pode virar "não
  // conseguimos salvar" na tela dele.
  await dispararSeCompleto();

  const depois = await obterNegocio();
  return {
    ok: true,
    estado: "erro" in depois ? undefined : montarEstado(depois.linha),
  };
}
