"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gravarCamposDoCliente } from "@/lib/cadastro/procedencia";

export interface VerbaActionState {
  erro?: string;
  ok?: string;
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
 * NÃO VALIDA CONTRA O PISO DO META, de propósito. O piso é por conta,
 * moeda e objetivo, e só é consultável com token
 * (`lib/meta/orcamento.ts`, `consultarPisoDiario`) — que aqui ainda não
 * existe. Um piso fixo inventado recusaria valor válido ou aceitaria
 * inválido, nos dois casos com cara de certeza. A validação dura continua
 * na publicação, onde ela já está e já funciona.
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

  const gravacao = await gravarCamposDoCliente({
    profileId: user.id,
    businessId: negocio.id,
    tabela: "businesses",
    campos: [{ campo: "monthly_budget", valor }],
  });
  if (!gravacao.ok) return { erro: gravacao.erro };

  revalidatePath("/verba");
  revalidatePath("/inicio");
  return { ok: "Pronto. É esse o seu teto do mês." };
}
