import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarPaginas } from "@/lib/meta/graph";
import { registrarErroMeta } from "@/lib/meta/erros";
import {
  consultarPreRequisitos,
  type PreRequisitos,
  type Resultado,
} from "@/lib/backend";

/**
 * O que o pré-voo precisa de um cliente Supabase — só `from`.
 *
 * Tipado assim, e não com o tipo do `@supabase/ssr`, porque os dois
 * clientes que entram aqui (o da sessão e o admin) têm o mesmo `from` e
 * tipos nominais diferentes. O cliente deste repositório não usa tipos
 * gerados (ver CLAUDE.md), então `any` já é o que os dois devolvem — o
 * que esta linha acrescenta é a DECLARAÇÃO de que só `from` é usado.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { from: (tabela: string) => any };

/** A forma que o `select` de `ad_accounts` devolve, aqui. */
interface LinhaDeConta {
  id: string;
  external_id: unknown;
  name: unknown;
}

/**
 * O PRÉ-VOO: de onde este anúncio sai, e se a subida está liberada.
 *
 * Desenho e medições em `docs/estado/pre-voo-no-aprovar-15-09.md`.
 *
 * ============================================================
 * SÓ LEITURA. Nada aqui escreve — nem no nosso banco, nem na Meta, nem no
 * backend. A rota consultada (`GET /campanhas/pre-requisitos`) diz de si
 * mesma "Nao escreve", e o cliente dela repete o motivo: é seguro chamar
 * quantas vezes quiser, inclusive para montar tela.
 *
 * NÃO É O DISPARO DA CAMPANHA. `POST /campanhas` não é chamado daqui e não
 * deve passar a ser sem a decisão que está parada: as execuções em
 * `estrutura_pronta` nascem sem `business_id`, e sem esse vínculo não há
 * dono para conferir antes de gastar dinheiro de terceiro. Ver
 * `docs/backend-integracao.md` §1.
 * ============================================================
 *
 * A REGRA QUE FAZ ISTO DURAR: **a tela não decide o que é o pré-voo.** Ela
 * recebe o estado resolvido e escreve a frase. Se a `/aprovar` e uma tela
 * futura lerem a mesma coisa de dois lugares, elas vão discordar — é o que
 * já aconteceu entre a `/aprovar` e a cadeia do `/inicio`
 * (`docs/buraco-aprovar-sem-filtro.md`).
 *
 * TUDO SOB RLS, com uma exceção nomeada: o `obter_token_meta`, que só a
 * `service_role` executa e que existe para descobrir o NOME da Página. As
 * três tabelas lidas aqui (`meta_connections`, `ad_accounts`, `campaigns`)
 * têm política de `select` por `owns_business`, então o cliente normal
 * basta — e o `businessId` que chega no admin sai do `select` que já rodou
 * sob RLS logo acima. Quem mudar a ordem dessas leituras quebra isso.
 */

export interface ContaDoNegocio {
  externalId: string;
  nome: string;
}

/**
 * A conta que a campanha vai usar — ou a AUSÊNCIA de marca, que é o estado
 * normal hoje.
 *
 * ============================================================
 * NÃO EXISTE "A CONTA ESCOLHIDA" ENQUANTO NÃO HÁ CAMPANHA.
 *
 * Medido em 15/09/2026: o negócio conectado tem TRÊS contas ativas, e
 * nenhuma coluna diz qual vale. A única marca de escolha no schema é
 * `campaigns.ad_account_id`, e `campaigns` tem zero linhas — então hoje a
 * resposta honesta é a lista, não um nome.
 *
 * DECISÃO DO VICTOR, 15/09/2026: **nada de regra "a mais recente"**. O
 * `updated_at` mais novo é ordem de gravação, não registro de escolha, e
 * uma tela que dissesse "Conta de anúncio: V2G CONTA" por causa dele
 * estaria afirmando uma decisão que ninguém tomou.
 *
 * O `verba/actions.ts` chegou na mesma conclusão por outro caminho, e por
 * isso pega o MENOR piso entre as contas: "qual conta a campanha vai usar
 * só se decide quando a campanha existe".
 * ============================================================
 */
export type ContaDeAnuncio =
  | { marcada: true; conta: ContaDoNegocio }
  | { marcada: false; contas: ContaDoNegocio[] };

export interface PaginaConectada {
  id: string;
  /**
   * `null` é "não deu para ler o nome na Meta agora" — **não** é "não tem
   * nome". A distinção importa porque a tela escreve frases diferentes, e
   * um `?? ""` aqui faria ela afirmar o que não verificou.
   */
  nome: string | null;
}

export interface PreVoo {
  temNegocio: boolean;
  /** `null` = nenhuma página escolhida ainda. */
  pagina: PaginaConectada | null;
  /**
   * `true` = não deu para LER a conexão. Diferente de não ter conexão, e a
   * tela precisa das duas: um estado vazio no lugar deste diria ao cliente
   * que ele não tem página quando o que houve foi a gente não conseguir
   * olhar. Mesma distinção da `/conta` (§ do `conta/page.tsx`).
   */
  conexaoIlegivel: boolean;
  /** `null` = sem negócio. */
  conta: ContaDeAnuncio | null;
  /**
   * `null` = sem negócio, ou sem página para consultar. O `Resultado`
   * carrega a falha já traduzida: a resposta crua da FastAPI nunca chega à
   * tela (`lib/backend/erros.ts`).
   */
  preRequisitos: Resultado<PreRequisitos> | null;
}

const VAZIO: PreVoo = {
  temNegocio: false,
  pagina: null,
  conexaoIlegivel: false,
  conta: null,
  preRequisitos: null,
};

/**
 * NÃO RECEBE IDENTIFICADOR DE FORA. Descobre o negócio pela sessão, como o
 * `dispararSeCompleto()` — não existe `businessId` de formulário ou de URL
 * para alguém forjar, porque não existe parâmetro para passá-lo. A
 * verificação de dono não é um `if` que dá para esquecer; é a ausência de
 * um caminho para errar.
 *
 * NUNCA LANÇA. É chamada no desenho de uma tela, e uma exceção aqui
 * derrubaria a `/aprovar` inteira — inclusive a peça que o cliente precisa
 * ver. O `createAdminClient()` lança quando falta a chave de servidor, e
 * foi exatamente isso que virou 500 na `/conta` em 02/09: o `try` cobre a
 * CRIAÇÃO do cliente, não só a chamada à Meta.
 */
export async function preVooDoNegocio(): Promise<PreVoo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return VAZIO;

  const { data: negocio } = await supabase
    .from("businesses")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!negocio) return VAZIO;

  return preVooPorNegocio(negocio.id, supabase);
}

/**
 * O MESMO PRÉ-VOO, para um negócio que NÃO é o da sessão.
 *
 * ============================================================
 * POR QUE ISTO É UMA EXTRAÇÃO, E NÃO UM SEGUNDO PRÉ-VOO.
 *
 * O bloco do topo deste arquivo diz: "a tela não decide o que é o
 * pré-voo […] Se a `/aprovar` e uma tela futura lerem a mesma coisa de
 * dois lugares, elas vão discordar — é o que já aconteceu entre a
 * `/aprovar` e a cadeia do `/inicio`."
 *
 * A tela do operador é exatamente essa "tela futura". Ela precisa do
 * pré-voo de um negócio que não é dela, e a tentação era escrever uma
 * consulta parecida do lado de lá. Em vez disso o corpo saiu daqui
 * inteiro e as duas entradas chamam o MESMO código: `preVooDoNegocio()`
 * resolve o negócio pela sessão, esta resolve por id.
 *
 * QUEM CHAMA ESTA É RESPONSÁVEL PELA AUTORIZAÇÃO. Ela não pergunta quem
 * é você — recebe um `negocioId` e responde sobre ele. O único chamador
 * hoje é a ação do operador, que confere `papel === "operador"` antes, e
 * está declarada em `lib/seguranca/excecoes.ts`.
 *
 * O `cliente` entra como parâmetro porque o operador NÃO POSSUI o
 * negócio: sob RLS normal (`owns_business`) ele não enxerga nenhuma
 * dessas linhas, e a função devolveria vazio como se o cliente não
 * tivesse nada. Ele passa o cliente admin; o dono passa o dele.
 * ============================================================
 */
export async function preVooPorNegocio(
  negocioId: string,
  cliente: SupabaseLike,
): Promise<PreVoo> {
  const supabase = cliente;
  const negocio = { id: negocioId };

  // As três saem juntas: são independentes entre si e todas dependem só do
  // `negocio.id`, que já está na mão.
  const [respConexao, respContas, respMarca] = await Promise.all([
    supabase
      .from("meta_connections")
      .select("meta_page_id, status")
      .eq("business_id", negocio.id)
      .maybeSingle(),
    supabase
      .from("ad_accounts")
      .select("id, external_id, name")
      .eq("business_id", negocio.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    // A MARCA DE ESCOLHA, e a única que existe no schema. `not is null`
    // porque a coluna é anulável: campanha sem conta escolhida não marca
    // nada, e trazê-la faria o `find` abaixo não achar e o código concluir
    // "sem marca" pelo motivo errado.
    supabase
      .from("campaigns")
      .select("ad_account_id")
      .eq("business_id", negocio.id)
      .not("ad_account_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // A anotação existe porque `from()` passou a devolver `any` (ver
  // `SupabaseLike`): sem ela o `.find()` logo abaixo fica com parâmetro
  // implícito e o `tsc` reprova. É a forma que o `select` acima pede.
  const linhasDeConta: LinhaDeConta[] = respContas.data ?? [];
  const nomeDaConta = (linha: { external_id: unknown; name: unknown }): ContaDoNegocio => ({
    externalId: String(linha.external_id),
    nome: (typeof linha.name === "string" ? linha.name.trim() : "") || String(linha.external_id),
  });

  const idMarcado = respMarca.data?.ad_account_id ?? null;
  const linhaMarcada = idMarcado ? linhasDeConta.find((c) => c.id === idMarcado) : undefined;

  const conta: ContaDeAnuncio = linhaMarcada
    ? { marcada: true, conta: nomeDaConta(linhaMarcada) }
    : { marcada: false, contas: linhasDeConta.map(nomeDaConta) };

  const paginaId = respConexao.data?.meta_page_id ?? null;

  // ---------- o nome da Página ----------
  //
  // O id está no nosso banco; o NOME só existe na Meta. É o mesmo caminho
  // da `/conta`: token do Vault pela `service_role`, `listarPaginas`, e
  // casa pelo id guardado.
  //
  // Falhar aqui deixa `nome: null` e nada mais — o id continua conhecido, a
  // conta do cliente não mudou, e a tela diz que não conseguiu ler o nome.
  // Marcar a conexão como ilegível neste caso seria exagerar a ignorância:
  // a gente sabe que existe página, só não sabe como ela se chama.
  let nome: string | null = null;
  if (paginaId && respConexao.data?.status === "connected") {
    try {
      const admin = createAdminClient();
      const { data: token } = await admin.rpc("obter_token_meta", {
        p_business_id: negocio.id,
      });
      if (token && typeof token === "string") {
        nome = (await listarPaginas(token)).find((p) => p.id === paginaId)?.nome ?? null;
      }
    } catch (erro) {
      registrarErroMeta("pre-voo:nome-da-pagina", erro);
      nome = null;
    }
  }

  // ---------- os requisitos de subida ----------
  //
  // `id_conta_anuncio` VAI SÓ QUANDO HÁ MARCA, e isto é medição, não
  // preciosismo: em 15/09/2026 a mesma rota, na mesma Página, devolveu
  // `ok: true` sem conta e `ok: false` com `act_880918131184584` (a Meta
  // recusa a conta por permissão). Mandar uma conta escolhida por palpite
  // faria o veredito da tela depender do palpite.
  const preRequisitos = paginaId
    ? await consultarPreRequisitos({
        idPagina: paginaId,
        ...(conta.marcada ? { idContaAnuncio: conta.conta.externalId } : {}),
      })
    : null;

  return {
    temNegocio: true,
    pagina: paginaId ? { id: paginaId, nome } : null,
    conexaoIlegivel: respConexao.error !== null,
    conta,
    preRequisitos,
  };
}
