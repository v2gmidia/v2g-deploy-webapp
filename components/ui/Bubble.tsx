import type { ReactNode } from "react";

interface BubbleProps {
  de: "ai" | "user";
  children: ReactNode;
}

/**
 * Balão de conversa (classe `.bubble` em app/globals.css).
 *
 * Extraído porque aparece nas duas telas desta leva: no chat do
 * onboarding e no "ainda com dúvida?" da tela de expectativas. Nenhum
 * outro elemento das duas se repete — o resto ficou local de propósito.
 */
export function Bubble({ de, children }: BubbleProps) {
  return <div className={`bubble ${de}`}>{children}</div>;
}
