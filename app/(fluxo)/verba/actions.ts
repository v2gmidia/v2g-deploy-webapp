"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dinheiro } from "@/lib/formato";
import { gravarCamposDoCliente } from "@/lib/cadastro/procedencia";
import { validarOrcamento } from "@/lib/meta/orcamento";
import { dispararSeCompleto } from "@/lib/pipeline/disparar";
import { DIAS, PISO_MENSAL_DA_CASA } from "@/lib/verba/limites";

export interface VerbaActionState {
  erro?: string;
  ok?: string;
}

/**
 * O piso REAL do Meta, quando ele já é conhecido — sem chamar o Meta.
 *
 * `publicar.ts` guarda em `ad_accounts.min_daily_budget_cents` o valor que
 * `/act_<id>/minimum_budgets` devolveu na última publicação. Ler daqui é
 * de graça e não põe token nenhum neste caminho.
 *
 * PEGA O MENOR entre as contas que têm valor, e a razão não é preguiça:
 * qual conta a campanha vai usar só se decide quando a campanha existe
 * (`campaigns.ad_account_id`) — o negócio medido tem TRÊS contas ativas.
 * Usar o maior recusaria um valor que talvez funcionasse na conta
 * escolhida. Na dúvida, quem recusa é o Meta na publicação, não a gente
 * aqui.
 *
 * Devolve `null` para "não sei" — e `null` não vira zero nem vira chute:
 * cai no piso da casa.
 */
async function pisoConhecidoEmCentavos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
): Promise<number | null> {
  const { data } = await supabase
    .from("ad_accounts")
    .select("min_daily_budget_cents")
    .eq("business_id", businessId)
    .not("min_daily_budget_cents", "is", null);

  const valores = (data ?? [])
    .map((linha) => Number(linha.min_daily_budget_cents))
    .filter((n) => Number.isFinite(n) && n > 0);

  return valores.length > 0 ? Math.min(...valores) : null;
}

/**
 * "1.200,50", "R$ 1200", "uns 800" → número. Aceita o que a pessoa
 * escreve, não o que o campo pediria.
 */
function reais(bruto: string): number | null {
  const limpo = bruto.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/**
 * Define quanto vai por mês para o Facebook.
 *
 * POR QUE A PERGUNTA MORA AQUI, e não no bloco 2 do onboarding (D2 do
 * `docs/onboarding-expandido.md`): esta tela é a única do app que explica
 * que são DUAS cobranças, a mensalidade da V2G e a verba do anúncio.
 * Perguntar o número onde a explicação está é diferente de perguntar
 * antes dela — a pessoa que não sabe que são duas contas responde a
 * pergunta errada.
 *
 * Antes deste lote a tela MOSTRAVA o valor e não deixava defini-lo: o
 * único lugar que definia era a `/conta`, que é área logada, depois do
 * fluxo. Quem estava no fluxo lia "você ainda não definiu" sem ter onde.
 *
 * NÃO INVENTA O PISO DO META, e isso não mudou: o piso dele é por conta,
 * moeda e objetivo, e só é consultável com token. O que mudou no lote
 * QA-3 é parar de usar "não sei o piso do Meta" como licença para aceitar
 * qualquer coisa. São três estados:
 *
 *   1. piso do Meta CONHECIDO (`ad_accounts.min_daily_budget_cents`, que
 *      a publicação já grava) — recusa com o número real dele;
 *   2. piso DESCONHECIDO — recusa só o impossível, com o piso da casa, e
 *      a tela diz que o número é nosso e que o do Facebook pode ser maior;
 *   3. teto — o mesmo `TETO_DIARIO_ABSOLUTO_CENTAVOS` que a publicação já
 *      aplica, alcançado por `validarOrcamento`. Duas telas com regras
 *      diferentes para o mesmo campo é o defeito que o QA-2 acabou de
 *      consertar em outro lugar; não vale reintroduzir aqui.
 *
 * A validação dura continua na publicação. Esta aqui é a que evita o
 * "Pronto" para um valor que nunca vai virar anúncio — e evita disparar o
 * pipeline com ele.
 */
export async function definirVerbaAction(
  _prev: VerbaActionState,
  formData: FormData,
): Promise<VerbaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const valor = reais(String(formData.get("verba") ?? ""));
  if (valor === null) return { erro: "Escreva quanto você pode investir por mês." };

  // `exclusiveMinimum: 0` no schema do backend (`orcamento_mensal_disponivel`).
  // Zero não é "não quero anunciar" — é campanha que não roda, e vale
  // dizer isso em vez de aceitar e falhar lá na frente.
  if (valor <= 0) return { erro: "O valor precisa ser maior que zero." };

  const { data: negocio } = await supabase
    .from("businesses")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!negocio) return { erro: "Não encontramos seu negócio. Comece pelo onboarding." };

  // ---------- O que a gente aceita guardar ----------
  const piso = await pisoConhecidoEmCentavos(supabase, negocio.id);

  // O piso da casa só vale quando o do Meta é desconhecido. Se o real é
  // conhecido, ele é a autoridade — recusar por cima dele seria a gente
  // barrando um valor que o Facebook aceitaria.
  if (piso === null && valor < PISO_MENSAL_DA_CASA) {
    return {
      erro:
        `Com ${dinheiro(valor)} por mês o anúncio fica em ${dinheiro(valor / DIAS)} por dia, e ` +
        `nesse valor ele não roda. Nosso mínimo é ${dinheiro(PISO_MENSAL_DA_CASA)} por mês — ` +
        `uns ${dinheiro(PISO_MENSAL_DA_CASA / DIAS)} por dia. Esse mínimo é nosso: o do Facebook ` +
        `pode ser maior, muda de conta para conta, e a gente confere na hora de publicar.`,
    };
  }

  // Piso real (quando conhecido), teto e consistência do cálculo saem da
  // MESMA função que a publicação usa — de propósito.
  const veredito = validarOrcamento(valor, piso);
  if (!veredito.ok) return { erro: veredito.mensagem };

  const gravacao = await gravarCamposDoCliente({
    profileId: user.id,
    businessId: negocio.id,
    tabela: "businesses",
    campos: [{ campo: "monthly_budget", valor }],
  });
  if (!gravacao.ok) return { erro: gravacao.erro };

  revalidatePath("/verba");
  revalidatePath("/inicio");

  // A verba é, na maioria dos cadastros, o último dos seis a entrar — é a
  // única pergunta que não tem "não sei" e a única que mora fora do
  // onboarding. Então este é o lugar onde o disparo mais acontece de
  // fato. Ainda assim a decisão não é daqui: quem decide é
  // `dispararSeCompleto`, com a mesma regra das outras duas superfícies.
  await dispararSeCompleto();

  // O "Pronto" seco afirmava que estava tudo certo para anunciar — e a
  // tela não sabe disso enquanto o piso do Meta for desconhecido. Diz o
  // que foi guardado, quanto dá por dia, e de quem é a próxima palavra.
  return {
    ok:
      `Guardado: ${dinheiro(valor)} por mês, uns ${dinheiro(valor / DIAS)} por dia. ` +
      (piso === null
        ? "O Facebook tem um mínimo por dia que muda de conta para conta — a gente confere na hora de publicar e te avisa se não alcançar."
        : "Esse valor passa do mínimo que o Facebook pede na sua conta."),
  };
}
