import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trocarCodePorToken } from "@/lib/meta/oauth";
import { registrarErroMeta } from "@/lib/meta/erros";
import { COOKIE_STATE } from "../iniciar/route";

/**
 * Retorno do consentimento do Meta.
 *
 * A ordem dos passos abaixo não é arbitrária: cada um só acontece depois
 * que o anterior provou que vale a pena. O `state` é conferido ANTES de
 * qualquer chamada ao Meta, porque uma requisição forjada não deve nem
 * consumir uma chamada de API nossa.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const falhar = (motivo: string) =>
    NextResponse.redirect(`${origin}/conectar?erro=${motivo}`);

  // Limpa o cookie em TODA saída — state é de uso único, tenha dado
  // certo ou errado. Um state reaproveitável não é state.
  const limpar = (resposta: NextResponse) => {
    resposta.cookies.set({ name: COOKIE_STATE, value: "", maxAge: 0, path: "/auth/meta" });
    return resposta;
  };

  // ---- 1. o usuário recusou, ou o Meta devolveu erro no redirect ----
  const erroDoMeta = searchParams.get("error");
  if (erroDoMeta) {
    console.error(
      `[meta:callback] recusa ou erro no redirect :: ${erroDoMeta} / ${searchParams.get("error_reason") ?? "-"}`,
    );
    return limpar(falhar(erroDoMeta === "access_denied" ? "recusado" : "troca"));
  }

  // ---- 2. state: comparação antes de qualquer outra coisa ----
  const cru = request.cookies.get(COOKIE_STATE)?.value;
  const stateRecebido = searchParams.get("state");
  const code = searchParams.get("code");

  if (!cru || !stateRecebido || !code) return limpar(falhar("state"));

  let guardado: { nonce?: string; businessId?: string };
  try {
    guardado = JSON.parse(cru) as { nonce?: string; businessId?: string };
  } catch {
    return limpar(falhar("state"));
  }

  if (!guardado.nonce || !guardado.businessId || guardado.nonce !== stateRecebido) {
    console.error("[meta:callback] state nao confere — requisicao descartada");
    return limpar(falhar("state"));
  }

  // ---- 3. a sessão pode ter mudado entre o início e a volta ----
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return limpar(falhar("sessao"));

  // O cookie é nosso, mas isso não basta: confirmamos contra o banco que
  // este negócio pertence a este usuário. É a mesma regra da RLS, e a
  // consulta abaixo passa por ela — se não for dele, volta vazia.
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", guardado.businessId)
    .maybeSingle();

  if (!business) {
    console.error("[meta:callback] business do state nao pertence ao usuario da sessao");
    return limpar(falhar("negocio"));
  }

  // ---- 4. code -> token curto -> token longo -> debug_token ----
  let dados;
  try {
    dados = await trocarCodePorToken(code);
  } catch (erro) {
    registrarErroMeta("callback:troca", erro);
    return limpar(falhar("troca"));
  }

  // ---- 5. Vault + meta_connections numa transação só ----
  // `service_role` porque só ele tem EXECUTE em `conectar_meta` — a
  // função é o único caminho pelo qual o token entra no sistema, e ela
  // não devolve o token de volta, só o id da conexão.
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("conectar_meta", {
      p_business_id: business.id,
      p_token: dados.token,
      p_expires_at: dados.expiraEm?.toISOString() ?? null,
      p_meta_user_id: dados.metaUserId,
      p_scopes: dados.escopos,
    });
    if (error) throw new Error(error.message);
  } catch (erro) {
    // A mensagem do Postgres pode citar o nome do parâmetro, nunca o
    // valor — mesmo assim, só o texto do erro entra no log.
    console.error(
      `[meta:callback] falha ao gravar conexao :: ${erro instanceof Error ? erro.message : "desconhecido"}`,
    );
    return limpar(falhar("gravacao"));
  }

  return limpar(NextResponse.redirect(`${origin}/conectar/escolher`));
}
