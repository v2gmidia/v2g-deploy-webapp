import type { SnapshotGeracao } from "./contexto.ts";
import { pngSimulado } from "./png-local.ts";

export interface SaidaDaImagem {
  bytes: Uint8Array;
  mime: "image/png";
  simulated: boolean;
  providerRequestId: string | null;
  usageReported: null;
  billedMinor: null;
}
export interface ProvedorDeImagem {
  readonly modo: "simulado" | "real";
  readonly id: string;
  gerar(entrada: { snapshot: SnapshotGeracao; attemptId: string; idempotencyKey: string }): Promise<SaidaDaImagem>;
}
export class FalhaDoProvedor extends Error {
  constructor(readonly certeza: "nao_enviado" | "incerto") { super("provedor_indisponivel"); }
}

/** Sem rede, SDK ou preço: somente um adaptador técnico para o ensaio local. */
export function criarProvedorSimulado(): ProvedorDeImagem {
  return { modo: "simulado", id: "fake-local-v1", async gerar() {
    return { bytes: pngSimulado(), mime: "image/png", simulated: true,
      providerRequestId: null, usageReported: null, billedMinor: null };
  } };
}
