import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registrarErroAuth } from "@/lib/auth-errors";

/**
 * Alvo do link enviado por e-mail (cadastro e recuperação de senha).
 *
 * ============================================================
 * O BUG DE 30/08/2026: A ROTA NÃO CHEGAVA A TENTAR.
 *
 * Ela lia só `token_hash`. O link que o Supabase estava mandando trazia
 * `?token=pkce_...&type=recovery` — outro nome de parâmetro. Então
 * `tokenHash` era `null`, o `if` era falso, e a requisição caía direto no
 * redirect de "inválido" **sem nunca falar com o Supabase**.
 *
 * É por isso que link novo, no mesmo navegador, um clique, dava inválido:
 * não era token expirado nem já usado. Ele não era verificado — era
 * descartado. E como o `registrarErroAuth` só rodava dentro do `if`, não
 * havia nem log para desmentir a hipótese do token expirado.
 *
 * A lição que fica no código: um `if` que decide entre "tentar" e
 * "recusar" precisa registrar os dois lados. O caminho que não tentava
 * era o único sem rastro, e foi o que aconteceu.
 * ============================================================
 *
 * AS TRÊS FORMAS, e por que todas as três:
 *
 *  1. `token_hash` + `type` → `verifyOtp`. É o template padrão do
 *     Supabase quando ele usa `{{ .TokenHash }}`.
 *  2. `token` + `type` → mesmo caminho. É o MESMO dado com outro nome de
 *     parâmetro; muda o template, não o valor. Era o caso que faltava.
 *  3. `code` → `exchangeCodeForSession`. É o PKCE completo: o link vai ao
 *     `/auth/v1/verify` do Supabase, ele verifica e redireciona para cá
 *     com `?code=`. Nesse caminho `verifyOtp` não serve.
 *
 * O prefixo `pkce_` no valor não decide qual função chamar — quem decide
 * é o NOME do parâmetro. `code` é código de autorização; `token` e
 * `token_hash` são hash de OTP, com ou sem o prefixo.
 *
 * ROUTE HANDLER, E ISSO IMPORTA: aqui o `cookieStore.set` funciona de
 * verdade. O `try/catch` silencioso do `lib/supabase/server.ts` existe
 * para Server Component, que não pode escrever cookie — se esta rota
 * fosse uma página, a sessão nasceria e se perderia na mesma requisição,
 * e o `/redefinir` não conseguiria chamar `auth.updateUser` depois.
 *
 * O PROXY RODA AQUI, E DEIXA PASSAR. Conferido em 31/08/2026: o
 * middleware deste projeto se chama `proxy.ts` — no Next 16 o
 * `middleware.ts` foi renomeado, mesmo mecanismo. O matcher dele pega
 * tudo que não é asset estático, então ele roda nesta rota; mas `/auth`
 * não está em `PROTECTED_PREFIXES`, e a requisição segue para cá sem
 * redirecionamento.
 *
 * Ele chama `supabase.auth.getUser()` antes, com o cliente dele. Isso
 * não atrapalha a troca: o cookie que vale é o que ESTA rota escreve, e
 * Route Handler pode escrever.
 *
 * (Procurar por `middleware.ts` e concluir que não há middleware é o
 * erro fácil aqui, e ele já foi cometido uma vez nesta investigação.)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash") ?? searchParams.get("token");
  const code = searchParams.get("code");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  // NOMES, NUNCA VALORES. Um token de recuperação é credencial: quem lê o
  // log entra na conta. O que diagnostica é QUAIS parâmetros chegaram, e
  // isso não é segredo.
  console.info(
    "[auth/confirmar] parâmetros recebidos ::",
    JSON.stringify({
      chaves: [...searchParams.keys()],
      tem_token_hash: searchParams.has("token_hash"),
      tem_token: searchParams.has("token"),
      tem_code: searchParams.has("code"),
      type,
      prefixo_pkce: (tokenHash ?? code ?? "").startsWith("pkce_"),
    }),
  );

  const supabase = await createClient();

  // PKCE completo primeiro: quando vem `code`, é ele que vale, mesmo que
  // por algum motivo venha um `token` junto.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    registrarErroAuth(error, "confirmacao", "/auth/confirmar");
    return recusar(origin);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    registrarErroAuth(error, "confirmacao", "/auth/confirmar");
    return recusar(origin);
  }

  // O caminho que não tenta. Antes era mudo, e o silêncio dele foi o bug.
  console.error(
    "[auth/confirmar] link sem parâmetro utilizável ::",
    `chaves=[${[...searchParams.keys()].join(", ")}] type=${type ?? "ausente"}`,
    "— nenhuma verificação foi tentada. Confira o template de e-mail no Supabase.",
  );
  return recusar(origin);
}

function recusar(origin: string) {
  // A tela de destino já explica o que fazer; o motivo real (expirado, já
  // usado, hash adulterado, ou link sem parâmetro) fica no log.
  const invalidUrl = new URL("/redefinir", origin);
  invalidUrl.searchParams.set("erro", "invalido");
  return NextResponse.redirect(invalidUrl);
}
