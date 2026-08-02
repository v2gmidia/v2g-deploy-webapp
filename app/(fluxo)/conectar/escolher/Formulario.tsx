"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { salvarEscolhaAction, type EscolhaState } from "./actions";
import type { ContaDeAnuncio, PaginaComWhatsApp } from "@/lib/meta/graph";

const inicial: EscolhaState = {};

interface Props {
  contas: ContaDeAnuncio[];
  paginas: PaginaComWhatsApp[];
}

/**
 * Escolha da conta de anúncio e da Página.
 *
 * A Página não é detalhe: `object_story_spec.page_id` é obrigatório para
 * criar o anúncio, e é dela que sai o WhatsApp que recebe as conversas.
 * Sem essa escolha não existe publicação.
 *
 * Página sem WhatsApp NÃO é bloqueada. A escolha é totalmente
 * recuperável — no momento em que ela acontece nada foi criado no Meta,
 * e trocar depois é um UPDATE. Bloquear seria pior: a página certa pode
 * ser justamente essa, e ligar o WhatsApp nela leva minutos no painel do
 * Meta. O que a tela faz é avisar antes, não decidir pela pessoa.
 */
export function FormularioEscolha({ contas, paginas }: Props) {
  const [estado, action, pendente] = useActionState(salvarEscolhaAction, inicial);

  const elegiveis = contas.filter((c) => c.elegivel);
  const [contaEscolhida, setContaEscolhida] = useState(elegiveis[0]?.externalId ?? "");

  // Começa pré-selecionando uma página COM WhatsApp, se houver — é a que
  // deixa o cliente pronto para anunciar sem passo extra.
  const preferida = paginas.find((p) => p.whatsapp === true) ?? paginas[0];
  const [paginaEscolhida, setPaginaEscolhida] = useState(preferida?.id ?? "");

  const conta = contas.find((c) => c.externalId === contaEscolhida);
  const pagina = paginas.find((p) => p.id === paginaEscolhida);

  return (
    <form action={action}>
      {estado.erro && <p className="form-error">{estado.erro}</p>}

      <input type="hidden" name="conta" value={contaEscolhida} />
      <input type="hidden" name="contaNome" value={conta?.nome ?? ""} />
      <input type="hidden" name="moeda" value={conta?.moeda ?? ""} />
      <input type="hidden" name="pagina" value={paginaEscolhida} />

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

      {paginas.length > 0 && (
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
                  <span>
                    {p.whatsapp === true && "WhatsApp ligado — pronta para anunciar"}
                    {p.whatsapp === false && "Sem WhatsApp ligado ainda"}
                    {p.whatsapp === null && "Não conseguimos conferir o WhatsApp desta página"}
                  </span>
                </span>
                <span className={`selo-wa${p.whatsapp === true ? " ok" : ""}`}>
                  {p.whatsapp === true ? "pronta" : p.whatsapp === false ? "falta WhatsApp" : "?"}
                </span>
              </label>
            ))}
          </div>

          {pagina?.whatsapp === false && <AvisoSemWhatsApp nome={pagina.nome} />}
          {pagina?.whatsapp === null && (
            <div className="trust">
              <b>Não conseguimos conferir o WhatsApp desta página</b>
              Dá para seguir normalmente. Se na hora de publicar faltar o WhatsApp, a gente
              avisa antes de qualquer anúncio ir ao ar.
            </div>
          )}
        </>
      )}

      <Button type="submit" disabled={pendente || !contaEscolhida || !paginaEscolhida}>
        {pendente ? "Salvando…" : "Usar esta conta"}
      </Button>
    </form>
  );
}

/**
 * O estado que o cliente precisa entender, não um erro genérico: o que
 * falta, por que importa, e um caminho humano.
 */
function AvisoSemWhatsApp({ nome }: { nome: string }) {
  return (
    <div className="fail-block" style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}>
      <b>Falta ligar um WhatsApp na página {nome}</b>
      <p>
        Seus anúncios funcionam levando a pessoa direto para uma conversa no WhatsApp. Sem um
        número ligado a esta página, o anúncio não tem para onde mandar quem clicar.
      </p>
      <p style={{ marginTop: 10 }}>
        Você pode seguir e resolver isso depois — nada aqui trava. Para ligar agora: no Facebook,
        abra a sua página, vá em <b>Configurações → WhatsApp</b> e conecte o número do seu
        negócio. Leva uns 5 minutos.
      </p>
      <p style={{ marginTop: 10 }}>
        <a
          className="wa"
          href="https://wa.me/5521980351531?text=Oi!%20Preciso%20ligar%20o%20WhatsApp%20na%20minha%20p%C3%A1gina%20do%20Facebook%20para%20anunciar%20pela%20V2G."
          target="_blank"
          rel="noopener"
        >
          Prefere que a gente faça junto? Chama aqui →
        </a>
      </p>
    </div>
  );
}
