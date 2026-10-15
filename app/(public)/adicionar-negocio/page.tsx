import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { temAcessoWebApp } from "@/lib/contratacao/acesso";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { SITE_PUBLICO_ORIGEM } from "@/lib/site-publico";
import { signOutAction } from "@/app/(protected)/actions";
import "@/app/entrada-editorial.css";

export const metadata = { title: "Adicionar negócio | V2G", robots: { index: false, follow: false } };

export default async function AdicionarNegocioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/adicionar-negocio");
  if (!(await temAcessoWebApp(supabase, user))) redirect("/acesso-pendente");

  const checkoutQaDisponivel = checkoutSandboxSeguroNesteServidor();
  const destinoCompra = checkoutQaDisponivel
    ? "/contratar" : `${SITE_PUBLICO_ORIGEM}/#pre-cadastro`;

  return <section className="auth-card adicionar-negocio">
    <a href="/inicio">← Voltar ao meu negócio</a>
    <h1 className="auth-h">Adicionar negócio</h1>
    <p className="auth-sub">Escolha como quer acessar o outro negócio.</p>

    <div className="adicionar-negocio-opcoes">
      <section>
        <h2>Outro CNPJ com este e-mail</h2>
        <p>{checkoutQaDisponivel
          ? "Use o mesmo e-mail na contratação. Após a aprovação do pagamento, o negócio aparece na sua lista."
          : "O pré-cadastro registra seu interesse, mas ainda não adiciona um negócio. Após contratar outro CNPJ com este e-mail e ter o pagamento aprovado, ele aparecerá na sua lista."}</p>
        <a className="cta" href={destinoCompra}>{checkoutQaDisponivel
          ? "Contratar outro CNPJ no QA" : "Ir para o pré-cadastro"}</a>
      </section>
      <section>
        <h2>Entrar com outro e-mail</h2>
        <p>Saia deste acesso para usar a tela de entrada existente. Lá você pode entrar ou criar o primeiro acesso de uma compra aprovada.</p>
        <form action={signOutAction}>
          <button className="cta" type="submit">Sair e entrar com outro e-mail</button>
        </form>
      </section>
    </div>
  </section>;
}
