"use client";

import { useEffect, useRef, useState } from "react";
import { Bubble } from "@/components/ui/Bubble";
import { PASSOS, RECIBO_CHECK as Check } from "./passos";

/**
 * Um combinado de cada vez — trocar de passo é um ato, não uma rolagem
 * (mesma decisão do protótipo). O estado é só de interface: nada aqui
 * vai para o banco, esta tela não coleta dado nenhum.
 */
export function Combinados() {
  const [i, setI] = useState(0);
  const [duvidaAberta, setDuvidaAberta] = useState(false);
  const [selando, setSelando] = useState(false);

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

  function selar() {
    if (selando) return;
    setSelando(true);
    // O selo carimba e some; daqui seguiria para o pagamento, que ainda
    // não existe como rota.
    setTimeout(() => setSelando(false), 900);
  }

  return (
    <section className="auth-card ec-card">
      <div className="ec-top">
        <button
          className="ec-back"
          type="button"
          aria-label="Voltar"
          onClick={() => ir(i - 1)}
          disabled={i === 0}
        >
          <svg width="14" height="14" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M6.5 1.5 2 5l4.5 3.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </svg>
        </button>
        <span className="ec-label">Antes de pagar</span>
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

          {passo.outlink && (
            <a className="ec-outlink" href="#">
              {passo.outlink}
            </a>
          )}

          {ultimo && (
            <>
              <button
                className="ec-doubt"
                type="button"
                onClick={() => setDuvidaAberta((v) => !v)}
                aria-expanded={duvidaAberta}
              >
                Ainda com dúvida? Fala com a gente antes de pagar
              </button>
              <div className={`ec-doubt-chat${duvidaAberta ? " open" : ""}`}>
                <Bubble de="ai">
                  Oi! Sou do suporte da V2G. Pode perguntar o que quiser sobre os combinados
                  antes de pagar — respondo por aqui mesmo.
                </Bubble>
              </div>
            </>
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
        {ultimo && (
          <button className="cta ec-final" type="button" onClick={selar}>
            <svg
              className={`lockicon${selando ? " open" : ""}`}
              width="15"
              height="15"
              viewBox="0 0 10 10"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="1" y="4" width="8" height="6" />
              <rect className="shackle-l" x="3" y="1" width="1.4" height="4" />
              <rect className="shackle-r" x="5.6" y="1" width="1.4" height="4" />
              <rect className="shackle-t" x="3" y="1" width="4" height="1.4" />
            </svg>
            Combinado, vamos pilotar
          </button>
        )}
      </div>

      <div className={`ec-badge${selando ? " show" : ""}`} aria-hidden="true">
        Combinado ✓
      </div>
    </section>
  );
}
