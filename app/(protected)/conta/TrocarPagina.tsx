"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { trocarPaginaAction, type ContaActionState } from "./actions";
import type { PaginaDoFacebook } from "@/lib/meta/graph";

const inicial: ContaActionState = {};

interface Props {
  paginas: PaginaDoFacebook[];
  atual: string | null;
}

/**
 * Trocar a página do Facebook sem passar pelo OAuth de novo.
 *
 * Só aparece quando existe mais de uma página. Com uma só, não há troca
 * possível — e um seletor de um item é uma pergunta com uma resposta,
 * que ensina a clicar sem ler.
 */
export function TrocarPagina({ paginas, atual }: Props) {
  const [estado, action, pendente] = useActionState(trocarPaginaAction, inicial);
  const [escolhida, setEscolhida] = useState(atual ?? paginas[0]?.id ?? "");

  const unica = paginas.length === 1 ? paginas[0] : null;
  if (paginas.length === 0) return null;

  const paginaAtual = paginas.find((p) => p.id === atual);

  if (unica) {
    return (
      <div className="card">
        <div className="escolhido">
          <b>{unica.nome}</b>
          <span>{unica.categoria ?? unica.id}</span>
          <p className="hint">
            É a única página que a sua conexão alcança, então não há o que trocar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action}>
      {estado.erro && <p className="form-error">{estado.erro}</p>}
      {estado.ok && <p className="form-ok">{estado.ok}</p>}

      <input type="hidden" name="pagina" value={escolhida} />

      <div className="escolha-lista">
        {paginas.map((p) => (
          <label key={p.id} className={`escolha-item${escolhida === p.id ? " picked" : ""}`}>
            <input
              type="radio"
              name="pagina-radio"
              value={p.id}
              checked={escolhida === p.id}
              onChange={() => setEscolhida(p.id)}
            />
            <span className="esc-texto">
              <b>{p.nome}</b>
              <span>
                {p.id === atual ? "Em uso agora" : (p.categoria ?? p.id)}
              </span>
            </span>
          </label>
        ))}
      </div>

      <p className="hint">
        A troca vale para os <b>próximos</b> anúncios. Os que já estão no ar continuam saindo de{" "}
        {paginaAtual?.nome ?? "onde estão"} até serem refeitos.
      </p>

      <Button type="submit" disabled={pendente || escolhida === atual}>
        {pendente ? "Salvando…" : "Usar esta página"}
      </Button>
    </form>
  );
}
