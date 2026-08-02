"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  salvarNegocioAction,
  salvarPerfilAction,
  type ContaActionState,
} from "./actions";

const inicial: ContaActionState = {};

/** Raios oferecidos. Batem com os que o onboarding grava (5/25/60). */
const RAIOS = [
  { valor: 5, rotulo: "5 km — só aqui perto" },
  { valor: 15, rotulo: "15 km" },
  { valor: 25, rotulo: "25 km — a cidade toda" },
  { valor: 60, rotulo: "60 km — cidade e região" },
];

interface NegocioProps {
  nome: string;
  segmento: string;
  cidade: string;
  raio: number | null;
  ticket: number | null;
  limite: number | null;
}

export function FormNegocio(props: NegocioProps) {
  const [estado, action, pendente] = useActionState(salvarNegocioAction, inicial);

  return (
    <form action={action} className="card form-card">
      {estado.erro && <p className="form-error">{estado.erro}</p>}
      {estado.ok && <p className="form-notice">{estado.ok}</p>}

      <p className="hint">
        Mudou alguma coisa aqui? É com isso que a IA decide para quem mostrar seus anúncios.
      </p>

      <div className="field-row">
        <div className="field">
          <label htmlFor="c-nome">Nome do negócio</label>
          <input id="c-nome" name="nome" type="text" defaultValue={props.nome} required />
        </div>
        <div className="field">
          <label htmlFor="c-segmento">Segmento</label>
          <input
            id="c-segmento"
            name="segmento"
            type="text"
            defaultValue={props.segmento}
            placeholder="Ex.: doceria, clínica, salão"
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="c-cidade">Cidade</label>
          <input id="c-cidade" name="cidade" type="text" defaultValue={props.cidade} />
        </div>
        <div className="field">
          <label htmlFor="c-raio">Raio de atendimento</label>
          <select id="c-raio" name="raio" defaultValue={props.raio ?? ""}>
            <option value="">Não definido</option>
            {RAIOS.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.rotulo}
              </option>
            ))}
          </select>
          <p className="note">A IA só mostra seus anúncios para quem está dentro dele.</p>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="c-ticket">Ticket médio</label>
          <input
            id="c-ticket"
            name="ticket"
            type="text"
            inputMode="decimal"
            defaultValue={props.ticket ?? ""}
            placeholder="Ex.: 68"
          />
          <p className="note">
            Quanto o cliente gasta, em média, numa compra. No onboarding isso foi respondido por
            faixa; aqui você pode cravar o número.
          </p>
        </div>
        <div className="field">
          <label htmlFor="c-limite">Limite de investimento no mês</label>
          <input
            id="c-limite"
            name="limite"
            type="text"
            inputMode="decimal"
            defaultValue={props.limite ?? ""}
            placeholder="Ex.: 2400"
          />
          {/* A copy antiga prometia "nunca passa disso, nem num dia bom".
              O Facebook gasta até 25% a mais num dia e desconta nos
              outros. A promessa era falsa e o cliente descobriria sozinho
              olhando o extrato — pior lugar para descobrir. */}
          <p className="note">
            É esse valor que você vai gastar no mês. Você mexe nele quando quiser.
          </p>
          <p className="note" style={{ marginTop: 6 }}>
            Um detalhe para não te assustar quando acontecer: o Facebook pode gastar um pouco
            mais num dia em que estiver aparecendo gente boa, e gasta menos nos dias seguintes
            para compensar. No fim do mês fecha no seu limite. É assim que ele funciona para
            todo mundo, e é o que faz o anúncio render mais.
          </p>
        </div>
      </div>

      <Button type="submit" disabled={pendente}>
        {pendente ? "Salvando…" : "Salvar dados do negócio"}
      </Button>
    </form>
  );
}

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
