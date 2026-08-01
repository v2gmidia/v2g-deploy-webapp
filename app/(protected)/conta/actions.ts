"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ContaActionState {
  erro?: string;
  ok?: string;
}

function numeroOuNulo(bruto: string): number | null {
  const limpo = bruto.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Dados do negócio. Escreve nas MESMAS colunas que o onboarding
 * preenche (`niche`, `city`, `radius_km`, `avg_ticket_min/max`,
 * `monthly_budget`) — esta tela é onde a pessoa corrige depois o que
 * respondeu no chat, então não existe um segundo lugar de verdade.
 *
 * O ticket é um par min/max desde a migration 0004. Aqui o campo é um
 * valor só, então min e max recebem o mesmo número: é um valor informado
 * com precisão, não uma faixa.
 */
export async function salvarNegocioAction(
  _prev: ContaActionState,
  formData: FormData,
): Promise<ContaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { erro: "O nome do negócio não pode ficar em branco." };

  const raioBruto = String(formData.get("raio") ?? "").trim();
  const raio = raioBruto ? Number(raioBruto) : null;
  const ticket = numeroOuNulo(String(formData.get("ticket") ?? ""));
  const limite = numeroOuNulo(String(formData.get("limite") ?? ""));

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) return { erro: "Não encontramos seu negócio. Comece pelo onboarding." };

  const { error } = await supabase
    .from("businesses")
    .update({
      name: nome,
      niche: String(formData.get("segmento") ?? "").trim() || null,
      city: String(formData.get("cidade") ?? "").trim() || null,
      radius_km: raio,
      avg_ticket_min: ticket,
      avg_ticket_max: ticket,
      monthly_budget: limite,
    })
    .eq("id", business.id);

  if (error) {
    console.error("[conta] falha ao salvar negócio ::", error.message);
    return { erro: "Não conseguimos salvar agora. Tente de novo em instantes." };
  }

  revalidatePath("/conta");
  return { ok: "Dados do negócio salvos." };
}

export async function salvarPerfilAction(
  _prev: ContaActionState,
  formData: FormData,
): Promise<ContaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const nome = String(formData.get("full_name") ?? "").trim();
  if (!nome) return { erro: "Seu nome não pode ficar em branco." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: nome,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[conta] falha ao salvar perfil ::", error.message);
    return { erro: "Não conseguimos salvar agora. Tente de novo em instantes." };
  }

  revalidatePath("/conta");
  return { ok: "Perfil salvo." };
}
