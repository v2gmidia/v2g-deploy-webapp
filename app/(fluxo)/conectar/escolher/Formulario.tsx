"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { salvarEscolhaAction, type EscolhaState } from "./actions";
import type { ContaDeAnuncio } from "@/lib/meta/graph";

const inicial: EscolhaState = {};

interface Props {
  contas: ContaDeAnuncio[];
}

/**
 * Escolha da conta de anúncio.
 *
 * Havia aqui um segundo bloco, para escolher o perfil de Instagram. Saiu
 * junto com o escopo `instagram_basic` — ver a nota em `lib/meta/graph.ts`.
 */
export function FormularioEscolha({ contas }: Props) {
  const [estado, action, pendente] = useActionState(salvarEscolhaAction, inicial);

  const elegiveis = contas.filter((c) => c.elegivel);
  const [contaEscolhida, setContaEscolhida] = useState(elegiveis[0]?.externalId ?? "");

  const conta = contas.find((c) => c.externalId === contaEscolhida);

  return (
    <form action={action}>
      {estado.erro && <p className="form-error">{estado.erro}</p>}

      <input type="hidden" name="conta" value={contaEscolhida} />
      <input type="hidden" name="contaNome" value={conta?.nome ?? ""} />
      <input type="hidden" name="moeda" value={conta?.moeda ?? ""} />

      <p className="eyebrow">Conta de anúncio</p>
      <div className="escolha-lista">
        {contas.map((c) => (
          <label
            key={c.externalId}
            className={`escolha-item${!c.elegivel ? " off" : ""}${
              contaEscolhida === c.externalId ? " picked" : ""
            }`}
          >
            <input
              type="radio"
              name="conta-radio"
              value={c.externalId}
              checked={contaEscolhida === c.externalId}
              disabled={!c.elegivel}
              onChange={() => setContaEscolhida(c.externalId)}
            />
            <span className="esc-texto">
              <b>{c.nome}</b>
              <span>
                {c.elegivel
                  ? `${c.externalId}${c.moeda ? ` · ${c.moeda}` : ""}`
                  : c.motivoInelegivel}
              </span>
            </span>
          </label>
        ))}
      </div>

      <Button type="submit" disabled={pendente || !contaEscolhida}>
        {pendente ? "Salvando…" : "Usar esta conta"}
      </Button>
    </form>
  );
}
