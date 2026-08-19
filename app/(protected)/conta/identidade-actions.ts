"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { arquivarImagem, guardarImagem } from "@/lib/identidade/armazenar";
import type { UsoDeIdentidade } from "@/lib/identidade/regras";
import { TEXTO_DA_DECLARACAO } from "./declaracao";

export interface IdentidadeState {
  erro?: string;
  ok?: string;
}

/**
 * O dono do negócio da sessão. `null` quando não há.
 *
 * Toda ação daqui resolve o negócio A PARTIR DA SESSÃO, e nunca aceita um
 * `business_id` vindo do formulário. Server Action é endpoint POST de
 * verdade: um id que chega pelo corpo é um id que quem chama escolheu, e
 * abaixo dele roda o cliente admin, que ignora RLS.
 */
async function negocioDaSessao(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("businesses")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export async function enviarImagemAction(
  _prev: IdentidadeState,
  formData: FormData,
): Promise<IdentidadeState> {
  const businessId = await negocioDaSessao();
  if (!businessId) return { erro: "Sua sessão expirou. Entre de novo." };

  const uso = String(formData.get("uso") ?? "");
  if (uso !== "logo" && uso !== "identidade") return { erro: "Não entendi o pedido." };

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Escolha um arquivo antes de enviar." };
  }

  const bytes = new Uint8Array(await arquivo.arrayBuffer());

  const r = await guardarImagem({
    businessId,
    uso: uso as UsoDeIdentidade,
    nomeOriginal: arquivo.name,
    bytes,
    // O texto EXATO que a pessoa viu. Vem da mesma constante que a tela
    // renderiza — se viesse do formulário, quem envia escolheria o que
    // ficou registrado que ele aceitou.
    textoDaDeclaracao: TEXTO_DA_DECLARACAO,
  });

  if (!r.ok) return { erro: r.mensagem };

  revalidatePath("/conta");
  return { ok: uso === "logo" ? "Logo salvo." : "Foto adicionada." };
}

export async function removerImagemAction(
  _prev: IdentidadeState,
  formData: FormData,
): Promise<IdentidadeState> {
  const businessId = await negocioDaSessao();
  if (!businessId) return { erro: "Sua sessão expirou. Entre de novo." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Não entendi qual imagem remover." };

  const r = await arquivarImagem(businessId, id);
  if (!r.ok) return { erro: "Não consegui remover agora. Tente de novo." };

  revalidatePath("/conta");
  return { ok: "Imagem removida." };
}
