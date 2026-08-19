"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { salvarEscolhaAction, type EscolhaState } from "./actions";
import type { ContaDeAnuncio, PaginaDoFacebook } from "@/lib/meta/graph";

const inicial: EscolhaState = {};

interface Props {
  contas: ContaDeAnuncio[];
  paginas: PaginaDoFacebook[];
}

/**
 * Escolha da conta de anúncio e da Página.
 *
 * A Página não é detalhe: `object_story_spec.page_id` é obrigatório para
 * criar o anúncio, e é dela que sai o WhatsApp que recebe as conversas.
 * Sem essa escolha não existe publicação.
 *
 * A tela NÃO diz se cada página tem WhatsApp ligado, porque a API não
 * permite saber (ver `docs/oauth-meta.md`, seção 2.1). Ela explica o
 * requisito uma vez, de forma geral, e deixa a checagem para o momento em
 * que ela é possível e importa: a validação do criativo antes de publicar.
 * Rótulo por página seria afirmação sem verificação — o mesmo defeito que
 * derrubou o seletor de Instagram.
 */
export function FormularioEscolha({ contas, paginas }: Props) {
  const [estado, action, pendente] = useActionState(salvarEscolhaAction, inicial);

  const elegiveis = contas.filter((c) => c.elegivel);
  const [contaEscolhida, setContaEscolhida] = useState(elegiveis[0]?.externalId ?? "");
  const [paginaEscolhida, setPaginaEscolhida] = useState(paginas[0]?.id ?? "");

  const conta = contas.find((c) => c.externalId === contaEscolhida);
  const pagina = paginas.find((p) => p.id === paginaEscolhida);

  // PERGUNTA SÓ QUANDO HÁ AMBIGUIDADE DE VERDADE.
  //
  // O cliente típico tem uma conta de anúncio e uma página. Perguntar
  // "qual das uma?" duas vezes seguidas é atrito de caso de agência
  // aplicado a quem não é agência — e uma pergunta com uma resposta só
  // ensina a pessoa a clicar sem ler, o que é o oposto do que a gente
  // quer quando a próxima pergunta for sobre dinheiro.
  //
  // Escolha única continua VISÍVEL, só não é interativa: some com a
  // informação e o cliente não sabe de qual conta a gente está falando.
  const contaUnica = elegiveis.length === 1;
  const paginaUnica = paginas.length === 1;

  return (
    <form action={action}>
      {estado.erro && <p className="form-error">{estado.erro}</p>}

      <input type="hidden" name="conta" value={contaEscolhida} />
      <input type="hidden" name="contaNome" value={conta?.nome ?? ""} />
      <input type="hidden" name="moeda" value={conta?.moeda ?? ""} />
      <input type="hidden" name="pagina" value={paginaEscolhida} />

      {contaUnica ? (
        <div className="escolhido">
          <span className="eyebrow">Conta de anúncio</span>
          <b>{conta?.nome}</b>
          <span>
            {conta?.externalId}
            {conta?.moeda ? ` · ${conta.moeda}` : ""}
          </span>
          <p className="hint">É a única que encontramos na sua conta do Facebook.</p>
        </div>
      ) : (
        <>
          <p className="eyebrow">Conta de anúncio</p>
          <div className="escolha-lista">
            {contas.map((c) => (
          <label
            key={c.externalId}
            className={`escolha-item${!c.elegivel ? " off" : ""}${
              contaEscolhida === c.externalId ? " picked" : ""
            }`}
          >
            <input
              type="radio"
              name="conta-radio"
              value={c.externalId}
              checked={contaEscolhida === c.externalId}
              disabled={!c.elegivel}
              onChange={() => setContaEscolhida(c.externalId)}
            />
            <span className="esc-texto">
              <b>{c.nome}</b>
              <span>
                {c.elegivel
                  ? `${c.externalId}${c.moeda ? ` · ${c.moeda}` : ""}`
                  : c.motivoInelegivel}
              </span>
            </span>
          </label>
            ))}
          </div>
        </>
      )}

      {paginaUnica ? (
        <div className="escolhido" style={{ marginTop: 18 }}>
          <span className="eyebrow">Página do seu negócio</span>
          <b>{pagina?.nome}</b>
          <span>{pagina?.categoria ?? pagina?.id}</span>
          <p className="hint">
            É a única página que encontramos. É dela que seus anúncios vão sair.
          </p>
        </div>
      ) : paginas.length > 0 ? (
        <>
          <p className="eyebrow" style={{ marginTop: 22 }}>
            Página do seu negócio
          </p>
          <p className="hint">
            É dela que seus anúncios saem, e é o WhatsApp dela que recebe as conversas.
          </p>
          <div className="escolha-lista">
            {paginas.map((p) => (
              <label
                key={p.id}
                className={`escolha-item${paginaEscolhida === p.id ? " picked" : ""}`}
              >
                <input
                  type="radio"
                  name="pagina-radio"
                  value={p.id}
                  checked={paginaEscolhida === p.id}
                  onChange={() => setPaginaEscolhida(p.id)}
                />
                <span className="esc-texto">
                  <b>{p.nome}</b>
                  <span>{p.categoria ?? p.id}</span>
                </span>
              </label>
            ))}
          </div>
        </>
      ) : null}

      <PrecisaDeWhatsApp />

      <Button type="submit" disabled={pendente || !contaEscolhida || !paginaEscolhida}>
        {pendente
          ? "Salvando…"
          : contaUnica && paginaUnica
            ? "Confirmar e seguir"
            : "Usar esta conta"}
      </Button>
    </form>
  );
}

/**
 * O requisito, dito uma vez e sem afirmar nada sobre a página escolhida.
 *
 * Antes isto só aparecia quando a verificação dizia "não tem WhatsApp".
 * Aquela verificação era um falso negativo para todo mundo (a API não
 * expõe o vínculo — `docs/oauth-meta.md`, seção 2.1), então o aviso ou
 * não aparecia, ou aparecia errado. Fixo e neutro informa sem mentir.
 */
function PrecisaDeWhatsApp() {
  return (
    <div className="trust">
      <b>A página precisa ter um WhatsApp ligado</b>
      Seus anúncios levam a pessoa direto para uma conversa no WhatsApp. Sem um número
      ligado à página, o anúncio não tem para onde mandar quem clica. Para conferir: no
      Facebook, abra a página e vá em <b>Configurações → WhatsApp</b>. A gente confirma
      isso com você antes de qualquer anúncio ir ao ar.
      <br />
      <a
        className="wa"
        href="https://wa.me/5521936182176?text=Oi!%20Preciso%20ligar%20o%20WhatsApp%20na%20minha%20p%C3%A1gina%20do%20Facebook%20para%20anunciar%20pela%20V2G."
        target="_blank"
        rel="noopener"
      >
        Prefere que a gente faça junto? Chama aqui →
      </a>
    </div>
  );
}
