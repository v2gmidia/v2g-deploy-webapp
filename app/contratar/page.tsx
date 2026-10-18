import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Marca } from "@/components/ui/Marca";
import { createClient } from "@/lib/supabase/server";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { FormularioContratar } from "./FormularioContratar";
import "./contratar.css";

export const metadata = { title: "Contratar | V2G", robots: { index: false, follow: false } };

export default async function ContratarPage() {
  // Somente o projeto isolado de QA pode oferecer o sandbox em um build HTTPS.
  if (!checkoutSandboxSeguroNesteServidor()) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const apiAtiva = process.env.V2G_CHECKOUT_API_ENABLED === "true";
  const segurancaAtiva = process.env.V2G_CHECKOUT_SECURITY_ENABLED === "true";
  const refAnterior = (await cookies()).get("v2g_checkout_ref")?.value;
  const podeRetomar = apiAtiva && refAnterior && /^[0-9a-f-]{36}$/i.test(refAnterior);
  return <main className="contratar-shell">
    <header className="contratar-topo"><Marca href="/entrar" editorial /><a href="/entrar">Já tenho acesso</a></header>
    <div className="contratar-grid">
      <section className="contratar-intro" aria-labelledby="contratar-titulo">
        <h1 id="contratar-titulo">Seus anúncios, com acompanhamento de perto.</h1>
        <p>A V2G cuida da operação de mídia. Você acompanha os próximos passos do negócio e, quando houver dados disponíveis, o desempenho dos anúncios.</p>
        <p className="contratar-proximo">Depois da compra aprovada, você cria seu acesso, preenche as informações do negócio e escolhe um horário para conversar com o gestor. A primeira campanha é publicada por ele após os preparativos.</p>
        <p className="contratar-limite">A verba de anúncios é paga à parte. Nesta fase, você precisa informar o CNPJ da empresa e vender por conversa no WhatsApp.</p>
        {podeRetomar && <p className="contratar-retomar"><a href={`/contratar/pagamento?ref=${encodeURIComponent(refAnterior)}`}>Retomar meu pedido de teste</a><span>Consulte o pagamento iniciado neste navegador antes de fazer outro pedido.</span></p>}
      </section>
      <FormularioContratar referencia={randomUUID()} apiAtiva={apiAtiva}
        emailDoAcesso={user?.email ?? undefined}
        turnstileSiteKey={segurancaAtiva ? (process.env.TURNSTILE_SITE_KEY ?? "") : undefined} />
    </div>
  </main>;
}
