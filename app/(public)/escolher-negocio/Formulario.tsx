"use client";

import { useActionState } from "react";
import { identificarDocumentoContratante } from "@/lib/contratacao/documento-contratante";
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
      {negocios.map((negocio) => <button key={negocio.id} type="submit"
        className="escolha-item" name="businessId" value={negocio.id}
        aria-current={selecionado === negocio.id ? "true" : undefined} disabled={pendente}>
        <span className="esc-texto">
          <b>{negocio.name}</b>
          <span>{negocio.cnpj ? identificarDocumentoContratante(negocio.cnpj) : `Cadastro ${negocio.codigo}`}</span>
        </span>
        <span aria-hidden="true" className="escolha-seta">→</span>
      </button>)}
    </div>
    {pendente && <p className="seletor-abrindo" role="status">Abrindo negócio…</p>}
  </form>;
}
