import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { credenciaisMeta } from "./oauth";

/**
 * O `signed_request` que a Meta manda nos callbacks de desautorização e
 * de exclusão de dados.
 *
 * ============================================================
 * ESTA VERIFICAÇÃO É A ÚNICA COISA ENTRE O ENDPOINT E QUALQUER UM.
 *
 * As duas rotas rodam **sem sessão** — a Meta chama de fora, e tem que
 * ser assim. O que impede um estranho de mandar um `user_id` qualquer e
 * apagar dados alheios é a assinatura conferir contra o `META_APP_SECRET`.
 *
 * Por isso ela falha FECHADA em tudo: formato errado, algoritmo diferente,
 * assinatura que não bate, segredo ausente do ambiente. Nenhum desses
 * casos "passa mesmo assim" — e o segredo ausente é o mais traiçoeiro,
 * porque em desenvolvimento a tentação é deixar passar.
 * ============================================================
 *
 * O formato é `<assinatura>.<payload>`, os dois em **base64url**, e o
 * payload é JSON. É parecido com JWT e não é JWT: sem cabeçalho, e o
 * algoritmo vem DENTRO do payload.
 */

export interface PedidoAssinado {
  /** o id do usuário no Meta — a chave para achar as conexões */
  userId: string;
  emitidoEm: number | null;
}

/** base64url → Buffer. `-` e `_` no lugar de `+` e `/`, sem `=`. */
function deBase64Url(texto: string): Buffer {
  return Buffer.from(texto.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Devolve o pedido se a assinatura conferir, e `null` em qualquer outro
 * caso. **Nunca lança** — quem chama é um route handler que precisa
 * responder à Meta, e um 500 aqui viraria retentativa infinita do lado
 * de lá.
 */
export function lerPedidoAssinado(assinado: string | null): PedidoAssinado | null {
  if (!assinado) return null;

  const partes = assinado.split(".");
  if (partes.length !== 2) return null;
  const [assinatura, payload] = partes as [string, string];

  let segredo: string;
  try {
    segredo = credenciaisMeta().appSecret;
  } catch {
    // Falta `META_APP_SECRET`. Sem ele não há como verificar nada, e
    // seguir seria aceitar qualquer assinatura.
    console.error("[meta:signed-request] META_APP_SECRET ausente — pedido recusado");
    return null;
  }

  let corpo: { algorithm?: unknown; user_id?: unknown; issued_at?: unknown };
  try {
    corpo = JSON.parse(deBase64Url(payload).toString("utf8"));
  } catch {
    return null;
  }

  // O algoritmo vem DENTRO do payload, então é entrada do atacante. Um
  // código que lesse `corpo.algorithm` para escolher o algoritmo aceitaria
  // `"none"` — é a falha clássica de JWT, e a defesa é a mesma: só um
  // algoritmo é aceito, e é o nosso.
  if (corpo.algorithm !== "HMAC-SHA256") {
    console.error(`[meta:signed-request] algoritmo inesperado :: ${String(corpo.algorithm)}`);
    return null;
  }

  const esperada = createHmac("sha256", segredo).update(payload).digest();
  const recebida = deBase64Url(assinatura);

  // `timingSafeEqual` exige tamanhos iguais e lança se diferirem — daí a
  // comparação de comprimento antes. A comparação constante existe para
  // a resposta não vazar, pelo tempo, quantos bytes iniciais bateram.
  if (recebida.length !== esperada.length) return null;
  if (!timingSafeEqual(recebida, esperada)) {
    console.error("[meta:signed-request] assinatura nao confere — pedido descartado");
    return null;
  }

  const userId = typeof corpo.user_id === "string" ? corpo.user_id.trim() : "";
  // Assinatura válida sem `user_id` não dá para atender: não há a quem
  // aplicar. Mesma regra do `TokenSemDono` — não se adivinha dono.
  if (!userId) {
    console.error("[meta:signed-request] pedido assinado sem user_id");
    return null;
  }

  return {
    userId,
    emitidoEm: typeof corpo.issued_at === "number" ? corpo.issued_at : null,
  };
}

/**
 * A Meta manda `signed_request` como campo de formulário
 * (`application/x-www-form-urlencoded`), mas há relato de JSON em
 * integrações antigas. Ler os dois custa três linhas e evita um endpoint
 * que recusa tudo por causa do `Content-Type`.
 */
export async function pedidoAssinadoDaRequisicao(
  request: Request,
): Promise<PedidoAssinado | null> {
  const tipo = request.headers.get("content-type") ?? "";
  try {
    if (tipo.includes("application/json")) {
      const corpo = (await request.json()) as { signed_request?: unknown };
      return lerPedidoAssinado(
        typeof corpo.signed_request === "string" ? corpo.signed_request : null,
      );
    }
    const form = await request.formData();
    const valor = form.get("signed_request");
    return lerPedidoAssinado(typeof valor === "string" ? valor : null);
  } catch {
    return null;
  }
}
