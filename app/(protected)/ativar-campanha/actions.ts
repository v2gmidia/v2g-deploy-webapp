"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { conferirAntesDeAtivar } from "@/lib/campanha/ativacao";
import {
  ativarCampanha,
  pausarCampanha,
  resumoDosNiveis,
  type AcaoNaCampanha,
  type NivelDaAcao,
} from "@/lib/backend/ativacao";

/**
 * AS AÇÕES DA TELA DE ATIVAÇÃO — a casca, com o portão de papel.
 *
 * ============================================================
 * QUEM FALA COM A META É O BACKEND, e mudou em 24/09/2026.
 *
 * Antes daqui saía chamada direta à Graph API. A campanha real, porém,
 * nasce do lado do Python, na conta com o System User da V2G — e ativar
 * com um token que não foi o que criou é remar contra o desenho. As duas
 * rotas novas (`rotas.py:3619` e `:3640`) põem a escrita onde já estão o
 * token, a conta e o registro.
 *
 * O que ficou aqui é o que só a requisição tem: quem é você, e o que veio
 * no formulário.
 *
 * TRÊS PORTAS, como em `/revisar-perfil`:
 *   1. `proxy.ts` guarda `/ativar-campanha` por PROTECTED_PREFIXES;
 *   2. e de novo por OPERADOR_PREFIXES;
 *   3. cada action chama `operadorOuErro()` na PRIMEIRA linha do corpo,
 *      antes de ler o `formData`.
 * ============================================================
 */

/**
 * O QUE A TELA RECEBE DE VOLTA.
 *
 * ============================================================
 * ANTES DE 26/09/2026 ESTAS AÇÕES DEVOLVIAM `void`.
 *
 * O resultado do backend chegava aqui, virava linha em `decisions`, e era
 * jogado fora. Na tela não acontecia nada: o operador clicava num botão
 * que gasta dinheiro e a única prova de que funcionou era rolar até o
 * histórico e reparar que tinha linha nova.
 *
 * O shape é o da casa (`verba/actions.ts:11-14`), com dois campos a mais
 * que só esta rota tem: os NÍVEIS e os AVISOS. Sem eles "a campanha
 * ligou" e "a campanha ligou mas o conjunto recusou" chegariam iguais.
 * ============================================================
 *
 * Exatamente um entre `ok` e `erro` vem preenchido. `niveis` e `avisos`
 * acompanham qualquer um dos dois quando houver o que dizer.
 */
export interface EstadoDaAtivacao {
  /** deu certo — a frase que vai em `.form-notice` ou `.form-warning` */
  ok?: string;
  /** não deu — a frase que vai em `.form-error` */
  erro?: string;
  /**
   * Um item por objeto do Meta, inclusive os NÃO TENTADOS.
   *
   * Só vem quando a operação parou no meio. "Parou no conjunto" e "parou
   * no anúncio" levam a consertos diferentes, e o `erro` de cada nível
   * carrega o texto cru da Meta — ver a exceção declarada em
   * `lib/backend/erros.ts`.
   */
  niveis?: NivelDaAcao[];
  /** o que o backend achou que valia dizer mesmo tendo dado certo */
  avisos?: string[];
}

/**
 * Traduz o resultado do backend no que a tela mostra.
 *
 * ============================================================
 * A MENSAGEM NASCE AQUI, E NÃO NA TELA.
 *
 * Se a tela montasse a frase, ela precisaria saber o que `completo` e
 * `niveis` significam — e dois lugares interpretando o mesmo contrato é
 * como um deles passa a dizer "pronto" sobre meia campanha.
 * ============================================================
 *
 * `mock` VIRA AVISO, e é o mais importante deles: com o backend em
 * `USE_MOCK_META=true` a chamada responde 200 sem ter tocado na Meta. Um
 * "campanha ligada" verde sobre isso seria a tela mentindo com a cara
 * mais convincente que ela tem.
 */
function lerResultado(dados: AcaoNaCampanha, verbo: "ligada" | "pausada"): EstadoDaAtivacao {
  const avisos = [...dados.avisos];
  if (dados.mock) {
    avisos.unshift(
      "O backend respondeu em modo simulado (`mock`): NADA foi alterado no Meta de verdade.",
    );
  }

  if (!dados.completo) {
    return {
      ok: `A operação parou no meio — parte da estrutura mudou e parte não. Confira cada nível abaixo antes de tentar de novo.`,
      niveis: dados.niveis,
      avisos,
    };
  }

  return {
    ok: `Campanha ${verbo} no Meta.`,
    avisos,
  };
}

/**
 * O portão de papel. Devolve o e-mail, que é o que vira o `por` do pedido.
 *
 * Mesmo corpo de `revisar-perfil/[proposta]/actions.ts:22-34`, e de
 * propósito: duas versões divergentes do mesmo portão é como um lado
 * passa a aceitar o que o outro recusa.
 *
 * ============================================================
 * O `por` QUE SAI DAQUI É DECLARAÇÃO, NÃO IDENTIDADE VERIFICADA — e o
 * backend é o primeiro a dizer isso (`modelos.py:1038-1054`): ele não tem
 * usuário nem sessão, o `X-V2G-Token` é segredo de máquina, e quem tem o
 * token escreve o que quiser nesse campo.
 *
 * O valor de mandá-lo é que ESTE lado tem o usuário logado (Supabase
 * Auth) e é o único ponto do caminho que sabe quem clicou. Gravar o que
 * ele declara é melhor que não gravar nada — tratar como autenticação
 * seria autenticação de mentira.
 * ============================================================
 */
async function operadorOuErro(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") {
    throw new Error("não autorizado");
  }
  // O e-mail é o que fica no registro. O id serve de reserva para conta
  // sem e-mail — o campo não pode ficar vazio, porque "quem pediu" é
  // metade do valor do rastro.
  return user.email ?? user.id;
}

/**
 * ATIVAR — a ação que gasta dinheiro.
 *
 * ============================================================
 * O QUE ELA NÃO FAZ: confiar em nada que veio da tela.
 *
 * Ela recebe UM dado, o id da execução. Não recebe o valor confirmado,
 * não recebe "o operador já viu os bloqueios", não recebe o estado que a
 * página desenhou. Ela reconfere do zero, aqui, a centímetros da chamada.
 *
 * Um campo escondido do tipo `confirmado=1` seria a tela autorizando a si
 * mesma, e é exatamente o que não pode existir aqui. O `confirmo: true`
 * que vai no corpo do pedido é escrito dentro de
 * `lib/backend/ativacao.ts`, depois desta reconferência — nunca antes, e
 * nunca vindo do formulário.
 * ============================================================
 *
 * ============================================================
 * O `try` NÃO É DECORAÇÃO, E O QUE ELE PEGA É DIFERENTE DO RESTO.
 *
 * `ativarCampanha()` já devolve `{ ok: false }` para tudo que ela PREVÊ —
 * backend fora do ar, 422, 502 da Meta. O que o `try` pega é o que ela
 * não prevê: banco fora do ar, `service_role` ausente do ambiente.
 *
 * Sem ele isso vira 500 genérico numa tela que acabou de pedir para
 * alguém apertar um botão que gasta dinheiro. O operador ficaria sem
 * saber se a campanha subiu ou não — que é a pior resposta possível
 * aqui, pior que "não foi".
 * ============================================================
 */
export async function ativarAction(
  _anterior: EstadoDaAtivacao,
  formData: FormData,
): Promise<EstadoDaAtivacao> {
  const quem = await operadorOuErro();

  // ============================================================
  // O ID VEM DO FORMULÁRIO, E É O ÚNICO QUE VEM.
  //
  // `idExecucao` é o único dado de fora que esta ação aceita além do
  // motivo da pausa. O NEGÓCIO nunca é parâmetro: ele é lido da linha da
  // execução, lá dentro. Ver a trava em `lib/campanha/ativacao.ts` e a
  // declaração em `lib/seguranca/excecoes.ts`.
  //
  // `_anterior` é o estado do `useActionState` e é IGNORADO de propósito:
  // aceitar qualquer coisa dele seria a tela mandando na ação.
  // ============================================================
  const idExecucao = String(formData.get("idExecucao") ?? "").trim();
  if (!idExecucao) {
    return { erro: "Sem campanha para ativar. Recarregue a página." };
  }

  try {
    // ---------- a reconferência que vale ----------
    // A da página foi desenhada; esta é a que decide. Entre uma e outra a
    // conta pode ter caído, o teto pode ter mudado, e outra pessoa do
    // time pode ter agido.
    const agora = await conferirAntesDeAtivar(idExecucao);
    if (!agora.ok) {
      await registrar(idExecucao, null, "ativacao_recusada", quem, agora.texto);
      revalidar(idExecucao);
      return { erro: agora.texto };
    }
    if (agora.bloqueios.length > 0) {
      const motivos = agora.bloqueios.map((b) => b.texto);
      await registrar(
        idExecucao,
        agora.negocioId,
        "ativacao_recusada",
        quem,
        `bloqueado na reconferência: ${motivos.join(" | ")}`,
      );
      revalidar(idExecucao);
      // ============================================================
      // ESTE RAMO É O MAIS FÁCIL DE SUBESTIMAR NA TELA.
      //
      // Ele quer dizer que a página mostrava o botão e, no instante do
      // clique, já não devia. Quem lê precisa entender que NADA foi
      // tentado — e por isso os motivos vão junto, não só "não deu".
      // ============================================================
      return {
        erro: "Entre desenhar a tela e o seu clique, alguma coisa mudou. Nada foi enviado ao Meta.",
        avisos: motivos,
      };
    }

    const resultado = await ativarCampanha(idExecucao, quem);

    if (!resultado.ok) {
      // O backend não respondeu, ou respondeu recusando. O rastro do lado
      // dele pode existir (ele grava a intenção antes de chamar a Meta) —
      // mas se a chamada nem chegou lá, este é o único registro que
      // sobra. Por isso ele é escrito mesmo quando parece redundante.
      const detalhe = `${resultado.categoria}${resultado.http ? ` (${resultado.http})` : ""}: ${resultado.mensagem}`;
      await registrar(idExecucao, agora.negocioId, "ativacao_sem_resposta", quem, detalhe);
      revalidar(idExecucao);
      return { erro: detalhe };
    }

    if (!resultado.dados.completo) {
      // ============================================================
      // O CASO CARO: PARTE LIGOU, PARTE NÃO.
      //
      // A Meta não tem operação atômica nos três níveis. Um anúncio
      // `ACTIVE` dentro de um conjunto `PAUSED` não veicula — e o
      // contrário gasta. Registrar qual nível ficou como, com o texto
      // cru da Meta, é o que permite alguém consertar sem adivinhar.
      // ============================================================
      await registrar(
        idExecucao,
        agora.negocioId,
        "ativacao_parcial",
        quem,
        resumoDosNiveis(resultado.dados),
      );
    }

    revalidar(idExecucao);
    return lerResultado(resultado.dados, "ligada");
  } catch (erro) {
    const frase = await registrarQuebra(idExecucao, "ativacao", erro, quem);
    revalidar(idExecucao);
    return { erro: frase };
  }
}

/**
 * PAUSAR — o freio.
 *
 * Mesmo portão, mesmo id, e NENHUMA reconferência de bloqueio: parar de
 * gastar não pede licença, e não depende de o resto estar em ordem. O
 * `motivo` é exigido porque o backend exige (`rotas.py:3521-3526`) e
 * porque ele é o que registra de quem partiu o pedido — o sistema nunca
 * pausa sozinho.
 *
 * O `try` aqui vale ainda mais: se pausar quebrar por motivo nosso, o
 * dinheiro continua saindo enquanto ninguém sabe.
 */
export async function pausarAction(
  _anterior: EstadoDaAtivacao,
  formData: FormData,
): Promise<EstadoDaAtivacao> {
  const quem = await operadorOuErro();

  const idExecucao = String(formData.get("idExecucao") ?? "").trim();
  if (!idExecucao) {
    return { erro: "Sem campanha para pausar. Recarregue a página." };
  }

  const motivo = String(formData.get("motivo") ?? "").trim();
  if (!motivo) {
    // Sem ida ao backend: ele recusaria com 422, e gastar uma viagem para
    // ouvir de volta o que já se sabe aqui não ajuda ninguém.
    await registrar(idExecucao, null, "pausa_recusada", quem, "pedido sem motivo escrito");
    revalidar(idExecucao);
    return { erro: "Escreva por que está pausando. Sem isso o pedido não sai daqui." };
  }

  try {
    const resultado = await pausarCampanha(idExecucao, quem, motivo);

    if (!resultado.ok) {
      const detalhe = `${resultado.categoria}${resultado.http ? ` (${resultado.http})` : ""}: ${resultado.mensagem}`;
      await registrar(idExecucao, null, "pausa_sem_resposta", quem, detalhe);
      revalidar(idExecucao);
      // ============================================================
      // PAUSA QUE NÃO SAIU É PIOR QUE ATIVAÇÃO QUE NÃO SAIU.
      //
      // O dinheiro continua saindo enquanto ninguém sabe. Por isso a
      // frase manda ao Gerenciador em vez de sugerir tentar de novo.
      // ============================================================
      return {
        erro: detalhe,
        avisos: [
          "A campanha pode continuar entregando. Se precisar parar agora, desligue a chave no Gerenciador de Anúncios.",
        ],
      };
    }

    if (!resultado.dados.completo) {
      await registrar(idExecucao, null, "pausa_parcial", quem, resumoDosNiveis(resultado.dados));
    }

    revalidar(idExecucao);
    return lerResultado(resultado.dados, "pausada");
  } catch (erro) {
    const frase = await registrarQuebra(idExecucao, "pausa", erro, quem);
    revalidar(idExecucao);
    return { erro: frase };
  }
}

/**
 * As duas rotas que mudam quando qualquer coisa acontece aqui.
 *
 * Existe como função porque estava copiada em seis lugares e as saídas
 * antecipadas tinham esquecido metade — revalidavam o detalhe e deixavam
 * a fila velha. Uma linha esquecida num `return` é exatamente o tipo de
 * coisa que ninguém vê em revisão.
 */
function revalidar(idExecucao: string): void {
  revalidatePath(`/ativar-campanha/${idExecucao}`);
  revalidatePath("/ativar-campanha");
}

/**
 * O NOSSO rastro, em `decisions` — e ele é o complemento do outro, não o
 * mesmo.
 *
 * ============================================================
 * SÃO DOIS REGISTROS, COM DONOS DIFERENTES, E ISSO É DESENHO.
 *
 *   `execucoes.aprovacoes`  o backend, duas linhas por chamada: a
 *                           intenção antes da Meta e o retorno depois
 *                           (`rotas.py:3486-3495`). É o que a tela mostra.
 *   `decisions`             o que acontece DESTE lado e nunca chega lá:
 *                           recusa na reconferência, backend mudo,
 *                           quebra nossa.
 *
 * Sem o segundo, "a rota recusou" e "a chamada nunca saiu daqui" ficariam
 * indistinguíveis — e a segunda é a que precisa de alguém olhando.
 *
 * `campaign_id` fica NULO de propósito: a coluna é FK para `campaigns`
 * (`0001_init.sql:566`), que é a tabela descartada. O id da execução vai
 * no `payload`, onde ele é honesto.
 * ============================================================
 */
async function registrar(
  idExecucao: string,
  negocioId: string | null,
  kind: string,
  quem: string,
  mensagem: string,
): Promise<void> {
  console.error(`[ativar-campanha] ${kind} em ${idExecucao} :: ${mensagem}`);

  // `decisions.business_id` é NOT NULL. Sem negócio não há linha para
  // escrever — e o console acima é o que sobra. Inventar um id para
  // satisfazer a coluna seria pior que não registrar.
  if (!negocioId) return;

  try {
    const admin = createAdminClient();
    await admin.from("decisions").insert({
      business_id: negocioId,
      campaign_id: null,
      kind,
      payload: { id_execucao: idExecucao, por: quem, mensagem },
      status: "failed",
      needs_review: true,
    });
  } catch (aoRegistrar) {
    console.error("[ativar-campanha] nem o rastro deu para gravar ::", aoRegistrar);
  }
}

/**
 * O que sobrou do `catch`.
 *
 * ============================================================
 * A FRASE É O CONTEÚDO, e ela diz "não sei" de propósito.
 *
 * Quebra nossa no meio da operação não permite afirmar que a Meta não
 * recebeu: a chamada pode ter ido e a resposta ter se perdido. Escrever
 * "não foi" aqui mandaria alguém tentar de novo sobre uma campanha que
 * já está ligada.
 * ============================================================
 */
async function registrarQuebra(
  idExecucao: string,
  acao: "ativacao" | "pausa",
  erro: unknown,
  quem: string,
): Promise<string> {
  console.error(`[ativar-campanha] quebra inesperada em ${idExecucao} ::`, erro);

  let negocioId: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("execucoes")
      .select("business_id")
      .eq("id", idExecucao)
      .maybeSingle();
    negocioId = (data?.business_id as string | null) ?? null;
  } catch {
    // segue sem negócio: o `registrar` abaixo cai no console
  }

  // A MESMA frase vai para o banco e para a tela. Duas versões da mesma
  // notícia — uma para o log, outra "amigável" — é como o operador lê uma
  // coisa e quem investiga depois lê outra.
  const frase =
    "Alguma coisa quebrou do nosso lado no meio da operação. NÃO dá para saber se o Meta chegou a receber a mudança — confira no Gerenciador de Anúncios antes de tentar de novo.";

  await registrar(idExecucao, negocioId, `${acao}_quebrou`, quem, `${frase} Detalhe: ${String(erro)}`);

  return frase;
}
