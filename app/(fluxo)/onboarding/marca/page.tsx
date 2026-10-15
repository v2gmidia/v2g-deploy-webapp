import { carregarMarcaAction } from "./actions";
import { Marca } from "./Marca";
import { Marca as MarcaEditorial } from "@/components/ui/Marca";
import { listarIdentidade } from "@/lib/identidade/armazenar";
import { carregarGuiaVisual } from "./guia-actions";
import { carregarVariacoesVisuais } from "./variacoes-actions";
import "../onboarding-editorial.css";

export default async function MarcaPage() {
  const estado = await carregarMarcaAction();
  let materiais: [
    Awaited<ReturnType<typeof listarIdentidade>>,
    Awaited<ReturnType<typeof carregarGuiaVisual>>,
    Awaited<ReturnType<typeof carregarVariacoesVisuais>>,
  ] | null = null;
  let materiaisIndisponiveis = false;
  if (!("erro" in estado)) {
    try {
      materiais = await Promise.all([
        listarIdentidade(estado.businessId), carregarGuiaVisual(estado.businessId), carregarVariacoesVisuais(estado.businessId),
      ]);
    } catch {
      materiaisIndisponiveis = true;
      console.error("[onboarding/marca] materiais indisponíveis");
    }
  }
  return <div className="onb-v2 onb-v2-etapa">
    <header className="onb-v2-topo"><MarcaEditorial editorial href="/inicio" /><a href="/onboarding/contas">Rever minhas contas</a></header>
    <section className="onb-v2-conteudo">
    {"erro" in estado ? <>
      <h1 className="auth-h">Não consegui abrir o visual da sua marca.</h1>
      <p className="auth-sub">{estado.erro}</p>
      <a className="cta" href="/onboarding/contas">Voltar às contas</a>
    </> : materiaisIndisponiveis || !materiais ? <>
      <h1 className="auth-h">Não conseguimos carregar seus arquivos de marca.</h1>
      <p className="auth-sub">Suas respostas continuam guardadas. Atualize esta página antes de enviar outro arquivo.</p>
      <a className="cta" href="/onboarding/marca">Tentar novamente</a>
    </> : <Marca inicial={estado} logo={materiais[0].logo} guia={materiais[1]} variacoes={materiais[2]} />}
    </section>
  </div>;
}
