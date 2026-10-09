"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { vincularComprasAprovadas } from "@/lib/contratacao/vincular";
import { destinoLocalSeguro } from "@/lib/auth-destino";
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
  return destinoLocalSeguro(formData.get("next"));
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
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const cnpj = String(formData.get("cnpj") ?? "").replace(/\D/g, "");
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
  if (!/^\d{14}$/.test(cnpj)) {
    return { error: "Informe o CNPJ de 14 dígitos da empresa contratante." };
  }

  // Nunca criar conta nova sem pedido aprovado. O mesmo retorno neutro evita
  // revelar se um e-mail pertence a um comprador ou a uma conta existente.
  try {
    const admin = createAdminClient();
    const { data: pedido, error: erroPedido } = await admin
      .from("commercial_orders")
      .select("id")
      .eq("buyer_email", email)
      .eq("cnpj", cnpj)
      .eq("status", "payment_approved")
      .not("business_id", "is", null)
      .limit(1)
      .maybeSingle();
    if (erroPedido) return { error: "Não foi possível conferir seu acesso. Tente novamente." };
    if (!pedido) return { message: MENSAGEM_CADASTRO_NEUTRA };
  } catch {
    return { error: "Não foi possível conferir seu acesso. Tente novamente." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (!siteUrl) return { error: "O endereço de acesso está indisponível. Tente novamente mais tarde." };
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { full_name: nome, whatsapp },
      emailRedirectTo: `${siteUrl}/auth/confirmar`,
    },
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

  if (data.user) await vincularComprasAprovadas(data.user);

  redirect(safeNextPath(formData));
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { error: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return { error: mensagemDeErroAuth(error, "login", "/entrar") };
  }

  if (data.user) await vincularComprasAprovadas(data.user);

  redirect(safeNextPath(formData));
}
