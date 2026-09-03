/**
 * O hook de resolução. Ver `resolvedor-de-imports.mjs` para o porquê.
 *
 * Roda na thread de loaders do Node, isolado do script principal — por
 * isso ele recalcula a raiz em vez de receber por parâmetro.
 */

import { statSync } from "node:fs";
import { dirname, resolve as resolverCaminho } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = resolverCaminho(dirname(fileURLToPath(import.meta.url)), "..");

/** É arquivo mesmo? `existsSync` diz sim para diretório, e aí o import falha. */
function ehArquivo(caminho) {
  try {
    return statSync(caminho).isFile();
  } catch {
    return false;
  }
}

/**
 * A ordem importa e é a do TypeScript: caminho exato primeiro, depois as
 * extensões, depois o `index`. Inverter faria `./x` achar `./x/index.ts`
 * mesmo existindo `./x.ts`.
 */
function candidatos(base) {
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`];
}

export async function resolve(especificador, contexto, proximo) {
  let base = null;

  if (especificador.startsWith("@/")) {
    base = resolverCaminho(RAIZ, especificador.slice(2));
  } else if (especificador.startsWith(".") && contexto.parentURL?.startsWith("file:")) {
    // O cache-buster que os conferidores usam para reimportar um módulo
    // com outra env (`?off=123`) não é parte do caminho no disco.
    const semQuery = especificador.split("?")[0];
    base = resolverCaminho(dirname(fileURLToPath(contexto.parentURL)), semQuery);
  }

  if (base) {
    for (const tentativa of candidatos(base)) {
      if (ehArquivo(tentativa)) {
        const query = especificador.includes("?") ? "?" + especificador.split("?")[1] : "";
        return { url: pathToFileURL(tentativa).href + query, shortCircuit: true };
      }
    }
  }

  // Pacote do `node_modules`, `node:` builtin, ou caminho que já resolve
  // sozinho: o Node sabe fazer, e fazer melhor.
  try {
    return await proximo(especificador, contexto);
  } catch (erro) {
    // ============================================================
    // O MAPA DE `exports` DO NEXT NÃO COBRE ESTA CONDIÇÃO.
    //
    // `import { revalidatePath } from "next/cache"` funciona dentro do
    // build do Next e falha aqui com ERR_MODULE_NOT_FOUND — o próprio
    // Node sugere `next/cache.js`. Não é import errado: é subentry que só
    // existe sob as condições que o Next passa e nós não.
    //
    // Tentar de novo com `.js` é o que destrava importar uma Server
    // Action neste processo. Só para subentry de pacote, e só depois de o
    // Node ter recusado — nada que já resolve passa por aqui.
    // ============================================================
    if (
      erro?.code === "ERR_MODULE_NOT_FOUND" &&
      !especificador.startsWith(".") &&
      !especificador.startsWith("node:") &&
      especificador.includes("/") &&
      !especificador.endsWith(".js")
    ) {
      return proximo(`${especificador}.js`, contexto);
    }
    throw erro;
  }
}
