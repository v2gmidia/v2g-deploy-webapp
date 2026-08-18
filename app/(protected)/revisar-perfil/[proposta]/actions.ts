"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acharCampo } from "@/lib/agentes/campos";
import {
  aplicarProposta,
  decidirItem,
  reabrirItem,
} from "@/lib/agentes/revisao";

/**
 * As ações da tela de revisão.
 *
 * CADA UMA CONFERE O PAPEL. Server Action é um endpoint POST de verdade:
 * o `proxy.ts` protege a navegação até a página, não a chamada da ação.
 * Sem esta checagem, qualquer usuário logado que descobrisse o id de um
 * item decidiria por ele. É a mesma defesa em profundidade da Decisão 3,
 * aplicada à camada que as pessoas esquecem.
 */
async function operadorOuErro(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") {
    throw new Error("não autorizado");
  }
  // O e-mail é o que fica gravado em `decidido_por` e na procedência. O
  // id serve de reserva para conta sem e-mail — o campo não pode ficar
  // vazio, porque "quem decidiu" é metade do valor do registro.
  return user.email ?? user.id;
}

/**
 * Converte o texto do formulário para o tipo da coluna.
 *
 * `undefined` quer dizer que não dá para converter, e a ação recusa em vez
 * de gravar lixo. Número é o caso que importa: "mil e quinhentos" digitado
 * na correção viraria `NaN`, e `NaN` em coluna numeric é o tipo de valor
 * que só aparece quando alguém for calcular orçamento com ele.
 */
function converter(chave: string, bruto: string): unknown | undefined {
  const campo = acharCampo(chave);
  const t = bruto.trim();
  if (!t) return undefined;

  switch (campo?.tipo) {
    case "numero": {
      // Aceita "1.200,50" e "1200.50" — quem digita usa o teclado do
      // Brasil, não o do JSON.
      const limpo = t.replace(/\s|R\$/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
      const n = Number(limpo);
      if (!Number.isFinite(n)) return undefined;
      if (campo.dinheiro && n <= 0) return undefined;
      return n;
    }
    case "booleano": {
      const s = t.toLowerCase();
      if (["true", "sim", "1"].includes(s)) return true;
      if (["false", "nao", "não", "0"].includes(s)) return false;
      return undefined;
    }
    case "lista":
      return t
        .split(/\r?\n|;/)
        .map((x) => x.trim())
        .filter(Boolean);
    default:
      return t;
  }
}

export async function decidirAction(formData: FormData): Promise<void> {
  const por = await operadorOuErro();

  const propostaId = String(formData.get("propostaId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const decisao = String(formData.get("decisao") ?? "");
  const chave = String(formData.get("chave") ?? "");

  if (decisao !== "aceito" && decisao !== "corrigido" && decisao !== "descartado") {
    return;
  }

  let valorFinal: unknown;
  if (decisao === "corrigido") {
    // `valorDireto` é o caminho da divergência: o operador escolheu o
    // número anotado, e ele já vem tipado do banco — não passa pelo
    // conversor de texto.
    const direto = formData.get("valorDireto");
    if (direto !== null && String(direto) !== "") {
      valorFinal = converter(chave, String(direto));
    } else {
      valorFinal = converter(chave, String(formData.get("valorFinal") ?? ""));
    }
    if (valorFinal === undefined) {
      // Sem valor válido não grava NADA e diz por quê. Gravar o item como
      // decidido com valor vazio seria pior que não gravar: sumiria da
      // contagem de pendentes sem ninguém ter decidido.
      return recarregarComErro(
        propostaId,
        "Não entendi esse valor. Para número, escreva só os dígitos (1500 ou 1.500,00).",
      );
    }
  }

  const r = await decidirItem({ itemId, decisao, valorFinal, por });
  if (!r.ok) return recarregarComErro(propostaId, r.mensagem);
  revalidatePath(`/revisar-perfil/${propostaId}`);
}

/**
 * O erro viaja na URL porque a página é servidor puro.
 *
 * `redirect()` dentro de Server Action lança por dentro — por isso as
 * chamadas usam `return`, para deixar explícito que nada roda depois.
 */
function recarregarComErro(propostaId: string, mensagem: string): never {
  redirect(
    `/revisar-perfil/${propostaId}?erro=` + encodeURIComponent(mensagem),
  );
}

export async function reabrirAction(formData: FormData): Promise<void> {
  await operadorOuErro();
  const propostaId = String(formData.get("propostaId") ?? "");
  await reabrirItem(String(formData.get("itemId") ?? ""));
  revalidatePath(`/revisar-perfil/${propostaId}`);
}

export async function aplicarAction(formData: FormData): Promise<void> {
  const por = await operadorOuErro();
  const propostaId = String(formData.get("propostaId") ?? "");
  const r = await aplicarProposta(propostaId, por);
  revalidatePath(`/revisar-perfil/${propostaId}`);
  if (!r.ok) return recarregarComErro(propostaId, r.mensagem);
}
