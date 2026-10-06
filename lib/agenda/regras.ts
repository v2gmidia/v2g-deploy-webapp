/** Regras locais para avaliar um horário proposto; não consulta nem reserva agenda. */

const FUSO = "America/Sao_Paulo";
const INICIO_DIA_MIN = 10 * 60;
const FIM_DIA_MIN = 18 * 60;
const ANTECEDENCIA_MIN = 30;
const INTERVALO_MIN = 15;
const DIAS_UTEIS_ADIANTE = 5;

export interface IntervaloOcupado {
  inicio: Date;
  fim: Date;
}

export type MotivoHorario =
  | "data_invalida"
  | "duracao_invalida"
  | "antecedencia"
  | "fim_de_semana"
  | "fora_do_horario"
  | "fora_do_prazo"
  | "ocupado";

export type AvaliacaoHorario = { ok: true } | { ok: false; motivo: MotivoHorario };

interface PartesLocais {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

const formato = new Intl.DateTimeFormat("en-US", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partes(instante: Date): PartesLocais {
  const campos = Object.fromEntries(
    formato.formatToParts(instante).map((parte) => [parte.type, parte.value]),
  );
  return {
    ano: Number(campos.year),
    mes: Number(campos.month),
    dia: Number(campos.day),
    hora: Number(campos.hour),
    minuto: Number(campos.minute),
  };
}

function diaSintetico(local: PartesLocais): Date {
  // Só aritmética de datas civis. O instante da reunião continua em UTC.
  return new Date(Date.UTC(local.ano, local.mes - 1, local.dia));
}

function diaUtil(local: PartesLocais): boolean {
  const dia = diaSintetico(local).getUTCDay();
  return dia !== 0 && dia !== 6;
}

function chaveDaData(local: PartesLocais): number {
  return local.ano * 10_000 + local.mes * 100 + local.dia;
}

/** Cinco dias úteis *depois* da data local de hoje; hoje também pode ser usado. */
export function limiteDeAgendamento(agora: Date): string | null {
  if (!Number.isFinite(agora.getTime())) return null;
  const cursor = diaSintetico(partes(agora));
  let contados = 0;
  while (contados < DIAS_UTEIS_ADIANTE) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const dia = cursor.getUTCDay();
    if (dia !== 0 && dia !== 6) contados++;
  }
  return cursor.toISOString().slice(0, 10);
}

/**
 * Filtra uma sugestão de horário. `ocupacoes` deve vir da agenda autorizada
 * do gestor escolhido; ausência da lista não é prova de disponibilidade.
 * A duração é parâmetro porque Victor mencionou 20 e 25 minutos, sem fechar.
 */
export function avaliarHorario({
  inicio,
  agora,
  duracaoMinutos,
  ocupacoes,
}: {
  inicio: Date;
  agora: Date;
  duracaoMinutos: number;
  ocupacoes: readonly IntervaloOcupado[];
}): AvaliacaoHorario {
  const inicioMs = inicio.getTime();
  const agoraMs = agora.getTime();
  if (!Number.isFinite(inicioMs) || !Number.isFinite(agoraMs)) {
    return { ok: false, motivo: "data_invalida" };
  }
  if (!Number.isInteger(duracaoMinutos) || duracaoMinutos <= 0 || duracaoMinutos > 480) {
    return { ok: false, motivo: "duracao_invalida" };
  }
  const fimMs = inicioMs + duracaoMinutos * 60_000;
  if (inicioMs < agoraMs + ANTECEDENCIA_MIN * 60_000) {
    return { ok: false, motivo: "antecedencia" };
  }

  const local = partes(inicio);
  const fimLocal = partes(new Date(fimMs));
  if (!diaUtil(local)) return { ok: false, motivo: "fim_de_semana" };
  if (
    chaveDaData(fimLocal) !== chaveDaData(local) ||
    local.hora * 60 + local.minuto < INICIO_DIA_MIN ||
    fimLocal.hora * 60 + fimLocal.minuto > FIM_DIA_MIN
  ) return { ok: false, motivo: "fora_do_horario" };

  const limite = limiteDeAgendamento(agora);
  const limiteNumerico = Number(limite?.replaceAll("-", ""));
  if (chaveDaData(local) > limiteNumerico) {
    return { ok: false, motivo: "fora_do_prazo" };
  }

  for (const ocupacao of ocupacoes) {
    const ocupadoInicio = ocupacao.inicio.getTime();
    const ocupadoFim = ocupacao.fim.getTime();
    if (!Number.isFinite(ocupadoInicio) || !Number.isFinite(ocupadoFim) || ocupadoFim <= ocupadoInicio) {
      return { ok: false, motivo: "data_invalida" };
    }
    if (
      inicioMs < ocupadoFim + INTERVALO_MIN * 60_000 &&
      fimMs + INTERVALO_MIN * 60_000 > ocupadoInicio
    ) return { ok: false, motivo: "ocupado" };
  }

  return { ok: true };
}
