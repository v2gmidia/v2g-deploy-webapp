import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  andamentoDaExecucao,
  type ExecucaoDoCliente,
} from "./relogios";

/**
 * A execução do cliente — DUAS COLUNAS, e é de propósito.
 *
 * Desenho em `docs/tela-processando.md` §4. Leia antes de acrescentar uma
 * coluna aqui.
 *
 * ============================================================
 * ESTA LEITURA IGNORA RLS, E O QUE SUBSTITUI A REDE É O PARÂMETRO.
 *
 * `execucoes` está em `default deny` (RLS ligada, zero políticas — ver
 * `0018_disparo_do_pipeline.sql`), e o `service_role` é o único jeito de
 * alcançá-la. Diferente da `./vigilancia.ts`, aqui quem chama é caminho
 * de CLIENTE, então a pergunta "de quem é esta linha?" tem que ter
 * resposta.
 *
 * A resposta não é um `if`. É o parâmetro: `businessId` vem do `select`
 * que o `lib/estado/cliente.ts` já faz sob RLS, com
 * `.eq("profile_id", user.id)`. Não existe caminho para um id alheio
 * porque não existe superfície que aceite um — nenhum `page.tsx` importa
 * este módulo, nenhuma Server Action recebe o id de formulário. É a mesma
 * disciplina do `docs/disparo-pipeline.md` §6.1: o passo "confere o dono"
 * não é um `if` que alguém pode esquecer, é a ausência de um caminho.
 *
 * **Quem chamar isto com um id que não veio de leitura sob RLS quebra a
 * única garantia que este arquivo tem.**
 * ============================================================
 *
 * POR QUE NÃO ABRIR RLS E ACABAR COM ISSO. Porque não resolveria: RLS
 * decide LINHA, e o problema de `execucoes` é COLUNA. Uma política
 * `using (private.owns_business(business_id))` responderia "esta execução
 * é dele?" corretamente — e entregaria as sete colunas jsonb junto. O
 * argumento inteiro está em `docs/auditoria-resultados.md` §4, com o
 * texto de cada coluna na mão.
 */

/** `select` sem `*`. As duas colunas, escritas à mão, e nada além. */
const COLUNAS_QUE_O_CLIENTE_PODE_VER = "status, atualizado_em";

/** Um UUID e nada mais — ver `filtroDeDono()`. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * O filtro das DUAS marcas, montado só depois de conferir a forma do id.
 *
 * `.or()` do PostgREST recebe string, e string montada com interpolação é
 * onde injeção mora. Hoje o `businessId` vem de um `select` do nosso
 * próprio banco e não há o que injetar — a conferência existe para o dia
 * em que alguém chamar isto de outro lugar sem ler o cabeçalho.
 */
function filtroDeDono(businessId: string): string | null {
  if (!UUID.test(businessId)) return null;
  return `business_id.eq.${businessId},cliente_id.eq.${businessId}`;
}

/**
 * A execução mais recente do negócio, ou `null`.
 *
 * `null` significa TRÊS coisas que esta função não distingue, e todas as
 * três levam a cadeia a se comportar exatamente como antes deste lote:
 * nunca disparou, disparou e a linha ainda não nasceu, ou não consegui
 * ler. Quem precisar da diferença é o operador, e ele tem a
 * `./vigilancia.ts`.
 *
 * `agora` é PARÂMETRO, como em todo o resto da cadeia: é o que torna o
 * corte de tempo testável sem esperar o tempo passar.
 */
export async function execucaoDoCliente(
  businessId: string,
  agora: Date,
): Promise<ExecucaoDoCliente | null> {
  const filtro = filtroDeDono(businessId);
  if (!filtro) {
    console.error("[execucao] businessId não é uuid; leitura recusada");
    return null;
  }

  // O `createAdminClient` LANÇA quando falta a chave no ambiente, e quem
  // chama esta função é o `/inicio`. Uma env ausente derrubando a tela
  // inicial do cliente inteiro, por causa de um campo que só muda uma
  // frase, é troca ruim: sem execução a cadeia diz o que sempre disse.
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[execucao] cliente admin indisponível ::", (e as Error).message);
    return null;
  }

  const { data, error } = await admin
    .from("execucoes")
    .select(COLUNAS_QUE_O_CLIENTE_PODE_VER)
    // As DUAS marcas. `business_id` é o vínculo que a gente escreve depois
    // da resposta; `cliente_id` é o eco do que mandamos na ida. Uma
    // execução cuja resposta se perdeu no timeout tem só o eco — é o caso
    // que a camada 2 do `docs/disparo-pipeline.md` §4.2 existe para pegar.
    .or(filtro)
    // Um negócio pode acumular execuções ao longo do tempo. A mais nova é
    // a que descreve o presente; decidir por `limit 1` sem ordenar seria
    // apostar que a tabela só tem uma.
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[execucao] falha ao ler a execução ::", error.message);
    return null;
  }
  if (!data) return null;

  const linha = data as unknown as { status: string | null; atualizado_em: string | null };
  const status = linha.status ?? "(sem status)";

  return {
    status,
    atualizadoEm: linha.atualizado_em,
    andamento: andamentoDaExecucao(status, linha.atualizado_em, agora),
  };
}
