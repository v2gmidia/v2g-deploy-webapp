"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error?: string;
  message?: string;
}

/**
 * O middleware manda o usuário pra /entrar?next=/rota-original quando
 * ele tentava acessar algo protegido sem sessão. Sem isso, depois de
 * logar ele sempre cairia em /inicio, perdendo o destino original —
 * hoje só existe /inicio mesmo, mas o parâmetro já é respeitado para
 * quando houver mais de uma rota protegida.
 */
function safeNextPath(formData: FormData): string {
  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/") && !next.startsWith("//") && next !== "/entrar") {
    return next;
  }
  return "/inicio";
}

/**
 * Cadastro. `nome`/`whatsapp` vão em `options.data` — o trigger
 * `handle_new_user()` (supabase/migrations/0001_init.sql) lê daí pra
 * criar a linha em `profiles` automaticamente. Este código nunca insere
 * em `profiles` diretamente.
 */
export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!nome || !email || !senha) {
    return { error: "Preencha nome, e-mail e senha." };
  }
  if (senha.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, whatsapp } },
  });

  if (error) {
    return { error: error.message };
  }

  // Se o projeto Supabase exigir confirmação de e-mail, `data.session`
  // vem nulo mesmo com o cadastro tendo funcionado — não é um erro.
  if (!data.session) {
    return {
      message: "Conta criada! Confira seu e-mail para confirmar antes de entrar.",
    };
  }

  redirect(safeNextPath(formData));
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { error: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  redirect(safeNextPath(formData));
}
