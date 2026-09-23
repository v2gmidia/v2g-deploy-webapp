import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { atualizarNoMeta } from "./marketing";
import { FalhaMeta } from "./oauth";
import { registrarErroMeta } from "./erros";
import { conferirAntesDeAtivar } from "@/lib/campanha/ativacao";
import { avisarClienteQueCampanhaEstaNoAr } from "@/lib/campanha/aviso";

/**
 * TIRAR DO PAUSADO, E COLOCAR DE VOLTA.
 *
 * ------------------------------------------------------------------
 * AS INVARIANTES DESTE ARQUIVO. Se você for mexer aqui, elas não são
 * sugestão — e são DIFERENTES das cinco de `publicar.ts`, de propósito.
 *
 *  1. **Este arquivo é o único que muda PAUSED para ACTIVE ou volta.**
 *     Todo bug aqui é dinheiro real do cliente, não lixo para limpar.
 *     Por isso toda ativação passa por `conferirAntesDeAtivar()`, sem
 *     exceção e sem atalho — inclusive quando quem chama acabou de
 *     chamá-la.
 *  2. **Os três níveis, ou nenhum.** Campanha, conjunto e anúncio. Um
 *     anúncio ACTIVE dentro de um conjunto PAUSED não veicula, e a tela
 *     diria "no ar" sobre algo parado. Ativação parcial é pior que
 *     nenhuma: ela mente.
 *  3. **Ativar confere; pausar não.** O freio nunca pede permissão. Uma
 *     confirmação de valor antes de pausar seria um obstáculo entre o
 *     operador e a parada de um gasto que ele quer parar.
 *  4. **Carimbos separados.** Ativar escreve `ativada_em`/`ativada_por`;
 *     pausar escreve `pausada_em`/`pausada_por`. Um par nunca escreve no
 *     outro — cada um conta a sua própria história, e a comparação das
 *     duas datas é que diz o estado (ver a migration 0024).
 *  5. **`decisions` antes e depois de cada nível**, como em
 *     `publicar.ts`. Se só existir o "antes", sabemos exatamente onde
 *     parou — e aqui isso vale mais, porque "parou no meio" significa
 *     objetos em estados diferentes gastando ou não.
 *  6. **A trava é o `UPDATE` condicional, nunca um `if`.** Ler o estado
 *     e depois escrever deixa uma janela entre as duas, e duas chamadas
 *     simultâneas passam as duas. Aqui a troca de estado é a própria
 *     condição, numa instrução — quem perde a corrida afeta zero linhas
 *     e sabe disso pela contagem.
 *
 * O que `publicar.ts` tem e este NÃO tem: a rede. Lá, "enquanto tudo
 * estiver pausado, todo bug é lixo para limpar". Aqui não existe esse
 * conforto, e é por isso que os dois arquivos são separados — as cinco
 * invariantes de lá continuam verdadeiras sobre o mundo delas.
 * ------------------------------------------------------------------
 *
 * ============================================================
 * ⚠️ NÃO TESTADO CONTRA A GRAPH API REAL.
 *
 * Nenhuma linha deste arquivo foi exercitada contra o Meta. O que está
 * conferido é que ele compila, que o fluxo de banco está certo e que a
 * trava de identidade é chamada. O que NÃO está conferido:
 *
 *   - se `POST /{id}` com `status=ACTIVE` é mesmo o caminho de cada um
 *     dos três níveis;
 *   - se a resposta é `{"success": true}` nos três (é o que
 *     `atualizarNoMeta` espera);
 *   - se ativar só a campanha bastaria — a invariante 2 assume que não,
 *     por causa de como o `effective_status` compõe os níveis, e isso é
 *     conhecimento geral, **não medição desta base**;
 *   - qual erro o Meta devolve quando a conta não tem saldo no momento
 *     da ativação. A verificação que existe hoje (`_checar_conta` no
 *     backend) responde "dá para criar o objeto?", não "dá para gastar?".
 *
 * **PRECISA DE VALIDAÇÃO MANUAL NUMA CONTA DE TESTE ANTES DE PRODUÇÃO.**
 * Com verba de alguns reais, ativando e conferindo o `effective_status`
 * dos três objetos no Gerenciador de Anúncios.
 * ============================================================
 */

/** O status que o Meta entende, nos três níveis. */
const ATIVO = "ACTIVE";
const PAUSADO = "PAUSED";

/**
 * Minutos até considerar que uma ativação travada pode ser retomada.
 *
 * Mesmo número de `publicar.ts`, e pelo mesmo motivo: uma ativação que
 * morreu no meio (processo caiu, deploy no meio da chamada) deixaria a
 * campanha presa em `'ativando'` para sempre, e ninguém conseguiria nem
 * ativar nem pausar. Dez minutos é folgado para as três chamadas ao Meta
 * e curto para não prender o operador.
 */
const MINUTOS_ATE_DESTRAVAR = 10;

/** Os estados de onde dá para SAIR para uma ativação. */
const DE_ONDE_SE_ATIVA = ["published", "pausada"] as const;

/** Onde a mudança aconteceu — entra no rastro e na mensagem de falha. */
export type NivelDaMudanca = "campanha" | "conjunto" | "anuncio";

export interface ResultadoDaMudanca {
  ok: boolean;
  /** o que foi mudado, com sucesso, até parar */
  feitos: NivelDaMudanca[];
  /** onde parou, quando parou */
  parouEm: NivelDaMudanca | null;
  /** frase para a tela do operador. Nunca a resposta crua do Meta. */
  mensagem: string;
}

interface Alvo {
  campanhaId: string;
  negocioId: string;
  externalCampaignId: string;
  externalAdsetId: string;
  /** um por criativo publicado desta campanha */
  externalAdIds: string[];
  token: string;
}

// ============================================================
// Rastro — o mesmo formato de `publicar.ts`, com `kind` próprio.
// ============================================================

type Supa = ReturnType<typeof createAdminClient>;

async function registrar(
  supa: Supa,
  alvo: Pick<Alvo, "campanhaId" | "negocioId">,
  kind: "ativacao_tentativa" | "ativacao_resultado" | "pausa_tentativa" | "pausa_resultado",
  payload: Record<string, unknown>,
  falhou = false,
): Promise<void> {
  await supa.from("decisions").insert({
    business_id: alvo.negocioId,
    campaign_id: alvo.campanhaId,
    kind,
    payload,
    status: falhou ? "failed" : "done",
    needs_review: falhou,
  });
}

/**
 * O erro que chega ao operador — NUNCA o corpo cru do Meta.
 *
 * Mesma regra de `publicar.ts`: em várias rotas o corpo carrega o próprio
 * token. O `error_user_msg`, quando existe, já vem escrito para humano e
 * é melhor que qualquer frase nossa.
 */
function mensagemDeFalha(erro: unknown, nivel: NivelDaMudanca): string {
  if (erro instanceof FalhaMeta) {
    const doMeta = erro.detalhe.mensagemUsuario;
    if (doMeta) return `O Meta recusou no nível "${nivel}": ${doMeta}`;
    const code = erro.detalhe.code ? ` (código ${erro.detalhe.code})` : "";
    return `O Meta recusou no nível "${nivel}"${code}. O detalhe está no log.`;
  }
  return `Não consegui falar com o Meta no nível "${nivel}".`;
}

// ============================================================
// Carregar o alvo
// ============================================================

/**
 * Junta os três ids externos e o token.
 *
 * `negocioId` NÃO é parâmetro: ele sai da linha da campanha, como na
 * trava do Bloco 2, e escopa a busca dos criativos. É a mesma disciplina,
 * e pelo mesmo motivo — este arquivo usa o cliente admin, que ignora RLS.
 */
async function carregarAlvo(
  supa: Supa,
  campanhaId: string,
): Promise<Alvo | { erro: string }> {
  const { data: campanha } = await supa
    .from("campaigns")
    .select("id, business_id, external_campaign_id, external_adset_id")
    .eq("id", campanhaId)
    .maybeSingle();

  if (!campanha) return { erro: "Essa campanha não existe." };

  const negocioId: string | null = campanha.business_id ?? null;
  if (!negocioId) {
    return { erro: "Essa campanha não aponta para nenhum negócio." };
  }

  const externalCampaignId: string | null = campanha.external_campaign_id ?? null;
  const externalAdsetId: string | null = campanha.external_adset_id ?? null;
  if (!externalCampaignId || !externalAdsetId) {
    return {
      erro: "Essa campanha não tem campanha e conjunto no Meta. Ela não foi publicada — não há o que ativar.",
    };
  }

  // Os anúncios desta campanha, escopados pelos DOIS: o negócio da linha
  // e a campanha. Só `campaign_id` bastaria hoje; os dois juntos
  // sobrevivem ao dia em que alguém escrever `campaign_id` errado.
  const { data: criativos } = await supa
    .from("creatives")
    .select("id, external_ad_id")
    .eq("business_id", negocioId)
    .eq("campaign_id", campanhaId)
    .not("external_ad_id", "is", null);

  const externalAdIds: string[] = (criativos ?? [])
    .map((c: { external_ad_id: unknown }) => c.external_ad_id)
    .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

  const { data: token } = await supa.rpc("obter_token_meta", {
    p_business_id: negocioId,
  });
  if (!token || typeof token !== "string") {
    return { erro: "Não consegui pegar o token do cliente. A conexão com o Meta pode ter caído." };
  }

  return {
    campanhaId: String(campanha.id),
    negocioId,
    externalCampaignId,
    externalAdsetId,
    externalAdIds,
    token,
  };
}

// ============================================================
// A mudança de status, nos três níveis
// ============================================================

/**
 * Muda o status dos três níveis, parando no primeiro que recusar.
 *
 * ============================================================
 * PARA NO PRIMEIRO ERRO, E NÃO DESFAZ O QUE JÁ FEZ.
 *
 * É a invariante 5 de `publicar.ts` aplicada aqui: "nada é apagado
 * automaticamente em caso de falha". Desfazer numa corrida é pior que
 * deixar o estado misto — e o estado misto está escrito em `decisions`,
 * nível a nível, então dá para saber exatamente onde parou.
 *
 * Na ATIVAÇÃO a ordem é de cima para baixo (campanha → conjunto →
 * anúncio): se parar no meio, o que ficou ACTIVE está dentro de algo
 * ainda PAUSED, e **não gasta**. A ordem errada (de baixo para cima)
 * deixaria anúncios ativos prontos para disparar no instante em que o
 * pai subisse.
 *
 * Na PAUSA a ordem é a mesma, e pelo motivo oposto: pausar a campanha
 * primeiro já interrompe tudo que está abaixo. Parar no meio, aqui,
 * significa ter parado o gasto — que é o objetivo.
 * ============================================================
 */
async function mudarOsTresNiveis(
  supa: Supa,
  alvo: Alvo,
  status: typeof ATIVO | typeof PAUSADO,
): Promise<ResultadoDaMudanca> {
  const ativando = status === ATIVO;
  const kindTentativa = ativando ? "ativacao_tentativa" : "pausa_tentativa";
  const kindResultado = ativando ? "ativacao_resultado" : "pausa_resultado";
  const feitos: NivelDaMudanca[] = [];

  const niveis: { nivel: NivelDaMudanca; ids: string[] }[] = [
    { nivel: "campanha", ids: [alvo.externalCampaignId] },
    { nivel: "conjunto", ids: [alvo.externalAdsetId] },
    { nivel: "anuncio", ids: alvo.externalAdIds },
  ];

  for (const { nivel, ids } of niveis) {
    // Nível sem objeto não é falha: campanha publicada sem anúncio é o
    // estado que o backend chama de `sem_anuncios`, e existe de propósito.
    if (ids.length === 0) continue;

    await registrar(supa, alvo, kindTentativa, { nivel, status, ids });

    for (const id of ids) {
      try {
        await atualizarNoMeta(id, alvo.token, { status });
      } catch (erro) {
        registrarErroMeta(`ativar:${nivel}`, erro);
        const mensagem = mensagemDeFalha(erro, nivel);
        // UMA linha de `decisions` por falha, com o código E a frase. O
        // código é para quem investiga; a frase é o que a tela do
        // operador mostra, e guardá-la aqui faz o recado sobreviver ao
        // recarregamento da página.
        await registrar(
          supa,
          alvo,
          kindResultado,
          {
            nivel,
            status,
            id,
            mensagem,
            erro:
              erro instanceof FalhaMeta
                ? {
                    code: erro.detalhe.code ?? null,
                    subcode: erro.detalhe.subcode ?? null,
                    type: erro.detalhe.type ?? null,
                    fbtrace_id: erro.detalhe.fbtrace_id ?? null,
                  }
                : { mensagem: String(erro) },
          },
          true,
        );
        return { ok: false, feitos, parouEm: nivel, mensagem };
      }
    }

    await registrar(supa, alvo, kindResultado, { nivel, status, ids });
    feitos.push(nivel);
  }

  return {
    ok: true,
    feitos,
    parouEm: null,
    mensagem: ativando
      ? "Campanha ativada no Meta."
      : "Campanha pausada no Meta.",
  };
}

// ============================================================
// As duas portas
// ============================================================

/**
 * PEGA A TRAVA — ou diz que outra pessoa já pegou.
 *
 * ============================================================
 * UMA INSTRUÇÃO, SEM LEITURA ANTES. É isso que a faz trava.
 *
 * O `.eq("publish_state", ...)` dentro do UPDATE é a condição: o
 * Postgres serializa as duas chamadas na mesma linha, a primeira muda o
 * estado e a segunda não encontra mais nada que case. O `.select()` no
 * fim devolve as linhas afetadas — zero significa "perdi a corrida", e
 * essa contagem é a resposta, não um palpite.
 *
 * O `.or()` do destravamento entra na MESMA instrução de propósito:
 * conferir o tempo antes, em leitura separada, reabriria exatamente a
 * janela que esta função existe para fechar.
 * ============================================================
 */
async function pegarATrava(
  supa: Supa,
  campanhaId: string,
): Promise<{ pegou: true } | { pegou: false; motivo: string }> {
  const limite = new Date(Date.now() - MINUTOS_ATE_DESTRAVAR * 60_000).toISOString();

  const { data: linhas } = await supa
    .from("campaigns")
    .update({ publish_state: "ativando", ativando_em: new Date().toISOString() })
    .eq("id", campanhaId)
    // De 'published' ou 'pausada' se ativa. De 'ativando' só se a
    // tentativa anterior passou do teto — aí ela morreu no meio.
    .or(
      `publish_state.in.(${DE_ONDE_SE_ATIVA.join(",")}),and(publish_state.eq.ativando,ativando_em.lt.${limite})`,
    )
    .select("id, publish_state");

  if (!linhas || linhas.length === 0) {
    return {
      pegou: false,
      motivo:
        "Outra pessoa está ativando essa campanha agora, ou ela não está num estado que permite ativar. Recarregue a tela.",
    };
  }

  // O estado ANTERIOR não é devolvido de propósito: o `update` acima já
  // o sobrescreveu, e reconstruí-lo aqui seria adivinhação. Quem precisa
  // dele é `devolverATrava`, que não adivinha — volta para 'published',
  // pelo motivo escrito lá.
  return { pegou: true };
}

/**
 * DEVOLVE A TRAVA sem ativar — quando o Meta recusou.
 *
 * Volta para `'published'`, que é o estado de "existe no Meta, pausado".
 * Não volta para `'pausada'` mesmo que viesse de lá: `'pausada'` exige o
 * carimbo de pausa pelo CHECK da 0024, e a campanha continua com o
 * carimbo antigo — mas o estado honesto depois de uma ativação recusada
 * é "publicado e parado", que é o que `'published'` diz.
 */
async function devolverATrava(supa: Supa, campanhaId: string): Promise<void> {
  await supa
    .from("campaigns")
    .update({ publish_state: "published", ativando_em: null })
    .eq("id", campanhaId)
    .eq("publish_state", "ativando");
}

/**
 * ATIVAR — tirar do pausado, nos três níveis.
 *
 * `quem` é o e-mail do operador, vindo de `operadorOuErro()`. Ele não é
 * lido aqui de propósito: esta função não tem requisição na mão, e
 * inventar uma leitura de sessão aqui dentro criaria um segundo portão
 * que poderia discordar do primeiro.
 *
 * ============================================================
 * A CONFERÊNCIA ACONTECE AQUI DENTRO, DE NOVO.
 *
 * Quem chama já chamou `conferirAntesDeAtivar()` para desenhar a tela.
 * Isso NÃO conta. Entre o desenho e o clique a conta pode ter sido
 * desativada, o token pode ter morrido e o teto do mês pode ter mudado.
 *
 * O que a tela mostrou é informação; o que autoriza é esta chamada, a
 * centímetros da chamada ao Meta. É a invariante 1 deste arquivo.
 * ============================================================
 */
export async function ativarCampanha(
  campanhaId: string,
  quem: string,
): Promise<ResultadoDaMudanca> {
  const conferencia = await conferirAntesDeAtivar(campanhaId);

  if (!conferencia.ok) {
    return { ok: false, feitos: [], parouEm: null, mensagem: conferencia.texto };
  }
  if (conferencia.bloqueios.length > 0) {
    return {
      ok: false,
      feitos: [],
      parouEm: null,
      mensagem: `Não dá para ativar agora: ${conferencia.bloqueios.map((b) => b.texto).join(" · ")}`,
    };
  }

  const supa = createAdminClient();
  const alvo = await carregarAlvo(supa, campanhaId);
  if ("erro" in alvo) {
    return { ok: false, feitos: [], parouEm: null, mensagem: alvo.erro };
  }

  // ---------- a trava, imediatamente antes de falar com o Meta ----------
  const trava = await pegarATrava(supa, campanhaId);
  if (!trava.pegou) {
    return { ok: false, feitos: [], parouEm: null, mensagem: trava.motivo };
  }

  const resultado = await mudarOsTresNiveis(supa, alvo, ATIVO);
  if (!resultado.ok) {
    // Devolve a trava: sem isto a campanha fica presa em 'ativando' até o
    // teto de dez minutos, e o operador não consegue nem tentar de novo
    // nem pausar o que porventura subiu.
    await devolverATrava(supa, campanhaId);
    return resultado;
  }

  // ============================================================
  // O CARIMBO SÓ DEPOIS DO META ACEITAR.
  //
  // Gravar antes deixaria `publish_state = 'ativa'` numa campanha que o
  // Meta recusou — e a tela do cliente passaria a dizer "no ar" sobre
  // algo parado. A ordem certa é sempre: o mundo lá fora primeiro, o
  // nosso registro depois.
  //
  // `ativada_em`/`ativada_por`, nunca o par de pausa (invariante 4).
  // ============================================================
  await supa
    .from("campaigns")
    .update({
      publish_state: "ativa",
      ativada_em: new Date().toISOString(),
      ativada_por: quem,
    })
    .eq("id", campanhaId);

  // ============================================================
  // O AVISO AO CLIENTE — POR ÚLTIMO, E NUNCA BLOQUEANDO.
  //
  // Vem DEPOIS de:
  //   1. os três níveis confirmarem no Meta (se qualquer um falhou, a
  //      função já voltou lá em cima e este ponto não é alcançado);
  //   2. o carimbo ser gravado — assim o aviso lê `ativada_em` e sabe
  //      desde quando o anúncio está no ar.
  //
  // E ele NÃO pode derrubar nada: a campanha já está no ar. Se o aviso
  // quebrar, quebrou o contar, não o fazer — `avisarCliente...` engole a
  // própria falha e devolve `registrado: false`, que vira log.
  //
  // HOJE ELE NÃO MANDA NADA. Não existe integração de envio de WhatsApp
  // neste repositório; a função registra a dívida em `decisions` com
  // `status: 'pending'`. Ver o bloco do topo de `lib/campanha/aviso.ts`.
  // ============================================================
  const aviso = await avisarClienteQueCampanhaEstaNoAr(campanhaId);
  if (!aviso.registrado) {
    console.error(`[ativar] campanha ${campanhaId} no ar e SEM aviso registrado ::`, aviso.motivo);
  }

  return resultado;
}

/**
 * PAUSAR — o caminho de volta.
 *
 * ============================================================
 * SEM CONFERÊNCIA DE VALOR, E É DECISÃO (invariante 3).
 *
 * `conferirAntesDeAtivar()` existe para a pessoa saber quanto vai
 * COMEÇAR a gastar. Pausar não começa nada: ela para. Exigir a mesma
 * confirmação seria pôr um obstáculo entre o operador e a interrupção de
 * um gasto — exatamente o momento em que atrito custa dinheiro.
 *
 * O que ela ainda faz: carrega o alvo (que confere que a campanha existe
 * e tem dono), grava `decisions` nos dois sentidos, e carimba.
 * ============================================================
 */
export async function pausarCampanha(
  campanhaId: string,
  quem: string,
): Promise<ResultadoDaMudanca> {
  const supa = createAdminClient();
  const alvo = await carregarAlvo(supa, campanhaId);
  if ("erro" in alvo) {
    return { ok: false, feitos: [], parouEm: null, mensagem: alvo.erro };
  }

  const resultado = await mudarOsTresNiveis(supa, alvo, PAUSADO);

  // ============================================================
  // O CARIMBO DE PAUSA ENTRA MESMO SE PAROU NO MEIO — e é diferente da
  // ativação de propósito.
  //
  // Se a campanha foi pausada e o conjunto não, o gasto JÁ PAROU: a
  // campanha pausada desliga tudo abaixo dela. Não carimbar nesse caso
  // deixaria o banco dizendo "ativa" sobre algo que não gasta mais, e a
  // tela do cliente mentiria na direção mais cara.
  //
  // Se não mudou NENHUM nível, aí sim não houve pausa e nada é carimbado.
  // ============================================================
  if (resultado.feitos.length > 0) {
    await supa
      .from("campaigns")
      .update({
        publish_state: "pausada",
        pausada_em: new Date().toISOString(),
        pausada_por: quem,
      })
      .eq("id", campanhaId);
  }

  return resultado;
}
