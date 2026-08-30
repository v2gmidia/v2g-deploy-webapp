import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarCadastro } from "@/lib/backend/cadastro";
import { obter } from "@/lib/backend/cliente";
import {
  COLUNAS_DO_CADASTRO,
  montarCadastro,
  type CadastroCompleto,
  type NegocioParaCadastro,
} from "@/lib/cadastro/montar";
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
  /**
   * `pipeline` responde a pergunta que o 200 do webhook nao responde.
   * Nenhum chamador le isto hoje — os quatro fazem `await` e descartam.
   * Esta aqui porque o dia em que uma tela precisar dizer "criamos, mas
   * nao comecou" o dado ja existe, e porque o teste consegue afirmar.
   */
  | { fez: "criou"; idExecucao: string; pipeline: ConfirmacaoDeInicio }
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
 * OS DOIS CABEÇALHOS POSSÍVEIS, e a escolha entre eles não é nossa.
 *
 * `X-V2G-Webhook` era o único aqui, com um argumento escrito: o webhook do
 * n8n e a API do backend são duas superfícies, e um segredo só faria
 * rotacionar uma obrigar a rotacionar a outra.
 *
 * O argumento continua bom e a instância não o segue. Em 31/08/2026 ficou
 * definido que o webhook em produção confere `X-V2G-Token`, com o mesmo
 * valor do `API_TOKEN` do Easypanel. Quem manda é o n8n que está de pé, não
 * o comentário — então os dois são suportados, e o que existir no ambiente
 * é o que sai.
 *
 * Se um dia a separação voltar, é só preencher `V2G_N8N_WEBHOOK_TOKEN` em
 * vez de `V2G_API_TOKEN`: o código não precisa mudar.
 */
const CABECALHO_N8N = "X-V2G-Webhook";
const CABECALHO_BACKEND = "X-V2G-Token";

/** Quanto o webhook pode demorar antes de a gente desistir de esperar. */
const TIMEOUT_WEBHOOK_MS = 10_000;

/**
 * A configuração do webhook, ou `null` com o motivo já registrado.
 *
 * SEPARADA DA CHAMADA DE PROPÓSITO: ela é consultada ANTES de a execução
 * ser criada. Webhook mal configurado é erro determinístico — vale para
 * todo disparo, não para este —, e descobrir isso depois de criar a
 * execução deixa um recurso nascido que ninguém vai consumir. Ver o
 * passo 5.5.
 */
function webhookConfigurado(): { url: string; cabecalhos: Record<string, string> } | null {
  const url = process.env.V2G_N8N_WEBHOOK_URL;
  if (!url) {
    console.error(
      "[pipeline] V2G_N8N_WEBHOOK_URL ausente ::",
      "sem ela o cadastro nasce e não anda, e ninguém fica sabendo",
    );
    return null;
  }

  const cabecalhos: Record<string, string> = { "Content-Type": "application/json" };

  const tokenBackend = process.env.V2G_API_TOKEN;
  const tokenWebhook = process.env.V2G_N8N_WEBHOOK_TOKEN;
  if (tokenBackend) cabecalhos[CABECALHO_BACKEND] = tokenBackend;
  if (tokenWebhook) cabecalhos[CABECALHO_N8N] = tokenWebhook;

  if (!tokenBackend && !tokenWebhook) {
    console.error(
      "[pipeline] webhook sem token ::",
      "preencha V2G_API_TOKEN (ou V2G_N8N_WEBHOOK_TOKEN). Sem header o n8n",
      "responde 403 e o pipeline não começa",
    );
    return null;
  }

  return { url, cabecalhos };
}

type ResultadoAviso = { ok: true } | { ok: false; motivo: string };

/**
 * Avisa o n8n. Nunca lança — devolve o que aconteceu.
 *
 * A HIPÓTESE DO POLLING MORREU, MEDIDA EM 22/08/2026. Esta função dizia
 * seguir pela hipótese de que o n8n varria `execucoes` atrás de
 * `status = 'cadastro_completo'`. Não varre: não existe trigger de
 * Postgres, o `pg_cron` não está instalado, e o workflow tem exatamente
 * dois gatilhos — o Form Trigger e o webhook para onde isto aponta. Sem
 * esta chamada, o cadastro nasce e não anda.
 *
 * O CORPO É O CADASTRO INTEIRO, NÃO SÓ O ID. O motivo está no nó
 * `3. classificar-nicho`, que monta o corpo dele a partir de
 * `$('Configuracao').item.json.cadastro.descricao_livre` — e `cadastro`,
 * no caminho do webhook, é literalmente o corpo que sai daqui. Mandando
 * só o id, o campo chega `undefined`, o `JSON.stringify` do nó o
 * descarta, sai `{}`, e o backend recusa com 422 no
 * `Field(min_length=10)`. O preço desse 422 não é a chamada perdida: o
 * nó anterior já moveu a execução para `pipeline_texto_rodando`, e a
 * máquina de estados do backend não tem destino de falha — só
 * `aguardando_fotos`. A execução fica presa ali para sempre, e a
 * retentativa leva 409 no mesmo ponto, também para sempre.
 *
 * `id_execucao` e `deve_varrer_site` vão DEPOIS do spread. O
 * `CadastroCompleto` não tem essas chaves hoje; a ordem é o que garante
 * que ganhar uma amanhã não sequestre o roteamento do fluxo.
 *
 * `deveVarrerSite` VEM DA RESPOSTA DO BACKEND, não de conta local — quem
 * decide se o site vale uma varredura é ele, e o n8n só roteia.
 *
 * O CORPO DA RECUSA VAI PARA O LOG, e é `.text()` e não `.json()`: o 403
 * do n8n vem como texto puro, sem `content-type`. Um `.json()` aqui
 * lançaria em cima do erro e trocaria "403 unauthorized" por "unexpected
 * token" — o diagnóstico errado no único log que alguém vai ler.
 */
async function avisarN8n(
  url: string,
  cabecalhos: Record<string, string>,
  idExecucao: string,
  cadastro: CadastroCompleto,
  deveVarrerSite: boolean,
): Promise<ResultadoAviso> {
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify({
        ...cadastro,
        id_execucao: idExecucao,
        deve_varrer_site: deveVarrerSite,
      }),
      signal: AbortSignal.timeout(TIMEOUT_WEBHOOK_MS),
      cache: "no-store",
    });

    if (resposta.ok) return { ok: true };

    // `.catch` porque ler o corpo também pode falhar, e perder o status
    // por causa disso seria trocar um diagnóstico por nenhum.
    const texto = await resposta.text().catch(() => "");
    const motivo = `n8n ${resposta.status}: ${texto.slice(0, 300)}`;
    console.error(
      "[pipeline] n8n recusou o aviso ::",
      `${motivo} — execução ${idExecucao} criada, pipeline NÃO iniciado`,
    );
    return { ok: false, motivo };
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.name : "desconhecido";
    console.error("[pipeline] falha ao avisar n8n ::", motivo);
    return { ok: false, motivo: `webhook inalcançável (${motivo})` };
  }
}

// ============================================================
// A confirmação — opção C
// ============================================================

/**
 * Estados que provam que o pipeline SAIU do lugar.
 *
 * `cadastro_completo` não está aqui de propósito: é o estado em que a
 * execução nasce. Encontrar esse valor é encontrar exatamente o que a
 * criação deixou, e não prova nada sobre o n8n.
 */
const ESTADOS_QUE_PROVAM_INICIO = new Set([
  "pipeline_texto_rodando",
  "decidindo_canal",
  "aguardando_fotos",
  "aguardando_tagueamento",
  "gerando_criativo",
  "estrutura_pronta",
]);

/**
 * O 200 DO WEBHOOK NÃO PROVA NADA, e é por isso que isto existe.
 *
 * O nó `Webhook` do n8n responde em `onReceived`: o 200 sai antes de o
 * workflow rodar, então ele só prova que o n8n recebeu o pedido — não que
 * alguma coisa começou. Um workflow que morre no primeiro nó devolve o
 * mesmo 200 de um que roda inteiro.
 *
 * Quem prova é o estado da execução no backend, e por isso a leitura é
 * dele e não do nosso banco.
 *
 * ELE ESPERA, E A ESPERA É O PONTO DELICADO. Como o 200 vem antes do
 * trabalho, consultar imediatamente encontra `cadastro_completo` quase
 * sempre — e reportar falha aí seria um alarme falso em todo cadastro. A
 * janela abaixo é o que separa "não começou" de "ainda não começou".
 *
 * O CUSTO É ACEITÁVEL PORQUE ISTO ACONTECE UMA VEZ NA VIDA DO CLIENTE:
 * só no caminho `criou`, no instante em que o cadastro fecha. Não é um
 * atraso por gravação de campo — é um atraso na última delas.
 *
 * Inconclusivo NÃO é falha. Se a leitura do backend não voltar, a gente
 * não sabe, e dizer que não começou seria inventar. O observador do
 * backend (prazo por estado, varredura e aviso) é quem pega esse caso.
 */
const TENTATIVAS_DE_CONFIRMACAO = 3;
const ESPERA_ENTRE_TENTATIVAS_MS = 1_500;

export type ConfirmacaoDeInicio =
  | { comecou: true; status: string }
  | { comecou: false; status: string }
  | { comecou: "indeterminado"; porque: string };

async function confirmarQueComecou(idExecucao: string): Promise<ConfirmacaoDeInicio> {
  let ultimoStatus = "";
  let ultimaFalha = "leitura não tentada";

  for (let tentativa = 1; tentativa <= TENTATIVAS_DE_CONFIRMACAO; tentativa++) {
    await new Promise((r) => setTimeout(r, ESPERA_ENTRE_TENTATIVAS_MS));

    const resultado = await obter(`/execucoes/${idExecucao}`, {
      contexto: "confirmar-inicio",
    });

    if (!resultado.ok) {
      ultimaFalha = resultado.categoria;
      continue;
    }

    // Sem `as`: o corpo é `unknown`, e um status ausente é indeterminado,
    // não "não começou".
    const corpo = resultado.dados;
    const status =
      typeof corpo === "object" && corpo !== null && "status" in corpo
        ? String((corpo as { status: unknown }).status)
        : "";

    if (!status) {
      ultimaFalha = "resposta sem status";
      continue;
    }

    ultimoStatus = status;
    if (ESTADOS_QUE_PROVAM_INICIO.has(status)) {
      return { comecou: true, status };
    }
  }

  if (ultimoStatus) {
    console.error(
      "[pipeline] o pipeline NÃO começou ::",
      `execução ${idExecucao} continua em "${ultimoStatus}" depois de`,
      `${TENTATIVAS_DE_CONFIRMACAO} leituras. O n8n respondeu 200 e não fez nada.`,
    );
    return { comecou: false, status: ultimoStatus };
  }

  console.error(
    "[pipeline] não deu para confirmar o início ::",
    `execução ${idExecucao}, motivo: ${ultimaFalha}`,
  );
  return { comecou: "indeterminado", porque: ultimaFalha };
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

  // ---------- 5.5. o webhook existe? ANTES de criar ----------
  //
  // Webhook mal configurado e erro deterministico: vale para todo disparo,
  // nao para este. Descobrir depois de criar deixa uma execucao nascida que
  // ninguem vai consumir — e foi exatamente assim que ninguem soube que o
  // pipeline nunca disparou.
  //
  // NAO LANCA. A invariante 4 nao e preciosismo: quem chama acabou de salvar
  // um campo com sucesso, e uma excecao daqui faria a tela dizer que a
  // gravacao falhou quando ela funcionou. Marcar `falhou` com o motivo
  // escrito e igualmente barulhento e nao mente para o cliente.
  const webhook = webhookConfigurado();
  if (!webhook) {
    await marcar(negocio.id, {
      cadastro_estado: "falhou",
      cadastro_erro: "Webhook do n8n nao configurado. Ninguem foi avisado.",
    });
    return { fez: "falhou", mensagem: "webhook do n8n nao configurado" };
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
  const avisar = () =>
    avisarN8n(
      webhook.url,
      webhook.cabecalhos,
      resposta.dados.idExecucao,
      cadastro.payload,
      resposta.dados.deveVarrerSite,
    );

  if (!(await ligarAoNegocio(resposta.dados.idExecucao, negocio.id))) {
    await avisar();
    return { fez: "incerto" };
  }

  await marcar(negocio.id, { cadastro_estado: "enviado", cadastro_erro: null });

  const aviso = await avisar();
  if (!aviso.ok) {
    // A execucao existe e o n8n nao soube. Isso NAO e `falhou`: o cadastro
    // foi enviado e o recurso nasceu — desfazer seria mentira. O que se
    // registra e que ninguem comecou, no lugar onde alguem olha.
    await marcar(negocio.id, { cadastro_erro: aviso.motivo, cadastro_estado: "enviado" });
    return {
      fez: "criou",
      idExecucao: resposta.dados.idExecucao,
      pipeline: { comecou: false, status: "webhook_recusou" },
    };
  }

  // ---------- 9. o 200 nao prova nada: confirma ----------
  const pipeline = await confirmarQueComecou(resposta.dados.idExecucao);
  if (pipeline.comecou !== true) {
    const motivo =
      pipeline.comecou === false
        ? `O pipeline nao comecou (execucao em "${pipeline.status}").`
        : `Nao deu para confirmar o inicio (${pipeline.porque}).`;
    await marcar(negocio.id, { cadastro_erro: motivo, cadastro_estado: "enviado" });
  }

  return { fez: "criou", idExecucao: resposta.dados.idExecucao, pipeline };
}
