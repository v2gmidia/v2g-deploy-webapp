/**
 * A telemetria de apresentação degrada limpo? — `pnpm conferir:apresentada`
 *
 * ============================================================
 * POR QUE ESTE CONFERIDOR EXISTE.
 *
 * `POST /execucoes/{id}/pergunta-apresentada` foi escrito ANTES de a rota
 * subir, de propósito, para os dois lados não esperarem um pelo outro. Em
 * 03/09/2026 o Victor mediu que ela existe no backend local e **não em
 * produção** — 46 paths no `openapi.json` contra 47.
 *
 * Ou seja: por algumas horas, todo card renderizado vai bater num 404. Eu
 * afirmei que isso é inofensivo porque o caminho é fire-and-forget. Isto
 * aqui é a prova, e não a afirmação.
 *
 * O QUE ELE MEDE, e é a distinção que importa: a diferença entre "a
 * chamada falha" e "a falha aparece para alguém". Falhar é esperado.
 * Aparecer é o defeito.
 * ============================================================
 *
 * SOBE UM SERVIDOR HTTP DE MENTIRA em porta efêmera do loopback e aponta
 * o cliente para ele. Nada toca o backend real, nada escreve em produção,
 * e o teste roda offline.
 *
 * PRECISA DE `--conditions=react-server`: `lib/backend/` é `server-only`,
 * e sem a condição o `import` estoura. É o mesmo motivo pelo qual os
 * outros conferidores só alcançam módulos puros.
 */

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

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

// ---------------------------------------------------------------- o dublê

/**
 * O servidor de mentira. Cada teste troca `responder` antes de chamar.
 *
 * Porta 0 = o SO escolhe uma livre. Porta fixa transformaria "outro
 * processo está usando a 4000" em falha do conferidor.
 */
let responder: (req: unknown, res: import("node:http").ServerResponse) => void = (_q, r) => {
  r.writeHead(404, { "Content-Type": "application/json" });
  r.end(JSON.stringify({ detail: "Not Found" }));
};

const servidor: Server = createServer((req, res) => responder(req, res));
await new Promise<void>((resolve) => servidor.listen(0, "127.0.0.1", resolve));
const porta = (servidor.address() as AddressInfo).port;

/**
 * O ambiente é montado ANTES do import de `lib/backend`.
 *
 * `configuracao()` lê `process.env` a cada chamada, então trocar depois
 * também funcionaria — mas depender disso seria depender de um detalhe de
 * implementação de outro módulo. Montar antes vale para as duas formas.
 */
process.env.V2G_BACKEND_URL = `http://127.0.0.1:${porta}`;
process.env.V2G_BACKEND_TOKEN = "token-de-mentira";
delete process.env.V2G_PERGUNTA_APRESENTADA;

const { registrarPerguntaApresentada, REGISTRA_PERGUNTA_APRESENTADA } = await import(
  "../lib/backend/dia-seguinte.ts"
);

const CHAMADA = { idExecucao: "exec-de-teste", dia: "2026-09-02" };

/** Chama e diz o que aconteceu — sem deixar exceção escapar. */
async function chamar(): Promise<
  { estourou: false; resultado: { ok: boolean } } | { estourou: true; erro: unknown }
> {
  try {
    return { estourou: false, resultado: await registrarPerguntaApresentada(CHAMADA) };
  } catch (erro) {
    return { estourou: true, erro };
  }
}

// ---------------------------------------------------------------- §1

secao("1. o flag nasce LIGADO — sem env, a telemetria acontece");
ok(
  REGISTRA_PERGUNTA_APRESENTADA === true,
  "sem `V2G_PERGUNTA_APRESENTADA`, o registro está ligado",
);

// ---------------------------------------------------------------- §2

secao("2. O CASO DE HOJE: a rota não está em produção e devolve 404");
{
  let recebeu: { metodo?: string; caminho?: string; corpo?: string; token?: string } = {};
  responder = (req, res) => {
    const r = req as import("node:http").IncomingMessage;
    let corpo = "";
    r.on("data", (p) => (corpo += p));
    r.on("end", () => {
      recebeu = {
        metodo: r.method,
        caminho: r.url,
        corpo,
        token: r.headers["x-v2g-token"] as string,
      };
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: "Not Found" }));
    });
  };

  const r = await chamar();

  ok(!r.estourou, "NÃO ESTOURA — 404 volta como resultado, não como exceção");
  ok(!r.estourou && r.resultado.ok === false, "e o resultado diz que não deu certo");

  // O que chegou do outro lado: se a rota mudar de nome ou de forma, é
  // aqui que aparece — o 404 de hoje é da rota ausente, não do corpo.
  ok(recebeu.metodo === "POST", "o método é POST");
  ok(
    recebeu.caminho === "/execucoes/exec-de-teste/pergunta-apresentada",
    `o caminho é o do contrato (${recebeu.caminho})`,
  );
  ok(recebeu.token === "token-de-mentira", "o header X-V2G-Token vai junto");
  {
    const corpo = JSON.parse(recebeu.corpo ?? "{}");
    ok(corpo.dia === "2026-09-02", "o corpo leva o dia");
    ok(corpo.canal === "tela", "e o canal `tela` — a terceira parte da chave");
  }
}

// ---------------------------------------------------------------- §3

secao("3. e degrada igual em toda forma de falha, não só no 404");
{
  const formas: Array<[string, typeof responder]> = [
    [
      "500 do servidor",
      (_q, r) => {
        r.writeHead(500);
        r.end("{}");
      },
    ],
    [
      "401 — token errado ou revogado",
      (_q, r) => {
        r.writeHead(401);
        r.end("{}");
      },
    ],
    [
      "200 com corpo que não é JSON (página de erro de proxy)",
      (_q, r) => {
        r.writeHead(200, { "Content-Type": "text/html" });
        r.end("<html>502 Bad Gateway</html>");
      },
    ],
    [
      "conexão cortada no meio da resposta",
      (_q, r) => {
        r.destroy();
      },
    ],
  ];

  for (const [nome, resposta] of formas) {
    responder = resposta;
    const r = await chamar();
    ok(!r.estourou, `não estoura: ${nome}`);
    ok(!r.estourou && r.resultado.ok === false, `e devolve falha: ${nome}`);
  }
}

// ---------------------------------------------------------------- §4

secao("4. o backend fora do ar — nada escutando na porta");
{
  await new Promise<void>((resolve) => servidor.close(() => resolve()));
  const r = await chamar();
  ok(!r.estourou, "não estoura com ECONNREFUSED");
  ok(!r.estourou && r.resultado.ok === false, "e devolve falha");
}

// ---------------------------------------------------------------- §5

secao("5. o flag desligado não chama ninguém");
{
  process.env.V2G_PERGUNTA_APRESENTADA = "off";
  // O flag é lido no `import`, não a cada chamada — então reimportar é o
  // que faz a troca valer. Cache-buster na URL porque o ESM guarda o
  // módulo já resolvido.
  const m = await import(`../lib/backend/dia-seguinte.ts?off=${Date.now()}`);
  ok(m.REGISTRA_PERGUNTA_APRESENTADA === false, "`off` desliga o registro");

  let bateu = false;
  const outro = createServer((_q, res) => {
    bateu = true;
    res.writeHead(201);
    res.end("{}");
  });
  await new Promise<void>((resolve) => outro.listen(0, "127.0.0.1", resolve));
  process.env.V2G_BACKEND_URL = `http://127.0.0.1:${(outro.address() as AddressInfo).port}`;

  const r = await m.registrarPerguntaApresentada(CHAMADA);
  ok(r.ok === false, "e a função devolve falha sem tentar a rede");
  ok(!bateu, "o servidor NÃO recebeu nada — é isto que `off` tem que garantir");

  await new Promise<void>((resolve) => outro.close(() => resolve()));
  delete process.env.V2G_PERGUNTA_APRESENTADA;
}

// ---------------------------------------------------------------- §6

secao("6. A CAMADA DE CIMA: a Server Action engole até o que ESTOURA");
{
  // ============================================================
  // A §2 prova que a falha de REDE volta como resultado. Falta a outra
  // metade: e o que não volta como resultado?
  //
  // Aqui a ação roda FORA de uma requisição do Next. `createClient()`
  // chama `cookies()` de `next/headers`, que exige contexto de request e
  // LANÇA sem ele. É um estouro de verdade, não simulado — e é do mesmo
  // tipo do que derrubou a `/conta` em 02/09: falha antes da rede, no
  // caminho que ninguém protegeu.
  //
  // Se o `try` externo da ação não existisse, esta linha rejeitaria — e no
  // navegador isso vira erro não tratado dentro de um `useEffect`, que o
  // Next transforma em `error.tsx`. A tela principal do produto trocada
  // por uma linha de estatística.
  // ============================================================
  // O import vem protegido: se um dia o Next mudar a forma dos subentries
  // e o módulo não carregar aqui, isso é limitação DESTE arranque — não
  // defeito do produto. Uma exceção não tratada aqui derrubaria a suíte
  // inteira e faria parecer que a ação está quebrada.
  let acao: ((e: { dia: string }) => Promise<void>) | null = null;
  try {
    ({ registrarPerguntaApresentadaAction: acao } = await import(
      "../app/(protected)/inicio/actions.ts"
    ));
  } catch (erro) {
    const linha = erro instanceof Error ? erro.message.split("\n")[0] : String(erro);
    console.log("   ?    NÃO DEU PARA CARREGAR a Server Action neste processo:");
    console.log(`        ${linha}`);
    console.log("        O §6 fica EM BRANCO — e isso não é verde, é ausência");
    console.log("        de medição. O placar abaixo não cobre esta camada.");
    falhou++;
  }

  if (acao) {
    const registrarPerguntaApresentadaAction = acao;

    // ============================================================
    // O CONTROLE DESTE §, e sem ele o resto não vale nada.
    //
    // "A ação não rejeitou" passa por dois motivos MUITO diferentes: ou
    // ela engoliu um estouro — o que se quer provar —, ou nada estourou e
    // ela saiu quieta por outro caminho. As duas hipóteses dão verde.
    //
    // Então mede-se primeiro que a primeira coisa que ela faz depois da
    // checagem barata REALMENTE estoura neste processo. Se um dia
    // `createClient()` parar de lançar aqui, esta linha fica vermelha e
    // avisa que o § virou teatro.
    // ============================================================
    let clientStoura = false;
    try {
      const { createClient } = await import("../lib/supabase/server.ts");
      await createClient();
    } catch {
      clientStoura = true;
    }
    ok(
      clientStoura,
      "CONTROLE: `createClient()` estoura mesmo neste processo (sem request)",
    );

    let estourou = false;
    let devolveu: unknown = "não chegou a devolver";
    try {
      devolveu = await registrarPerguntaApresentadaAction({ dia: "2026-09-02" });
    } catch {
      estourou = true;
    }

    ok(!estourou, "a ação NÃO rejeita, mesmo com a camada de baixo estourando");
    ok(devolveu === undefined, "e devolve `undefined` — nada para a tela ler ou exibir");

    // A checagem barata roda ANTES de qualquer coisa cara: dia fora da
    // janela devolve sem tocar em sessão, banco ou rede.
    let estourouNoFuturo = false;
    try {
      await registrarPerguntaApresentadaAction({ dia: "2099-01-01" });
    } catch {
      estourouNoFuturo = true;
    }
    ok(!estourouNoFuturo, "dia fora da janela também sai quieto");
  }
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
  "\nNada tocou o backend real: todas as chamadas foram para 127.0.0.1.\n" +
    "O que está verde é que a FALHA não vaza para a tela — não que a rota\n" +
    "de produção funcione. Isso só o deploy responde.\n",
);
