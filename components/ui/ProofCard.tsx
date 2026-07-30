import type { ReactNode } from "react";

interface ProofCardProps {
  title: string;
  children: ReactNode;
}

/**
 * Card de confiança (classe `.proof-card` em app/globals.css), usado
 * na coluna lateral do fluxo de entrada.
 */
export function ProofCard({ title, children }: ProofCardProps) {
  return (
    <div className="proof-card">
      <b className="title">{title}</b>
      <p>{children}</p>
    </div>
  );
}
