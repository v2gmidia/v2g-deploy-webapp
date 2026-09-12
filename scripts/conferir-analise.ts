/**
 * A análise de peça — `pnpm conferir:analise`
 *
 * ============================================================
 * ESTE CONFERIDOR NASCEU DE UMA TELA QUE GIRAVA PARA SEMPRE.
 *
 * 12/09/2026: o cliente subiu foto do celular em `/criativos` e a tela
 * nunca voltou. A causa medida: o limite de corpo de Server Action do
 * Next é **1 MB** quando não configurado, a validação do navegador não
 * tinha teto de tamanho, e a função que envia não tinha `try`.
 *
 * Foto de celular tem 2 a 8 MB → passava da validação → o Next recusava
 * com `Body exceeded 1 MB limit.` → o `await` rejeitava → a linha
 * seguinte, que tirava a tela do "analisando", não rodava.
 *
 * **O teto de 1 MB era o gatilho; o defeito era não haver caminho de
 * erro.** Perda de rede, aba suspensa e 500 do framework rejeitam igual.
 * Por isso este arquivo trava as duas coisas, e a segunda com mais
 * cuidado que a primeira.
 * ============================================================
 *
 * Puro: não toca rede, banco, nem navegador.
 */

import { readFileSync } from "node:fs";
import {
  ESPERA_DO_BACKEND_MS,
  FOLGA_DO_CORPO_BYTES,
  TETO_DA_ESPERA_MS,
  TETO_DO_NAVEGADOR_BYTES,
  TETO_DO_NAVEGADOR_MB,
  TETO_DO_SERVIDOR_BYTES,
  TETO_DO_SERVIDOR_TEXTO,
} from "../lib/criativos/limites.mjs";
import { conferirAntesDeLer } from "../lib/criativos/envio.ts";

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
const secao = (t: string) => console.log("\n" + t);

/** O arquivo, sem comentário — para o grep não achar a própria explicação. */
function fonte(caminho: string): string {
  return readFileSync(caminho, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const TELA = "app/(protected)/criativos/Analisar.tsx";
const ACTION = "app/(protected)/criativos/actions.ts";

console.log("\nA análise de peça\n" + "=".repeat(64));

secao("0. controle negativo — a asserção pega erro quando existe");
ok(true, "`ok(true, …)` conta como acerto");
{
  const antes = falhou;
  ok(false, "ESTA LINHA TEM QUE FALHAR (se ela passar, ignore o resto)");
  const pegou = falhou === antes + 1;
  falhou = antes;
  ok(pegou, "e a falha foi contada — o placar abaixo vale alguma coisa");
}

// ------------------------------------------------------------------
secao("1. UM NÚMERO SÓ — o teto do navegador é derivado do do servidor");
{
  const config = fonte("next.config.mjs");
  const envio = fonte("lib/criativos/envio.ts");
  const limites = fonte("lib/criativos/limites.mjs");

  ok(
    /TETO_DO_SERVIDOR_TEXTO/.test(config) && /limites\.mjs/.test(config),
    "`next.config.mjs` importa o teto de `limites.mjs` em vez de digitar",
  );
  ok(
    !/bodySizeLimit:\s*["'`]/.test(config),
    "  e não há literal de tamanho no `bodySizeLimit`",
  );
  ok(
    /TETO_DO_NAVEGADOR_BYTES/.test(envio) && /limites\.mjs/.test(envio),
    "`envio.ts` importa o teto do navegador do mesmo módulo",
  );

  // A derivação é o que impede os dois de divergirem: o segundo número
  // não existe como literal em lugar nenhum.
  ok(
    /TETO_DO_NAVEGADOR_BYTES\s*=\s*TETO_DO_SERVIDOR_BYTES\s*-\s*FOLGA_DO_CORPO_BYTES/.test(limites),
    "o teto do navegador é SUBTRAÇÃO do teto do servidor, não um literal",
  );
  ok(
    TETO_DO_NAVEGADOR_BYTES === TETO_DO_SERVIDOR_BYTES - FOLGA_DO_CORPO_BYTES,
    `  e a conta fecha: ${TETO_DO_SERVIDOR_BYTES} − ${FOLGA_DO_CORPO_BYTES} = ${TETO_DO_NAVEGADOR_BYTES}`,
  );
  ok(
    TETO_DO_NAVEGADOR_BYTES < TETO_DO_SERVIDOR_BYTES,
    "  o navegador recusa ANTES do servidor — nunca o contrário",
  );
  ok(FOLGA_DO_CORPO_BYTES > 0, "  e a folga é positiva");

  // A declaração de tipos cobre tudo que o `.mjs` exporta.
  const decl = fonte("lib/criativos/limites.d.mts");
  const exportados = [...limites.matchAll(/export const (\w+)/g)].map((m) => m[1]);
  const faltando = exportados.filter((n) => !new RegExp(`declare const ${n}\\b`).test(decl));
  ok(
    faltando.length === 0,
    `a declaração cobre os ${exportados.length} exports do \`.mjs\`` +
      (faltando.length ? ` (faltam: ${faltando.join(", ")})` : ""),
  );
}

// ------------------------------------------------------------------
secao("2. o teto recusa NO NAVEGADOR, antes de qualquer upload");
{
  const jpg = (bytes: number) =>
    conferirAntesDeLer({ nome: "foto.jpg", tipo: "image/jpeg", tamanhoBytes: bytes });

  ok(jpg(TETO_DO_NAVEGADOR_BYTES) === null, `${TETO_DO_NAVEGADOR_MB} MB exatos passam`);
  ok(
    jpg(TETO_DO_NAVEGADOR_BYTES + 1)?.motivo === "grande_demais",
    "  um byte acima é recusado, com motivo próprio",
  );

  // O caso que quebrou em produção: 4,2 MB continua passando, porque o
  // teto subiu para 10 MB. Se alguém devolver o padrão de 1 MB, esta
  // linha reprova antes de o cliente descobrir de novo.
  ok(jpg(4_200_000) === null, "  o arquivo de 4,2 MB que quebrou em 12/09 PASSA");
  ok(
    TETO_DO_SERVIDOR_BYTES > 1024 * 1024,
    "  e o teto do servidor não voltou para o padrão de 1 MB do Next",
  );

  const texto = jpg(TETO_DO_NAVEGADOR_BYTES + 1)?.texto ?? "";
  ok(texto.includes(String(TETO_DO_NAVEGADOR_MB)), "o texto diz o teto em MB");
  ok(!/erro|inválid|falhou|incorret/i.test(texto), "  e não usa a palavra 'erro'");
  ok(/menor|reduz/i.test(texto), "  e diz o que fazer");
}

// ------------------------------------------------------------------
secao("3. NENHUM CAMINHO FICA EM 'analisando' — o defeito de verdade");
{
  const tela = fonte(TELA);

  // Quem entra no estado é um lugar só. Dois lugares entrando e um
  // saindo é como o buraco volta.
  const entradas = [...tela.matchAll(/setFase\(\{\s*nome:\s*"analisando"/g)].length;
  ok(entradas === 1, `um único lugar entra em "analisando" (achei ${entradas})`);

  ok(/try\s*\{/.test(tela), "a função que envia tem `try`");
  ok(/\}\s*catch/.test(tela), "  e `catch`");
  ok(/\}\s*finally\s*\{/.test(tela), "  e `finally`");

  // ============================================================
  // A ASSERÇÃO QUE IMPORTA: o terminal está no `finally`.
  //
  // No `catch` ele cobriria só a falha PREVISTA. No `finally` ele roda
  // nos três desfechos — sucesso, exceção e retorno — e é a única forma
  // de a garantia não depender de alguém ter previsto a falha certa.
  // ============================================================
  const finalmente = tela.match(/\}\s*finally\s*\{([\s\S]*?)\n\s{2}\}/);
  const corpoDoFinally = finalmente?.[1] ?? "";
  ok(
    /setFase\(/.test(corpoDoFinally),
    "o `finally` sai do estado — é ele que garante, não o `catch`",
  );
  ok(
    !/analisando/.test(corpoDoFinally),
    "  e o estado em que ele deixa a tela NÃO é 'analisando'",
  );

  ok(
    /TETO_DA_ESPERA_MS/.test(tela) && /AbortSignal\.timeout/.test(tela),
    "há teto de tempo no cliente, para a promessa que não resolve nem rejeita",
  );

  // A action nunca lança: se ela lançasse, a tela dependeria só do
  // `finally` — que existe, mas é a segunda linha, não a primeira.
  const action = fonte(ACTION);
  ok(/try\s*\{/.test(action) && /\}\s*catch/.test(action), "a action tem `try/catch`");
  const retornosNus = [...action.matchAll(/return\s*;/g)].length;
  ok(retornosNus === 0, "  e nenhum `return` sem resultado");
  const retornos = [...action.matchAll(/return\s*\{([\s\S]{0,60})/g)];
  ok(
    retornos.length > 0 && retornos.every((m) => /\bok\s*:/.test(m[1] ?? "")),
    `  os ${retornos.length} retornos declaram \`ok\``,
  );
}

// ------------------------------------------------------------------
secao("4. o teto da tela é maior que o do backend");
{
  ok(
    TETO_DA_ESPERA_MS > ESPERA_DO_BACKEND_MS,
    `a tela espera ${TETO_DA_ESPERA_MS / 1000}s, o backend leva até ${ESPERA_DO_BACKEND_MS / 1000}s`,
  );

  // Se a tela desistisse antes, ela abandonaria análise que ia
  // responder — e o cliente leria "não deu" sobre trabalho que deu.
  const margem = TETO_DA_ESPERA_MS - ESPERA_DO_BACKEND_MS;
  ok(margem >= 30_000, `  com margem de ${margem / 1000}s para o upload e a ida ao servidor`);

  // A cópia do número do backend precisa bater com o original, que mora
  // num módulo `server-only` e por isso não pode ser importado aqui.
  const cliente = fonte("lib/backend/cliente.ts");
  const achado = cliente.match(/compliance:\s*([\d_]+)/);
  const valor = achado ? Number(achado[1]!.replace(/_/g, "")) : NaN;
  ok(
    valor === ESPERA_DO_BACKEND_MS,
    `\`TIMEOUTS.compliance\` (${valor}) bate com \`ESPERA_DO_BACKEND_MS\` (${ESPERA_DO_BACKEND_MS})`,
  );
}

console.log("\n" + "=".repeat(64));
if (falhou === 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências`);
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nO QUE ISTO NÃO PEGA: o `finally` existir e deixar a tela num estado\n" +
    "que não é 'analisando' mas também não mostra nada. A §3 confere a\n" +
    "FORMA do caminho de saída, não o que ele desenha — isso é a prova\n" +
    "visual, e ela precisa de sessão.\n",
);
