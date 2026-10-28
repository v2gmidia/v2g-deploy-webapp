export type EstadoDaVoz = "disponivel" | "nao_configurada" | "desativada";

export function estadoDaVoz(temChave: boolean, desativada: boolean): EstadoDaVoz {
  if (desativada) return "desativada";
  return temChave ? "disponivel" : "nao_configurada";
}

export function recadoDaVozIndisponivel(estado: Exclude<EstadoDaVoz, "disponivel">): string {
  return estado === "desativada"
    ? "está temporariamente desativada neste ambiente. Digite sua resposta abaixo."
    : "não está configurada neste ambiente. Digite sua resposta abaixo.";
}

export function recadoDeFalhaDoMicrofone(falha: unknown): string {
  const nome = typeof falha === "object" && falha !== null && "name" in falha
    ? String((falha as { name?: unknown }).name ?? "") : "";
  if (nome === "NotAllowedError" || nome === "PermissionDeniedError")
    return "A permissão do microfone foi negada. Autorize no navegador ou digite sua resposta.";
  if (nome === "NotFoundError" || nome === "DevicesNotFoundError")
    return "Não encontrei um microfone neste aparelho. Digite sua resposta.";
  return "Não consegui abrir o microfone. Tente novamente ou digite sua resposta.";
}

export function recadoDeFalhaDaTranscricao(status: number): string {
  if (status === 401) return "Sua sessão terminou. Entre novamente para responder por voz.";
  if (status === 403) return "Escolha um negócio antes de responder por voz.";
  if (status === 429) return "Há muitas transcrições agora. Aguarde um minuto ou digite sua resposta.";
  if (status === 501) return "A resposta por voz não está disponível neste ambiente. Digite sua resposta.";
  return "Não consegui iniciar a transcrição. Tente novamente ou digite sua resposta.";
}

export function juntarTextoEFala(textoAtual: string, fala: string): string {
  return [textoAtual.trim(), fala.trim()].filter(Boolean).join(" ");
}
