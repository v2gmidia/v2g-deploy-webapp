"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mensagemDeErroAuth } from "@/lib/auth-errors";

export interface RedefinirActionState {
  error?: string;
}

const initialState: RedefinirActionState = {};

function validarForca(senha: string): string | null {
  if (senha.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }
  if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    return "A senha precisa ter letras e números.";
  }
  return null;
}

export async function redefinirAction(
  _prevState: RedefinirActionState,
  formData: FormData,
): Promise<RedefinirActionState> {
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  const erroForca = validarForca(senha);
  if (erroForca) {
    return { error: erroForca };
  }
  if (senha !== confirmarSenha) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    return { error: mensagemDeErroAuth(error, "redefinicao", "/redefinir") };
  }

  await supabase.auth.signOut();
  redirect("/entrar");
}

export { initialState as redefinirInitialState };
