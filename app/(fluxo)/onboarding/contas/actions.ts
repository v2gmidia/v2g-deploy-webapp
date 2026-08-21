"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  lerConta,
  ticketEscalar,
  type ChaveDeConta,
  type LeituraDaConta,
  type RespostaDeConta,
} from "@/lib/cadastro/montar";
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
   * O que se sabe de cada conta, JÁ RESOLVIDO entre coluna e jsonb.
   *
   * A tela lê isto, e não `contas` direto. O jsonb sozinho dizia "Você não
   * soube" sobre um valor que o cliente havia confirmado três horas depois
   * pela `/meu-negocio` — medido em conta real em 20/08. A coluna manda.
   * Ver `lerConta` e docs/estado-do-cliente.md §4.
   */
  leituras: Record<ChaveDeConta, LeituraDaConta>;
  /** quando o cliente confirmou cada coluna, se confirmou */
  confirmadoEm: Partial<Record<ChaveDeConta, string>>;
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
    // `COLUNAS_DO_CADASTRO` + `procedencia`: a tela precisa dizer QUANDO o
    // cliente conferiu um valor, e isso não é dado de cadastro. A constante
    // fica como está — ela é o contrato do que `montarCadastro` lê.
    .select(`${COLUNAS_DO_CADASTRO}, procedencia`)
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

/**
 * Quando o cliente confirmou uma coluna, lido da `procedencia`.
 *
 * Só `origem = "confirmado"` conta. Um valor `extraido` da transcrição ou
 * `manual` não foi conferido por ele, e escrever "você conferiu isso"
 * embaixo seria afirmar um ato que não aconteceu — a mesma regra que a
 * `/meu-negocio` já aplica em `lerProcedencia`.
 */
function confirmadoEmDe(
  procedencia: unknown,
  coluna: string,
): string | undefined {
  const mapa = (procedencia ?? {}) as Record<
    string,
    { origem?: string; em?: string } | undefined
  >;
  const e = mapa[coluna];
  return e?.origem === "confirmado" ? e.em : undefined;
}

function montarEstado(linha: LinhaNegocio): EstadoDasContas {
  const ticket = ticketEscalar(num(linha.avg_ticket_min), num(linha.avg_ticket_max));
  const custo = num(linha.avg_direct_cost);
  const lucro = num(linha.target_profit_per_customer);
  const contas = lerContas(linha.onboarding);
  const cadastro = montarCadastro(linha);
  const proc = (linha as { procedencia?: unknown }).procedencia;

  return {
    businessId: linha.id,
    contas,
    ticket,
    margem: ticket !== null && custo !== null ? Math.round((ticket - custo) * 100) / 100 : null,
    // A COLUNA PRIMEIRO, SEMPRE. `lerConta` é a única regra de combinação
    // entre coluna e jsonb no projeto — `motivoDaConta` também é escrita em
    // cima dela.
    leituras: {
      ticket: lerConta(ticket, contas.ticket),
      custo: lerConta(custo, contas.custo),
      lucro: lerConta(lucro, contas.lucro),
    },
    confirmadoEm: {
      // O ticket são duas colunas; a procedência que vale é a do `min`, que
      // é a que a `/meu-negocio` mostra como par.
      ticket: confirmadoEmDe(proc, "avg_ticket_min"),
      custo: confirmadoEmDe(proc, "avg_direct_cost"),
      lucro: confirmadoEmDe(proc, "target_profit_per_customer"),
    },
    resumo: resumirPendencias(cadastro.completo ? [] : cadastro.pendencias, new Date()),
  };
}

export async function carregarContasAction(): Promise<{ erro: string } | EstadoDasContas> {
  const r = await obterNegocio();
  if ("erro" in r) return r;
  return montarEstado(r.linha);
}

/**
 * REABRE uma conta que ele respondeu "não sei".
 *
 * ============================================================
 * ISTO NÃO CONTRADIZ O LOTE B, E A DIFERENÇA É QUEM COMEÇOU.
 *
 * A razão de "não sei" fechar a conta era a tela não COBRAR: reoferecer a
 * mesma pergunta faz a pessoa chutar um número na segunda vez só para a
 * tela parar de pedir, e um chute entra como `confirmado` — o nível mais
 * alto da escala — e vira orçamento de campanha.
 *
 * Um caminho que ELE clica não é a tela pedindo. É ele voltando.
 *
 * Sem isto, "não sei" era terminal: `montarCadastro` exige os seis campos,
 * e um cliente nessa situação nunca dispara o pipeline — sem erro, sem
 * pendência acionável, sem nada na tela que diga o que falta acontecer.
 * Medido em docs/buraco-numeros-dificeis.md.
 * ============================================================
 *
 * NÃO APAGA O "NÃO SEI". Acrescenta `reabertoEm` ao lado dele. O jsonb
 * registra um fato com hora — às 19:56 daquele dia essa pessoa disse que
 * não sabia — e apagar é reescrever medição. Deixar de ler não é apagar
 * (ver o cabeçalho de `lerConta`).
 *
 * NENHUMA COLUNA É TOCADA aqui, e por isso esta ação não passa por
 * `gravarCamposDoCliente`: reabrir não afirma valor nenhum sobre o
 * negócio. Quem escreve a coluna é a resposta que vem depois, pelo
 * caminho normal, com procedência.
 */
export async function reabrirContaAction(entrada: {
  conta: ChaveDeConta;
}): Promise<ResultadoDaConta> {
  const r = await obterNegocio();
  if ("erro" in r) return { ok: false, erro: r.erro };

  const { linha } = r;
  const estado = montarEstado(linha);

  // SÓ O "NÃO SEI" REABRE. Uma conta respondida já tem caminho — a
  // `/meu-negocio`, que corrige valor com procedência — e um segundo
  // caminho de reescrita para a mesma coluna é como a `/conta` perdeu
  // procedência. Server Action é endpoint, não é botão: a checagem tem que
  // estar aqui, não só no `disabled` do JSX.
  if (estado.leituras[entrada.conta].estado !== "nao_sei") {
    return { ok: false, erro: "Essa conta não está marcada como “não sei”." };
  }

  const anterior = estado.contas[entrada.conta];
  if (!anterior) return { ok: false, erro: "Essa conta ainda não foi respondida." };

  const contas = {
    ...estado.contas,
    [entrada.conta]: { ...anterior, reabertoEm: new Date().toISOString() },
  };

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
    console.error("[contas] falha ao reabrir ::", error.message);
    return { ok: false, erro: "Não conseguimos abrir a pergunta agora. Tente de novo." };
  }

  revalidatePath("/onboarding/contas");

  const depois = await obterNegocio();
  return {
    ok: true,
    estado: "erro" in depois ? undefined : montarEstado(depois.linha),
  };
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
