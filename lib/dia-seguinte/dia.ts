/**
 * Que dia é "ontem" para o dono — e a resposta NÃO é `Date.now() - 24h`.
 *
 * ============================================================
 * O FUSO É `America/Sao_Paulo`, E O SERVIDOR NÃO ESTÁ NELE.
 *
 * A Vercel roda em UTC. Das 21h à meia-noite de Brasília, o servidor já
 * está no dia seguinte — três horas por dia em que "ontem" calculado no
 * fuso do servidor é o dia errado.
 *
 * O estrago é concreto: às 22h o dono abre o app, a tela pergunta sobre
 * anteontem, e a resposta dele é gravada na chave `(execução, dia)` de
 * anteontem — por cima do que ele já tinha respondido, porque a escrita é
 * upsert. Um dia inteiro de venda apagado por causa de fuso.
 *
 * Decisão do Victor em 01/09/2026: fuso `America/Sao_Paulo`.
 * ============================================================
 *
 * ============================================================
 * A PERGUNTA É SOBRE ONTEM, E ISSO TAMBÉM É DECISÃO.
 *
 * "O dono responde sobre o dia que fechou — perguntar sobre hoje às 10h
 * da manhã não faz sentido." (Victor, 01/09/2026.) O contrato do backend
 * já dizia que `dia` é "o dia a que a resposta SE REFERE"; aqui está
 * fixado qual é esse dia.
 * ============================================================
 *
 * `agora` é PARÂMETRO, e não `new Date()` lá dentro — mesma disciplina do
 * `resumirPendencias`. É o que torna a virada das 21h testável sem
 * esperar as 21h.
 */

const FUSO = "America/Sao_Paulo";

/**
 * O formatador. `en-CA` porque ele produz `YYYY-MM-DD`, que é exatamente
 * o formato que o contrato pede — e não uma montagem à mão que erraria o
 * zero à esquerda no dia 9.
 */
const COMO_DIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** O dia de hoje em São Paulo, `YYYY-MM-DD`. */
export function diaEmSaoPaulo(agora: Date): string {
  return COMO_DIA.format(agora);
}

/**
 * O dia de ontem em São Paulo, `YYYY-MM-DD` — o dia sobre o qual a
 * pergunta diária é feita.
 *
 * ARITMÉTICA DE CALENDÁRIO, e não `agora - 24h`. Subtrair 24 horas erra
 * na virada de horário de verão: um dia de 23 horas devolveria o mesmo
 * dia, e um de 25 devolveria anteontem. O Brasil não tem horário de
 * verão desde 2019, mas o código não fica sabendo se voltar — e a forma
 * certa não custa mais.
 *
 * `Date.UTC` com `dia - 1` resolve a virada de mês e de ano sozinho:
 * `Date.UTC(2026, 0, 0)` é 31/12/2025.
 */
export function diaDeOntemEmSaoPaulo(agora: Date): string {
  const hoje = diaEmSaoPaulo(agora);
  const [ano, mes, dia] = hoje.split("-").map(Number) as [number, number, number];
  const ontem = new Date(Date.UTC(ano, mes - 1, dia - 1));
  return ontem.toISOString().slice(0, 10);
}

/**
 * O dia `n` dias antes de `dia`, em `YYYY-MM-DD`.
 *
 * Aritmética de calendário pelo mesmo motivo do `diaDeOntemEmSaoPaulo`:
 * subtrair `n * 86400000` erra em virada de horário de verão. `Date.UTC`
 * com `dia - n` resolve mês e ano sozinho.
 *
 * Opera sobre a STRING, e não sobre um `Date` — assim ela não reintroduz
 * fuso nenhum: o dia já foi decidido em São Paulo por quem chamou.
 */
export function diasAntesDe(dia: string, n: number): string {
  const [ano, mes, d] = dia.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(ano, mes - 1, d - n)).toISOString().slice(0, 10);
}
