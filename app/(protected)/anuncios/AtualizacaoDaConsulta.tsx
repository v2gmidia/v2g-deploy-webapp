"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { erroDoIntervalo } from "@/lib/inicio/periodo";
import { useEsperaLocal } from "../criativos/useEsperaLocal";

/** Só a leitura desta página: mantém a resposta atual durante a navegação RSC. */
export function AtualizacaoDaConsulta({ children, hoje }: { children: ReactNode; hoje: string }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [consultou, setConsultou] = useState(false);
  const ocupado = useRef(false);
  const espera = useEsperaLocal(pendente ? "anuncios" : null);
  useEffect(() => { if (!pendente) ocupado.current = false; }, [pendente]);

  return <div onSubmitCapture={evento => {
    const form = evento.target;
    if (!(form instanceof HTMLFormElement)) return;
    const periodo = form.classList.contains("periodo-form");
    if (!periodo && !form.hasAttribute("data-consulta-anuncios")) return;
    evento.preventDefault();
    evento.stopPropagation();
    if (ocupado.current) return;
    const campos = new FormData(form);
    const parametros = new URLSearchParams(window.location.search);
    if (periodo) {
      const desde = String(campos.get("desde") ?? "");
      const ate = String(campos.get("ate") ?? "");
      const falha = erroDoIntervalo(desde, ate, hoje);
      setErro(falha);
      if (falha) return;
      parametros.delete("periodo");
      parametros.set("desde", desde);
      parametros.set("ate", ate);
    } else {
      parametros.set("conta", String(campos.get("conta") ?? ""));
      parametros.set("desde", String(campos.get("desde") ?? ""));
      parametros.set("ate", String(campos.get("ate") ?? ""));
      setErro(null);
    }
    ocupado.current = true;
    setConsultou(true);
    const destino = `/anuncios?${parametros.toString()}`;
    iniciar(() => {
      if (`${window.location.pathname}${window.location.search}` === destino) return router.refresh();
      return router.push(destino, { scroll: false });
    });
    form.closest("details")?.removeAttribute("open");
  }}>
    <div role="status" aria-live="polite" aria-atomic="true">
      {espera.visivel ? <p className="form-warning">{espera.longa
        ? "A consulta está demorando. Os dados abaixo continuam sendo os da consulta anterior, com sua conta e período originais. Aguarde a resposta; ausência de resposta não é gasto zero."
        : "Atualizando os anúncios. A conta, o período e os números abaixo ainda são os da consulta anterior."}</p>
        : consultou && !pendente ? <p className="hint">Consulta encerrada. Confira a conta, o período e os avisos abaixo.</p> : null}
    </div>
    {erro ? <p className="form-error" role="alert">{erro}</p> : null}
    <div aria-busy={pendente}>{children}</div>
  </div>;
}
