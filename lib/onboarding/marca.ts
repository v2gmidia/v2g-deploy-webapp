/** Cores propostas pelo arquivo só viram resposta depois da confirmação do cliente. */
export interface RespostasDaMarca {
  aparencia: string;
  coresConfirmadas: string[];
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
    coresConfirmadas: Array.isArray(marca.coresConfirmadas)
      ? marca.coresConfirmadas.filter((cor): cor is string => typeof cor === "string" && /^#[0-9A-Fa-f]{6}$/.test(cor)).slice(0, 3)
      : [],
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
