/**
 * O que a gente MANDA bate com o que a rota DECLARA? — leitura pura.
 *
 *   pnpm conferir:rota-apresentada
 *
 * ============================================================
 * ESTE SCRIPT NÃO ESCREVE NADA EM PRODUÇÃO. É a razão de ele existir.
 *
 * A checagem óbvia seria mandar um `POST` de verdade e ver o status. Ela
 * não funciona, e o motivo é um furo do próprio contrato: com id de
 * execução inventado, **a rota devolve 404 tanto se ela não existir
 * quanto se a execução não existir**. Os dois casos são indistinguíveis
 * pela resposta — é o mesmo desenho de `/negocios/{id}/execucao`, que
 * responde 404 em vez de 403 para não confirmar existência a quem
 * adivinha id.
 *
 * Um teste que não separa "a rota não subiu" de "o id é falso" não
 * responde à pergunta. E usar um id REAL responderia — ao custo de gravar
 * em produção, que o Victor não autorizou (03/09/2026).
 *
 * A saída é ler o `openapi.json`, que é declaração e não efeito.
 * ============================================================
 *
 * ============================================================
 * O QUE ELE RESPONDE, E O QUE FICA SEM RESPOSTA.
 *
 * Responde três dos quatro: **caminho**, **método** e **corpo**.
 *
 * Não responde o **header**: `X-V2G-Token` só se prova numa chamada real,
 * e a primeira vai ser a de um cliente de verdade. É aceito, e por um
 * motivo medido: se o header estiver errado, a rota responde 401, e o §3
 * de `conferir-apresentada` já provou que 401 vira uma linha de log e
 * nada mais. O sintoma é log, não tela quebrada.
 * ============================================================
 *
 * ============================================================
 * O QUE A GENTE MANDA É MEDIDO, NÃO DIGITADO AQUI.
 *
 * A tentação era escrever `{ dia, canal }` neste arquivo e comparar com o
 * schema. Isso testaria o que eu ACHO que o cliente manda. Em vez disso
 * um dublê local captura a requisição REAL de
 * `registrarPerguntaApresentada()` — se alguém mudar o corpo do cliente
 * amanhã, esta comparação muda junto, sem ninguém lembrar de vir aqui.
 * ============================================================
 *
 * FORA da `pnpm conferir` de propósito: depende de rede e do estado de
 * produção, e conferidor da suíte não pode ficar vermelho porque o
 * backend está reiniciando.
 */

import { createServer } from "node:http";
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

console.log("\nA rota /pergunta-apresentada, contra o que o cliente manda");
console.log("=".repeat(66));

// ---------------------------------------------------------------- §1

const BASE = (process.env.V2G_BACKEND_URL ?? "").replace(/\/+$/, "");
const TOKEN = process.env.V2G_BACKEND_TOKEN;

if (!BASE) {
  console.log(
    "\nSem `V2G_BACKEND_URL`. Este script fala com PRODUÇÃO — sem a env\n" +
      "não há o que medir, e inventar uma base seria pior que parar.\n",
  );
  process.exitCode = 1;
}

// ---------------------------------------------------------------- §2

/**
 * A requisição de verdade, capturada de um dublê no loopback.
 *
 * Roda antes da parte de rede: se o cliente mudar de forma, quero saber
 * disso mesmo com o backend fora do ar.
 */
interface Capturado {
  metodo: string;
  caminho: string;
  corpo: Record<string, unknown>;
  temToken: boolean;
}

async function capturarOQueMandamos(): Promise<Capturado> {
  let visto: Capturado | null = null;

  const dubles = createServer((req, res) => {
    let bruto = "";
    req.on("data", (p) => (bruto += p));
    req.on("end", () => {
      visto = {
        metodo: req.method ?? "",
        caminho: req.url ?? "",
        corpo: JSON.parse(bruto || "{}"),
        temToken: Boolean(req.headers["x-v2g-token"]),
      };
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end("{}");
    });
  });
  await new Promise<void>((r) => dubles.listen(0, "127.0.0.1", r));
  const porta = (dubles.address() as AddressInfo).port;

  const baseReal = process.env.V2G_BACKEND_URL;
  const flagReal = process.env.V2G_PERGUNTA_APRESENTADA;
  process.env.V2G_BACKEND_URL = `http://127.0.0.1:${porta}`;
  process.env.V2G_BACKEND_TOKEN = TOKEN || "token-de-mentira";
  delete process.env.V2G_PERGUNTA_APRESENTADA; // o dublê mede o cliente LIGADO

  const { registrarPerguntaApresentada } = await import("../lib/backend/dia-seguinte.ts");
  await registrarPerguntaApresentada({ idExecucao: "exec-de-teste", dia: "2026-09-02" });

  await new Promise<void>((r) => dubles.close(() => r()));
  if (baseReal) process.env.V2G_BACKEND_URL = baseReal;
  if (flagReal) process.env.V2G_PERGUNTA_APRESENTADA = flagReal;

  if (!visto) throw new Error("o cliente não chamou o dublê — nada a comparar");
  return visto;
}

console.log("\n1. o que o CLIENTE manda (capturado do código, não digitado aqui)");
const nosso = await capturarOQueMandamos();
console.log(`   ${nosso.metodo} ${nosso.caminho}`);
console.log(`   corpo: ${JSON.stringify(nosso.corpo)}`);
console.log(`   X-V2G-Token: ${nosso.temToken ? "vai junto" : "AUSENTE"}`);
ok(nosso.temToken, "o cliente manda o header (aqui; contra produção não dá para provar)");

// ---------------------------------------------------------------- §3

console.log("\n2. o que PRODUÇÃO declara");

interface Openapi {
  paths?: Record<string, Record<string, unknown>>;
  components?: { schemas?: Record<string, unknown> };
}

async function lerOpenapi(): Promise<Openapi | null> {
  // Sem token primeiro: se o `openapi.json` for público, é bom saber —
  // e é o mesmo cuidado do `/saude`, que não manda credencial de
  // propósito. Só manda o token se o outro lado exigir.
  for (const comToken of [false, true]) {
    if (comToken && !TOKEN) continue;
    try {
      const r = await fetch(`${BASE}/openapi.json`, {
        headers: comToken ? { "X-V2G-Token": TOKEN!, Accept: "application/json" } : { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
      if (r.ok) {
        console.log(`   openapi.json lido ${comToken ? "COM" : "SEM"} token (${r.status})`);
        return (await r.json()) as Openapi;
      }
      console.log(`   ${comToken ? "com" : "sem"} token: ${r.status}`);
    } catch (erro) {
      console.log(`   ${comToken ? "com" : "sem"} token: ${erro instanceof Error ? erro.message : erro}`);
    }
  }
  return null;
}

const doc = BASE ? await lerOpenapi() : null;

if (!doc) {
  console.log(
    "\nNão consegui ler o `openapi.json`. Sem ele nada abaixo pode ser\n" +
      "medido — e isso NÃO quer dizer que a rota está errada, quer dizer\n" +
      "que a medição não aconteceu.\n",
  );
  process.exitCode = 1;
} else {
  const paths = doc.paths ?? {};
  const total = Object.keys(paths).length;
  console.log(`   ${total} paths no documento`);

  // ---- 3. o caminho ----
  console.log("\n3. o CAMINHO que mandamos casa com algum path declarado?");

  /** `/execucoes/{id}/x` vira uma regex que casa com o caminho concreto. */
  const casa = (modelo: string) =>
    new RegExp("^" + modelo.replace(/\{[^}]+\}/g, "[^/]+") + "$").test(nosso.caminho);

  const candidatos = Object.keys(paths).filter(casa);
  ok(candidatos.length === 1, `exatamente um path casa (achei ${candidatos.length})`);
  for (const c of candidatos) console.log(`         ${c}`);

  if (candidatos.length === 0) {
    const parecidos = Object.keys(paths).filter((p) => p.includes("apresentada"));
    console.log(
      parecidos.length > 0
        ? `         o que existe com "apresentada": ${parecidos.join(", ")}`
        : `         NADA com "apresentada" no documento — a rota não subiu.`,
    );
  }

  const caminho = candidatos[0];
  if (caminho) {
    const operacoes = paths[caminho]!;

    // ---- 4. o método ----
    console.log("\n4. o MÉTODO");
    const verbo = nosso.metodo.toLowerCase();
    ok(verbo in operacoes, `\`${nosso.metodo}\` está declarado neste path`);
    console.log(`         declarados: ${Object.keys(operacoes).join(", ")}`);

    // ---- 5. o corpo ----
    console.log("\n5. o CORPO — o que ela EXIGE contra o que a gente MANDA");

    /** Resolve `$ref: "#/components/schemas/X"` uma vez, que é o que o FastAPI gera. */
    function resolver(no: unknown): Record<string, unknown> | null {
      if (!no || typeof no !== "object") return null;
      const obj = no as Record<string, unknown>;
      const ref = obj["$ref"];
      if (typeof ref === "string") {
        const nome = ref.split("/").pop()!;
        const alvo = doc!.components?.schemas?.[nome];
        return (alvo as Record<string, unknown>) ?? null;
      }
      return obj;
    }

    const op = operacoes[verbo] as Record<string, unknown> | undefined;
    const corpoDecl = op?.["requestBody"] as Record<string, unknown> | undefined;
    const conteudo = (corpoDecl?.["content"] as Record<string, unknown> | undefined)?.[
      "application/json"
    ] as Record<string, unknown> | undefined;
    const schema = resolver(conteudo?.["schema"]);

    if (!schema) {
      ok(false, "a operação declara um corpo JSON");
    } else {
      const props = Object.keys((schema["properties"] as Record<string, unknown>) ?? {});
      const exigidos = (schema["required"] as string[] | undefined) ?? [];
      const nossos = Object.keys(nosso.corpo);

      console.log(`         declara:  ${props.join(", ") || "(nenhuma propriedade)"}`);
      console.log(`         exige:    ${exigidos.join(", ") || "(nada obrigatório)"}`);
      console.log(`         mandamos: ${nossos.join(", ")}`);

      // ============================================================
      // ESTA É A ASSERÇÃO QUE VALE MAIS, e não é "dia e canal existem".
      //
      // Campo obrigatório que a gente NÃO manda vira 422 em toda
      // apresentação — e o §3 de `conferir-apresentada` provou que 422
      // some numa linha de log. Seria uma rota no ar, um cliente
      // chamando, e zero linha gravada, sem ninguém notar.
      // ============================================================
      const faltando = exigidos.filter((c) => !nossos.includes(c));
      ok(
        faltando.length === 0,
        faltando.length === 0
          ? "mandamos TODO campo obrigatório"
          : `FALTA mandar: ${faltando.join(", ")} — seria 422 em toda apresentação`,
      );

      ok(props.includes("dia"), "o schema tem `dia`");
      ok(props.includes("canal"), "o schema tem `canal`");

      const sobrando = nossos.filter((c) => !props.includes(c));
      const fechado = schema["additionalProperties"] === false;
      ok(
        sobrando.length === 0 || !fechado,
        sobrando.length === 0
          ? "e não mandamos campo que ela não declara"
          : `mandamos ${sobrando.join(", ")}, que ela não declara` +
              (fechado ? " — e o schema é FECHADO, então recusa" : " (schema aberto, ignora)"),
      );

      // O `canal` costuma ser enum. Se for, `tela` tem que estar nele.
      const canal = resolver(
        (schema["properties"] as Record<string, unknown> | undefined)?.["canal"],
      );
      const enumerado = canal?.["enum"] as string[] | undefined;
      if (enumerado) {
        ok(
          enumerado.includes(String(nosso.corpo["canal"])),
          `\`${nosso.corpo["canal"]}\` está no enum de canal (${enumerado.join(", ")})`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------- placar

console.log("\n" + "=".repeat(66));
if (falhou === 0 && passou > 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências`);
} else if (passou === 0) {
  console.log("NADA FOI MEDIDO — ver as mensagens acima");
  process.exitCode = 1;
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nLEITURA PURA: nenhum POST saiu para produção. O `X-V2G-Token` fica\n" +
    "sem prova até a primeira apresentação real — e o pior caso dele é\n" +
    "401, que `conferir:apresentada` §3 já mostrou virar linha de log.\n",
);
