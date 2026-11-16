"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { salvarPerfilAction, type ContaActionState } from "./actions";

const inicial: ContaActionState = {};

interface PerfilProps {
  nome: string;
  whatsapp: string;
  email: string;
}

export function FormPerfil(props: PerfilProps) {
  const [estado, action, pendente] = useActionState(salvarPerfilAction, inicial);

  return (
    <form action={action} className="card form-card">
      {estado.erro && <p className="form-error">{estado.erro}</p>}
      {estado.ok && <p className="form-notice">{estado.ok}</p>}

      <div className="field-row">
        <div className="field">
          <label htmlFor="c-full-name">Seu nome</label>
          <input
            id="c-full-name"
            name="full_name"
            type="text"
            defaultValue={props.nome}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="c-whatsapp">WhatsApp</label>
          <input
            id="c-whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="numeric"
            defaultValue={props.whatsapp}
            placeholder="(11) 91234-5678"
          />
          <p className="note">É por aqui que a gente avisa e conversa. Nada de robô.</p>
        </div>
      </div>

      <Button type="submit" variant="ghost" disabled={pendente}>
        {pendente ? "Salvando…" : "Salvar perfil"}
      </Button>
    </form>
  );
}
