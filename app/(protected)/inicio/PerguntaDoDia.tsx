"use client";

import { useState } from "react";
import {
  centavosDoQueFoiDigitado,
  PERGUNTA_DE_RECEITA,
  PERGUNTA_DE_VENDAS,
  vendasDoQueFoiDigitado,
} from "@/lib/dia-seguinte/pergunta";
import { responderPerguntaDoDiaAction } from "./actions";

/**
 * A pergunta diária — o card que faz o loop existir.
 *
 * ============================================================
 * DUAS PERGUNTAS, RESPONDÍVEIS SEPARADAMENTE.
 *
 * É a regra mais importante do contrato: "'Umas 3' o dono responde de
 * cabeça; 'quanto deu' exige contar. Aceitar só a primeira é o caso
 * NORMAL, não a exceção."
 *
 * Por isso os dois campos são independentes e o botão manda o que tiver.
 * Um formulário que exigisse os dois transformaria o caso normal em
 * abandono — e o dado que a gente mais quer é justamente o que ele
 * responde de cabeça.
 * ============================================================
 *
 * ============================================================
 * "NÃO SEI" MANDA `null`, NUNCA `0`.
 *
 * `null` é "não perguntamos ou não respondeu". `0` é "respondeu que foi
 * zero" — e zero venda num dia é sinal FORTE, não silêncio. Confundir os
 * dois faz um dia ruim virar um dia sem dado, e o produto para de
 * enxergar o que mais precisa enxergar.
 *
 * O botão diz "não sei" e não "zero", e o campo vazio não vira zero em
 * lugar nenhum do caminho.
 * ============================================================
 *
 * O texto exibido é o MESMO que a ação grava — as duas leem
 * `lib/dia-seguinte/pergunta.ts`. Se a copy virasse string aqui e outra
 * lá, melhorar a frase da tela deixaria o banco registrando a pergunta
 * velha, e as duas continuariam plausíveis.
 */

interface PerguntaDoDiaProps {
  /** o que já está gravado no dia, para o campo nascer preenchido */
  vendasAtuais: number | null;
  receitaAtualCentavos: number | null;
  /**
   * Ele já respondeu ALGUMA das duas — o card vira "completar", não
   * "perguntar".
   *
   * O caso que isto cobre é o normal, não a exceção: ele responde "umas
   * 3" de cabeça e deixa a receita para depois. Tratar isso como "já
   * respondeu, não pergunta mais" perderia metade do dado todo dia.
   */
  respondeuAlgo: boolean;
}

export function PerguntaDoDia({
  vendasAtuais,
  receitaAtualCentavos,
  respondeuAlgo,
}: PerguntaDoDiaProps) {
  const [vendas, setVendas] = useState(
    vendasAtuais === null ? "" : String(vendasAtuais),
  );
  const [receita, setReceita] = useState(
    receitaAtualCentavos === null ? "" : (receitaAtualCentavos / 100).toFixed(2).replace(".", ","),
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  async function enviar(naoSei: "vendas" | "receita" | null) {
    if (enviando) return;
    setEnviando(true);
    setErro(null);

    // `undefined` = não mexeu (o servidor manda); `null` = disse "não
    // sei" (apaga de propósito). A distinção é o que impede o botão de
    // virar "não mexi" e o abrir-e-salvar de virar apagamento.
    const resultado = await responderPerguntaDoDiaAction({
      vendas: naoSei === "vendas" ? null : vendasDoQueFoiDigitado(vendas) ?? undefined,
      receitaCentavos:
        naoSei === "receita" ? null : centavosDoQueFoiDigitado(receita) ?? undefined,
    });

    setEnviando(false);
    if (!resultado.ok) {
      setErro(resultado.erro ?? "Não consegui guardar sua resposta.");
      return;
    }
    setPronto(true);
  }

  if (pronto) {
    return (
      <section className="rc-bloco">
        <div className="card">
          {/* Sem confete: guardar um número não é conquista, é a pessoa
              fazendo um favor à gente. Celebração aqui seria a marca
              comemorando o próprio trabalho. */}
          <p className="rc-abertura">Anotado. É isso que faz a conta fechar.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rc-bloco">
      <div className="section-title">
        <h2>{respondeuAlgo ? "Falta completar o de ontem" : "Uma pergunta rápida sobre ontem"}</h2>
      </div>

      <div className="card">
        {erro && <p className="form-error">{erro}</p>}

        <p className="rc-abertura">{PERGUNTA_DE_VENDAS}</p>
        <div className="fallback-field">
          <label className="sr-only" htmlFor="pd-vendas">
            {PERGUNTA_DE_VENDAS}
          </label>
          <input
            id="pd-vendas"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ex: 3"
            value={vendas}
            disabled={enviando}
            onChange={(e) => setVendas(e.target.value)}
          />
          <button
            className="text-fallback"
            type="button"
            disabled={enviando}
            onClick={() => enviar("vendas")}
          >
            não sei
          </button>
        </div>

        <p className="rc-abertura">{PERGUNTA_DE_RECEITA}</p>
        <div className="fallback-field">
          <label className="sr-only" htmlFor="pd-receita">
            {PERGUNTA_DE_RECEITA}
          </label>
          <input
            id="pd-receita"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex: 1.600,00"
            value={receita}
            disabled={enviando}
            onChange={(e) => setReceita(e.target.value)}
          />
          <button
            className="text-fallback"
            type="button"
            disabled={enviando}
            onClick={() => enviar("receita")}
          >
            não sei
          </button>
        </div>

        <div className="fallback-field">
          <button
            className="mini-send"
            type="button"
            disabled={enviando}
            onClick={() => enviar(null)}
          >
            {enviando ? "…" : "Guardar"}
          </button>
        </div>

        {/* Diz por que a gente pergunta. Sem isso, a pergunta diária vira
            cobrança sem contrapartida — e é ela que o cliente abandona
            primeiro. */}
        <p className="rc-tranquilo">
          O Facebook mede quantas pessoas te chamaram. Quantas viraram venda, quem sabe é
          você — e é com isso que a gente calcula se está valendo a pena.
        </p>
      </div>
    </section>
  );
}
