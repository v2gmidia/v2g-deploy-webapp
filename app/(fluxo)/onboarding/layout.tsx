import { redirect } from "next/navigation";
import { carregarAgenciaDaSessao } from "@/lib/agencia/da-sessao";

/** A raiz administrativa não fornece marca, contas ou briefing de anunciante. */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const agencia = await carregarAgenciaDaSessao();
  if (agencia.status === "agencia" && !agencia.contexto) redirect("/inicio");
  if (agencia.status === "indisponivel") return <section className="auth-card">
    <h1 className="auth-h">Não conseguimos conferir sua carteira.</h1>
    <p className="form-warning" role="alert">Volte ao Início e tente novamente.</p>
    <a className="cta" href="/inicio">Voltar ao Início</a>
  </section>;
  return children;
}
