"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { salvarEscolhaAction, type EscolhaState } from "./actions";
import type { ContaDeAnuncio, PerfilDeInstagram } from "@/lib/meta/graph";

const inicial: EscolhaState = {};

interface Props {
  contas: ContaDeAnuncio[];
  perfis: PerfilDeInstagram[];
}

export function FormularioEscolha({ contas, perfis }: Props) {
  const [estado, action, pendente] = useActionState(salvarEscolhaAction, inicial);

  const elegiveis = contas.filter((c) => c.elegivel);
  const comInstagram = perfis.filter((p) => p.instagramId);

  const [contaEscolhida, setContaEscolhida] = useState(elegiveis[0]?.externalId ?? "");
  const [igEscolhido, setIgEscolhido] = useState(comInstagram[0]?.instagramId ?? "");

  const conta = contas.find((c) => c.externalId === contaEscolhida);

  return (
    <form action={action}>
      {estado.erro && <p className="form-error">{estado.erro}</p>}

      <input type="hidden" name="conta" value={contaEscolhida} />
      <input type="hidden" name="contaNome" value={conta?.nome ?? ""} />
      <input type="hidden" name="moeda" value={conta?.moeda ?? ""} />
      <input type="hidden" name="instagram" value={igEscolhido} />

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

      {comInstagram.length > 0 && (
        <>
          <p className="eyebrow" style={{ marginTop: 22 }}>
            Perfil do Instagram
          </p>
          <div className="escolha-lista">
            {comInstagram.map((p) => (
              <label
                key={p.instagramId}
                className={`escolha-item${igEscolhido === p.instagramId ? " picked" : ""}`}
              >
                <input
                  type="radio"
                  name="ig-radio"
                  value={p.instagramId ?? ""}
                  checked={igEscolhido === p.instagramId}
                  onChange={() => setIgEscolhido(p.instagramId ?? "")}
                />
                <span className="esc-texto">
                  <b>@{p.instagramUsuario ?? p.instagramId}</b>
                  <span>ligado à página {p.paginaNome}</span>
                </span>
              </label>
            ))}
          </div>
        </>
      )}

      <Button type="submit" disabled={pendente || !contaEscolhida}>
        {pendente ? "Salvando…" : "Usar esta conta"}
      </Button>
    </form>
  );
}
