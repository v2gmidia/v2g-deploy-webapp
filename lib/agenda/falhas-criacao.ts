// Respostas explícitas que recusam o POST de criação. Falhas de rede, 409,
// limites de taxa e falhas do servidor não provam que o evento não foi criado.
const REJEICOES_DEFINITIVAS = new Set([400, 401, 403, 404, 422]);

export function rejeicaoDefinitivaDaCriacao(status: number): boolean {
  return REJEICOES_DEFINITIVAS.has(status);
}

export class CriacaoGoogleRecusada extends Error {
  readonly statusHttp: number;

  constructor(statusHttp: number) {
    super("criacao_google_recusada");
    this.statusHttp = statusHttp;
  }
}
