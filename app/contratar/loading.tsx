import { Marca } from "@/components/ui/Marca";
import "./contratar.css";
export default function Loading() {
  return <main className="contratar-shell">
    <header className="contratar-topo"><Marca href="/entrar" editorial /></header>
    <p role="status">Preparando a contratação…</p>
    <div className="contratar-grid contratar-esqueleto" aria-hidden="true">
      <div><span className="titulo" /><span /><span /><span /></div>
      <div className="contratar-formulario"><span className="titulo" />{Array.from({length:6},(_,i)=><span className="campo" key={i} />)}</div>
    </div>
  </main>;
}
