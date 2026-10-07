"use client";

import { useActionState } from "react";
import { escolherNegocioAction, type EscolhaNegocioState } from "./actions";

interface NegocioNaLista { id: string; name: string; cnpj: string | null; codigo: string }

export function FormularioNegocio({ negocios, selecionado }: {
  negocios: NegocioNaLista[];
  selecionado: string | null;
}) {
  const [estado, action, pendente] = useActionState<EscolhaNegocioState, FormData>(
    escolherNegocioAction, {},
  );
  return <form action={action}>
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    <div className="escolha-lista">
      {negocios.map((negocio) => <label key={negocio.id} className="escolha-item">
        <input type="radio" name="businessId" value={negocio.id}
          defaultChecked={selecionado === negocio.id || (negocios.length === 1 && !selecionado)} required />
        <span className="esc-texto">
          <b>{negocio.name}</b>
          <span>{negocio.cnpj ? `CNPJ ${negocio.cnpj}` : `Cadastro ${negocio.codigo}`}</span>
        </span>
      </label>)}
    </div>
    <button className="cta" type="submit" disabled={pendente}>
      {pendente ? "Abrindo…" : "Abrir negócio"}
    </button>
  </form>;
}
