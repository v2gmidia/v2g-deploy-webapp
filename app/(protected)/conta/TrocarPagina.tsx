"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { trocarPaginaAction, type ContaActionState } from "./actions";
import type { PaginaDoFacebook } from "@/lib/meta/graph";

const inicial: ContaActionState = {};

interface Props {
  paginas: PaginaDoFacebook[];
  atual: string | null;
  businessId: string;
  variasContasAtivas: boolean;
  contasIlegiveis: boolean;
}

/**
 * Trocar a página do Facebook sem passar pelo OAuth de novo.
 *
 * Com várias contas de anúncios, informa que a Página ainda é compartilhada
 * por negócio e encaminha a troca para a equipe. Com uma única Página
 * disponível, mostra a escolhida sem oferecer um seletor sem alternativa.
 */
export function TrocarPagina({ paginas, atual, businessId, variasContasAtivas, contasIlegiveis }: Props) {
  const [estado, action, pendente] = useActionState(trocarPaginaAction, inicial);
  const [escolhida, setEscolhida] = useState(atual ?? paginas[0]?.id ?? "");

  const unica = paginas.length === 1 ? paginas[0] : null;
  if (paginas.length === 0) return null;

  const paginaAtual = paginas.find((p) => p.id === atual);

  if (contasIlegiveis) return <div className="card">
    <p className="hint">Não conseguimos conferir quantas contas de anúncios usam esta Página. Tente novamente antes de mudar.</p>
  </div>;

  if (variasContasAtivas) return <div className="card">
    <p className="hint">Este negócio tem mais de uma conta de anúncios, e todas usam a mesma Página na configuração atual.</p>
    <p className="hint">Página em uso: <b>{paginaAtual?.nome ?? atual ?? "não identificada"}</b>. Para trocar sem afetar as outras contas, fale com a equipe.</p>
    <a href="https://wa.me/5521936182176" target="_blank" rel="noopener">Falar com a equipe</a>
  </div>;

  if (unica) {
    return (
      <div className="card">
        <div className="escolhido">
          <b>{unica.nome}</b>
          <span>{unica.categoria ?? unica.id}</span>
          <p className="hint">
            É a única página que a sua conexão alcança, então não há o que trocar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="businessId" value={businessId} />
      {estado.erro && <p className="form-error">{estado.erro}</p>}
      {estado.ok && <p className="form-ok">{estado.ok}</p>}

      <input type="hidden" name="pagina" value={escolhida} />

      <div className="escolha-lista">
        {paginas.map((p) => (
          <label key={p.id} className={`escolha-item${escolhida === p.id ? " picked" : ""}`}>
            <input
              type="radio"
              name="pagina-radio"
              value={p.id}
              checked={escolhida === p.id}
              onChange={() => setEscolhida(p.id)}
            />
            <span className="esc-texto">
              <b>{p.nome}</b>
              <span>
                {p.id === atual ? "Em uso agora" : (p.categoria ?? p.id)}
              </span>
            </span>
          </label>
        ))}
      </div>

      {/* "Os que já estão no ar" virou "os já publicados" em 11/09/2026.
          Não era afirmação falsa — é uma condicional sobre quais anúncios
          a troca alcança — mas dizer "no ar" aqui obriga o leitor a
          decidir se ele TEM anúncio no ar, que é pergunta de outra tela e
          cuja resposta esta não tem. "Já publicados" descreve o mesmo
          conjunto sem afirmar nada sobre o estado de agora. */}
      <p className="hint">
        A troca vale para os <b>próximos</b> anúncios. Os já publicados continuam saindo de{" "}
        {paginaAtual?.nome ?? "onde estão"} até serem refeitos.
      </p>

      <Button type="submit" disabled={pendente || escolhida === atual}>
        {pendente ? "Salvando…" : "Usar esta página"}
      </Button>
    </form>
  );
}
