"use client";

import { useEffect } from "react";

/**
 * Os dois comportamentos da landing page.
 *
 * O protótipo trazia isto num `<script>` inline no meio do HTML. Aqui
 * vira um componente de cliente: o `<script>` inline não roda em JSX (ele
 * chega como texto), e mesmo se rodasse seria um bloco de JavaScript solto
 * no meio da árvore, sem limpeza quando a rota sai.
 *
 * Não renderiza nada — só liga os ouvintes e os desliga ao sair.
 */
export function ComportamentoLP() {
  useEffect(() => {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alvos = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

    // QUEM PEDIU MENOS MOVIMENTO RECEBE TUDO VISÍVEL, DE UMA VEZ. Não é
    // "a mesma animação mais rápida": é ausência de animação.
    if (reduzido) {
      alvos.forEach((el) => el.classList.add("in"));
      return;
    }

    // O original varria a lista a cada evento de scroll. `IntersectionObserver`
    // faz o mesmo sem rodar código a cada pixel rolado — e é suportado em
    // tudo que roda o Next 16.
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            observador.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    alvos.forEach((el) => observador.observe(el));

    // Rede de segurança do original, mantida: se por qualquer motivo o
    // observador não disparar, ninguém fica preso invisível. Numa página
    // de vendas, conteúdo que não aparece é conteúdo que não existe.
    const rede = window.setTimeout(() => {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
    }, 2600);

    // FAQ em acordeão: abrir um fecha os outros.
    const perguntas = Array.from(document.querySelectorAll<HTMLDetailsElement>(".faq details"));
    const aoAbrir = (evento: Event) => {
      const aberta = evento.currentTarget as HTMLDetailsElement;
      if (!aberta.open) return;
      perguntas.forEach((outra) => {
        if (outra !== aberta) outra.open = false;
      });
    };
    perguntas.forEach((d) => d.addEventListener("toggle", aoAbrir));

    return () => {
      observador.disconnect();
      window.clearTimeout(rede);
      perguntas.forEach((d) => d.removeEventListener("toggle", aoAbrir));
    };
  }, []);

  return null;
}
