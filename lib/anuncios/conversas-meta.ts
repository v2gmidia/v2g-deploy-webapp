/** Contagem atribuída pela Meta; nunca presume WhatsApp ou pessoa única. */
export const DEFINICAO_CONVERSAS = "onsite_conversion.messaging_conversation_started_7d";
const decimal = /^\d{1,15}(?:\.\d{1,6})?$/;
const escala = 1_000_000n;
const limite = 999_999_999_999_999n * escala;
export const conversaValida = (v: unknown): v is string => typeof v === "string" && decimal.test(v);

export function somarConversas(valores: (string | null | undefined)[]): string | null {
  if (!valores.length || valores.some(v => !conversaValida(v))) return null;
  const total = valores.reduce((soma, v) => {
    const [inteiro, fracao = ""] = v!.split(".");
    return soma + BigInt(inteiro!) * escala + BigInt(fracao.padEnd(6, "0"));
  }, 0n);
  if (total > limite) return null;
  const fracao = (total % escala).toString().padStart(6, "0").replace(/0+$/, "");
  return `${total / escala}${fracao ? `.${fracao}` : ""}`;
}

export function formatarConversas(valor: string | null | undefined): string {
  if (!conversaValida(valor)) return "Não medido";
  const [inteiro, fracao] = valor.split(".");
  return `${BigInt(inteiro!).toLocaleString("pt-BR")}${fracao ? `,${fracao.replace(/0+$/, "")}`.replace(/,$/, "") : ""}`;
}
