import { carregarMarcaAction } from "../marca/actions";
import { Conclusao } from "./Conclusao";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cnpjsDoComprador, type PedidoParaIdentificarNegocio } from "@/lib/multiconta/identificacao";
import { lerTodasPaginas } from "@/lib/multiconta/paginacao";
import { carregarAgendaAction } from "./agenda-actions";
import "../onboarding-editorial.css";

export default async function OnboardingConcluidoPage() {
  const estado = await carregarMarcaAction();
  let cnpj: string | null = null;
  if (!("erro" in estado)) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at && user.email) {
        const admin = createAdminClient();
        const pedidos = await lerTodasPaginas((inicio, fim) => admin.from("commercial_orders")
          .select("business_id, cnpj, buyer_email, buyer_profile_id")
          .eq("business_id", estado.businessId).eq("status", "payment_approved")
          .order("created_at", { ascending: false }).order("id", { ascending: false })
          .range(inicio, fim));
        if (pedidos) cnpj = cnpjsDoComprador([estado.businessId], pedidos as PedidoParaIdentificarNegocio[],
          user.id, user.email).get(estado.businessId) ?? null;
      }
    } catch { console.error("[conclusao] CNPJ da compra indisponível"); }
  }
  const agenda = "erro" in estado || !estado.concluido ? { status: "legado" as const } : await carregarAgendaAction();
  return <Conclusao estado={estado} cnpj={cnpj} agenda={agenda} />;
}
