"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mensagemDeErroAuth } from "@/lib/auth-errors";
import { validarNovaSenha } from "@/lib/auth-senha";

export interface RedefinirActionState {
  error?: string;
}

export async function redefinirAction(
  _prevState: RedefinirActionState,
  formData: FormData,
): Promise<RedefinirActionState> {
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  const erroSenha = validarNovaSenha(senha, confirmarSenha);
  if (erroSenha) return { error: erroSenha };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) return { error: mensagemDeErroAuth(error, "redefinicao", "/redefinir") };
  } catch {
    return { error: "Não foi possível confirmar a alteração. Tente entrar com a nova senha ou peça outro link de recuperação." };
  }

  // A senha já mudou: falha no encerramento não pode parecer falha ao salvá-la.
  let saidaConfirmada = false;
  try {
    const { error: erroSaida } = await supabase.auth.signOut();
    saidaConfirmada = !erroSaida;
  } catch { /* Mostrar o resultado salvo sem expor resposta do provedor. */ }
  // Página pública independente da sessão: remover cookies pode remontar a
  // página atual como link expirado antes de um estado local ser exibido.
  redirect(saidaConfirmada ? "/redefinir/concluido" : "/redefinir/concluido?aviso=sessao");
}
