import "server-only";
import { enviarArquivos, TIMEOUTS } from "./cliente";
import { falha, registrarErroBackend, type Resultado } from "./erros";

/**
 * O que o CLIENTE manda: as fotos do negócio e o criativo pronto.
 *
 * ============================================================
 * DUAS ROTAS, DOIS SIGNIFICADOS. Não são a mesma coisa com nomes
 * diferentes.
 *
 *   /fotos               matéria-prima. O gerador usa para CRIAR a peça
 *   /criativos-enviados  a peça pronta. Não passa pelo gerador
 *
 * O que decide qual usar é a `OrigemDoCriativo` do contrato — `gerar`,
 * `enviar` ou `publicacao` —, e ela é escolhida no começo da call.
 * Mandar foto para a rota errada não dá erro: dá uma campanha com a
 * matéria-prima no lugar do anúncio.
 * ============================================================
 *
 * ============================================================
 * `criativo-pronto` NÃO EXISTE NA API PUBLICADA. Medido em 10/09/2026.
 *
 * O briefing descreve `POST /execucoes/{id}/criativo-pronto`, devolvendo
 * `motivo` e `achados_tecnicos`. O `openapi.json` de produção não a tem —
 * o que existe é `criativos-enviados`, que devolve `recebidos`,
 * `recusados` e `videos`.
 *
 * Então `enviarCriativoPronto()` aponta para a rota que EXISTE, e a
 * leitura da recusa fica isolada em `lib/criativos/envio.ts`
 * (`textoDaRecusaDoBackend`) — quando a rota nova subir, muda o caminho e
 * o campo lido, e nada mais.
 * ============================================================
 */

const CONTEXTO_FOTOS = "fotos-do-cliente";
const CONTEXTO_CRIATIVOS = "criativos-enviados";
const CONTEXTO_ANALISE = "analise-de-peca";

/** Um arquivo que o backend aceitou e gravou. */
export interface ArquivoAceito {
  tipo: string;
  storagePath: string;
  tamanhoBytes: number;
  urlAssinada: string;
}

export interface ResultadoDoEnvio {
  idExecucao: string;
  status: string;
  aceitos: ArquivoAceito[];
  /** Nomes que o backend recusou. */
  recusados: string[];
  /** Quantos vídeos vieram e foram descartados. Só `criativos-enviados`. */
  videos: number;
}

function texto(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function validarArquivo(bruto: unknown): ArquivoAceito | null {
  if (!bruto || typeof bruto !== "object") return null;
  const o = bruto as Record<string, unknown>;
  const storagePath = texto(o.storage_path);
  const urlAssinada = texto(o.url_assinada);
  if (!storagePath || !urlAssinada) return null;
  return {
    tipo: texto(o.tipo) ?? "",
    storagePath,
    urlAssinada,
    tamanhoBytes: typeof o.tamanho_bytes === "number" ? o.tamanho_bytes : 0,
  };
}

/**
 * A fronteira das duas respostas — elas têm a mesma forma no que importa.
 *
 * `recusados` vem como lista de NOMES, e é o que a tela mostra. Um item
 * ilegível na lista de aceitos é descartado em vez de derrubar a resposta:
 * o cliente subiu cinco fotos, e uma linha torta não pode fazer as outras
 * quatro sumirem da tela.
 */
function validarResposta(bruto: unknown, chaveDosAceitos: "fotos" | "recebidos"): ResultadoDoEnvio | null {
  if (!bruto || typeof bruto !== "object") return null;
  const o = bruto as Record<string, unknown>;

  const idExecucao = texto(o.id_execucao);
  const status = texto(o.status);
  if (!idExecucao || !status) return null;

  const brutos = Array.isArray(o[chaveDosAceitos]) ? (o[chaveDosAceitos] as unknown[]) : [];
  const recusados = Array.isArray(o.recusados)
    ? (o.recusados as unknown[]).map((r) => texto(r)).filter((r): r is string => r !== null)
    : [];

  return {
    idExecucao,
    status,
    aceitos: brutos.map(validarArquivo).filter((a): a is ArquivoAceito => a !== null),
    recusados,
    videos: typeof o.videos === "number" ? o.videos : 0,
  };
}

/**
 * `POST /execucoes/{id}/fotos` — a matéria-prima do gerador.
 *
 * `logo` é opcional e vai em campo próprio: o backend a trata diferente
 * das fotos, e mandá-la no meio delas a faria virar cenário de anúncio.
 */
export async function enviarFotosDoNegocio(args: {
  idExecucao: string;
  fotos: File[];
  logo?: File | null;
}): Promise<Resultado<ResultadoDoEnvio>> {
  const corpo = new FormData();
  for (const f of args.fotos) corpo.append("fotos", f, f.name);
  if (args.logo) corpo.append("logo", args.logo, args.logo.name);

  const resposta = await enviarArquivos(
    `/execucoes/${encodeURIComponent(args.idExecucao)}/fotos`,
    corpo,
    { contexto: CONTEXTO_FOTOS },
  );
  if (!resposta.ok) return resposta;

  const validado = validarResposta(resposta.dados, "fotos");
  if (!validado) {
    registrarErroBackend(CONTEXTO_FOTOS, {
      metodo: "POST",
      caminho: "/execucoes/{id}/fotos",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }
  return { ok: true, dados: validado };
}

/**
 * `POST /execucoes/{id}/criativos-enviados` — a peça que o cliente já tem.
 *
 * ============================================================
 * O `videos` DA RESPOSTA NÃO É ERRO — É CONTAGEM.
 *
 * O backend descarta vídeo e diz quantos descartou. A tela precisa desse
 * número para dizer "os dois vídeos não entraram" em vez de deixar a
 * pessoa achando que subiu tudo.
 *
 * E é a segunda linha de defesa: a primeira é o `accept` do input, em
 * `lib/criativos/envio.ts`. Se este número vier maior que zero, a
 * primeira falhou.
 * ============================================================
 */
export async function enviarCriativoPronto(args: {
  idExecucao: string;
  arquivos: File[];
}): Promise<Resultado<ResultadoDoEnvio>> {
  const corpo = new FormData();
  for (const f of args.arquivos) corpo.append("arquivos", f, f.name);

  const resposta = await enviarArquivos(
    `/execucoes/${encodeURIComponent(args.idExecucao)}/criativos-enviados`,
    corpo,
    { contexto: CONTEXTO_CRIATIVOS },
  );
  if (!resposta.ok) return resposta;

  const validado = validarResposta(resposta.dados, "recebidos");
  if (!validado) {
    registrarErroBackend(CONTEXTO_CRIATIVOS, {
      metodo: "POST",
      caminho: "/execucoes/{id}/criativos-enviados",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }
  return { ok: true, dados: validado };
}

/** O que a ANÁLISE devolve — e só o que a tela do dono pode ver. */
export interface AnaliseDaPeca {
  idExecucao: string;
  /** o que o backend gravou */
  aceitos: ArquivoAceito[];
  /** nomes que não entraram */
  recusados: string[];
  /**
   * O veredito CRU, como veio. `null` = nenhum arquivo aceito, então não
   * houve o que julgar. Quem traduz é `lib/criativos/veredito.ts`, e ele
   * trata valor desconhecido como neutro — nunca como ausência.
   */
  veredito: string | null;
  /** no máximo 3, escritos pelo backend para o DONO. Repassados como vieram. */
  motivos: string[];
  /** a recusa escrita para o dono, quando o gate barrou */
  motivo: string | null;
}

/**
 * `POST /execucoes/{id}/criativo-pronto` — a peça que o cliente já tem,
 * para ANÁLISE.
 *
 * ============================================================
 * NÃO É A `enviarCriativoPronto` ACIMA, E O NOME DELA ENGANA.
 *
 * Aquela aponta para `/criativos-enviados`, que é a peça ENTRANDO na
 * campanha. Esta aponta para `/criativo-pronto`, que é a peça sendo
 * ANALISADA. São duas rotas, dois significados, e as duas continuam
 * necessárias — mandar para a errada não dá erro: dá uma campanha com a
 * matéria-prima no lugar do anúncio.
 *
 * O nome daqui diz o que ela faz: `analisar`.
 * ============================================================
 *
 * ============================================================
 * TRÊS CAMPOS DA RESPOSTA NÃO ATRAVESSAM ESTA FUNÇÃO.
 *
 *   `custo_usd`         quanto a chamada custou. É contabilidade nossa.
 *   `descricao`         o que o modelo viu. É raciocínio de máquina.
 *   `achados_tecnicos`  regra de plataforma e gravidade — para o gestor.
 *
 * Eles não são filtrados na tela: **não saem daqui**. A diferença
 * importa, porque filtro em componente é filtro que a próxima tela
 * esquece. Aqui, quem quiser expor um deles tem que vir mudar o tipo.
 *
 * A mesma trava que `textoDaRecusaDoBackend` já tem: um argumento só,
 * aridade conferida em `conferir-envio.ts`.
 * ============================================================
 */
export async function analisarCriativoPronto(args: {
  idExecucao: string;
  arquivos: File[];
}): Promise<Resultado<AnaliseDaPeca>> {
  const corpo = new FormData();
  for (const f of args.arquivos) corpo.append("arquivos", f, f.name);

  const resposta = await enviarArquivos(
    `/execucoes/${encodeURIComponent(args.idExecucao)}/criativo-pronto`,
    corpo,
    { contexto: CONTEXTO_ANALISE, timeoutMs: TIMEOUTS.compliance },
  );
  if (!resposta.ok) return resposta;

  const bruto = resposta.dados;
  if (!bruto || typeof bruto !== "object") {
    registrarErroBackend(CONTEXTO_ANALISE, {
      metodo: "POST",
      caminho: "/execucoes/{id}/criativo-pronto",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }
  const o = bruto as Record<string, unknown>;

  const idExecucao = texto(o.id_execucao);
  if (!idExecucao) {
    registrarErroBackend(CONTEXTO_ANALISE, {
      metodo: "POST",
      caminho: "/execucoes/{id}/criativo-pronto",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }

  const lista = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => texto(x)).filter((x): x is string => x !== null) : [];

  return {
    ok: true,
    dados: {
      idExecucao,
      aceitos: (Array.isArray(o.recebidos) ? o.recebidos : [])
        .map(validarArquivo)
        .filter((a): a is ArquivoAceito => a !== null),
      recusados: lista(o.recusados),
      // Sem lista branca de valores: `veredito` é `string | null` no
      // contrato, sem enum. Quem decide o que fazer com um valor novo é
      // `lib/criativos/veredito.ts`, e a decisão dele é "mostra mesmo
      // assim". Reprovar aqui recriaria a porteira que o `nivel` pagou.
      veredito: texto(o.veredito),
      // O teto de 3 é do contrato (`maxItems: 3`). Cortar aqui é barato e
      // evita que um backend generoso empurre quinze linhas na tela.
      motivos: lista(o.motivos).slice(0, 3),
      motivo: texto(o.motivo),
    },
  };
}
