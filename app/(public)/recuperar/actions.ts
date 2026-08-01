"use server";

import { createClient } from "@/lib/supabase/server";

export interface RecuperarActionState {
  error?: string;
  enviado?: boolean;
}

/**
 * Sempre retorna `enviado: true` em caso de sucesso na chamada à API,
 * exista ou não o e-mail na base — o Supabase Auth já não revela isso,
 * e replicamos a mesma mensagem aqui para não abrir brecha de enumeração
 * de contas por outro caminho.
 */
export async function recuperarAction(
  _prevState: RecuperarActionState,
  formData: FormData,
): Promise<RecuperarActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Informe seu e-mail." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl.replace(/\/+$/, "")}/auth/confirmar?next=/redefinir`,
  });

  // Erros de rede/config do provedor de e-mail são reais e merecem
  // aparecer — só a existência (ou não) da conta é que fica escondida.
  if (error) {
    return { error: "Não foi possível enviar o e-mail agora. Tente novamente em instantes." };
  }

  return { enviado: true };
}
