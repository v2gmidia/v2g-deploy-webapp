/**
 * Faz o Node enxergar os imports do repositório — só para conferidor.
 *
 * ============================================================
 * POR QUE ISTO PRECISA EXISTIR, E POR QUE NÃO É GAMBIARRA.
 *
 * O `tsconfig` deste projeto usa duas coisas que o bundler resolve e o
 * Node não:
 *
 *   import { enviar } from "./cliente";          // sem extensão
 *   import { validar } from "@/lib/dia-seguinte/validar";  // alias
 *
 * Rodar `lib/backend/` em Node puro estoura em ERR_MODULE_NOT_FOUND na
 * primeira linha. Havia duas saídas: reescrever os imports de `lib/` para
 * a forma que o Node aceita, ou ensinar o Node a resolver como o bundler.
 *
 * A PRIMEIRA FOI RECUSADA de propósito. Mudar código de produção para um
 * teste conseguir importá-lo inverte quem serve a quem — e o risco não é
 * teórico: seriam dezenas de linhas em oito arquivos, num commit cujo
 * único motivo seria o teste. Um erro ali é um erro em produção, pago
 * para deixar um conferidor feliz.
 *
 * Este arquivo, ao contrário, não existe em produção. O `next build` não
 * o enxerga; só quem passa `--import` na linha de comando.
 * ============================================================
 *
 * Uso, junto de `--conditions=react-server`, que é o que destrava
 * `server-only`:
 *
 *   node --import ./scripts/resolvedor-de-imports.mjs --conditions=react-server x.ts
 *
 * ELE NÃO SUBSTITUI O TYPECHECK. É resolução de caminho, nada mais: se um
 * import estiver errado de verdade, quem acusa é o `tsc`.
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./resolvedor-hook.mjs", import.meta.url);

// Nada mais acontece aqui. O trabalho está no hook, que roda numa thread
// separada — é o contrato do `module.register` do Node.
void pathToFileURL;
