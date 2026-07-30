import type { ReactNode } from "react";

type PillTone = "ok" | "warn" | "crit" | "info" | "off";

interface PillProps {
  tone: PillTone;
  children: ReactNode;
}

/**
 * Pill de status (classe `.pill` em app/globals.css).
 * Não é consumido por nenhuma tela deste PR (nem /entrar nem /inicio
 * mostram status) — extraído agora porque aparece em 3+ telas do
 * design de referência (dashboard, campanhas, alertas) e vai ser
 * reaproveitado quando essas telas forem construídas. Ver
 * docs/arquitetura.md, Decisão 8.
 */
export function Pill({ tone, children }: PillProps) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
