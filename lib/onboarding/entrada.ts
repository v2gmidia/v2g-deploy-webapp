import { documento } from "./marca.ts";

/** Só a primeira abertura vai ao convite; respostas já iniciadas retomam pelo início. */
export function negocioAindaNaoIniciouOnboarding(onboarding: unknown): boolean {
  const doc = documento(onboarding);
  const respostas = documento(doc.respostas);
  return Object.keys(respostas).length === 0
    && !doc.contas && !doc.marca && !doc.conclusao;
}
