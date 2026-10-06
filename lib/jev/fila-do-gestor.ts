import "server-only";

import type { Pendencia } from "@/lib/cadastro/montar";
import { estadoDaTriagem, sugestaoDeterministica, type SugestaoDaTriagem } from "./triagem";
import { sugerirComJev } from "./typesafe";

export async function triarPendenciasDoGestor(
  pendencias: Pendencia[],
  diasEsperando: number | null,
): Promise<{ sugestao: SugestaoDaTriagem; origem: "jev" | "regra" }> {
  const estado = estadoDaTriagem(
    pendencias.map((pendencia) => ({
      campo: pendencia.campo,
      motivo: pendencia.motivo,
      caminho: pendencia.onde,
      diasEsperando: pendencia.desde ? diasEsperando : null,
    })),
  );
  const sugestao = await sugerirComJev(estado);
  return sugestao ? { sugestao, origem: "jev" } : {
    sugestao: sugestaoDeterministica(estado),
    origem: "regra",
  };
}
