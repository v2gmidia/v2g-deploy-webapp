"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { erroDoIntervalo, rotuloDoIntervalo, type IntervaloDoInicio } from "@/lib/inicio/periodo";

export function SeletorDePeriodo({ intervalo }: { intervalo: IntervaloDoInicio }) {
  const router = useRouter();
  const pathname = usePathname();
  const busca = useSearchParams();
  const painel = useRef<HTMLDetailsElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aplicando, iniciar] = useTransition();

  return <details className="periodo-seletor" ref={painel} onKeyDown={(event) => {
    if (event.key === "Escape" && painel.current) {
      painel.current.open = false;
      painel.current.querySelector("summary")?.focus();
    }
  }}>
    <summary aria-label={`Escolher período. Selecionado: ${rotuloDoIntervalo(intervalo)}`}>
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12.5" rx="1.5" stroke="currentColor" /><path d="M6.5 2.5v4M13.5 2.5v4M3 8.5h14" stroke="currentColor" /></svg>
      {rotuloDoIntervalo(intervalo)}
    </summary>
    <form className="periodo-form" noValidate onSubmit={(event) => {
      event.preventDefault();
      const campos = new FormData(event.currentTarget);
      const desde = String(campos.get("desde") ?? "");
      const ate = String(campos.get("ate") ?? "");
      const falha = erroDoIntervalo(desde, ate, intervalo.hoje);
      setErro(falha);
      if (falha) return;
      const parametros = new URLSearchParams(busca.toString());
      parametros.delete("periodo");
      parametros.set("desde", desde);
      parametros.set("ate", ate);
      iniciar(() => {
        router.push(`${pathname}?${parametros.toString()}`, { scroll: false });
        if (painel.current) painel.current.open = false;
      });
    }}>
      <h2>Escolher período</h2>
      <div className="periodo-campos">
        <label>Data inicial<input type="date" name="desde" required min="0001-01-01" max={intervalo.hoje} defaultValue={intervalo.desde} aria-describedby={erro ? "periodo-erro" : undefined} onChange={() => setErro(null)} /></label>
        <label>Data final<input type="date" name="ate" required min="0001-01-01" max={intervalo.hoje} defaultValue={intervalo.ate} aria-describedby={erro ? "periodo-erro" : undefined} onChange={() => setErro(null)} /></label>
      </div>
      {erro && <p id="periodo-erro" className="form-error" role="alert">{erro}</p>}
      <button className="cta" type="submit" disabled={aplicando}>{aplicando ? "Aplicando…" : "Aplicar período"}</button>
    </form>
  </details>;
}
