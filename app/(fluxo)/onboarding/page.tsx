import { carregarEstadoAction } from "./actions";
import { Chat } from "./Chat";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cnpjsDoComprador, type PedidoParaIdentificarNegocio } from "@/lib/multiconta/identificacao";
import { lerTodasPaginas } from "@/lib/multiconta/paginacao";
import { tituloDaAba } from "@/lib/titulos";
import { Marca } from "@/components/ui/Marca";
import "./onboarding-editorial.css";

export const metadata = tituloDaAba("/onboarding");

/**
 * Onboarding — porte de `tela-03-onboarding-desktop.html`.
 *
 * Esta rota é o primeiro bloco. As contas, o visual da marca e a conclusão
 * persistida têm rotas próprias. Upload, conexão OAuth e geração de criativo
 * seguem fora desta etapa; o primeiro criativo será tratado na reunião.
 *
 * A DÍVIDA QUE MORREU AQUI: no protótipo as respostas ficavam num
 * `var answers = {}` do navegador enquanto o card lateral prometia
 * "fecha a página sem medo — suas respostas ficam guardadas". Era falso:
 * um F5 apagava tudo. Agora cada resposta grava no banco no momento em
 * que é dada, e esta página lê o que já foi respondido para retomar de
 * onde parou.
 *
 * Server Component: o estado inicial vem do banco na primeira
 * renderização, sem piscar a tela vazia antes de carregar.
 */
export default async function OnboardingPage() {
  const estado = await carregarEstadoAction();

  if ("erro" in estado) {
    return (
      <div className="auth-grid solo">
        <section className="auth-card">
          <h1 className="auth-h">Não consegui abrir seu onboarding.</h1>
          <p className="auth-sub">{estado.erro}</p>
          <a className="cta" href="/inicio">
            Voltar para o início
          </a>
        </section>
      </div>
    );
  }

  const { respostas, businessId } = estado;
  let cnpj: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email_confirmed_at && user.email) {
      // Apenas pedidos aprovados do negócio que a sessão já selecionou.
      // A identidade do comprador é conferida antes de mostrar o CNPJ.
      const admin = createAdminClient();
      const pedidos = await lerTodasPaginas((inicio, fim) => admin.from("commercial_orders")
        .select("business_id, cnpj, buyer_email, buyer_profile_id")
        .eq("business_id", businessId).eq("status", "payment_approved")
        .order("created_at", { ascending: false }).order("id", { ascending: false })
        .range(inicio, fim));
      if (pedidos) cnpj = cnpjsDoComprador([businessId], pedidos as PedidoParaIdentificarNegocio[],
        user.id, user.email).get(businessId) ?? null;
    }
  } catch {
    console.error("[onboarding] CNPJ da compra indisponível");
  }
  const digitos = cnpj?.replace(/\D/g, "") ?? "";
  const cnpjExibido = /^\d{14}$/.test(digitos)
    ? digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    : null;

  return (
    <div className="onb-v2">
      <header className="onb-v2-topo">
        <Marca editorial href="/inicio" />
        <a href="https://wa.me/5521936182176" target="_blank" rel="noopener">Falar com uma pessoa</a>
      </header>
      {cnpjExibido && <p className="onb-v2-identidade">CNPJ da conta: <strong>{cnpjExibido}</strong></p>}
      <Chat businessId={businessId} inicial={respostas}
        vozHabilitada={process.env.V2G_VOICE_TRANSCRIPTION_ENABLED === "true" && !!process.env.OPENAI_API_KEY} />
    </div>
  );
}
