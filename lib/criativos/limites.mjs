/**
 * OS LIMITES DO ENVIO DE PEÇA — a fonte única dos três números.
 *
 * ============================================================
 * POR QUE ESTE ARQUIVO EXISTE. Medido em 12/09/2026.
 *
 * A `/criativos` ficava carregando para sempre quando o cliente subia
 * foto do celular. A causa: o limite de corpo de Server Action do Next é
 * **1 MB** quando não configurado, e a validação do navegador não tinha
 * teto de tamanho nenhum. Foto de celular tem 2 a 8 MB — ela passava da
 * validação, estourava no Next, e a promessa rejeitava.
 *
 * O conserto exige dois números que **precisam concordar**: o teto do
 * servidor (`next.config.ts`) e o teto do navegador (`envio.ts`). Dois
 * números iguais em dois arquivos é exatamente a forma de defeito que
 * `lib/verba/limites.ts` existe para não ter — lá, três telas julgavam a
 * mesma coluna com regras diferentes e só a publicação recusava, depois
 * de o pipeline inteiro ter rodado.
 *
 * Então há UM número, e o do navegador é DERIVADO dele. Não dá para
 * mudar um e esquecer o outro: o segundo não existe como literal.
 * ============================================================
 *
 * ESTE MÓDULO NÃO PODE IMPORTAR NADA DE SERVIDOR. Ele é lido pelo
 * `next.config.ts` (que roda antes de existir aplicação) e pelo
 * componente de cliente da tela. É só número e aritmética, de propósito —
 * a mesma regra do `lib/verba/limites.ts`.
 
 * ============================================================
 * POR QUE `.mjs` E NÃO `.ts`, e a tentativa que falhou antes.
 *
 * O `next.config` precisa deste número, e ele é carregado pelo Node
 * ANTES de existir bundler. Tentei `next.config.ts` (o Next 16 aceita, e
 * transpila com bundler): falhou com `exports is not defined in ES
 * module scope` — o transpilador emite CommonJS e o projeto é ESM.
 *
 * Então os VALORES moram aqui, em `.mjs`, que o `next.config.mjs`
 * importa sem cerimônia. Os TIPOS ficam em `limites.d.mts` ao lado —
 * `allowJs` é falso no `tsconfig`, e sem a declaração o TypeScript
 * recusaria o import.
 *
 * A dívida que isso cria, declarada: tipo e valor em dois arquivos. Ela
 * é pequena (são seis números) e o `conferir:analise` §1 confere que a
 * declaração cobre tudo que o módulo exporta.
 * ============================================================
 */

const MB = 1024 * 1024;

/**
 * O TETO DO SERVIDOR: 10 MB.
 *
 * Decisão do Victor, 12/09/2026: **o produto pede a foto original**, e o
 * padrão de 1 MB do Next recusa quase toda foto de celular. Subir é
 * coerente com o que a tela pede ("do tamanho original — sem reduzir
 * para mandar").
 *
 * Vira `experimental.serverActions.bodySizeLimit` no `next.config.ts`.
 * Não é enfeite: o Next recusa o corpo ANTES de a action rodar, e a
 * recusa dele não passa pelo nosso tratamento de falha.
 */
export const TETO_DO_SERVIDOR_BYTES = 10 * MB;

/**
 * A FOLGA ENTRE OS DOIS TETOS: 1 MB.
 *
 * ============================================================
 * O QUE O NEXT CONTA NÃO É O ARQUIVO — É O CORPO DA REQUISIÇÃO.
 *
 * O `FormData` de um Server Action vai como `multipart/form-data`, e o
 * corpo carrega, além dos bytes do arquivo: o delimitador repetido a
 * cada parte, os cabeçalhos de cada parte (`Content-Disposition`,
 * `Content-Type`, o nome do arquivo), e o payload do próprio protocolo
 * de action.
 *
 * Para um arquivo binário isso é pouco — algumas centenas de bytes, uns
 * 0,02%. **A folga não existe por causa disso.** Ela existe porque o
 * formulário vai ganhar campo: no dia em que alguém acrescentar um
 * `<input name="observacao">` ou um segundo arquivo, o corpo cresce e
 * ninguém vai voltar aqui refazer a conta.
 *
 * 1 MB é folga grosseira de propósito. Ela custa 10% do teto e compra
 * que a conta continue certa sem manutenção.
 * ============================================================
 */
export const FOLGA_DO_CORPO_BYTES = 1 * MB;

/**
 * O TETO DO NAVEGADOR: 9 MB. **Derivado, não digitado.**
 *
 * É aqui que a recusa acontece — antes de qualquer upload. Quem sobe
 * foto pelo celular no 4G não pode esperar o upload de 9 MB para ler que
 * não serve.
 */
export const TETO_DO_NAVEGADOR_BYTES = TETO_DO_SERVIDOR_BYTES - FOLGA_DO_CORPO_BYTES;

/** O teto do servidor como o `next.config.ts` quer: `"10mb"`. */
export const TETO_DO_SERVIDOR_TEXTO = `${TETO_DO_SERVIDOR_BYTES / MB}mb`;

/** Quantos MB, para a tela escrever sem fazer conta. */
export const TETO_DO_NAVEGADOR_MB = Math.floor(TETO_DO_NAVEGADOR_BYTES / MB);

/**
 * Quanto o BACKEND leva, no pior caso, para responder a análise.
 *
 * ============================================================
 * É CÓPIA DE `TIMEOUTS.compliance`, E A CÓPIA TEM MOTIVO.
 *
 * O original mora em `lib/backend/cliente.ts`, que abre com
 * `import "server-only"` — importá-lo aqui quebraria o bundle do
 * componente de cliente, que é justamente quem precisa do número.
 *
 * Cópia que precisa concordar é dívida, então ela não fica no escuro:
 * `pnpm conferir:analise` lê os dois arquivos e reprova se divergirem.
 * ============================================================
 */
export const ESPERA_DO_BACKEND_MS = 300_000;

/**
 * O TETO DA ESPERA NA TELA: 6 minutos. **Derivado.**
 *
 * ============================================================
 * ELE TEM QUE SER MAIOR QUE O DO BACKEND, E A MARGEM NÃO É ENFEITE.
 *
 * Se a tela desistisse antes dos 300 s, ela abandonaria uma análise que
 * ia responder — e o cliente veria "não deu" sobre um trabalho que deu.
 *
 * A margem de 60 s cobre o que acontece ANTES de o relógio do backend
 * começar: o upload de até 9 MB (no 4G, dezenas de segundos), a
 * serialização do action e a ida até o servidor. Sem ela, um upload
 * lento consumiria o orçamento da própria análise.
 *
 * Este teto é a ÚLTIMA porta: ele existe para a promessa que não resolve
 * **nem rejeita** — rede que some sem fechar a conexão, aba suspensa
 * pelo iOS. Falha comum não chega aqui; ela vira `{ok:false}` muito
 * antes.
 * ============================================================
 */
export const TETO_DA_ESPERA_MS = ESPERA_DO_BACKEND_MS + 60_000;
