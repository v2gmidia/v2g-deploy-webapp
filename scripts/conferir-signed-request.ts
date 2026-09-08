/**
 * O `signed_request` da Meta — `pnpm conferir:signed-request`
 *
 * ============================================================
 * ESTA VERIFICAÇÃO É A ÚNICA COISA ENTRE OS DOIS CALLBACKS E QUALQUER UM.
 *
 * `/auth/meta/desautorizar` e `/auth/meta/exclusao-de-dados` rodam SEM
 * SESSÃO — a Meta chama de fora, e tem que ser assim. Não há RLS, não há
 * cookie, não há segunda camada: se a assinatura passar, o `user_id` que
 * veio no corpo decide o que é apagado.
 *
 * Um erro aqui não dá tela quebrada. Dá apagamento de dado alheio por
 * quem mandar o corpo certo. Por isso este conferidor existe, e por isso
 * cada caso abaixo é uma forma diferente de tentar passar.
 * ============================================================
 *
 * Não toca rede, não toca banco. Monta os pedidos com o mesmo `crypto` do
 * Node e confere o que a função aceita e o que ela recusa.
 *
 * PRECISA de `--conditions=react-server` e do resolvedor: o módulo é
 * `server-only` e usa alias `@/`.
 */

import { createHmac } from "node:crypto";

let passou = 0;
let falhou = 0;

function ok(condicao: boolean, rotulo: string) {
  if (condicao) {
    passou++;
    console.log("  ok   ", rotulo);
  } else {
    falhou++;
    console.log("  FALHA", rotulo);
  }
}

function secao(titulo: string) {
  console.log("\n" + titulo);
}

// ---------------------------------------------------------------- §0

secao("0. controle negativo — a asserção pega erro quando existe");
ok(true, "`ok(true, …)` conta como acerto");
{
  const antes = falhou;
  ok(false, "ESTA LINHA TEM QUE FALHAR (se ela passar, ignore o resto)");
  const pegou = falhou === antes + 1;
  falhou = antes;
  ok(pegou, "e a falha foi contada — o placar abaixo vale alguma coisa");
}

// ---------------------------------------------------------------- montagem

const SEGREDO = "segredo-de-teste-nao-e-o-de-producao";
process.env.META_APP_ID = "app-de-teste";
process.env.META_APP_SECRET = SEGREDO;

const { lerPedidoAssinado } = await import("../lib/meta/signed-request.ts");

const b64url = (b: Buffer | string) =>
  Buffer.from(b)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** Monta um `signed_request` como a Meta monta. */
function assinar(corpo: unknown, segredo = SEGREDO): string {
  const payload = b64url(JSON.stringify(corpo));
  const sig = b64url(createHmac("sha256", segredo).update(payload).digest());
  return `${sig}.${payload}`;
}

const BOM = { algorithm: "HMAC-SHA256", user_id: "1234567890", issued_at: 1_757_000_000 };

// ---------------------------------------------------------------- §1

secao("1. o caminho feliz");
{
  const r = lerPedidoAssinado(assinar(BOM));
  ok(r !== null, "um pedido bem assinado passa");
  ok(r?.userId === "1234567890", "e o `user_id` chega inteiro");
  ok(r?.emitidoEm === 1_757_000_000, "o `issued_at` também");
}

// ---------------------------------------------------------------- §2

secao("2. as formas de tentar passar sem poder");
{
  // ============================================================
  // O CASO QUE MOTIVA TUDO: assinado com OUTRO segredo.
  //
  // É o ataque óbvio — copiar o formato e assinar com qualquer coisa. Se
  // isto passasse, qualquer pessoa apagaria os dados de qualquer cliente
  // mandando o `user_id` dele.
  // ============================================================
  ok(
    lerPedidoAssinado(assinar(BOM, "outro-segredo-qualquer")) === null,
    "assinado com outro segredo NÃO passa",
  );

  // O `algorithm` vem DENTRO do payload — é entrada do atacante. Aceitar
  // o que ele diz é a falha clássica do `alg: none` em JWT.
  const semAlg = assinar({ ...BOM, algorithm: "none" });
  ok(lerPedidoAssinado(semAlg) === null, '`algorithm: "none"` NÃO passa, mesmo bem assinado');
  ok(
    lerPedidoAssinado(assinar({ ...BOM, algorithm: "HMAC-SHA1" })) === null,
    "outro algoritmo declarado também não passa",
  );

  // Payload adulterado depois de assinar: troca o `user_id` mantendo a
  // assinatura do original. É como se tentaria apagar os dados de outro.
  {
    const original = assinar(BOM);
    const sig = original.split(".")[0]!;
    const outro = b64url(JSON.stringify({ ...BOM, user_id: "9999999999" }));
    ok(
      lerPedidoAssinado(`${sig}.${outro}`) === null,
      "trocar o `user_id` mantendo a assinatura NÃO passa",
    );
  }

  ok(lerPedidoAssinado(null) === null, "ausente não passa");
  ok(lerPedidoAssinado("") === null, "vazio não passa");
  ok(lerPedidoAssinado("sem-ponto") === null, "sem o ponto separador não passa");
  ok(lerPedidoAssinado("a.b.c") === null, "com pontos demais não passa");
  ok(lerPedidoAssinado("xxx.yyy") === null, "base64 que não é JSON não passa");

  // Assinatura mais curta: `timingSafeEqual` LANÇA com tamanhos
  // diferentes. Se a checagem de comprimento não existisse, isto viraria
  // 500 na rota — e 500 faz a Meta repetir para sempre.
  {
    const original = assinar(BOM);
    const payload = original.split(".")[1]!;
    ok(lerPedidoAssinado(`YWJj.${payload}`) === null, "assinatura curta não passa (e não lança)");
  }
}

// ---------------------------------------------------------------- §3

secao("3. assinatura boa, pedido inatendível");
{
  // ============================================================
  // ASSINATURA VÁLIDA NÃO BASTA. Sem `user_id` não há a quem aplicar, e
  // adivinhar dono é exatamente o que o `TokenSemDono` proíbe do outro
  // lado do ciclo. Aceitar aqui com `user_id` vazio faria a rota chamar
  // `apagar_dados_da_meta('')` — que a função recusa, mas depender disso
  // seria deixar a defesa só no banco.
  // ============================================================
  ok(
    lerPedidoAssinado(assinar({ algorithm: "HMAC-SHA256" })) === null,
    "sem `user_id` não passa, mesmo bem assinado",
  );
  ok(
    lerPedidoAssinado(assinar({ ...BOM, user_id: "   " })) === null,
    "`user_id` só com espaço não passa",
  );
  ok(
    lerPedidoAssinado(assinar({ ...BOM, user_id: 123 })) === null,
    "`user_id` que não é string não passa",
  );
}

// ---------------------------------------------------------------- §4

secao("4. sem o segredo no ambiente, NADA passa");
{
  // ============================================================
  // O caso mais traiçoeiro dos quatro, porque a tentação é "deixa passar
  // em desenvolvimento". Sem `META_APP_SECRET` não há como verificar
  // coisa alguma — e um endpoint que aceita tudo quando falta config é um
  // endpoint aberto no dia em que alguém esquecer a variável no deploy.
  // ============================================================
  const guardado = process.env.META_APP_SECRET;
  delete process.env.META_APP_SECRET;
  ok(
    lerPedidoAssinado(assinar(BOM, guardado!)) === null,
    "falta `META_APP_SECRET` → recusa (falha FECHADA, não aberta)",
  );
  process.env.META_APP_SECRET = guardado;
  ok(lerPedidoAssinado(assinar(BOM)) !== null, "e volta a aceitar quando a env volta");
}

// ---------------------------------------------------------------- placar

console.log("\n" + "=".repeat(64));
if (falhou === 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências`);
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nIsto confere a PORTA das duas rotas, não o que elas apagam. O que\n" +
    "`apagar_dados_da_meta` de fato remove só o banco responde — e a\n" +
    "migration 0021 não foi aplicada por esta sessão.\n",
);
