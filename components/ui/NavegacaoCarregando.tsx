"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./NavegacaoCarregando.module.css";

/** Feedback imediato para links internos enquanto a próxima rota é preparada. */
export function NavegacaoCarregando() {
  const pathname = usePathname();
  const [carregando, setCarregando] = useState(false);

  useEffect(() => { setCarregando(false); }, [pathname]);
  useEffect(() => {
    let limite: number | undefined;
    function aoClicar(evento: MouseEvent) {
      if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
      const alvo = evento.target;
      if (!(alvo instanceof Element)) return;
      const link = alvo.closest("a[href]");
      if (!link || link.hasAttribute("download") || (link.getAttribute("target") && link.getAttribute("target") !== "_self")) return;
      const destino = new URL(link.getAttribute("href") ?? "", window.location.href);
      if (destino.origin !== window.location.origin || destino.href === window.location.href) return;
      if (destino.pathname === window.location.pathname && destino.search === window.location.search) return;
      setCarregando(true);
      window.clearTimeout(limite);
      // Uma navegação cancelada não deve deixar o indicador preso na tela.
      limite = window.setTimeout(() => setCarregando(false), 15000);
    }
    document.addEventListener("click", aoClicar, true);
    return () => { document.removeEventListener("click", aoClicar, true); window.clearTimeout(limite); };
  }, []);

  return carregando ? <div className={styles.indicador} role="status" aria-live="polite">
    <span className={styles.barra} aria-hidden="true" />
    <span className={styles.rotulo}>Carregando tela…</span>
  </div> : null;
}
