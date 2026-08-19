"use client";

import { useActionState, useState } from "react";
import { dinheiro } from "@/lib/formato";
import { definirVerbaAction, type VerbaActionState } from "./actions";

const inicial: VerbaActionState = {};

/** 30 dias, como o resto do app (`lib/meta/orcamento.ts`). */
const DIAS = 30;

export function FormVerba({ atual }: { atual: number | null }) {
  const [estado, action, pendente] = useActionState(definirVerbaAction, inicial);
  const [rascunho, setRascunho] = useState(atual !== null ? String(atual) : "");

  // A conversão para o dia acontece ENQUANTO ele digita, e não depois de
  // salvar. "R$ 600 por mês" não diz nada a quem nunca comprou anúncio;
  // "uns R$ 20 por dia" diz. Mostrar só depois do salvar faria a pessoa
  // descobrir a escala quando a escolha já está feita.
  const numero = Number(rascunho.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", "."));
  const porDia = Number.isFinite(numero) && numero > 0 ? numero / DIAS : null;

  return (
    <form action={action} className="card form-card">
      {estado.erro && <p className="form-error">{estado.erro}</p>}
      {estado.ok && <p className="form-notice">{estado.ok}</p>}

      <div className="field">
        <label htmlFor="v-verba">
          {atual !== null ? "Mudar quanto investir por mês" : "Quanto você pode investir por mês"}
        </label>
        <input
          id="v-verba"
          name="verba"
          type="text"
          inputMode="decimal"
          placeholder="Ex: 600"
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          required
        />
      </div>

      <p className="hint">
        {porDia !== null ? (
          <>
            Dá mais ou menos <b>{dinheiro(porDia)} por dia</b> de anúncio. Esse dinheiro vai
            inteiro para o Facebook — a mensalidade da V2G é a outra cobrança, e vem separada.
          </>
        ) : (
          <>
            É o teto do mês. Esse dinheiro vai inteiro para o Facebook — a mensalidade da V2G é a
            outra cobrança, e vem separada.
          </>
        )}
      </p>

      <div className="acoes">
        <button className="cta" type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : atual !== null ? "Salvar novo limite" : "Definir meu limite"}
        </button>
      </div>

      {/* O piso do Facebook varia por conta, moeda e objetivo, e só dá para
          consultar depois da conexão. Dizer aqui um número inventado seria
          pior que não dizer — ver `definirVerbaAction`. */}
      <p className="empty-note">
        O Facebook tem um valor mínimo por dia, e ele muda de conta para conta. A gente confere
        isso na hora de publicar e avisa se o seu limite não alcançar.
      </p>
    </form>
  );
}
