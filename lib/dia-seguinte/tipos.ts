/**
 * Os tipos do "dia seguinte" — a pergunta diária e a tela de resultado.
 *
 * Contrato do backend em `docs/contrato-do-app-dia-seguinte.md` (worktree
 * `backend_v2g-a2`, fora deste repositório).
 *
 * SEM `server-only`: as telas são componentes de cliente e precisam dos
 * tipos. Quem guarda o `X-V2G-Token` é `lib/backend/dia-seguinte.ts`.
 *
 * ============================================================
 * AS TRÊS REGRAS DO CONTRATO QUE VIRARAM TIPO
 *
 * 1. `null` NUNCA É ZERO. Por isso todo número que pode faltar é
 *    `number | null`, e nunca ganha `?? 0` em lugar nenhum. `null` é
 *    "não sabemos"; `0` é "respondeu que foi zero", e zero venda é sinal
 *    forte que não pode virar silêncio. Já temos a cicatriz irmã disso no
 *    `pre-requisitos.ts`: tratar ausência como negativa fez a interface
 *    acusar todo cliente de não ter WhatsApp.
 *
 * 2. CENTAVOS CONTINUAM CENTAVOS, e o nome do campo diz. O `dinheiro()`
 *    deste repositório recebe REAIS; dividir por 100 na fronteira jogaria
 *    fora a garantia de inteiro que o contrato pede ("centavos inteiros,
 *    nunca float"). Quem exibe usa `dinheiroDeCentavos()`.
 *
 * 3. `Decimal` CONTINUA STRING até a hora de exibir. A Meta atribui
 *    conversão parcial por modelo de atribuição, e float perderia
 *    precisão. Converta para exibir, nunca para guardar.
 * ============================================================
 */

/**
 * O vocabulário INTERNO do pipeline. É chave para ramificar, **nunca**
 * texto de tela — o contrato é explícito: "não use `status` para montar
 * texto. Ele é chave, não cópia."
 *
 * Quem escreve a frase é o backend, e ela chega em `andamento`. A união
 * está aqui para o `switch` de quem precisa ramificar ter exaustividade
 * conferida pelo TypeScript.
 */
export type StatusDaExecucao =
  | "onboarding_em_andamento"
  | "cadastro_completo"
  | "pipeline_texto_rodando"
  | "decidindo_canal"
  | "aguardando_fotos"
  | "aguardando_tagueamento"
  | "gerando_criativo"
  | "estrutura_pronta"
  | "gerado";

/** `GET /negocios/{business_id}/execucao` */
export interface ExecucaoDoNegocio {
  idExecucao: string;
  businessId: string;
  /** chave para ramificar. NÃO renderize. */
  status: StatusDaExecucao | string;
  /**
   * O QUE A TELA MOSTRA. Traduzido no backend de propósito — tradução
   * espalhada diverge, e já divergiu aqui.
   */
  andamento: string;
  /**
   * A bola está com o cliente.
   *
   * Hoje só `aguardando_fotos` devolve `true`, e o contrato pede
   * tratamento visual diferente: se toda etapa tiver o mesmo peso, o
   * cliente para de ler — e para justamente antes da única que precisava
   * dele.
   */
  pedeAcao: boolean;
  atualizadoEm: string;
}

/** Um dia do consolidado. Só aparece se tiver PELO MENOS UM dos lados. */
export interface DiaDoConsolidado {
  /** `YYYY-MM-DD` */
  dia: string;
  /** plataforma. `null` enquanto o coletor da Meta estiver desligado. */
  investiuCentavos: number | null;
  /** conversões medidas. Decimal como string — ver regra 3. */
  pessoasQueChegaram: string | null;
  /** o que o dono informou */
  viraramVenda: number | null;
  voltouCentavos: number | null;
}

/**
 * O que as DUAS rotas de consolidado devolvem em comum.
 *
 * Existe para os dois validadores não divergirem: a rota por execução e a
 * do acumulado do negócio compartilham tudo menos a identificação e os
 * dois campos de auditoria da soma. Dois validadores irmãos copiados
 * divergiriam no primeiro campo novo — e o campo esquecido seria
 * justamente o que ninguém lembra de testar.
 */
export interface ConsolidadoBase {
  /** `YYYY-MM-DD` */
  desde: string;
  ate: string;
  dias: DiaDoConsolidado[];

  investiuCentavos: number | null;
  voltouCentavos: number | null;
  pessoasQueChegaram: string | null;
  vendas: number | null;
  /**
   * `voltou ÷ investiu`, duas casas, **já calculado**. Decimal como
   * string.
   *
   * NÃO RECALCULE NO CLIENTE. O campo existe para a divisão por zero ter
   * um tratamento só — ele vem `null` quando falta um lado ou o
   * investimento é zero.
   */
  retornoPorReal: string | null;
  diasComOsDoisLados: number;
  /**
   * `false` é o estado NORMAL por enquanto: o coletor da Meta existe e
   * está desligado até o App Review. Enquanto for `false`, a tela mostra
   * só o lado do dono. Quando ligar, o mesmo endpoint passa a devolver
   * `true` — sem mudança de contrato.
   */
  temDadoDaPlataforma: boolean;
  /**
   * O dono já respondeu a pergunta de hoje.
   *
   * ============================================================
   * DUAS RESSALVAS ANTES DE USAR ISTO PARA DECIDIR O CARD.
   *
   * 1. **"Hoje" é o fuso de quem?** Se o backend contar em UTC, às 21h de
   *    Brasília já é o dia seguinte lá, e o card reapareceria para um dia
   *    que ele acabou de responder.
   * 2. **A pergunta costuma ser sobre ONTEM.** O contrato diz que `dia` é
   *    "o dia a que a resposta SE REFERE". Se a tela pergunta "quantas
   *    vendas ontem?", quem responde é `dia = ontem`, e um booleano preso
   *    a "hoje" responde outra pergunta.
   *
   * Por isso quem decide o card usa `jaRespondeu(consolidado, dia)` de
   * `./resposta.ts`, que pergunta pelo DIA que a tela vai perguntar e lê
   * os campos do dono. Este campo fica como conferência cruzada — e a
   * divergência entre os dois é sinal, não empate.
   * ============================================================
   *
   * ============================================================
   * `null` = HOJE ESTÁ FORA DA JANELA CONSULTADA. Não é "não respondeu".
   *
   * MEDIDO em 01/09/2026 contra a rota real: com `desde=ate=2026-08-31`,
   * o campo volta `null`; sem janela, volta `false`. Faz sentido — ele não
   * tem como responder sobre um dia que não foi consultado.
   *
   * Isto derrubou a pergunta diária inteira: a Server Action consulta com
   * `desde=ate=ONTEM` para ler o que já está gravado, e essa janela nunca
   * contém hoje. O validador exigia booleano, reprovava o corpo, e a ação
   * respondia "não consegui confirmar" para toda resposta — sem nada no
   * log dizendo que o motivo era um `null` legítimo.
   *
   * É a mesma família do `null` NÃO É ZERO da regra 1: ausência de
   * informação e informação negativa são coisas diferentes, e aqui a
   * ausência tem uma terceira causa — a pergunta não foi feita.
   * ============================================================
   */
  respondeuHoje: boolean | null;
  /**
   * O ECO do `dia_da_pergunta` que foi mandado no query.
   *
   * ============================================================
   * SEM O ECO NÃO DÁ PARA LER O `respondeuNoDia`.
   *
   * As três combinações, e cada uma quer dizer outra coisa:
   *
   *   null + null       não pedimos
   *   data + true/false  respondeu / não respondeu — resposta de verdade
   *   data + null        o dia está FORA do período consultado
   *
   * Sem o eco, "não perguntei" e "perguntei e o período não cobre" viriam
   * as duas como `null` e seriam indistinguíveis.
   *
   * **CONFIRA QUE O ECO BATE COM O QUE VOCÊ PEDIU** antes de acreditar no
   * `respondeuNoDia`: eco diferente quer dizer que a resposta é sobre
   * outro dia. Ver `respostaConfiavelSobre()` em `./resposta.ts`.
   * ============================================================
   */
  diaDaPergunta: string | null;
  /** ver `diaDaPergunta` — só é legível junto com o eco */
  respondeuNoDia: boolean | null;
}

/** `GET /execucoes/{id}/consolidado` — uma rodada do pipeline. */
export interface Consolidado extends ConsolidadoBase {
  idExecucao: string;
}

/**
 * `GET /negocios/{business_id}/consolidado` — o acumulado do negócio.
 *
 * ============================================================
 * OS DOIS LADOS SE COMPORTAM AO CONTRÁRIO NO MESMO DIA.
 *
 * - a MÉTRICA da plataforma **soma**: duas campanhas no ar gastaram as
 *   duas, e o total do dia é a soma;
 * - a RESPOSTA DO DONO **não soma**: ele responde "quantas vendas hoje"
 *   uma vez por execução, sobre o MESMO fato do mundo.
 *
 * Somar os dois dobraria a receita — e o erro superestima o retorno, que
 * é o lado errado para errar quando o número na tela é "voltou R$ X".
 *
 * A rota resolve: uma resposta por dia, execução mais recente vence.
 * ============================================================
 */
export interface ConsolidadoDoNegocio extends ConsolidadoBase {
  businessId: string;
  /** quantas execuções entraram na soma */
  execucoesSomadas: number;
  /**
   * **`> 0` É DEFEITO DE FLUXO, NÃO DE SOMA.** Significa que a varredura
   * perguntou duas vezes ao mesmo dono no mesmo dia. A soma já está
   * correta — a mais recente venceu — mas alguém perguntou duas vezes.
   *
   * Vai para diagnóstico, **nunca** para a tela do cliente: ele não tem o
   * que fazer com isso, e o problema é nosso.
   */
  diasComRespostaDeMaisDeUmaExecucao: number;
}

/**
 * O corpo do `POST /execucoes/{id}/resposta-do-dono`.
 *
 * ============================================================
 * `vendas` E `receitaCentavos` SÃO OPCIONAIS SEPARADAMENTE.
 *
 * É a regra mais importante do contrato. "Umas 3" o dono responde de
 * cabeça; "quanto deu" exige contar. Aceitar só a primeira é o caso
 * NORMAL, não a exceção.
 *
 * E o botão "não sei" manda `null`, **nunca `0`**.
 * ============================================================
 */
export interface RespostaDoDono {
  /** `YYYY-MM-DD` — o dia a que a resposta SE REFERE, não o de hoje. */
  dia: string;
  /**
   * ============================================================
   * AUSENTE ≠ `null`, E A DIFERENÇA É O QUE PROTEGE O DADO.
   *
   * Desde o merge por campo (backend, 01/09/2026):
   *
   *   campo AUSENTE  → preserva o que está no servidor
   *   `null`         → APAGA de propósito ("não sei")
   *   número         → grava. `0` é resposta, não ausência.
   *
   * Por isso são opcionais no tipo: omitir é uma das três coisas que se
   * pode querer dizer, e um `number | null` obrigatório tornaria essa
   * impossível de expressar.
   * ============================================================
   */
  vendas?: number | null;
  receitaCentavos?: number | null;
  /**
   * O texto EXATO que a tela mostrou. Obrigatório, e é texto, não código.
   *
   * A pergunta vai mudar, e uma resposta só é interpretável junto da
   * pergunta que a produziu: "quantas viraram venda?" e "quantas pessoas
   * te chamaram?" dão números diferentes.
   */
  pergunta: string;
  origem?: "app" | "whatsapp" | "gestor";
}
