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
  enviarCadastro,
  ESTADOS_DE_EXECUCAO,
  type Cadastrado,
  type EstadoExecucao,
  type StatusRecebido,
} from "./cadastro";
export {
  MENSAGEM_GENERICA_BACKEND,
  type CategoriaErro,
  type FalhaBackend,
  type Resultado,
} from "./erros";
export {
  formatarConfianca,
  listarEmRevisao,
  type ConfiancaDeAgente,
  type ExecucaoEmRevisao,
} from "./execucoes";

/**
 * `GET /campanhas/pre-requisitos` — read-only, e **já funciona**.
 *
 * Ficou guardado um tempo porque a rota não estava no deploy (404). Ela
 * subiu: medido em 19/08/2026, responde 200, com os dois controles
 * negativos que dão sentido ao 200 — token inválido devolve 401, e rota
 * inexistente com token válido devolve 404. Registro em
 * `docs/disparo-pipeline.md` §0.1.
 *
 * UMA RESSALVA AO USAR: `Prevoo.tem_whatsapp` é `boolean` com
 * `default: false` no schema publicado, **sem `null`**. Nosso
 * `temWhatsapp: boolean | null` continua certo como tipo, mas contra
 * este backend o `null` nunca acontece — então um cliente cujo WhatsApp
 * a Meta não soube informar chega aqui como `false`, indistinguível de
 * "verificamos e não tem". É o bug do `oauth-meta.md` §2.1 de novo, e o
 * conserto é do lado do backend. Não trate o `false` desta rota como
 * negativa dura numa tela.
 */
export {
  consultarPreRequisitos,
  type FiltrosPreRequisitos,
  type PreRequisitos,
} from "./pre-requisitos";
