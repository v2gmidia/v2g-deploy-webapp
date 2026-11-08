import { EntradaEditorial } from "@/components/ui/EntradaEditorial";
import "./espera-local.css";

export function CarregandoAcesso({ titulo = "Preparando seu acesso" }: { titulo?: string }) {
  return <EntradaEditorial>
    <p role="status">{titulo}…</p>
    <div className="esqueleto-acesso-01-02" aria-hidden="true">
      <span className="linha titulo" />
      <span className="linha curta" /><span className="linha campo" />
      <span className="linha curta" /><span className="linha campo" />
      <span className="linha campo" />
    </div>
  </EntradaEditorial>;
}
