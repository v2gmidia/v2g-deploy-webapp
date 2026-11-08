"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { erroDoIntervalo, rotuloDoIntervalo, type IntervaloDoInicio } from "@/lib/inicio/periodo";
import { EsperaLocal } from "@/components/ui/EsperaLocal";
import styles from "./SeletorDePeriodo.module.css";

export function SeletorDePeriodo({ intervalo, aoAplicar }: {
  intervalo: IntervaloDoInicio;
  /** Permite ensaiar a espera sem consultar dados reais na bancada local. */
  aoAplicar?: (destino: string) => Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const busca = useSearchParams();
  const painel = useRef<HTMLDetailsElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aplicando, iniciar] = useTransition();
  const trava = useRef(false);
  const [falhaConsulta, setFalhaConsulta] = useState(false);

  return <div className={styles.raiz}><details className="periodo-seletor" ref={painel} onKeyDown={(event) => {
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
      if (aplicando || trava.current) return;
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
      const destino = `${pathname}?${parametros.toString()}`;
      trava.current = true;
      setFalhaConsulta(false);
      if (painel.current) {
        painel.current.open = false;
        painel.current.querySelector("summary")?.focus();
      }
      iniciar(async () => {
        try {
          if (aoAplicar) await aoAplicar(destino);
          else if (desde === intervalo.desde && ate === intervalo.ate) router.refresh();
          else router.push(destino, { scroll: false });
        } catch {
          setFalhaConsulta(true);
        } finally {
          trava.current = false;
        }
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
  </details>
    <EsperaLocal ativa={aplicando} mensagem="Atualizando o período. Os números anteriores continuam na tela." mensagemDemorada="A consulta do período está demorando. Os números na tela ainda são do período anterior; você pode aguardar ou abrir outra área pelo menu." />
    {falhaConsulta && <p className="form-error" role="alert">Não conseguimos consultar esse período. Abra o calendário e aplique novamente; suas datas continuam preenchidas.</p>}
  </div>;
}
