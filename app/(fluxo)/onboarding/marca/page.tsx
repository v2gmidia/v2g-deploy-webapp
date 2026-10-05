import { carregarMarcaAction } from "./actions";
import { Marca } from "./Marca";

export default async function MarcaPage() {
  const estado = await carregarMarcaAction();
  return <div className="auth-grid solo"><section className="auth-card">
    {"erro" in estado ? <>
      <h1 className="auth-h">Não consegui abrir o visual da sua marca.</h1>
      <p className="auth-sub">{estado.erro}</p>
      <a className="cta" href="/onboarding/contas">Voltar às contas</a>
    </> : <Marca inicial={estado} />}
  </section></div>;
}
