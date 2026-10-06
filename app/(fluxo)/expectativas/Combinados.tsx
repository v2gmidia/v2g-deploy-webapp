"use client";

import { useEffect, useRef, useState } from "react";
import { PASSOS, RECIBO_CHECK as Check } from "./passos";

/**
 * Um combinado de cada vez — trocar de passo é um ato, não uma rolagem
 * (mesma decisão do protótipo). O estado é só de interface: nada aqui
 * vai para o banco, esta tela não coleta dado nenhum.
 */
export function Combinados() {
  const [i, setI] = useState(0);

  // `focar` distingue a primeira renderização (sem foco) das trocas de
  // passo feitas pelo usuário (com foco no título), como no original.
  const focar = useRef(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focar.current) tituloRef.current?.focus();
  }, [i]);

  const total = PASSOS.length;
  const passo = PASSOS[i]!;
  const ultimo = i === total - 1;

  function ir(n: number) {
    if (n < 0 || n >= total) return;
    focar.current = true;
    setI(n);
  }

  return (
    <section className="auth-card ec-card">
      <div className="ec-top">
        <button
          className="ec-back alvo-redondo"
          type="button"
          aria-label="Voltar"
          onClick={() => ir(i - 1)}
          disabled={i === 0}
        >
          <svg width="14" height="14" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M6.5 1.5 2 5l4.5 3.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </svg>
        </button>
        <span className="ec-label">Como funciona</span>
        <div className="ec-progress">
          <div className="ec-dots" aria-hidden="true">
            {PASSOS.map((_, n) => (
              <i key={n} className={n < i ? "done" : n === i ? "now" : ""} />
            ))}
          </div>
          <span className="ec-count" aria-live="polite">
            {i + 1} de {total}
          </span>
        </div>
      </div>

      <div className="ec-steps">
        <article className="ec-step" key={i} aria-label={ultimo ? "Fechamento" : `Combinado ${i + 1} de ${total}`}>
          <span className="ec-icon">{passo.icone}</span>
          <h1 className="auth-h ec-h" tabIndex={-1} ref={tituloRef}>
            {passo.titulo}
          </h1>
          <p className="auth-sub ec-sub">{passo.sub}</p>

          <div className="ec-swap">
            <b className="ec-swap-label">{passo.swapLabel}</b>
            {passo.swapTexto && <p>{passo.swapTexto}</p>}
            {passo.recibo && (
              <ul className="ec-receipt">
                {passo.recibo.map((linha) => (
                  <li key={linha}>
                    <Check />
                    {linha}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {ultimo && (
            <a className="ec-outlink" href="https://wa.me/5521936182176" target="_blank" rel="noopener noreferrer">
              Ficou com dúvida? Fale com a equipe pelo WhatsApp →
            </a>
          )}
        </article>
      </div>

      <div className="ec-nav">
        {i > 0 && (
          <button className="cta quiet ec-prev" type="button" onClick={() => ir(i - 1)}>
            Voltar
          </button>
        )}
        {!ultimo && (
          <button className="cta ec-next" type="button" onClick={() => ir(i + 1)}>
            Próximo
          </button>
        )}
        {ultimo && <a className="cta ec-final" href="/inicio">Voltar ao início</a>}
      </div>
    </section>
  );
}
