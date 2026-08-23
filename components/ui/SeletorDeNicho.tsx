"use client";

import { useId, useState } from "react";
import { filtrarNichos, resolverConsulta } from "@/lib/nichos/busca";
import type { Nicho } from "@/lib/nichos/tipos";

/**
 * A escolha do nicho: dez chips visíveis e um campo de busca abaixo.
 *
 * ============================================================
 * DEZ CHIPS, NÃO "OS CINCO OU SEIS MAIS COMUNS".
 *
 * Não há dado de uso para escolher quais seriam os comuns — quatro
 * negócios na base, uma resposta de ramo. E um recorte curado seria uma
 * lista nova mantida à mão, que é exatamente a coisa que este componente
 * existe para apagar. Dez rótulos curtos cabem.
 *
 * E a busca fica ABAIXO da lista, não no lugar dela: quem se reconhece
 * toca, quem não se reconhece digita. Não obriga a digitar e não esconde
 * a lista.
 * ============================================================
 *
 * O filtro roda AQUI, no navegador. A lista inteira são 3,8 KB e vem uma
 * vez; uma ida ao servidor por tecla custaria mais. Ver `lib/nichos/busca.ts`
 * para o dia em que isso deixa de valer — e não é o dia em que os nichos
 * passarem de vinte.
 *
 * Usado em DUAS telas: a pergunta `ramo` do `/onboarding` e o campo
 * `businesses.niche` da `/meu-negocio`. É o mesmo componente de propósito
 * — enquanto eram duas telas com regras próprias, uma restringia a lista
 * e a outra convidava ao texto livre dando *padaria* de exemplo, que é
 * justamente o termo deixado sem par. Duas instruções opostas sobre a
 * mesma coluna.
 */

interface SeletorDeNichoProps {
  /** a lista viva, já validada. Quem não a tem mostra os chips de reserva. */
  nichos: Nicho[];
  /** o que já está escolhido, para marcar o chip. Compara pelo identificador. */
  escolhido?: string | null;
  /** trava tudo enquanto uma gravação está em curso */
  ocupado?: boolean;
  /** tocou um chip, ou digitou o rótulo inteiro */
  aoEscolher: (nicho: Nicho) => void;
  /** não se achou na lista: o texto vira a resposta */
  aoEscreverLivre: (texto: string) => void;
  placeholder?: string;
  /** o rótulo do campo para leitor de tela */
  rotuloDoCampo?: string;
  /** o chip do fim da lista, que abre o campo livre */
  rotuloOutro?: string;
  /** o que o campo pede depois que o "Outro" foi tocado */
  placeholderLivre?: string;
  rotuloLivre?: string;
}

export function SeletorDeNicho({
  nichos,
  escolhido,
  ocupado = false,
  aoEscolher,
  aoEscreverLivre,
  placeholder = "Busque ou escreva do seu jeito",
  rotuloDoCampo = "Busque o seu negócio",
  rotuloOutro = "Outro",
  placeholderLivre = "Como você descreveria seu negócio em poucas palavras?",
  rotuloLivre = "Como você descreveria seu negócio",
}: SeletorDeNichoProps) {
  const [consulta, setConsulta] = useState("");
  // O "Outro" trocou a lista pelo campo. Estado à parte da busca porque são
  // duas coisas: filtrar a lista e dizer que não se está nela.
  const [modoLivre, setModoLivre] = useState(false);
  const idCampo = useId();

  const visiveis = filtrarNichos(nichos, consulta);

  // A regra do Enter mora em `lib/nichos/busca.ts`, pura e conferida — ver
  // o bloco de `resolverConsulta` para o porquê de cada desfecho.
  const resolucao = resolverConsulta(nichos, consulta);

  const digitou = consulta.trim() !== "";
  const semResultado = resolucao.tipo === "livre";

  // O botão só aparece quando tem o que fazer. Com dois ou mais resultados
  // ele some: não há o que enviar, e um botão ali contradiria a resposta
  // certa, que é tocar no chip.
  const podeEnviar = modoLivre
    ? digitou
    : resolucao.tipo === "nicho" || resolucao.tipo === "livre";

  function enviar() {
    if (ocupado || !podeEnviar) return;

    // No modo livre não se procura nicho nenhum: a pessoa já disse que não
    // está na lista. Casar o texto dela com um nicho aqui seria justamente
    // a sugestão aproximada que foi recusada.
    if (modoLivre) {
      aoEscreverLivre(consulta.trim());
      setConsulta("");
      setModoLivre(false);
      return;
    }

    if (resolucao.tipo === "nicho") {
      aoEscolher(resolucao.nicho);
      setConsulta("");
      return;
    }
    if (resolucao.tipo === "livre") {
      aoEscreverLivre(resolucao.texto);
      setConsulta("");
    }
  }

  function abrirModoLivre() {
    setModoLivre(true);
    setConsulta("");
  }

  // O modo livre é a tela de quem tocou em "Outro": sem chips, sem busca,
  // só o campo. Ela já disse que não está na lista — continuar mostrando a
  // lista seria insistir.
  if (modoLivre) {
    return (
      <div className="seletor-nicho">
        <div className="fallback-field">
          <label className="sr-only" htmlFor={idCampo}>
            {rotuloLivre}
          </label>
          <input
            id={idCampo}
            type="text"
            autoComplete="off"
            autoFocus
            placeholder={placeholderLivre}
            value={consulta}
            disabled={ocupado}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              enviar();
            }}
          />
          {podeEnviar && (
            <button className="mini-send" type="button" disabled={ocupado} onClick={enviar}>
              {ocupado ? "…" : "Enviar"}
            </button>
          )}
        </div>
        {/* A porta de volta. Sem ela o "Outro" é uma escolha da qual não se
            desiste — e quem tocou por engano teria que recarregar a tela. */}
        <button
          className="text-fallback"
          type="button"
          disabled={ocupado}
          onClick={() => {
            setModoLivre(false);
            setConsulta("");
          }}
        >
          voltar para a lista
        </button>
      </div>
    );
  }

  return (
    <div className="seletor-nicho">
      <div className="chips-row">
        {visiveis.map((n) => (
          <button
            key={n.nicho}
            className={`chip-opt${escolhido === n.nicho ? " picked" : ""}`}
            type="button"
            disabled={ocupado}
            onClick={() => {
              aoEscolher(n);
              setConsulta("");
            }}
          >
            {n.rotulo}
          </button>
        ))}

        {/*
          ============================================================
          O "OUTRO" FICA NO FIM, DEPOIS DOS DEZ — NUNCA NO MEIO.
          Decisão do Victor, 22/08. Ele é a saída para `padaria` e para todo
          negócio fora da lista, e a LACUNA PRECISA CONTINUAR VISÍVEL: sem
          ele, quem não se reconhece precisa descobrir sozinho, digitando e
          falhando, que existe um caminho. Um chip nomeado diz que existe.

          Renderizado depois do `map` justamente para não depender de
          ordenação — ele é o último irmão no DOM por construção. Conferido
          na ordem real do DOM em 22/08; não há conferidor automático para
          isso, porque `conferir:nichos` não monta React.

          Some quando a busca não achou nada: ali o recado e o botão de
          enviar já oferecem o mesmo caminho, e dois convites para a mesma
          porta é ruído.
          ============================================================
        */}
        {visiveis.length > 0 && (
          <button
            className="chip-opt"
            type="button"
            disabled={ocupado}
            onClick={abrirModoLivre}
          >
            {rotuloOutro}
          </button>
        )}
      </div>

      <div className="fallback-field">
        <label className="sr-only" htmlFor={idCampo}>
          {rotuloDoCampo}
        </label>
        <input
          id={idCampo}
          type="text"
          // `search` e não `text`: o teclado do celular muda, e o leitor de
          // tela anuncia o campo pelo que ele faz.
          inputMode="search"
          autoComplete="off"
          placeholder={placeholder}
          value={consulta}
          disabled={ocupado}
          onChange={(e) => setConsulta(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            enviar();
          }}
        />
        {podeEnviar && (
          <button className="mini-send" type="button" disabled={ocupado} onClick={enviar}>
            {ocupado ? "…" : "Enviar"}
          </button>
        )}
      </div>

      {/*
        NÃO SUGERE O VIZINHO MAIS PRÓXIMO, e isso foi decidido contra uma
        proposta que existia: a ressalva na tela ("achamos que talvez seja
        clínica de estética?") seria interface pedindo desculpa por não ter
        o que a pessoa precisa. `padaria`, `doceria` e `lavanderia` não
        acham nada — é a decisão funcionando, não falha da busca.

        O caminho digno é este: escreve do seu jeito, e fica registrado.
        `aria-live` porque o recado nasce depois que a pessoa digitou, e
        quem usa leitor de tela precisa saber que a lista esvaziou.
      */}
      {semResultado && (
        <p className="nicho-sem-lista" role="status" aria-live="polite">
          Esse não está na nossa lista — escreva do seu jeito que a gente entende.
        </p>
      )}
    </div>
  );
}
