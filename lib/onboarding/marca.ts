/** Respostas do visual da marca. O texto é do cliente, não uma cor inferida. */
export interface RespostasDaMarca {
  aparencia: string;
  aparenciaNaoSei: boolean;
  siteNaoTenho: boolean;
  em: string;
}

export interface ConclusaoDoOnboarding {
  em: string;
  proximoPasso: "agendamento_pendente";
}

export function documento(onboarding: unknown): Record<string, unknown> {
  return onboarding && typeof onboarding === "object" && !Array.isArray(onboarding)
    ? onboarding as Record<string, unknown>
    : {};
}

export function lerMarca(onboarding: unknown): RespostasDaMarca | null {
  const valor = documento(onboarding).marca;
  if (!valor || typeof valor !== "object") return null;
  const marca = valor as Partial<RespostasDaMarca>;
  if (typeof marca.em !== "string") return null;
  return {
    aparencia: typeof marca.aparencia === "string" ? marca.aparencia : "",
    aparenciaNaoSei: marca.aparenciaNaoSei === true,
    siteNaoTenho: marca.siteNaoTenho === true,
    em: marca.em,
  };
}

export function lerConclusao(onboarding: unknown): ConclusaoDoOnboarding | null {
  const valor = documento(onboarding).conclusao;
  if (!valor || typeof valor !== "object") return null;
  const conclusao = valor as Partial<ConclusaoDoOnboarding>;
  return typeof conclusao.em === "string" && conclusao.proximoPasso === "agendamento_pendente"
    ? { em: conclusao.em, proximoPasso: "agendamento_pendente" }
    : null;
}

/** A nova jornada não inicia o pipeline antes de registrar a reunião. */
export function fluxoAguardaReuniao(onboarding: unknown): boolean {
  const doc = documento(onboarding);
  return "respostas" in doc || "contas" in doc;
}
