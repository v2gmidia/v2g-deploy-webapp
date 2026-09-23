import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { preVooPorNegocio, type PreVoo } from "@/lib/campanha/pre-voo";
import { validarOrcamento } from "@/lib/meta/orcamento";
export { lerCarimbos, type EstadoDaVeiculacao, type LeituraDosCarimbos } from "./carimbos";

/**
 * A TRAVA DE IDENTIDADE DA ATIVAÇÃO DE CAMPANHA.
 *
 * ============================================================
 * O QUE ESTE ARQUIVO PROTEGE, E POR QUE ELE É DIFERENTE DO RESTO.
 *
 * Toda outra escrita deste app é do DONO sobre o que é dele, e o RLS
 * (`owns_business`) sozinho já separa um cliente do outro. Aqui não:
 *
 *   - quem clica é o OPERADOR, que não possui negócio nenhum;
 *   - sob RLS normal ele não enxerga uma linha sequer de `campaigns`
 *     (`0001_init.sql:419-433`, as quatro políticas por posse);
 *   - então a leitura usa o cliente ADMIN, que ignora RLS.
 *
 * Com o admin na mão, **o que separa a campanha de um cliente da de
 * outro é o `.eq()` escrito à mão** — e mais nada. É o arquétipo que
 * `lib/seguranca/excecoes.ts` descreve sobre `identidade-actions.ts`:
 * *"Apagar aquela linha não quebra teste, typecheck nem build."*
 *
 * Por isso a regra deste arquivo: **o `business_id` sai da linha da
 * campanha, uma vez, e TODA leitura seguinte é escopada por ele.**
 * Nenhuma consulta aqui recebe id vindo do formulário além do
 * `campanhaId` — o negócio nunca é parâmetro de entrada, é consequência.
 * ============================================================
 *
 * ============================================================
 * TRÊS PORTAS, NÃO UMA. O mesmo desenho de `/revisar-perfil`:
 *
 *   1. `proxy.ts` guarda o prefixo `/ativar-campanha` inteiro, por
 *      `OPERADOR_PREFIXES`;
 *   2. a página confere `papel !== "operador" → notFound()`;
 *   3. CADA action chama `operadorOuErro()` na primeira linha do corpo,
 *      antes de ler o `formData`.
 *
 * Uma action nova que esquecesse a 3 ainda precisaria ser importada de
 * fora do prefixo para escapar da 1.
 * ============================================================
 *
 * ESTE ARQUIVO NÃO ATIVA NADA. Ele só reúne o que a pessoa precisa ver
 * antes de decidir. A chamada ao Meta é o Bloco 3.
 *
 * ============================================================
 * POR QUE O CORPO MORA EM `lib/` E NÃO NA `actions.ts`.
 *
 * Duas entradas precisam do mesmo dado: a PÁGINA, que desenha a
 * confirmação a partir do id que vem da URL, e a AÇÃO, que relê tudo
 * imediatamente antes de chamar o Meta. Se cada uma consultasse por
 * conta, elas poderiam discordar — e a que discorda na hora errada é a
 * que gasta dinheiro.
 *
 * É a mesma regra que `lib/campanha/pre-voo.ts` escreve sobre si: *"a
 * tela não decide o que é o pré-voo. Ela recebe o estado resolvido."*
 *
 * O PORTÃO DE PAPEL NÃO ESTÁ AQUI. Quem confere `papel === "operador"` é
 * quem tem requisição na mão: a página e cada action. Esta função
 * responde sobre a campanha que recebe, e confia em quem a chamou — como
 * `preVooPorNegocio()`, e pelo mesmo motivo.
 * ============================================================
 */

/** Por que a ativação não pode ser oferecida agora. */
export type MotivoDeBloqueio =
  /** a campanha não existe, ou o id não é de campanha nenhuma */
  | "campanha_inexistente"
  /** a campanha existe mas não aponta para negócio — não há dono a conferir */
  | "sem_negocio"
  /** o negócio da campanha sumiu do banco */
  | "negocio_inexistente"
  /** ainda não foi publicada no Meta: não há o que ativar */
  | "nao_publicada"
  /** já está ativa */
  | "ja_ativa"
  /** o teto mensal não dá um diário válido */
  | "orcamento"
  /** o pré-voo devolveu bloqueio da Meta */
  | "pre_voo";

export interface ConfirmacaoDeAtivacao {
  ok: true;
  campanhaId: string;
  /** o dono, lido da própria linha da campanha */
  negocioId: string;
  nomeDoCliente: string;
  nomeDaCampanha: string | null;
  /** `publish_state` como está agora no banco */
  estadoAtual: string;
  /** quanto passa a gastar por dia, em centavos */
  diarioCentavos: number;
  /** o teto do mês que originou o diário, em reais */
  mensalReais: number;
  /** o pré-voo relido AGORA, não o que a tela tinha */
  preVoo: PreVoo;
  /** o que impede ativar, se impedir. Vazio = pode oferecer o botão. */
  bloqueios: { motivo: MotivoDeBloqueio; texto: string }[];
  /** carimbo da última ativação, se houve */
  ativadaEm: string | null;
  ativadaPor: string | null;
  pausadaEm: string | null;
  pausadaPor: string | null;
}

export interface ConfirmacaoRecusada {
  ok: false;
  motivo: MotivoDeBloqueio;
  texto: string;
}

const recusa = (motivo: MotivoDeBloqueio, texto: string): ConfirmacaoRecusada => ({
  ok: false,
  motivo,
  texto,
});

/**
 * O QUE O OPERADOR VÊ ANTES DE CONFIRMAR.
 *
 * ============================================================
 * ELA RELÊ TUDO, TODA VEZ. NÃO CONFIA EM ESTADO DE TELA.
 *
 * A tela pode estar aberta há meia hora. Entre ela carregar e o clique
 * acontecer, a conta de anúncio pode ter sido desativada, o token pode
 * ter morrido, o cliente pode ter mudado o teto do mês, e a campanha pode
 * ter sido ativada por outra pessoa do time. Nada disso avisa.
 *
 * Por isso esta função é chamada DUAS vezes: uma para desenhar a
 * confirmação, e de novo dentro da ativação, imediatamente antes da
 * chamada ao Meta (Bloco 3). O que ela devolveu na primeira vez não vale
 * como autorização para a segunda.
 * ============================================================
 *
 * ============================================================
 * O PISO DO META NÃO É CONSULTADO AQUI, e é decisão.
 *
 * `validarOrcamento(teto, piso)` aceita `piso = null`, que quer dizer
 * "não consegui consultar" e pula a checagem de piso — ele NÃO é
 * substituído por um chute. Consultar o piso é uma ida à Meta por conta
 * de anúncio, e esta função roda a cada vez que a tela desenha.
 *
 * Quem confere o piso de verdade é a subida, em `lib/meta/orcamento.ts`,
 * antes da primeira chamada. Aqui o número serve para a pessoa LER quanto
 * vai gastar — e para isso o diário já basta.
 * ============================================================
 */
export async function conferirAntesDeAtivar(
  campanhaId: string,
): Promise<ConfirmacaoDeAtivacao | ConfirmacaoRecusada> {
  const admin = createAdminClient();

  // ---------- 1. a campanha, e SÓ por id ----------
  const { data: campanha } = await admin
    .from("campaigns")
    .select(
      "id, business_id, name, publish_state, ativada_em, ativada_por, pausada_em, pausada_por",
    )
    .eq("id", campanhaId)
    .maybeSingle();

  if (!campanha) {
    return recusa("campanha_inexistente", "Essa campanha não existe.");
  }

  // ============================================================
  // AQUI ESTÁ A TRAVA. A linha abaixo é a que separa um cliente do outro.
  //
  // `negocioId` NÃO vem do formulário, da URL, nem de um parâmetro: ele é
  // lido da linha da campanha que acabou de ser carregada por id. Todas as
  // leituras seguintes usam ESTE valor, e nenhuma aceita outro.
  //
  // Se alguém um dia acrescentar um parâmetro `negocioId` à assinatura
  // desta função "para evitar uma consulta", a trava morre: passaria a ser
  // possível ativar a campanha de um cliente com o contexto de outro.
  // ============================================================
  const negocioId: string | null = campanha.business_id ?? null;
  if (!negocioId) {
    return recusa(
      "sem_negocio",
      "Essa campanha não aponta para nenhum negócio. Sem dono não há o que conferir, e ativar às cegas está fora de questão.",
    );
  }

  // ---------- 2. o cliente, escopado pelo negócio da campanha ----------
  const { data: negocio } = await admin
    .from("businesses")
    .select("id, name, monthly_budget")
    .eq("id", negocioId)
    .maybeSingle();

  if (!negocio) {
    return recusa("negocio_inexistente", "O negócio dessa campanha não está mais no banco.");
  }

  // ---------- 3. o dinheiro ----------
  const orcamento = validarOrcamento(negocio.monthly_budget, null);

  // ---------- 4. o pré-voo, AGORA ----------
  const preVoo = await preVooPorNegocio(negocioId, admin);

  // ---------- 5. o que impede ----------
  const bloqueios: ConfirmacaoDeAtivacao["bloqueios"] = [];

  const estadoAtual = String(campanha.publish_state ?? "draft");
  if (estadoAtual !== "published" && estadoAtual !== "pausada") {
    bloqueios.push({
      motivo: "nao_publicada",
      texto: `A campanha está em "${estadoAtual}". Só dá para ativar o que já foi publicado no Meta (e está pausado lá).`,
    });
  }
  if (estadoAtual === "ativa") {
    bloqueios.push({ motivo: "ja_ativa", texto: "Essa campanha já está ativa." });
  }
  if (!orcamento.ok) {
    bloqueios.push({ motivo: "orcamento", texto: orcamento.mensagem });
  }

  const pre = preVoo.preRequisitos;
  if (pre && pre.ok && !pre.dados.ok) {
    for (const b of pre.dados.bloqueios) {
      bloqueios.push({ motivo: "pre_voo", texto: b });
    }
    // `nao_verificados` não é bloqueio, mas também não é "tudo certo": é o
    // que a rota não conseguiu olhar. Aparece como bloqueio aqui de
    // propósito — antes de gastar dinheiro de terceiro, "não sei" pesa
    // como "não".
    for (const n of pre.dados.naoVerificados) {
      bloqueios.push({ motivo: "pre_voo", texto: `Não deu para conferir: ${n}` });
    }
  }
  if (pre && !pre.ok) {
    bloqueios.push({
      motivo: "pre_voo",
      texto: `Não consegui conferir os pré-requisitos agora: ${pre.mensagem}`,
    });
  }

  return {
    ok: true,
    campanhaId: String(campanha.id),
    negocioId,
    nomeDoCliente:
      (typeof negocio.name === "string" ? negocio.name.trim() : "") || "(negócio sem nome)",
    nomeDaCampanha: typeof campanha.name === "string" ? campanha.name : null,
    estadoAtual,
    diarioCentavos: orcamento.ok ? orcamento.diarioCentavos : 0,
    mensalReais: Number(negocio.monthly_budget ?? 0),
    preVoo,
    bloqueios,
    ativadaEm: campanha.ativada_em ?? null,
    ativadaPor: campanha.ativada_por ?? null,
    pausadaEm: campanha.pausada_em ?? null,
    pausadaPor: campanha.pausada_por ?? null,
  };
}
