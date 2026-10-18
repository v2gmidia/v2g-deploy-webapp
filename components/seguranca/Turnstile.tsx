"use client";

import Script from "next/script";

export function Turnstile({ siteKey }: { siteKey?: string }) {
  if (!siteKey) return <p className="form-warning" role="status">
    A verificação de segurança não está configurada. O envio permanecerá bloqueado.
  </p>;
  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
    <div className="cf-turnstile" data-sitekey={siteKey} data-action="checkout"
      data-theme="light" data-response-field-name="cf-turnstile-response" />
  </>;
}

