import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarCadastro } from "@/lib/backend/cadastro";
import { montarCadastro, type NegocioParaCadastro } from "@/lib/cadastro/montar";
import { COLUNAS_DO_CADASTRO } from "@/lib/cadastro/consultar";
import { MINUTOS_ATE_DESTRAVAR_DISPARO } from "./relogios";

/**
 * O disparo do pipeline. Desenho em `docs/disparo-pipeline.md`.
 *
 * ------------------------------------------------------------------
 * AS QUATRO INVARIANTES. Se for mexer aqui, não são sugestão.
 *
 *  1. NENHUM IDENTIFICADOR VEM DE FORA. Esta função não recebe
 *     `businessId` — nem de formulário, nem de URL, nem de parâmetro. Ela
 *     descobre pela sessão. A verificação de dono não é um `if` que dá
 *     para esquecer; é a ausência de um caminho para errar.
 *  2. NEGÓCIO FICTÍCIO NÃO DISPARA, e a checagem vem antes de tudo.
 *  3. IDEMPOTÊNCIA EM TRÊS CAMADAS — estado local, marca na ida, trava de
 *     concorrência. Todas as três.
 *  4. ELA NUNCA LANÇA. Quem chama é uma ação que acabou de salvar um
 *     campo do cliente; se o disparo explodir, o campo continua salvo e a
 *     tela não pode dizer que falhou. Ver `dispararSeCompleto`.
 *
 * A invariante que sustenta as outras é a 3: sem ela, um clique duplo
 * cria duas execuções, e execução criada pode ser consumida pelo n8n —
 * ou seja, custa dinheiro. Não é lixo para limpar como no `publicar.ts`,
 * onde tudo nasce PAUSED.
 * ------------------------------------------------------------------
 */

export type ResultadoDisparo =
  /** não havia o que fazer: sem sessão, sem negócio, ou cadastro incompleto */
  | { fez: "nada"; porque: string }
  /** o negócio está marcado como dados fictícios */
  | { fez: "recusou"; porque: "dados_ficticios" }
  /** outra chamada está no meio do disparo agora */
  | { fez: "nada"; porque: "ja_em_curso" }
  /** já tinha execução: reaproveitou em vez de criar uma segunda */
  | { fez: "reaproveitou"; idExecucao: string }
  | { fez: "criou"; idExecucao: string }
  | { fez: "falhou"; mensagem: string }
  /** a resposta se perdeu; a execução PODE existir. Reconcilia depois. */
  | { fez: "incerto" };

interface Negocio extends NegocioParaCadastro {
  dados_ficticios: boolean;
  cadastro_estado: string | null;
  cadastro_iniciado_em: string | null;
}

const COLUNAS =
  COLUNAS_DO_CADASTRO +
  ", dados_ficticios, cadastro_estado, cadastro_iniciado_em";

// ============================================================
// Camada 2 — reencontrar a execução que já existe
// ============================================================

/**
 * Procura uma execução deste negócio, pelas DUAS marcas.
 *
 * `business_id` é o vínculo, escrito por nós DEPOIS da resposta.
 * `cliente_id` é o eco do que mandamos na ida, escrito pelo backend
 * DURANTE a criação.
 *
 * A busca precisa das duas, e é por causa do caso que ela existe para
 * pegar: quando a resposta se perde, `business_id` está nulo — porque
 * quem o escreveria é justamente o código que nunca recebeu o id. Só a
 * marca de ida sobrevive a esse cenário.
 *
 * É esta função que revisou a decisão do `perfil-empresa.md` §4 de deixar
 * o `cliente_id` morrer. Ver `docs/disparo-pipeline.md` §4.2.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function acharExecucaoExistente(businessId: string): Promise<string | null> {
  // O `.or()` do PostgREST recebe uma STRING de filtro, então o valor é
  // concatenado em vez de parametrizado. Aqui ele vem do nosso próprio
  // `select` e é sempre um uuid — mas a checagem fica porque o dia em que
  // alguém passar outra coisa para esta função é o dia em que a
  // concatenação vira um problema, e ele não avisa antes.
  if (!UUID.test(businessId)) {
    throw new Error("businessId não é uuid");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("execucoes")
    .select("id, criado_em")
    .or(`business_id.eq.${businessId},cliente_id.eq.${businessId}`)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Falha na busca NÃO pode virar "não existe": concluir ausência a
    // partir de um erro de leitura faria o chamador criar uma segunda
    // execução. Lança, e quem chama trata como incerto.
    console.error("[pipeline] falha ao procurar execução ::", error.message);
    throw new Error("busca de execução falhou");
  }

  return data?.id ?? null;
}

/**
 * Escreve o vínculo. A única coluna de `execucoes` que o webapp escreve.
 *
 * Devolve se conseguiu, e quem chama PRECISA olhar: um negócio marcado
 * como `enviado` sem vínculo é uma execução órfã que a reconciliação
 * nunca mais visita — ela só roda em `enviando`. Ver o passo 8.
 */
async function ligarAoNegocio(idExecucao: string, businessId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("execucoes")
    .update({ business_id: businessId })
    .eq("id", idExecucao);

  if (error) {
    // Não derruba o disparo: a execução existe e vai rodar de qualquer
    // jeito. O que se perde é a ligação — e ela é recuperável, porque a
    // marca de ida (`cliente_id`) continua lá.
    console.error("[pipeline] falha ao ligar execução ao negócio ::", error.message);
    return false;
  }
  return true;
}

// ============================================================
// Estado local — camadas 1 e 3
// ============================================================

async function marcar(
  businessId: string,
  campos: { cadastro_estado: string | null; cadastro_erro?: string | null },
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("businesses").update(campos).eq("id", businessId);
  if (error) console.error("[pipeline] falha ao marcar estado ::", error.message);
}

/**
 * A trava de concorrência, como compare-and-set.
 *
 * O `.or()` é a condição, e é ele que faz disto uma trava de verdade em
 * vez de uma leitura seguida de escrita: dois disparos simultâneos no
 * mesmo negócio serializam no lock de linha do Postgres, e o segundo
 * encontra `cadastro_estado = 'enviando'`, não casa com a condição, e
 * atualiza zero linhas. Ler antes e escrever depois deixaria uma janela
 * entre as duas — e é numa janela dessas que o clique duplo passa.
 *
 * `null` (nunca disparou) e `'falhou'` (pode tentar de novo) passam.
 * `'enviando'` e `'enviado'` não.
 */
async function travar(businessId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .update({
      cadastro_estado: "enviando",
      cadastro_iniciado_em: new Date().toISOString(),
      cadastro_erro: null,
    })
    .eq("id", businessId)
    .or("cadastro_estado.is.null,cadastro_estado.eq.falhou")
    .select("id");

  if (error) {
    console.error("[pipeline] falha ao travar disparo ::", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

// ============================================================
// O n8n
// ============================================================

/**
 * Avisa o n8n, SE houver para onde avisar.
 *
 * Sem `V2G_N8N_WEBHOOK_URL` no ambiente, não chama — mesma disciplina do
 * `backendConfigurado()`. Estamos seguindo pela hipótese de que o n8n faz
 * polling em `execucoes` procurando `status = 'cadastro_completo'`, e
 * nessa hipótese o `POST /cadastro` já é o disparo e isto aqui nunca roda.
 *
 * A hipótese NÃO foi medida — `docs/disparo-pipeline.md` §2.2 e §12. Se
 * o status não sair de `cadastro_completo` sozinho depois do primeiro
 * disparo real, é webhook, e o conserto é preencher uma env.
 *
 * Falha aqui não derruba nada: a execução existe e continua existindo.
 */
async function avisarN8n(idExecucao: string): Promise<void> {
  const url = process.env.V2G_N8N_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_execucao: idExecucao }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch (erro) {
    console.error(
      "[pipeline] falha ao avisar n8n ::",
      erro instanceof Error ? erro.name : "desconhecido",
    );
  }
}

// ============================================================
// A porta única
// ============================================================

/**
 * Dispara o pipeline se — e só se — o cadastro acabou de ficar completo.
 *
 * CHAMADA NO FIM DE TODA AÇÃO QUE GRAVA CAMPO OBRIGATÓRIO. São três
 * superfícies (`/onboarding/contas`, `/verba`, `/meu-negocio`) porque o
 * último campo a ser preenchido muda por cliente — e é por isso que a
 * regra mora aqui e não em cada uma delas. Três cópias divergiriam na
 * primeira edição, e a divergência apareceria como cliente que completou
 * o cadastro e nunca disparou.
 *
 * NUNCA LANÇA. É a invariante 4, e ela não é preciosismo: quem chama
 * acabou de salvar um campo com sucesso, e uma exceção daqui faria a
 * tela dizer que a gravação falhou quando ela funcionou. O cliente
 * responderia de novo, e o dado dele está certo desde a primeira vez.
 */
export async function dispararSeCompleto(): Promise<ResultadoDisparo> {
  try {
    return await disparar();
  } catch (erro) {
    console.error(
      "[pipeline] disparo levantou exceção ::",
      erro instanceof Error ? erro.message : String(erro),
    );
    // `incerto` e não `falhou`: uma exceção pode ter vindo depois do POST
    // ter saído. Tratar como falha limpa autorizaria uma segunda
    // tentativa que duplicaria a execução. Incerto força a reconciliação.
    return { fez: "incerto" };
  }
}

async function disparar(): Promise<ResultadoDisparo> {
  // ---------- 1. sessão, e o negócio DELE ----------
  //
  // Cliente NORMAL, sob RLS. Não existe `businessId` de parâmetro para
  // alguém forjar, e a cláusula `profile_id` é conferida de novo pela
  // política da tabela. Invariante 1.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { fez: "nada", porque: "sem sessão" };

  const { data, error } = await supabase
    .from("businesses")
    .select(COLUNAS)
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[pipeline] falha ao ler negócio ::", error.message);
    return { fez: "nada", porque: "leitura falhou" };
  }
  if (!data) return { fez: "nada", porque: "sem negócio" };

  const negocio = data as unknown as Negocio;

  // ---------- 2. negócio de teste não dispara ----------
  //
  // ANTES de tudo: antes do token, antes de montar payload, antes de
  // marcar estado. Mesma posição da checagem em `lib/meta/publicar.ts`,
  // e pelo mesmo motivo — a resposta não depende de nada remoto, e um
  // `cadastro_estado = 'enviando'` que ninguém encerra é pior que a
  // chamada economizada.
  //
  // Mais cedo que lá, aliás: uma execução de negócio fictício que nasce
  // já pode ser pega pelo n8n e virar token de LLM e imagem gerada.
  // Publicação é o segundo portão; este é o primeiro.
  if (negocio.dados_ficticios) {
    return { fez: "recusou", porque: "dados_ficticios" };
  }

  // ---------- 3. reconciliação, antes de qualquer decisão ----------
  if (negocio.cadastro_estado === "enviando") {
    const jaExiste = await acharExecucaoExistente(negocio.id);

    if (jaExiste) {
      // A resposta tinha se perdido e a execução existe. Liga e fecha —
      // mas só fecha se a ligação pegou. Se não pegou, fica em
      // `enviando` para a próxima passagem tentar de novo; a busca acima
      // acha pelo `cliente_id` quantas vezes for preciso.
      if (!(await ligarAoNegocio(jaExiste, negocio.id))) {
        return { fez: "incerto" };
      }
      await marcar(negocio.id, { cadastro_estado: "enviado", cadastro_erro: null });
      return { fez: "reaproveitou", idExecucao: jaExiste };
    }

    const desde = negocio.cadastro_iniciado_em
      ? Date.now() - new Date(negocio.cadastro_iniciado_em).getTime()
      : Infinity;

    if (desde < MINUTOS_ATE_DESTRAVAR_DISPARO * 60_000) {
      // Outra chamada está no meio disto agora. Sair é o certo.
      return { fez: "nada", porque: "ja_em_curso" };
    }

    // Passou o prazo e não há execução: a tentativa anterior morreu antes
    // de criar qualquer coisa. Libera para tentar de novo — e é seguro
    // porque a busca acima já provou que não há o que duplicar.
    await marcar(negocio.id, {
      cadastro_estado: "falhou",
      cadastro_erro: "A tentativa anterior não terminou.",
    });
    negocio.cadastro_estado = "falhou";
  }

  // ---------- 4. camada 1: já foi ----------
  if (negocio.cadastro_estado === "enviado") {
    return { fez: "nada", porque: "ja_enviado" };
  }

  // ---------- 5. o cadastro está completo? ----------
  const cadastro = montarCadastro(negocio);
  if (!cadastro.completo) {
    return { fez: "nada", porque: `faltam ${cadastro.pendencias.length} campos` };
  }

  // ---------- 6. camada 3: trava ----------
  if (!(await travar(negocio.id))) {
    return { fez: "nada", porque: "ja_em_curso" };
  }

  // ---------- 7. a chamada ----------
  const resposta = await enviarCadastro(cadastro.payload, negocio.id);

  if (!resposta.ok) {
    if (resposta.categoria === "tempo_esgotado") {
      // NÃO marca falha, e o estado fica em `enviando` de propósito. O
      // trabalho pode ter sido criado do outro lado — é o que a própria
      // mensagem de `tempo_esgotado` diz. A próxima passagem por aqui
      // cai na reconciliação do passo 3, que decide com evidência em vez
      // de com palpite.
      return { fez: "incerto" };
    }

    await marcar(negocio.id, {
      cadastro_estado: "falhou",
      cadastro_erro: resposta.mensagem,
    });
    return { fez: "falhou", mensagem: resposta.mensagem };
  }

  // ---------- 8. o vínculo, e só então "enviado" ----------
  //
  // NESTA ORDEM, E SÓ FECHA SE LIGOU. Marcar `enviado` com a ligação
  // falhada deixaria um negócio que se considera disparado e uma execução
  // que ninguém sabe de quem é — e a reconciliação nunca mais passaria
  // para consertar, porque ela só roda em `enviando`.
  //
  // Ficar em `enviando` com a execução já criada é seguro: a busca da
  // camada 2 a encontra pelo `cliente_id`, que o backend acabou de
  // gravar. O pior caso é o negócio esperar até a próxima gravação de
  // campo — não é uma execução duplicada.
  if (!(await ligarAoNegocio(resposta.dados.idExecucao, negocio.id))) {
    await avisarN8n(resposta.dados.idExecucao);
    return { fez: "incerto" };
  }

  await marcar(negocio.id, { cadastro_estado: "enviado", cadastro_erro: null });
  await avisarN8n(resposta.dados.idExecucao);

  return { fez: "criou", idExecucao: resposta.dados.idExecucao };
}
