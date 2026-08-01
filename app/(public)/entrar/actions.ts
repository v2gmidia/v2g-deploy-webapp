"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ehContaJaExistente,
  mensagemDeErroAuth,
  MENSAGEM_CADASTRO_NEUTRA,
} from "@/lib/auth-errors";

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
 * Cadastro. Os campos do formulário continuam em português (`nome`,
 * `whatsapp`) porque são rótulos de UI; a tradução para o vocabulário
 * do schema acontece aqui, ao montar `options.data`. O trigger
 * `handle_new_user()` (supabase/migrations/0001_init.sql) lê
 * `full_name`/`whatsapp` daí para criar a linha em `profiles`
 * automaticamente — e, no mesmo passo, reivindica negócios órfãos
 * cujo `claim_email` bate com este e-mail. Este código nunca insere
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

  // WhatsApp é obrigatório: é o canal por onde o produto avisa o cliente
  // quando algo precisa dele (campanha parada, criativo esperando
  // aprovação). Sem ele, esses avisos não têm para onde ir.
  //
  // A validação vive aqui, e não só no `required` do formulário, porque
  // `required` do HTML é sugestão — a Server Action recebe qualquer
  // corpo que alguém queira mandar.
  if (!whatsapp) {
    return { error: "Informe seu WhatsApp — é por ele que a gente te avisa." };
  }
  if (whatsapp.replace(/\D/g, "").length < 10) {
    return { error: "Esse WhatsApp parece incompleto. Inclua o DDD." };
  }

  if (senha.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { full_name: nome, whatsapp } },
  });

  if (error) {
    // Conta já existente responde igual ao cadastro novo — ver
    // MENSAGEM_CADASTRO_NEUTRA. Nunca dizemos que o e-mail já está na base.
    if (ehContaJaExistente(error)) {
      return { message: MENSAGEM_CADASTRO_NEUTRA };
    }
    return { error: mensagemDeErroAuth(error, "cadastro", "/entrar") };
  }

  // Se o projeto Supabase exigir confirmação de e-mail, `data.session`
  // vem nulo mesmo com o cadastro tendo funcionado — não é um erro.
  if (!data.session) {
    return { message: MENSAGEM_CADASTRO_NEUTRA };
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
    return { error: mensagemDeErroAuth(error, "login", "/entrar") };
  }

  redirect(safeNextPath(formData));
}
