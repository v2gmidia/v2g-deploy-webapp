import { avaliarHorario, type IntervaloOcupado } from "./regras.ts";

const partes = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

/** Grade fixa de 25 minutos de reunião + 15 minutos de intervalo. */
export function sugerirHorarios(agora: Date, ocupacoes: readonly IntervaloOcupado[]): string[] {
  const horarios: string[] = [];
  const cincoMinutos = 5 * 60_000;
  const primeiro = Math.ceil((agora.getTime() + 30 * 60_000) / cincoMinutos) * cincoMinutos;
  for (let instante = primeiro; instante < agora.getTime() + 10 * 24 * 60 * 60_000; instante += cincoMinutos) {
    const data = new Date(instante);
    const local = Object.fromEntries(partes.formatToParts(data).map((item) => [item.type, item.value]));
    const minutos = Number(local.hour) * 60 + Number(local.minute);
    if (minutos < 600 || (minutos - 600) % 40 !== 0) continue;
    if (avaliarHorario({ inicio: data, agora, duracaoMinutos: 25, ocupacoes }).ok)
      horarios.push(data.toISOString());
    if (horarios.length >= 60) break;
  }
  return horarios;
}
