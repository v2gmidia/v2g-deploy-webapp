import { Marca } from "@/components/ui/Marca";
import "../contratar.css";
export default function Loading() {
  return <main className="contratar-shell">
    <header className="contratar-topo"><Marca href="/entrar" editorial /></header>
    <div className="contratar-pagamento">
      <p role="status">Consultando este pedido…</p>
      <div className="contratar-pagamento-layout contratar-esqueleto" aria-hidden="true">
        <div className="contratar-pagamento-principal"><span className="titulo" /><span /><span className="campo" /><span className="campo" /></div>
        <div className="contratar-pagamento-resumo"><span className="titulo" /><span /><span /><span /></div>
      </div>
    </div>
  </main>;
}
