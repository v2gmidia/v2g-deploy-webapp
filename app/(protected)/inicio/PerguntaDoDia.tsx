"use client";

import { useState } from "react";
import { dinheiroDeCentavos } from "@/lib/formato";
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
  /**
   * O dia sobre o qual se pergunta, `YYYY-MM-DD`.
   *
   * Entra para o RÓTULO dizer o período. A tela de resultado mostra o
   * ACUMULADO ("O que você me contou"); este card mostra UM DIA. Hoje são
   * o mesmo número, porque só há um dia respondido — amanhã divergem, e
   * dois "vendas" diferentes sem período na mesma tela é a pessoa
   * concluindo que um dos dois está errado.
   */
  dia: string;
}

export function PerguntaDoDia({
  vendasAtuais,
  receitaAtualCentavos,
  respondeuAlgo,
  dia,
}: PerguntaDoDiaProps) {
  const [vendas, setVendas] = useState(
    vendasAtuais === null ? "" : String(vendasAtuais),
  );
  const [receita, setReceita] = useState(
    receitaAtualCentavos === null ? "" : (receitaAtualCentavos / 100).toFixed(2).replace(".", ","),
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ============================================================
  // O QUE ESTÁ SALVO VIVE AQUI, E NÃO SÓ NAS PROPS.
  //
  // Depois de gravar, o `revalidatePath` atualiza o servidor — mas este
  // componente não recebe props novas sem um refresh do router. Ler as
  // props para montar o resumo mostraria o valor ANTERIOR logo depois de
  // salvar, que é exatamente o momento em que a pessoa está conferindo se
  // acertou.
  // ============================================================
  const [salvo, setSalvo] = useState<{ vendas: number | null; receita: number | null }>({
    vendas: vendasAtuais,
    receita: receitaAtualCentavos,
  });

  // O card fechado (resumo) ou aberto (campos). Nasce aberto enquanto
  // faltar resposta, e fechado quando já está tudo respondido.
  const [corrigindo, setCorrigindo] = useState(
    vendasAtuais === null || receitaAtualCentavos === null,
  );

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

    // O que ficou salvo, do ponto de vista do servidor: o campo mexido
    // mudou, o omitido continua como estava. É a mesma regra do merge —
    // e refazê-la aqui é o que deixa o resumo certo sem esperar refresh.
    setSalvo((antes) => ({
      vendas: naoSei === "vendas" ? null : (vendasDoQueFoiDigitado(vendas) ?? antes.vendas),
      receita:
        naoSei === "receita" ? null : (centavosDoQueFoiDigitado(receita) ?? antes.receita),
    }));
    setCorrigindo(false);
  }

  const tudoRespondido = salvo.vendas !== null && salvo.receita !== null;

  // ============================================================
  // RESPONDIDO, O CARD PARA DE SER CARD.
  //
  // Decisão do Victor, 01/09: o card FICA mesmo com os dois respondidos,
  // porque "o dono digitando no celular vai errar, e errar em campo de
  // dinheiro sem poder corrigir é pior que perguntar de novo".
  //
  // Mas ele não pode ficar do mesmo tamanho. Na tela da cadeia o herói é o
  // próximo passo — hoje `aguardando_fotos`, o ÚNICO estado que pede ação
  // do cliente —, e um card titulado embaixo disputa atenção justamente
  // com a coisa que precisa dele. Na tela de resultado ele repetiria
  // números que o bloco "O que você me contou" já mostra.
  //
  // Então: sem `<h2>`, sem `.card`, sem chrome. Uma linha que diz o que
  // ficou guardado e oferece a correção. O peso volta só quando ele
  // escolhe corrigir.
  // ============================================================
  if (tudoRespondido && !corrigindo) {
    return (
      <p className="rc-tranquilo">
        {/* O período está no rótulo de propósito: a tela de resultado
            mostra o ACUMULADO, e este número é de um dia só. */}
        Ontem você respondeu: {salvo.vendas}{" "}
        {salvo.vendas === 1 ? "venda" : "vendas"}, {dinheiroDeCentavos(salvo.receita!)}.{" "}
        <button className="text-fallback" type="button" onClick={() => setCorrigindo(true)}>
          corrigir
        </button>
      </p>
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
