import { carregarMarcaAction } from "./actions";
import { Marca } from "./Marca";
import { Marca as MarcaEditorial } from "@/components/ui/Marca";
import { listarIdentidade } from "@/lib/identidade/armazenar";
import { carregarGuiaVisual } from "./guia-actions";
import "../onboarding-editorial.css";

export default async function MarcaPage() {
  const estado = await carregarMarcaAction();
  const [identidade, guia] = "erro" in estado ? [null, null] : await Promise.all([
    listarIdentidade(estado.businessId), carregarGuiaVisual(estado.businessId),
  ]);
  return <div className="onb-v2 onb-v2-etapa">
    <header className="onb-v2-topo"><MarcaEditorial editorial href="/inicio" /><a href="/onboarding/contas">Rever minhas contas</a></header>
    <section className="onb-v2-conteudo">
    {"erro" in estado ? <>
      <h1 className="auth-h">Não consegui abrir o visual da sua marca.</h1>
      <p className="auth-sub">{estado.erro}</p>
      <a className="cta" href="/onboarding/contas">Voltar às contas</a>
    </> : <Marca inicial={estado} logo={identidade?.logo ?? null} guia={guia} />}
    </section>
  </div>;
}
