"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PODE_ESVAZIAR,
  acharCampoDoCliente,
  type CampoDoCliente,
} from "@/lib/perfil/catalogo-cliente";
import { conferirFaixaDeTicket, converterValor } from "@/lib/perfil/valores";

/**
 * As ações da tela `/meu-negocio`.
 *
 * CADA UMA CONFERE A SESSÃO E O DONO. Server Action é endpoint POST de
 * verdade: o `proxy.ts` protege a navegação até a página, não a chamada da
 * ação. Mesma defesa em profundidade da Decisão 3 e da tela do operador.
 *
 * O dono não é conferido por um `if` sobre um id que veio do formulário: o
 * negócio é BUSCADO pelo `profile_id` da sessão, com o cliente sujeito a
 * RLS. O formulário não manda `business_id` — não há o que forjar.
 */

export interface EstadoDaRevisao {
  erro?: string;
  ok?: string;
  /** Qual campo a mensagem é sobre. A tela mostra ao lado dele, não no topo. */
  chave?: string;
}

// ============================================================
// O DESPACHO — três casos, três funções de banco, três motivos
// ============================================================

/**
 * SÃO TRÊS CASOS E DUAS FUNÇÕES DE BANCO, e a bifurcação está escrita aqui
 * de propósito, em vez de morar dentro de um `if` no meio da ação.
 *
 * | o cliente faz          | vai para                      | com que cliente |
 * |------------------------|-------------------------------|-----------------|
 * | diz que está certo     | `confirmar_campo_do_cliente`  | admin           |
 * | escreve um valor       | `confirmar_campo_do_cliente`  | admin           |
 * | apaga o que estava lá  | `esvaziar_campos_do_cliente`  | do usuário      |
 *
 * **Por que apagar não pode ir pela mesma função.** A
 * `confirmar_campo_do_cliente` recusa valor em branco, e recusa de propósito:
 * ela sempre grava procedência `confirmado`, e não existe procedência de
 * campo vazio — "vazio se preenche, não se confirma". Se ela aceitasse o
 * branco, deixaria a coluna nula com a procedência ainda afirmando que
 * alguém conferiu aquilo. Pior que não ter procedência: a trava da 0013
 * passaria a recusar uma proposta futura para proteger um valor que não
 * existe mais.
 *
 * **Por que a de apagar é chamada com o cliente DO USUÁRIO e não com o
 * admin.** A `esvaziar_campos_do_cliente` (0017) é `security invoker` — quem
 * autoriza a escrita é a política de RLS da tabela, não um `if` dentro dela.
 * Chamá-la com `service_role` desligaria exatamente a autorização que ela
 * usa, e a função passaria a apagar campo de qualquer negócio cujo id
 * chegasse até ela. É a única das quatro funções de perfil que `authenticated`
 * executa, e é por isso que pode ser.
 *
 * Se um dia alguém for unificar as duas chamadas num caminho só: as duas
 * linhas acima são o motivo de não dar.
 */
const DESPACHO = {
  confirmar: {
    quando: "o cliente diz que o valor que já está lá está certo",
    funcao: "confirmar_campo_do_cliente",
    cliente: "admin",
  },
  gravar: {
    quando: "o cliente escreve um valor — corrigindo o que havia ou preenchendo o vazio",
    funcao: "confirmar_campo_do_cliente",
    cliente: "admin",
  },
  esvaziar: {
    quando: "o cliente apaga o que estava lá",
    funcao: "esvaziar_campos_do_cliente",
    cliente: "do usuário, sob RLS",
  },
} as const;

type CasoDoCliente = keyof typeof DESPACHO;

// ============================================================
// O comum às três
// ============================================================

interface Contexto {
  profileId: string;
  businessId: string;
}

async function sessaoENegocio(): Promise<Contexto | { erro: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  // Cliente NORMAL, sujeito a RLS. É esta linha que garante que a pessoa só
  // alcança o negócio dela — não a ordem das operações abaixo.
  const { data: negocio } = await supabase
    .from("businesses")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!negocio) return { erro: "Não encontramos seu negócio. Comece pelo onboarding." };
  return { profileId: user.id, businessId: negocio.id as string };
}

function campoOuErro(chave: string): CampoDoCliente | { erro: string } {
  const campo = acharCampoDoCliente(chave);
  // Chave desconhecida não vira erro genérico: a lista branca do banco
  // recusaria de qualquer forma, mas parar aqui evita gastar uma chamada e
  // deixa o motivo legível no log.
  if (!campo) return { erro: "Esse campo não existe." };
  if (campo.oculto) return { erro: "Esse campo é editado junto com o outro do par." };
  return campo;
}

/**
 * A chamada de escrita. Um campo, um `rpc`.
 *
 * A mensagem do `raise exception` é escrita para ser lida — repassá-la é
 * melhor que trocar por um texto genérico que obrigaria a abrir o log. Mas
 * ela é escrita para NÓS, não para o dono da padaria: por isso as recusas
 * previsíveis são interceptadas antes, e o que chega aqui é falha de
 * verdade.
 */
async function gravarNoBanco(
  ctx: Contexto,
  campo: CampoDoCliente,
  valor: unknown | undefined,
): Promise<{ ok: true; ato: string } | { ok: false; mensagem: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("confirmar_campo_do_cliente", {
    p_profile_id: ctx.profileId,
    p_business_id: ctx.businessId,
    p_tabela: campo.tabela,
    p_campo: campo.campo,
    p_valor: valor === undefined ? null : valor,
  });

  if (error) {
    console.error("[meu-negocio] rpc confirmar ::", campo.chave, "::", error.message);
    return { ok: false, mensagem: "Não conseguimos salvar agora. Tente de novo em instantes." };
  }

  const ato =
    typeof data === "object" && data !== null && "ato" in data
      ? String((data as { ato: unknown }).ato)
      : "";
  return { ok: true, ato };
}

// ============================================================
// As ações
// ============================================================

/** Caso `confirmar`. Não manda valor: o que está lá continua como está. */
export async function confirmarCampoAction(
  _prev: EstadoDaRevisao,
  formData: FormData,
): Promise<EstadoDaRevisao> {
  const ctx = await sessaoENegocio();
  if ("erro" in ctx) return { erro: ctx.erro };

  const chave = String(formData.get("chave") ?? "");
  const campo = campoOuErro(chave);
  if ("erro" in campo) return { erro: campo.erro, chave };

  // O par do ticket é uma pergunta na tela e duas colunas no banco. Confirmar
  // carimba as duas: deixar só o piso confirmado produziria a faixa
  // meio-confirmada que a leitura teria que resolver toda vez — e ela
  // resolve pela mais fraca, então o cliente veria "não conferido" logo
  // depois de conferir.
  const alvos = [campo, ...(campo.parCom ? [acharCampoDoCliente(campo.parCom)!] : [])];

  for (const alvo of alvos) {
    const r = await gravarNoBanco(ctx, alvo, undefined);
    if (!r.ok) return { erro: r.mensagem, chave };
  }

  revalidatePath("/meu-negocio");
  return { ok: "Conferido.", chave };
}

/**
 * Casos `gravar` e `esvaziar`. Qual dos dois é decidido aqui, e a decisão é
 * o conteúdo do campo — ver o `DESPACHO`.
 */
export async function salvarCampoAction(
  _prev: EstadoDaRevisao,
  formData: FormData,
): Promise<EstadoDaRevisao> {
  const ctx = await sessaoENegocio();
  if ("erro" in ctx) return { erro: ctx.erro };

  const chave = String(formData.get("chave") ?? "");
  const campo = campoOuErro(chave);
  if ("erro" in campo) return { erro: campo.erro, chave };

  const bruto = String(formData.get("valor") ?? "");
  const brutoAte = String(formData.get("valorAte") ?? "");

  // A INTENÇÃO VEM DECLARADA, e não deduzida do campo estar em branco.
  //
  // Deduzir foi a primeira versão e estava errada por dois motivos. O
  // mecânico: o botão de apagar vivia no mesmo `<form>` do input, e um botão
  // `name="valor" value=""` não vence um input `name="valor"` já preenchido —
  // `FormData.get` devolve o primeiro, então o botão nunca limpava nada. O de
  // desenho é maior: apagar e "salvei sem querer com o campo vazio" são atos
  // diferentes, e o primeiro apaga a procedência junto. Um ato que remove
  // registro precisa ser pedido, não inferido de um campo em branco.
  const caso: CasoDoCliente =
    formData.get("acao") === "esvaziar" ? "esvaziar" : "gravar";

  switch (caso) {
    case "esvaziar":
      return esvaziar(ctx, campo, chave);
    case "gravar":
      return gravar(ctx, campo, chave, bruto, brutoAte);
  }
}

/** `DESPACHO.gravar` — vira `preencheu` ou `corrigiu`, quem decide é o banco. */
async function gravar(
  ctx: Contexto,
  campo: CampoDoCliente,
  chave: string,
  bruto: string,
  brutoAte: string,
): Promise<EstadoDaRevisao> {
  const conv = converterValor(campo, bruto);
  if (!conv.ok) return { erro: conv.mensagem, chave };

  // O par do ticket: os dois valores conferidos juntos ANTES de qualquer
  // escrita. Gravar o piso e só então descobrir que o teto é menor deixaria
  // metade da faixa trocada.
  if (campo.parCom) {
    const par = acharCampoDoCliente(campo.parCom);
    if (!par) return { erro: "Esse campo não existe.", chave };

    const convAte = converterValor(par, brutoAte);
    if (!convAte.ok) return { erro: convAte.mensagem, chave };

    const faixa = conferirFaixaDeTicket(Number(conv.valor), Number(convAte.valor));
    if (!faixa.ok) return { erro: faixa.mensagem, chave };

    const a = await gravarNoBanco(ctx, campo, conv.valor);
    if (!a.ok) return { erro: a.mensagem, chave };
    const b = await gravarNoBanco(ctx, par, convAte.valor);
    if (!b.ok) return { erro: b.mensagem, chave };

    revalidatePath("/meu-negocio");
    return { ok: "Salvo.", chave };
  }

  const r = await gravarNoBanco(ctx, campo, conv.valor);
  if (!r.ok) return { erro: r.mensagem, chave };

  revalidatePath("/meu-negocio");
  return { ok: r.ato === "preencheu" ? "Anotado." : "Salvo.", chave };
}

/**
 * `DESPACHO.esvaziar` — a outra função, e o outro cliente.
 *
 * `createClient()` e não `createAdminClient()`: ver o comentário do
 * `DESPACHO`. Trocar por admin aqui não daria erro nenhum — só desligaria a
 * autorização.
 */
async function esvaziar(
  ctx: Contexto,
  campo: CampoDoCliente,
  chave: string,
): Promise<EstadoDaRevisao> {
  if (!PODE_ESVAZIAR.has(campo.chave)) {
    return {
      erro: "Esse a gente não consegue deixar em branco — escreva o que vale hoje.",
      chave,
    };
  }

  const colunas = [campo.campo];
  if (campo.parCom) {
    const par = acharCampoDoCliente(campo.parCom);
    if (par && PODE_ESVAZIAR.has(par.chave)) colunas.push(par.campo);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("esvaziar_campos_do_cliente", {
    p_business_id: ctx.businessId,
    p_campos: colunas,
  });

  if (error) {
    console.error("[meu-negocio] rpc esvaziar ::", chave, "::", error.message);
    return { erro: "Não conseguimos salvar agora. Tente de novo em instantes.", chave };
  }

  revalidatePath("/meu-negocio");
  return { ok: "Deixamos em branco.", chave };
}
