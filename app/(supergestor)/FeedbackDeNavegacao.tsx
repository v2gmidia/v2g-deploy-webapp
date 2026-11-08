"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./Mesa.module.css";

/** Feedback para navegações da Mesa que ainda usam links e filtros GET nativos. */
export function FeedbackDeNavegacao() {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const buscaAtual = useSearchParams().toString();

  useEffect(() => {
    const conteudo = document.getElementById("conteudo");
    if (!conteudo) return;
    setMensagem(null);

    let pendente: { chave: string; iniciadoEm: number } | null = null;
    let aviso: ReturnType<typeof setTimeout> | undefined;
    let demora: ReturnType<typeof setTimeout> | undefined;
    let liberar: ReturnType<typeof setTimeout> | undefined;
    let botaoPendente: HTMLButtonElement | null = null;

    function liberarFiltro() {
      if (botaoPendente) botaoPendente.disabled = false;
      botaoPendente = null;
    }

    function iniciar(chave: string, texto: string, evento: Event, atrasoDoAviso: number): boolean {
      if (pendente?.chave === chave && Date.now() - pendente.iniciadoEm < 15_000) {
        evento.preventDefault();
        return false;
      }
      pendente = { chave, iniciadoEm: Date.now() };
      if (aviso) clearTimeout(aviso);
      if (demora) clearTimeout(demora);
      if (liberar) clearTimeout(liberar);
      liberarFiltro();
      setMensagem(null);
      aviso = setTimeout(() => setMensagem(texto), atrasoDoAviso);
      demora = setTimeout(() => setMensagem(`${texto.replace(/…$/, ".")} A abertura está demorando; os dados anteriores continuam visíveis.`), 10_000);
      liberar = setTimeout(() => {
        pendente = null;
        liberarFiltro();
        setMensagem("A consulta demorou. Você pode tentar novamente com os mesmos filtros.");
      }, 15_000);
      return true;
    }

    function aoClicar(evento: MouseEvent) {
      if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
      const alvo = evento.target;
      const link = alvo instanceof Element ? alvo.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || !conteudo?.contains(link) || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      const rotulo = link.textContent?.trim() || "próxima tela";
      if (!iniciar(`link:${url.href}`, `Abrindo ${rotulo.toLocaleLowerCase("pt-BR")}…`, evento, 2_000)) return;
      evento.preventDefault();
      router.push(`${url.pathname}${url.search}${url.hash}`);
    }

    function aoEnviar(evento: SubmitEvent) {
      const formulario = evento.target;
      if (!(formulario instanceof HTMLFormElement) || !conteudo?.contains(formulario) || formulario.method.toLowerCase() !== "get") return;
      if (!formulario.querySelector('input[name="q"]') || !formulario.querySelector('select[name="filtro"]')) return;
      const parametros = new URLSearchParams();
      for (const [nome, valor] of new FormData(formulario)) if (typeof valor === "string") parametros.append(nome, valor);
      const destino = new URL(formulario.action, window.location.href);
      if (destino.origin !== window.location.origin) return;
      destino.search = parametros.toString();
      if (!iniciar(`filtro:${destino.href}`, "Aplicando filtros da carteira…", evento, 350)) return;
      evento.preventDefault();
      if (evento.submitter instanceof HTMLButtonElement) {
        botaoPendente = evento.submitter;
        botaoPendente.disabled = true;
      }
      router.push(`${destino.pathname}${destino.search}${destino.hash}`);
    }

    function aoRetornar() {
      pendente = null;
      if (aviso) clearTimeout(aviso);
      if (demora) clearTimeout(demora);
      if (liberar) clearTimeout(liberar);
      setMensagem(null);
      liberarFiltro();
    }

    conteudo.addEventListener("click", aoClicar, true);
    conteudo.addEventListener("submit", aoEnviar, true);
    window.addEventListener("pageshow", aoRetornar);
    return () => {
      conteudo.removeEventListener("click", aoClicar, true);
      conteudo.removeEventListener("submit", aoEnviar, true);
      window.removeEventListener("pageshow", aoRetornar);
      if (aviso) clearTimeout(aviso);
      if (demora) clearTimeout(demora);
      if (liberar) clearTimeout(liberar);
      liberarFiltro();
    };
  }, [router, pathname, buscaAtual]);

  return mensagem ? <p className={styles.feedbackNavegacao} role="status" aria-live="polite">{mensagem}</p> : null;
}
