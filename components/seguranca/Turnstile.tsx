"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

export function Turnstile({ siteKey }: { siteKey?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [pronto, setPronto] = useState(false);
  const [falhou, setFalhou] = useState(false);
  useEffect(() => {
    const api = (window as Window & { turnstile?: TurnstileApi }).turnstile;
    if (!pronto || !siteKey || !container.current || !api) return;
    let id: string;
    try {
      id = api.render(container.current, { sitekey: siteKey, action: "checkout", theme: "light",
        "response-field-name": "cf-turnstile-response" });
    } catch { setFalhou(true); return; }
    return () => { api.remove(id); };
  }, [pronto, siteKey]);

  if (!siteKey) return <p className="form-warning" role="status">
    A verificação de segurança não está configurada. O envio permanecerá bloqueado.
  </p>;
  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive" onReady={() => { setPronto(true); setFalhou(false); }}
      onError={() => setFalhou(true)} />
    <div ref={container} />
    {falhou && <p className="form-error" role="alert">A verificação de segurança não carregou. Atualize a página para tentar novamente.</p>}
  </>;
}

