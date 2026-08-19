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

      <div className="field-row">
        <div className="field">
          <label htmlFor="c-email">E-mail</label>
          {/* Trocar e-mail no Supabase Auth exige confirmar nos dois
              endereços; enquanto esse fluxo não existe, o campo é só
              leitura em vez de fingir que salva. */}
          <input id="c-email" type="email" defaultValue={props.email} disabled />
          <p className="note">
            Para trocar o e-mail, fale com a gente — o fluxo de confirmação ainda não está no
            app.
          </p>
        </div>
        <div className="field">
          <label htmlFor="c-senha">Senha</label>
          <input id="c-senha" type="password" defaultValue="••••••••" disabled />
          <p className="note">
            <a href="/recuperar">Trocar minha senha</a>
          </p>
        </div>
      </div>

      <Button type="submit" variant="ghost" disabled={pendente}>
        {pendente ? "Salvando…" : "Salvar perfil"}
      </Button>
    </form>
  );
}
