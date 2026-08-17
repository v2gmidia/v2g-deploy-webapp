import "server-only";

/**
 * A porta de entrada do backend V2G.
 *
 * Importe daqui, não dos arquivos internos: quando o cliente mudar de
 * forma — POST, upload multipart, Realtime em vez de polling — quem
 * importou daqui não sente.
 *
 * NADA NESTE DIRETÓRIO PODE SER IMPORTADO DE COMPONENTE DE CLIENTE. Todo
 * arquivo tem `import "server-only"` e o build quebra se tentar. Ver
 * `docs/backend-integracao.md` para o motivo.
 */

export { backendConfigurado, saude, TIMEOUTS } from "./cliente";
export {
  MENSAGEM_GENERICA_BACKEND,
  type CategoriaErro,
  type FalhaBackend,
  type Resultado,
} from "./erros";
export {
  consultarPreRequisitos,
  type FiltrosPreRequisitos,
  type PreRequisitos,
} from "./pre-requisitos";
