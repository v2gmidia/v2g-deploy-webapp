import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { temAcessoWebApp } from "@/lib/contratacao/acesso";
import { vincularComprasAprovadas } from "@/lib/contratacao/vincular";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { FormularioNegocio } from "./Formulario";
import { limparNegocioAction } from "./actions";
import { tituloDaAba } from "@/lib/titulos";

export const dynamic = "force-dynamic";
export const metadata = tituloDaAba("/escolher-negocio");

export default async function EscolherNegocioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/escolher-negocio");
  if (user.email_confirmed_at) await vincularComprasAprovadas(user);
  if (!(await temAcessoWebApp(supabase, user))) redirect("/acesso-pendente");

  const ativo = await negocioAtivoDaSessao();
  if (ativo.status === "falha_consulta") return <section className="auth-card">
    <h1 className="auth-h">Não conseguimos carregar seus negócios.</h1>
    <p className="auth-sub">Tente novamente em instantes.</p>
  </section>;
  if (ativo.status === "sem_sessao") redirect("/entrar");
  if (!("negocios" in ativo)) return null;

  const data = ativo.negocios;

  const { count: negociosDoPerfil, error: erroContagem } = !data.length
    ? await supabase.from("businesses").select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
    : { count: 0, error: null };
  if (erroContagem) return <section className="auth-card">
    <h1 className="auth-h">Não conseguimos conferir seus negócios.</h1>
    <p className="auth-sub">Tente novamente em instantes.</p>
  </section>;
  if (!data.length && (negociosDoPerfil ?? 0) > 0) return <section className="auth-card">
    <h1 className="auth-h">Este negócio ainda não foi liberado</h1>
    <p className="auth-sub">O comprovante enviado passa por aprovação da equipe. Atualize esta página depois da confirmação.</p>
    <a className="cta" href="/escolher-negocio">Conferir liberação</a>
  </section>;
  if (!data.length) return <section className="auth-card">
    <h1 className="auth-h">Ainda não há negócio nesta conta.</h1>
    <p className="auth-sub">Se já recebeu a liberação, entre com o e-mail usado na compra. Caso esteja começando, continue seu cadastro.</p>
    <form action={limparNegocioAction}><button className="cta" type="submit">Continuar</button></form>
  </section>;

  const { data: pedidos } = await supabase.from("commercial_orders")
    .select("business_id, cnpj")
    .eq("buyer_profile_id", user.id).eq("status", "payment_approved")
    .in("business_id", data.map((negocio) => negocio.id));
  const cnpjPorNegocio = new Map((pedidos ?? []).map((pedido) => [pedido.business_id, pedido.cnpj]));
  const negocios = data.map((negocio) => ({ ...negocio,
    cnpj: cnpjPorNegocio.get(negocio.id) ?? null, codigo: negocio.id.slice(0, 8),
  }));

  return <section className="auth-card">
    <p className="mission-tag">Sua conta</p>
    <h1 className="auth-h">Qual negócio você quer abrir?</h1>
    <p className="auth-sub">Cada negócio tem suas próprias respostas, anúncios e próximos passos.</p>
    <FormularioNegocio negocios={negocios}
      selecionado={ativo.status === "selecionado" ? ativo.negocio.id : null} />
    <p className="auth-sub">Para adicionar outro CNPJ, use o mesmo e-mail da sua conta na nova contratação. O negócio aparece aqui depois da confirmação do pagamento e do vínculo ao e-mail verificado.</p>
    {process.env.NODE_ENV !== "production"
      ? <a className="cta" href="/contratar">Adicionar negócio pelo checkout de teste</a>
      : <a className="cta" href="https://wa.me/5521936182176?text=Quero%20adicionar%20outro%20neg%C3%B3cio%20%C3%A0%20minha%20conta%20V2G" target="_blank" rel="noopener">Pedir outro negócio</a>}
  </section>;
}
