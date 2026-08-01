import "server-only";

/**
 * Tradução dos erros do Supabase Auth para português.
 *
 * Duas regras que valem para todas as telas:
 *
 * 1. A mensagem original NUNCA vai para a tela. Ela é inglês com jargão
 *    ("Email address ... is invalid", "email rate limit exceeded") e às
 *    vezes revela detalhe de infraestrutura. Vai para o log do servidor.
 * 2. Erro desconhecido cai em MENSAGEM_GENERICA. É melhor uma frase vaga
 *    em português do que uma precisa em inglês que o usuário não entende.
 *
 * O Supabase expõe `error.code` desde a v2.85 do supabase-js. Ainda assim
 * há caminhos que só trazem `message` (respostas antigas do GoTrue, erros
 * de rede), então existe um segundo passe por texto — ver `porMensagem`.
 */

export type ContextoAuth =
  | "cadastro"
  | "login"
  | "recuperacao"
  | "redefinicao"
  | "confirmacao";

export const MENSAGEM_GENERICA =
  "Não foi possível concluir agora. Tente de novo em alguns instantes.";

/**
 * Resposta única do cadastro, usada tanto quando a conta é criada quanto
 * quando o e-mail já existe. As duas situações precisam ser
 * indistinguíveis da tela, senão o formulário de cadastro vira um
 * verificador de quais e-mails estão na base.
 */
export const MENSAGEM_CADASTRO_NEUTRA =
  "Se este e-mail ainda não tiver conta, enviamos um link de confirmação. " +
  "Confira sua caixa de entrada e também o spam.";

const MSG_EMAIL_INVALIDO = "Esse e-mail não parece válido. Confira e tente de novo.";
const MSG_SENHA_FRACA =
  "Senha muito fraca. Escolha uma senha mais longa, misturando letras e números.";
const MSG_CREDENCIAIS = "E-mail ou senha incorretos.";
const MSG_LINK_EXPIRADO = "Este link expirou ou já foi usado. Peça um novo.";
const MSG_SESSAO_EXPIRADA = "Sua sessão expirou. Entre de novo.";
const MSG_MUITAS_TENTATIVAS =
  "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.";
const MSG_MUITOS_EMAILS =
  "Enviamos e-mails demais em pouco tempo. Espere alguns minutos e tente de novo.";

// Revela que a conta existe — ver a nota sobre esse trade-off em
// `mensagemDeErroAuth`. Redigida no condicional para não afirmar nada.
const MSG_NAO_CONFIRMADO =
  "Se você acabou de criar a conta, confirme seu e-mail pelo link que " +
  "enviamos antes de entrar.";

const POR_CODIGO: Record<string, string> = {
  email_address_invalid: MSG_EMAIL_INVALIDO,
  validation_failed: "Confira os dados preenchidos e tente de novo.",

  weak_password: MSG_SENHA_FRACA,
  same_password: "A nova senha precisa ser diferente da senha atual.",

  over_email_send_rate_limit: MSG_MUITOS_EMAILS,
  over_send_rate_limit: MSG_MUITOS_EMAILS,
  over_request_rate_limit: MSG_MUITAS_TENTATIVAS,

  invalid_credentials: MSG_CREDENCIAIS,
  user_not_found: MSG_CREDENCIAIS,
  email_not_confirmed: MSG_NAO_CONFIRMADO,

  otp_expired: MSG_LINK_EXPIRADO,
  bad_jwt: MSG_SESSAO_EXPIRADA,
  session_expired: MSG_SESSAO_EXPIRADA,
  session_not_found: MSG_SESSAO_EXPIRADA,
  refresh_token_not_found: MSG_SESSAO_EXPIRADA,
};

/**
 * Segundo passe, por texto. Só entra em ação quando `code` não veio.
 * A ordem importa: "invalid login credentials" antes de "invalid".
 *
 * Conta já existente cai em MENSAGEM_GENERICA de propósito: quem precisa
 * desse caso é `ehContaJaExistente`, chamada antes daqui pelo cadastro.
 * Se chegar até este ponto, é um caminho que não deveria revelar nada.
 */
const POR_MENSAGEM: Array<[RegExp, string]> = [
  [/invalid login credentials/i, MSG_CREDENCIAIS],
  [/email not confirmed/i, MSG_NAO_CONFIRMADO],
  [/(already registered|already exists|user already)/i, MENSAGEM_GENERICA],
  [/rate limit/i, MSG_MUITAS_TENTATIVAS],
  [/(password.*(short|weak)|weak.*password)/i, MSG_SENHA_FRACA],
  [/(expired|invalid).*(token|otp|link)/i, MSG_LINK_EXPIRADO],
  [/email.*invalid|invalid.*email/i, MSG_EMAIL_INVALIDO],
];

interface ErroNormalizado {
  code?: string;
  status?: number;
  message: string;
}

function normalizar(erro: unknown): ErroNormalizado {
  if (erro && typeof erro === "object") {
    const e = erro as { code?: unknown; status?: unknown; message?: unknown };
    return {
      code: typeof e.code === "string" ? e.code : undefined,
      status: typeof e.status === "number" ? e.status : undefined,
      message: typeof e.message === "string" ? e.message : String(erro),
    };
  }
  return { message: String(erro) };
}

/**
 * O log do servidor é o único lugar onde o texto original aparece.
 * Sem e-mail, senha ou token junto — só o suficiente para diagnosticar.
 *
 * Exportada para os pontos que precisam registrar sem mostrar mensagem
 * nenhuma (o route handler de confirmação, que responde com redirect).
 */
export function registrarErroAuth(erro: unknown, contexto: ContextoAuth): void {
  const e = normalizar(erro);
  console.error(
    `[auth:${contexto}] code=${e.code ?? "(sem code)"} status=${e.status ?? "-"} :: ${e.message}`,
  );
}

/**
 * `true` quando o Supabase disse que a conta já existe.
 *
 * Existe separado porque no cadastro esse caso NÃO é tratado como erro:
 * `signUpAction` responde com MENSAGEM_CADASTRO_NEUTRA, a mesma resposta
 * do cadastro bem-sucedido. Quando a confirmação de e-mail está ligada no
 * projeto, o próprio Supabase já devolve sucesso falso nesse caso; com ela
 * desligada, ele devolve erro — esta função cobre o segundo caminho para
 * que o comportamento visível seja o mesmo nas duas configurações.
 */
export function ehContaJaExistente(erro: unknown): boolean {
  const { code, message } = normalizar(erro);
  if (code === "user_already_exists" || code === "email_exists") return true;
  return /(already registered|already exists|user already)/i.test(message);
}

/**
 * Traduz o erro e registra o original no servidor.
 *
 * Nota sobre `email_not_confirmed` no login: essa mensagem confirma, na
 * prática, que a conta existe. Mantida mesmo assim porque a alternativa —
 * responder "e-mail ou senha incorretos" para quem só não confirmou —
 * deixa a pessoa num beco sem saída, sem nenhuma pista do que fazer. O
 * cadastro e a recuperação de senha continuam sem vazar nada, que é onde
 * a enumeração de contas é barata para um atacante.
 */
export function mensagemDeErroAuth(erro: unknown, contexto: ContextoAuth): string {
  const normalizado = normalizar(erro);
  registrarErroAuth(erro, contexto);

  if (normalizado.code) {
    const porCodigo = POR_CODIGO[normalizado.code];
    if (porCodigo) return porCodigo;
  }

  for (const [padrao, mensagem] of POR_MENSAGEM) {
    if (padrao.test(normalizado.message)) return mensagem;
  }

  return MENSAGEM_GENERICA;
}
