/**
 * A cadeia do "o que falta", e a frase de cada elo — num lugar só.
 *
 * Desenho em `docs/estado-do-cliente.md`.
 *
 * SEM `server-only`, de propósito: não há segredo aqui, e a trilha do
 * onboarding precisa dos tipos. Quem lê o banco é `./cliente.ts`; este
 * módulo é função pura sobre a medida que ele entrega.
 *
 * ============================================================
 * POR QUE ISTO É PURO, E NÃO UM `if` DENTRO DE CADA TELA.
 *
 * Em 20/08/2026 quatro telas responderam quatro coisas diferentes para "o
 * que falta pra sair anúncio?", na mesma conta, no mesmo minuto — uma
 * delas afirmando que a IA não conhecia o negócio de um cliente cujo
 * cadastro estava completo e cuja execução já tinha sido criada. Nenhuma
 * das quatro consultava a mesma coisa.
 *
 * Ser função pura sobre uma medida, e não uma leitura de banco, é o que
 * torna os dois lados testáveis: `montarEtapas(medida, agora)` roda num
 * script com `agora` dois dias à frente, e o ramo em que a gente admite a
 * dívida aparece sem ninguém esperar dois dias. Um corte de tempo que só
 * dá para ver esperando é um corte que ninguém confere.
 * ============================================================
 */

import type { ResumoDePendencias } from "@/lib/cadastro/pendencias";
import type { ExecucaoDoCliente } from "@/lib/pipeline/relogios";
import type { ExecucaoDoNegocio } from "@/lib/dia-seguinte/tipos";

/**
 * De quem é a vez. TRÊS valores, não dois — e a diferença entre os dois
 * últimos é o ponto.
 *
 * "A gente está montando sua campanha" e "o Facebook está aprendendo quem é
 * seu cliente" são fatos diferentes e o cliente faz coisas diferentes com
 * eles: o primeiro ele cobra da gente, o segundo ele não cobra de ninguém.
 * Uma tela que só sabe dizer "não é sua vez" deixa ele sem saber de quem é.
 */
export type QuemTemABola = "cliente" | "nos" | "facebook";

export type IdDeEtapa =
  | "cadastro"
  | "conexao"
  | "peca"
  | "aprovacao"
  | "no_ar"
  | "numeros";

export interface Acao {
  rotulo: string;
  href: string;
}

export interface Etapa {
  id: IdDeEtapa;
  concluida: boolean;
  bola: QuemTemABola;
  /**
   * COMO A ETAPA SE CHAMA — substantivo, não chamado de ação.
   *
   * Existe porque o `titulo` é escrito para o estado PENDENTE dela: "Falta
   * conectar sua conta" é a frase certa no herói e a frase errada numa
   * lista, onde a mesma etapa aparece já resolvida. Numa conta real a lista
   * mostrava "Falta conectar sua conta · Já está feito", que é uma
   * contradição na mesma linha.
   *
   * `nome` funciona nos três estados porque não afirma nada sobre o estado.
   */
  nome: string;
  /**
   * A frase do herói. Nunca nome de coluna, nunca nome de campo da API.
   *
   * **SÓ TEM SENTIDO ENQUANTO `concluida` É FALSO.** Ela é escrita para o
   * estado pendente — e na etapa 1, que delega a copy ao
   * `resumirPendencias`, ela é literalmente STRING VAZIA quando o cadastro
   * fecha (aquele módulo não tem frase para "não falta nada", porque nunca
   * precisou renderizar isso). Quem for mostrar uma etapa concluída usa
   * `nome`, não isto.
   */
  titulo: string;
  corpo: string;
  /**
   * O que a tela oferece.
   *
   * **Nulo quando a bola não é do cliente**, com uma exceção: quando a bola
   * é nossa E já passou do prazo, a ação é falar com a gente. É a mesma
   * regra do `resumirPendencias` — cobrar do cliente uma coisa que depende
   * de nós é a versão educada de culpá-lo, mas deixá-lo sem canal quando a
   * gente está devendo é pior.
   */
  acao: Acao | null;
  /** desde quando esta etapa está parada, em ISO. Só quando dá para saber. */
  desde?: string;
  /** a gente passou do prazo e a etapa parou de explicar e admitiu */
  admitindo: boolean;
}

// ------------------------------------------------------------------ prazos

/**
 * Quantos dias até a tela parar de explicar e admitir, por etapa.
 *
 * ============================================================
 * DOIS E QUATRO SÃO ESCOLHA. NINGUÉM MEDIU.
 *
 * Mesma honestidade do aviso que abre `lib/pipeline/relogios.ts`: não
 * existe medição da duração real de um pipeline nesta base. Estes cortes
 * são a régua do CLIENTE, e ela é deliberadamente mais larga que a régua
 * do operador (90 minutos, em `relogios.ts`) — o operador pode agir sobre
 * a suspeita, abrir a execução e ver onde parou; o cliente só pode
 * desconfiar. Admitir cedo demais ensina a desconfiar de um sistema que
 * estava bem, e esse aprendizado não se desfaz.
 *
 * O prazo da etapa 1 NÃO está aqui: ele é o `DIAS_ATE_TROCAR_DE_DONO` do
 * `pendencias.ts`, são 5 dias, e é o único que não é chute — vem da janela
 * de arrependimento de 7 dias do art. 49 do CDC. Ver o motivo escrito lá.
 * ============================================================
 */
export const DIAS_ATE_ADMITIR_PECA = 2;
export const DIAS_ATE_ADMITIR_PUBLICACAO = 2;

/**
 * QUATRO, e não dois, porque o vazio aqui é legítimo por mais tempo: o
 * `/inicio` já ensina ao cliente que o aprendizado do Facebook leva de 2 a
 * 3 dias. Admitir no dia 2 contradiria o que a própria tela acabou de
 * explicar.
 */
export const DIAS_ATE_ADMITIR_NUMEROS = 4;

const WHATSAPP_PECA =
  "https://wa.me/5521936182176?text=Oi!%20Meu%20cadastro%20est%C3%A1%20completo%20e%20meu%20an%C3%BAncio%20ainda%20n%C3%A3o%20saiu.";

const WHATSAPP_NUMEROS =
  "https://wa.me/5521936182176?text=Oi!%20Meu%20an%C3%BAncio%20est%C3%A1%20no%20ar%20e%20eu%20ainda%20n%C3%A3o%20vejo%20n%C3%BAmero%20nenhum.";

// -------------------------------------------------------------- auxiliares

function diasDesde(iso: string | undefined | null, agora: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (agora.getTime() - t) / 86_400_000;
}

/**
 * Passou do prazo?
 *
 * **Sem data, devolve `false`.** Ausência de data não é prova de que passou
 * do tempo — é ausência de informação, e o projeto já pagou por tratar as
 * duas como a mesma coisa (o `false` que era "não consegui verificar"
 * acusou todo cliente de não ter WhatsApp). Errar para "ainda não passou" é
 * o lado que só atrasa uma admissão; errar para o outro é acusar a gente de
 * uma dívida que talvez não exista.
 */
function passouDoPrazo(
  desde: string | undefined | null,
  dias: number,
  agora: Date,
): boolean {
  const d = diasDesde(desde, agora);
  return d !== null && d >= dias;
}

function dataCurta(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

// ---------------------------------------------------------------- a medida

/**
 * O que `./cliente.ts` mede no banco. Só fato — nenhuma frase, nenhuma
 * decisão de ordem.
 */
export interface MedidaDoCliente {
  temNegocio: boolean;
  /** o veredito do cadastro, já em texto, vindo de `resumirPendencias` */
  cadastro: ResumoDePendencias;
  conexaoAtiva: boolean;
  /** `businesses.cadastro_iniciado_em` — quando a gente pegou a bola */
  cadastroEnviadoEm: string | null;
  /**
   * A execução do pipeline, quando existe. `null` é o caso normal de quem
   * nunca disparou — e faz a cadeia se comportar como antes do lote F.
   *
   * **Ela NÃO decide se uma etapa está concluída** (Decisão 13 da
   * `arquitetura.md`). Quem decide isso é o artefato: peça pronta é linha
   * em `creatives` com `copy` escrita, que é o que o cliente pode ver e
   * aprovar. O status da execução diz de quem é a bola e se a coisa está
   * andando — nunca uma segunda opinião sobre se ela acabou.
   */
  execucao: ExecucaoDoCliente | null;
  /** peças de anúncio com texto já escrito pela IA */
  pecasProntas: number;
  /** peças esperando o "sim" do cliente */
  pecasParaAprovar: number;
  /** a campanha mais nova, criada e ainda não publicada */
  campanhaCriadaEm: string | null;
  /** alguma publicação parou em `failed` */
  publicacaoFalhou: boolean;
  /** a publicação mais antiga que está no ar */
  publicadaEm: string | null;
  /** houve gasto nos últimos 7 dias */
  temNumero: boolean;
  /**
   * A execução como o BACKEND a vê — `GET /negocios/{id}/execucao`.
   *
   * ============================================================
   * PREFERIDA SOBRE A LOCAL, E O MOTIVO NÃO É QUALIDADE DO DADO.
   *
   * A `execucao` acima é lida de `execucoes` por `service_role`, e essa
   * leitura MORRE quando o cliente admin não está configurado. Em 02/09
   * isso aconteceu num preview: a `/inicio` respondeu 200 com a execução
   * nula, caiu em `sem_execucao`, e disse "a gente está montando o seu
   * primeiro anúncio" para um cliente cuja execução estava em
   * `aguardando_fotos` — ou seja, para quem a gente estava esperando.
   *
   * Esta fonte chega por HTTP com o token do backend e **não precisa de
   * admin nenhum**. Preferi-la tira a decisão de "de quem é a bola" da
   * dependência que falhou.
   * ============================================================
   */
  execucaoDoBackend: ExecucaoDoNegocio | null;
  /**
   * Nenhuma das duas fontes deu resposta legível.
   *
   * NÃO é "não tem execução": 404 do backend é resposta, e quer dizer que
   * não há execução mesmo. Isto aqui é não saber — e a tela diz isso, em
   * vez de escolher a frase mais otimista das duas.
   */
  execucaoIlegivel: boolean;
}

// ----------------------------------------------------------------- a cadeia

/**
 * A cadeia inteira, em ordem, com a bola de cada elo.
 *
 * A ORDEM É O CONTEÚDO. "O que falta" não é lista, é sequência: sem
 * cadastro não adianta ter foto, sem conta conectada não adianta ter peça.
 * O cliente precisa saber qual é o PRÓXIMO passo, não os seis pendentes —
 * e é por isso que quem consome usa `proximo`, e não `etapas.filter(...)`.
 */
export function montarEtapas(m: MedidaDoCliente, agora: Date): Etapa[] {
  return [
    etapaCadastro(m),
    etapaConexao(m),
    etapaPeca(m, agora),
    etapaAprovacao(m),
    etapaNoAr(m, agora),
    etapaNumeros(m, agora),
  ];
}

/**
 * Etapa 1 — o cadastro. **Esta etapa não escreve copy: ela delega.**
 *
 * O dono da frase é `lib/cadastro/pendencias.ts`, e continua sendo. Lá
 * moram duas regras que custaram caro — o prazo de 5 dias em que o bloco
 * troca de dono, e a proibição de dar botão de "responder de novo" a quem
 * disse que não sabe. Reescrever qualquer uma delas aqui criaria o segundo
 * dono que este lote existe para eliminar.
 */
function etapaCadastro(m: MedidaDoCliente): Etapa {
  const r = m.cadastro;

  // A bola é nossa nos dois casos em que o `resumirPendencias` para de
  // cobrar do cliente: quando só restam "não sei" (sem ação, de propósito)
  // e quando já passou dos 5 dias e a dívida virou nossa.
  const bola: QuemTemABola = r.nossaDivida || r.acao === null ? "nos" : "cliente";

  return {
    id: "cadastro",
    concluida: r.vazio,
    bola,
    nome: "Seu cadastro",
    titulo: r.titulo,
    corpo: r.corpo,
    acao: r.acao,
    admitindo: r.nossaDivida,
  };
}

function etapaConexao(m: MedidaDoCliente): Etapa {
  return {
    id: "conexao",
    concluida: m.conexaoAtiva,
    bola: "cliente",
    nome: "A conexão da sua conta",
    titulo: "Falta conectar sua conta",
    corpo:
      "É pela sua conta que o anúncio sai — com o nome e a cara do seu negócio, não com os nossos. Leva menos de um minuto, e você pode desfazer quando quiser.",
    acao: { rotulo: "Conectar minha conta", href: "/conectar" },
    admitindo: false,
  };
}

/**
 * Em que pé está a montagem, do ponto de vista do que dá para CONTAR ao
 * cliente. É o mapa dos seis `EstadoExecucao` do backend reduzido às
 * situações que mudam a frase — `docs/tela-processando.md` §2.2.
 *
 * `sem_execucao` não é "erro": é quem nunca disparou, quem disparou e a
 * linha ainda não nasceu, e quem a gente não conseguiu ler. As três dizem
 * o que a cadeia sempre disse, que é o comportamento anterior ao lote F.
 */
type FaseDaPeca =
  | "ilegivel"
  | "sem_execucao"
  | "na_fila"
  | "rodando"
  | "conferindo"
  | "esperando_foto";

/**
 * A fase, a partir do STATUS — venha ele de onde vier.
 *
 * O vocabulário é o mesmo nas duas fontes (os nove estados do contrato),
 * então quem chama escolhe a fonte e esta função não precisa saber qual é.
 */
function faseDoStatus(status: string): FaseDaPeca {
  switch (status) {
    case "cadastro_completo":
      return "na_fila";
    case "aguardando_fotos":
      return "esperando_foto";
    case "estrutura_pronta":
    case "gerado":
      return "conferindo";
    case "pipeline_texto_rodando":
    case "gerando_criativo":
      return "rodando";
    default:
      // ESTADO NOVO DO BACKEND CAI EM "rodando", NUNCA EM "esperando_foto".
      // Um valor fora dos seis não pode quebrar a tela — é a mesma regra do
      // `lib/backend/cadastro.ts`. Mas o lado para o qual se erra não é
      // indiferente: errar para "a bola é nossa" inventa trabalho para nós;
      // errar para o outro lado cobra do cliente uma coisa que ele não
      // deve. Só um dos dois erros culpa quem não tem culpa.
      return "rodando";
  }
}

/**
 * ============================================================
 * O BACKEND VENCE, E A LOCAL É RESERVA. Decisão de 02/09.
 *
 * Ordem: a execução do backend, depois a local, depois o não-saber.
 *
 * A local não é pior — é mais frágil: ela depende do cliente admin, e foi
 * exatamente ele que faltou num preview e fez a tela dizer "a gente está
 * montando" para quem estava sendo esperado.
 *
 * `ilegivel` só acontece quando NENHUMA das duas respondeu. Um 404 do
 * backend não cai aqui: 404 é resposta, e quer dizer que não há execução.
 * ============================================================
 */
function faseDaPeca(m: MedidaDoCliente): FaseDaPeca {
  if (m.execucaoDoBackend) return faseDoStatus(m.execucaoDoBackend.status);
  if (m.execucao) return faseDoStatus(m.execucao.status);
  return m.execucaoIlegivel ? "ilegivel" : "sem_execucao";
}

/**
 * Etapa 3 — a peça. **A bola é nossa, e é a etapa em que o cliente da conta
 * medida em 20/08 estava parado havia um dia sem que nenhuma tela dissesse
 * isso.**
 *
 * ============================================================
 * O RELÓGIO CONTA DO ÚLTIMO MOVIMENTO, NÃO DO DISPARO (lote F).
 *
 * Antes contava de `businesses.cadastro_iniciado_em`, que **nunca anda**:
 * ele marca o instante do disparo e morre ali. Enquanto o pipeline não
 * andava os dois eram iguais, e por isso o defeito ficou invisível — na
 * conta medida em 20/08 os dois carimbos diferem por 1,7 segundo. No dia
 * em que o n8n reagir eles divergem, e a versão antiga passaria a acusar
 * de dívida um pipeline que está trabalhando normalmente.
 *
 * `execucoes.atualizado_em` é a única coluna que responde "quando foi a
 * última vez que alguma coisa aconteceu". `cadastro_iniciado_em` continua
 * como fallback, para quem não tem execução legível.
 *
 * BURACO CONHECIDO, escrito em vez de tapado: um relógio que se reinicia
 * nunca dispara. Um pipeline que se mexe a cada 47 horas mantém o cliente
 * esperando para sempre. Não há segundo corte hoje — seria o terceiro
 * número inventado do projeto, e o cenário exige um pipeline que se mexe
 * periodicamente por dias, quando o que existe medido é um que nunca se
 * mexeu. O operador vê o caso pela `/saude-meta`, na régua de 90 minutos.
 * O conserto, quando aparecer: admitir por silêncio OU por um teto
 * absoluto desde `cadastro_iniciado_em`. Ver `docs/tela-processando.md`
 * §3.3.
 * ============================================================
 *
 * POR QUE O PRAZO NÃO SAI DO `andamentoDaExecucao`. Aqueles 20 e 90
 * minutos são a régua do OPERADOR, e ele pode agir sobre a suspeita —
 * abrir a execução, ver onde parou. O cliente só pode desconfiar, e
 * admitir cedo demais ensina a desconfiar de um sistema que estava bem.
 * O que a gente reusa de lá é uma coisa só: quais status são espera DELE.
 */
function etapaPeca(m: MedidaDoCliente, agora: Date): Etapa {
  const fase = faseDaPeca(m);
  const quando = dataCurta(m.cadastroEnviadoEm);

  // Peça pronta é peça com texto escrito, em `creatives`. O status da
  // execução NÃO fecha esta etapa — Decisão 13. `estrutura_pronta` quer
  // dizer que o backend terminou e a execução entrou na fila de revisão do
  // gestor (`GET /execucoes-em-revisao`); entre isso e o cliente ter uma
  // peça na mão existe um humano nosso. Se ele fechasse a etapa, a cadeia
  // avançaria e o `/inicio` diria "tem peça esperando você" com o
  // `/aprovar` vazio — a verdade vazia do `estado-do-cliente.md` §11.3
  // reintroduzida pela porta dos fundos.
  const concluida = m.pecasProntas > 0;

  // ESPERA DELE NÃO É ESPERA NOSSA, e sai antes de qualquer relógio.
  //
  // Único estado dos seis em que a bola é do cliente. Sem este ramo, a
  // cadeia diria "a gente está montando o seu primeiro anúncio" para quem
  // está sendo esperado — a frase proibida, na tela para onde o onboarding
  // manda. O `esperando_cliente` do `andamentoDaExecucao` é a fonte de
  // quais status são espera dele, para essa regra ter um dono só.
  //
  // A AÇÃO É FALAR COM A GENTE, E NÃO "SUBIR FOTO". O upload da `/conta`
  // grava em `storage` + `creatives` e não chama
  // `POST /execucoes/{id}/fotos` — ninguém liga os dois lados. Um botão
  // "mandar foto" aqui levaria o cliente a fazer uma coisa que não
  // destrava nada, e botão que não resolve é pior que silêncio. O buraco
  // está registrado em `docs/buraco-fotos-execucao.md`.
  // ============================================================
  // `pede_acao` VENCE. Decisão do Victor, 01/09.
  //
  // Ele é mais específico e mais novo que a nossa leitura de status — e é
  // o campo que o backend criou justamente para dizer de quem é a bola.
  // Se ele diz que a bola é do cliente e a nossa fase não concorda, quem
  // manda é ele, e a frase vem do `andamento`, que o backend traduz.
  //
  // Sem este ramo, `pede_acao` era só uma linha de log: a decisão estava
  // tomada e a tela continuava decidindo sozinha.
  // ============================================================
  if (m.execucaoDoBackend?.pedeAcao === true && fase !== "esperando_foto") {
    return {
      id: "peca",
      concluida,
      bola: "cliente",
      nome: "A peça do seu anúncio",
      titulo: m.execucaoDoBackend.andamento,
      corpo:
        "A montagem chegou num ponto que precisa de você. Chama a gente no WhatsApp que resolvemos junto — sem você precisar mexer em nada sozinho.",
      acao: { rotulo: "Falar com a gente", href: WHATSAPP_PECA },
      desde: m.execucaoDoBackend.atualizadoEm,
      admitindo: false,
    };
  }

  if (fase === "esperando_foto") {
    return {
      id: "peca",
      concluida,
      bola: "cliente",
      nome: "A peça do seu anúncio",
      titulo: "Seu anúncio está esperando uma foto sua",
      corpo:
        "A montagem chegou num ponto que pede uma foto do seu negócio, e daqui a gente não consegue destravar sozinho. É rápido: chama a gente no WhatsApp que resolvemos junto com você, sem você precisar mexer em nada sozinho.",
      acao: { rotulo: "Falar com a gente", href: WHATSAPP_PECA },
      desde: m.execucao?.atualizadoEm ?? undefined,
      admitindo: false,
    };
  }

  // O relógio do cliente, sobre o último movimento. Ver o bloco do
  // cabeçalho: `atualizado_em` primeiro, `cadastro_iniciado_em` de reserva.
  // O relógio segue a mesma ordem da fase: backend, local, reserva. Com o
  // admin fora, contar de `cadastro_iniciado_em` adiantava o prazo em dias
  // e fazia a tela admitir dívida antes da hora.
  const desdeORelogio =
    m.execucaoDoBackend?.atualizadoEm ?? m.execucao?.atualizadoEm ?? m.cadastroEnviadoEm;
  const admitindo = passouDoPrazo(desdeORelogio, DIAS_ATE_ADMITIR_PECA, agora);

  if (admitindo) {
    return {
      id: "peca",
      concluida,
      bola: "nos",
      nome: "A peça do seu anúncio",
      titulo: "A gente está devendo o seu primeiro anúncio",
      // A SEGUNDA FRASE VEIO DA `/processando`, e é a única coisa que
      // aquela tela tinha e esta variante não. Para um cliente de R$490/mês
      // que ficou dois dias sem anúncio, "não te cobramos por isso" é a
      // primeira pergunta, não a segunda.
      corpo: `Seu cadastro chegou aqui${quando ? ` em ${quando}` : ""} e a gente ainda não te mandou nenhuma peça para aprovar. Já passou do tempo, e isso é nosso — não é nada que você deixou de fazer. Nada foi cobrado e nenhum anúncio foi ao ar: a montagem parou antes de qualquer anúncio existir. Se quiser puxar agora, é só chamar.`,
      acao: { rotulo: "Falar com a gente", href: WHATSAPP_PECA },
      desde: desdeORelogio ?? undefined,
      admitindo: true,
    };
  }

  // As três fases em que a bola é nossa e está dentro do prazo. A diferença
  // entre elas é o que muda: "chegou até a gente" descreve uma FILA;
  // "a IA está escrevendo" descreve TRABALHO ACONTECENDO. Dizer a segunda
  // quando é a primeira é a mentira que o lote F existe para tirar da tela
  // — e é o estado real da única execução de cliente que existe hoje.
  const porFase: Record<
    Exclude<FaseDaPeca, "esperando_foto">,
    { titulo: string; corpo: string }
  > = {
    na_fila: {
      titulo: "Seu cadastro chegou até a gente",
      corpo: `Seu cadastro está completo${quando ? ` desde ${quando}` : ""} e já está aqui, na fila. Quando a vez dele chegar, a IA escreve o texto e escolhe a arte do seu primeiro anúncio — e ele vem para você aprovar. Nada vai ao ar sem o seu sim.`,
    },
    rodando: {
      titulo: "A gente está montando o seu primeiro anúncio",
      corpo: `Seu cadastro está completo${quando ? ` desde ${quando}` : ""} e agora é com a gente: a IA escreve o texto e escolhe a arte. Quando ficar pronto, chega aqui para você aprovar — nada vai ao ar sem o seu sim.`,
    },
    conferindo: {
      titulo: "Seu anúncio ficou pronto e a gente está conferindo",
      corpo:
        "A IA terminou de montar. Antes de mandar para você, alguém da nossa equipe lê o texto e olha a arte — é o que evita você receber uma peça com erro. Passando por aí, ela chega aqui para o seu sim.",
    },
    // ============================================================
    // NÃO CONSEGUIMOS LER — E A TELA DIZ ISSO.
    //
    // Antes de 02/09 este caso caía em `sem_execucao` e a tela afirmava
    // "a gente está montando o seu primeiro anúncio". Era a frase mais
    // otimista das possíveis, escolhida por não saber — e num preview ela
    // foi dita para um cliente que estava sendo ESPERADO.
    //
    // SEM DETALHE TÉCNICO: "admin indisponível" não é problema dele, e o
    // nome da variável de ambiente não o ajuda em nada. Mas também sem
    // fingir que está tudo normal — o que ele precisa saber é que o que
    // está na tela pode estar incompleto, e que não é ele que resolve.
    // ============================================================
    ilegivel: {
      titulo: "Não consegui carregar o andamento do seu anúncio agora",
      corpo:
        "O que está aqui pode estar incompleto — não é nada que você tenha feito, e não some nada por causa disso. Atualize daqui a pouco; se continuar assim, chama a gente.",
    },
    // Sem execução legível, a cadeia diz exatamente o que dizia antes do
    // lote F. É o que torna esta mudança uma adição, e não uma troca.
    sem_execucao: {
      titulo: "A gente está montando o seu primeiro anúncio",
      corpo: `Seu cadastro está completo${quando ? ` desde ${quando}` : ""} e agora é com a gente: a IA escreve o texto e escolhe a arte. Quando ficar pronto, chega aqui para você aprovar — nada vai ao ar sem o seu sim.`,
    },
  };

  return {
    id: "peca",
    concluida,
    bola: "nos",
    nome: "A peça do seu anúncio",
    titulo: porFase[fase].titulo,
    corpo: porFase[fase].corpo,
    // SEM AÇÃO. Não há o que ele fazer, e um botão aqui inventaria trabalho
    // para quem está esperando a gente.
    acao: null,
    desde: desdeORelogio ?? undefined,
    admitindo: false,
  };
}

function etapaAprovacao(m: MedidaDoCliente): Etapa {
  const uma = m.pecasParaAprovar === 1;
  return {
    id: "aprovacao",
    concluida: m.pecasParaAprovar === 0,
    bola: "cliente",
    nome: "A sua aprovação",
    titulo: uma ? "Tem uma peça esperando você" : "Tem peça esperando você",
    corpo: uma
      ? "A IA montou seu anúncio — o texto e a foto. Nada vai ao ar antes de você ler e dizer que sim."
      : `A IA montou ${m.pecasParaAprovar} peças. Nada vai ao ar antes de você ler e dizer que sim, uma de cada vez.`,
    acao: { rotulo: uma ? "Ver a peça" : "Ver as peças", href: "/aprovar" },
    admitindo: false,
  };
}

function etapaNoAr(m: MedidaDoCliente, agora: Date): Etapa {
  // A FALHA NÃO ESPERA O PRAZO. Os dois dias existem para não acusar a
  // gente de uma dívida que talvez não exista; aqui ela existe e está
  // registrada em `campaigns.publish_state`. Fazer o cliente esperar dois
  // dias para ler o que o banco já sabe seria esconder.
  if (m.publicacaoFalhou) {
    return {
      id: "no_ar",
      concluida: false,
      bola: "nos",
      nome: "O anúncio no ar",
      titulo: "Uma publicação não deu certo",
      corpo:
        "Nada foi ativado e nenhuma verba foi gasta. O motivo está na linha do anúncio, e resolver é com a gente.",
      acao: { rotulo: "Falar com a gente", href: WHATSAPP_PECA },
      desde: m.campanhaCriadaEm ?? undefined,
      admitindo: true,
    };
  }

  const admitindo = passouDoPrazo(
    m.campanhaCriadaEm,
    DIAS_ATE_ADMITIR_PUBLICACAO,
    agora,
  );

  return {
    id: "no_ar",
    concluida: m.publicadaEm !== null,
    bola: "nos",
    nome: "O anúncio no ar",
    titulo: admitindo
      ? "Seu anúncio devia estar no ar e não está"
      : "A gente está colocando seu anúncio no ar",
    corpo: admitindo
      ? "Você aprovou a peça e ela ainda não subiu. Isso é com a gente, e já passou do tempo — nenhuma verba foi gasta enquanto isso."
      : "A peça está aprovada e agora é a gente publicando no Facebook. Costuma levar poucos minutos.",
    acao: admitindo ? { rotulo: "Falar com a gente", href: WHATSAPP_PECA } : null,
    desde: m.campanhaCriadaEm ?? undefined,
    admitindo,
  };
}

/**
 * Etapa 6 — os números. A única cuja bola é do FACEBOOK.
 *
 * O texto normal é o do "dia zero" que já existia no `/inicio`, trazido
 * para cá em vez de reescrito: era bom, foi escrito com cuidado, e ter
 * dois donos da mesma tela é o defeito que este lote conserta.
 *
 * Passado o prazo, a bola MUDA DE MÃO. Um anúncio no ar há quatro dias sem
 * número nenhum não é mais o Facebook aprendendo — é a gente não tendo
 * trazido o dado, e a tela passa a dizer isso.
 */
function etapaNumeros(m: MedidaDoCliente, agora: Date): Etapa {
  const admitindo = passouDoPrazo(m.publicadaEm, DIAS_ATE_ADMITIR_NUMEROS, agora);

  if (admitindo) {
    return {
      id: "numeros",
      concluida: m.temNumero,
      bola: "nos",
      nome: "Os primeiros números",
      titulo: "Faz dias que seu anúncio está no ar e nenhum número chegou",
      corpo:
        "O aprendizado do Facebook leva de 2 a 3 dias, e já passou disso. Se ainda não há número aqui, o problema é nosso e a gente vai atrás.",
      acao: { rotulo: "Falar com a gente", href: WHATSAPP_NUMEROS },
      desde: m.publicadaEm ?? undefined,
      admitindo: true,
    };
  }

  return {
    id: "numeros",
    concluida: m.temNumero,
    bola: "facebook",
    nome: "Os primeiros números",
    titulo: "O Facebook está aprendendo quem é o seu cliente",
    corpo:
      "Nos primeiros dias ele mostra seu anúncio para perfis diferentes de pessoas só para descobrir quem responde. Enquanto esse teste roda, o custo fica mais alto e a venda demora — não porque a campanha está ruim, mas porque ela ainda não sabe para quem falar. Costuma levar de 2 a 3 dias.",
    acao: null,
    desde: m.publicadaEm ?? undefined,
    admitindo: false,
  };
}

// ------------------------------------------------------------------ trilha

/**
 * Os blocos acesos da trilha do passo 1, de 6.
 *
 * São os SEIS OBRIGATÓRIOS do `/cadastro` — nome, o que vende, ticket,
 * custo, lucro e verba — e não uma tabela indexada pela última pergunta
 * respondida. A tabela antiga (`MIN_RESTANTES`/`BLOCOS_ACESOS` em
 * `perguntas.ts`) não enxergava o bloco 2 nem a `/verba`: numa conta com o
 * cadastro fechado e a execução já criada ela continuava dizendo 4 de 6.
 *
 * **Um "não sei" ACENDE o bloco.** Ele respondeu; a bola daquele campo é
 * nossa. Deixar apagado seria cobrar dele a conversa que a gente é que deve
 * — a mesma disciplina do `nao_sei` em `pendencias.ts`.
 */
export function blocosDaTrilha(cadastro: ResumoDePendencias): number {
  if (cadastro.vazio) return 6;
  const doCliente = cadastro.itens.length - cadastro.quantosNaoSei;
  return Math.max(0, 6 - doCliente);
}

/**
 * A tarja acima da frase, por quem tem a bola.
 *
 * Mora aqui e não na tela pelo mesmo motivo de todo o resto: é copy, e copy
 * sobre "o que falta" tem um dono só. Uma tela que escrevesse "Seu próximo
 * passo" em cima de uma etapa cuja bola é nossa estaria mentindo no rótulo
 * com o texto certo embaixo.
 */
export function tarja(etapa: Etapa): string {
  if (etapa.admitindo) return "A gente está devendo";
  switch (etapa.bola) {
    case "cliente":
      return "Seu próximo passo";
    case "nos":
      return "Com a gente agora";
    case "facebook":
      return "Por que ainda não há número";
  }
}

// -------------------------------------------------- a etapa vista de lista

/**
 * Onde a etapa está EM RELAÇÃO À ATUAL. Três valores, não dois.
 *
 * ============================================================
 * ESTE É O ERRO QUE A LISTA DO `/inicio` COMETEU, e é o mesmo que este
 * projeto já pagou caro em outro lugar: dois estados onde havia três.
 *
 * A lista perguntava só `etapa.concluida`, e imprimia "Já está feito" para
 * tudo que não estava pendente. Numa conta real isso escreveu "A sua
 * aprovação · Já está feito" para um cliente que nunca aprovou nada — o
 * predicado da etapa (`pecasParaAprovar === 0`) é VERDADE VAZIA quando não
 * existe peça nenhuma para aprovar.
 *
 * Numa cadeia, "não está pendente" tem dois significados incompatíveis:
 * aconteceu, e ainda não chegou a vez. Quem sabe a diferença não é a etapa
 * sozinha — é a POSIÇÃO dela em relação à atual. Uma etapa depois da atual
 * não aconteceu, e o que o predicado dela diz é irrelevante: não dá para
 * ter aprovado uma peça que ainda não existe.
 * ============================================================
 */
export type PosicaoNaCadeia = "feita" | "atual" | "ainda_nao";

export function posicoesDaCadeia(
  etapas: Etapa[],
  atual: Etapa | null,
): Array<{ etapa: Etapa; posicao: PosicaoNaCadeia }> {
  const iAtual = atual ? etapas.findIndex((e) => e.id === atual.id) : etapas.length;
  return etapas.map((etapa, i) => ({
    etapa,
    posicao: i < iAtual ? "feita" : i === iAtual ? "atual" : "ainda_nao",
  }));
}

/**
 * O estado da etapa em uma linha, para a lista.
 *
 * UMA VOZ SÓ. A lista pareia `nome` (substantivo) com estado (afirmação
 * sobre o mundo). Antes ela pareava `titulo` — que é chamado de ação — com
 * estado, e "Falta conectar sua conta · Já está feito" mistura as duas
 * vozes na mesma linha, além de se contradizer.
 *
 * O futuro diz DE QUEM VAI SER a vez, e não só que ainda não chegou: é a
 * mesma informação que o herói dá sobre o presente, e é o que faz a lista
 * ser mapa em vez de enfeite.
 */
export function estadoNaLista(etapa: Etapa, posicao: PosicaoNaCadeia): string {
  if (posicao === "feita") return "Já está feito.";
  if (posicao === "atual") return "É o que está acontecendo agora.";
  switch (etapa.bola) {
    case "cliente":
      return "Ainda não chegou — vai depender de você.";
    case "nos":
      return "Ainda não chegou — vai ser com a gente.";
    case "facebook":
      return "Ainda não chegou — vai depender do Facebook.";
  }
}
