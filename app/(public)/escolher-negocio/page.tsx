import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { temAcessoWebApp } from "@/lib/contratacao/acesso";
import { vincularComprasAprovadas } from "@/lib/contratacao/vincular";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { cnpjsDosNegociosLiberados } from "@/lib/multiconta/cnpjs";
import { FormularioNegocio } from "./Formulario";
import { limparNegocioAction } from "./actions";
import { tituloDaAba } from "@/lib/titulos";
import "@/app/entrada-editorial.css";

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

  // O vínculo por e-mail verificado pode anteceder a gravação de buyer_profile_id.
  // A leitura administrativa fica restrita aos IDs já liberados e os dados
  // só aparecem se o comprador do pedido corresponder à sessão atual.
  let cnpjPorNegocio: Map<string, string>;
  try {
    cnpjPorNegocio = await cnpjsDosNegociosLiberados(
      data.map((negocio) => negocio.id), user.id,
      user.email_confirmed_at ? user.email ?? null : null,
    );
  } catch {
    console.error("[escolher-negocio] falha ao ler CNPJs das compras");
    return <section className="auth-card">
      <h1 className="auth-h">Não conseguimos carregar seus negócios por completo.</h1>
      <p className="auth-sub">A identificação das contas está indisponível agora. Tente novamente antes de escolher.</p>
      <a className="cta" href="/escolher-negocio">Tentar novamente</a>
    </section>;
  }
  const negocios = data.map((negocio) => ({ ...negocio,
    cnpj: cnpjPorNegocio.get(negocio.id) ?? null, codigo: negocio.id.slice(0, 8),
  }));

  return <section className="auth-card seletor-negocio">
    <h1 className="auth-h">Qual negócio você quer abrir?</h1>
    <p className="auth-sub">Cada negócio tem suas próprias respostas, anúncios e próximos passos.</p>
    <FormularioNegocio negocios={negocios}
      selecionado={ativo.status === "selecionado" ? ativo.negocio.id : null} />
    <p className="seletor-ajuda">Para adicionar outro CNPJ, use o mesmo e-mail na nova contratação. O negócio aparecerá após a confirmação do pagamento.</p>
    <a className="seletor-link" href="/entrar?adicionar=1">
      Adicionar negócio <span aria-hidden="true">→</span>
    </a>
  </section>;
}
