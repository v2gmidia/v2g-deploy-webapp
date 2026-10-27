/** Intenção do envio pronto: não é briefing de geração nem ordem de publicação. */
export const OBJETIVOS_DO_ENVIO = [
  { valor: "whatsapp_messages", rotulo: "Receber mensagens no WhatsApp", apoio: "Levar pessoas para conversar com seu negócio." },
  { valor: "instagram_visits", rotulo: "Levar pessoas ao Instagram", apoio: "Dar visibilidade ao perfil da sua empresa." },
] as const;

export type ObjetivoDoEnvio = typeof OBJETIVOS_DO_ENVIO[number]["valor"];
type BaseDaIntencao = {
  objective: ObjetivoDoEnvio;
  promotionEndsOn: string | null;
  confirmedAt: string;
};
export type IntencaoDoEnvio = (BaseDaIntencao & { version: 1 })
  | (BaseDaIntencao & { version: 2; referenceId: string });

export function hojeEmSaoPaulo(agora = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(agora);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)!.value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

function ehObjetivo(valor: unknown): valor is ObjetivoDoEnvio {
  return OBJETIVOS_DO_ENVIO.some((opcao) => opcao.valor === valor);
}

function ehData(valor: unknown): valor is string {
  if (typeof valor !== "string" || !/^20\d{2}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T12:00:00Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

export function validarIntencaoDoEnvio(entrada: {
  objetivo: unknown; promocao: boolean; validade: unknown; confirmado: boolean;
}, hoje: string): { ok: true; objetivo: ObjetivoDoEnvio; validade: string | null } | { ok: false; erro: string } {
  if (!ehObjetivo(entrada.objetivo)) return { ok: false, erro: "Escolha o objetivo desse criativo." };
  if (entrada.promocao && !ehData(entrada.validade))
    return { ok: false, erro: "Informe uma data válida para o fim da promoção." };
  if (entrada.promocao && (entrada.validade as string) < hoje)
    return { ok: false, erro: "A promoção já terminou. Confira a validade antes de enviar." };
  if (!entrada.promocao && entrada.validade !== null && entrada.validade !== "")
    return { ok: false, erro: "Confira se este criativo tem uma promoção com prazo." };
  if (!entrada.confirmado) return { ok: false, erro: "Confirme os dados do criativo antes de enviar." };
  return { ok: true, objetivo: entrada.objetivo, validade: entrada.promocao ? entrada.validade as string : null };
}

export function lerIntencaoDoEnvio(valor: unknown): IntencaoDoEnvio | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const item = valor as Record<string, unknown>;
  const v1 = item.version === 1 && Object.keys(item).sort().join(",") === "confirmedAt,objective,promotionEndsOn,version";
  const v2 = item.version === 2 && Object.keys(item).sort().join(",") === "confirmedAt,objective,promotionEndsOn,referenceId,version"
    && typeof item.referenceId === "string" && /^\d{10,20}$/.test(item.referenceId);
  if (!(v1 || v2) || !ehObjetivo(item.objective) ||
    !(item.promotionEndsOn === null || ehData(item.promotionEndsOn)) ||
    typeof item.confirmedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(item.confirmedAt) ||
    !Number.isFinite(Date.parse(item.confirmedAt)) ||
    new Date(item.confirmedAt).toISOString() !== item.confirmedAt) return null;
  return item as IntencaoDoEnvio;
}

export function mesmaIntencaoDoEnvio(anterior: unknown, nova: IntencaoDoEnvio): boolean {
  const lida = lerIntencaoDoEnvio(anterior);
  return lida !== null && lida.objective === nova.objective && lida.promotionEndsOn === nova.promotionEndsOn
    && (lida.version === 2 ? lida.referenceId : null) === (nova.version === 2 ? nova.referenceId : null);
}

export function resumoDaIntencao(valor: unknown, hoje: string): string {
  if (valor === null) return "Objetivo e validade não registrados neste envio antigo.";
  const item = lerIntencaoDoEnvio(valor);
  if (!item) return "Objetivo ou validade inconsistentes. Confira o envio com a equipe.";
  const objetivo = OBJETIVOS_DO_ENVIO.find((opcao) => opcao.valor === item.objective)!.rotulo;
  const referencia = item.version === 2 ? ` Referência pública: anúncio ${item.referenceId}.` : "";
  if (!item.promotionEndsOn) return `${objetivo}. Sem promoção com prazo informado.${referencia}`;
  const data = item.promotionEndsOn.split("-").reverse().join("/");
  return `${objetivo}. Promoção até ${data}${item.promotionEndsOn < hoje ? " — prazo encerrado" : ""}.${referencia}`;
}

/** Bloqueia só a aprovação interna; não agenda nem pausa anúncios. */
export function impedimentoParaAprovarEnvio(valor: unknown, hoje: string): string | null {
  if (valor === null) return null; // legado permanece explícito, sem objetivo inventado
  const item = lerIntencaoDoEnvio(valor);
  if (!item) return "Confira o objetivo e a validade deste envio antes de aprovar.";
  return item.promotionEndsOn && item.promotionEndsOn < hoje
    ? "Esta promoção já terminou. Peça um criativo atualizado antes de aprovar." : null;
}
