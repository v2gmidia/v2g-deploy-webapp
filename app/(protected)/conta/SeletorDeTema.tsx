import { cookies } from "next/headers";
import { COOKIE_TEMA } from "@/app/layout";
import { definirTemaAction } from "./tema-actions";

/**
 * Escolha do tema: claro, escuro ou o padrão do aparelho.
 *
 * POR QUE AQUI E NÃO NUM BOTÃO NO CANTO: os mockups aprovados não têm
 * nenhum controle de tema na moldura do app — nem na sidebar, nem na
 * topbar. Enfiar um botãozinho ali seria acrescentar um elemento que o
 * design não pediu, numa região onde a regra é uma coisa gritando por
 * vez. Tema é decisão que se toma uma vez e não se revisita.
 *
 * É um Server Component com três botões de submit, sem `useState` e sem
 * `onClick`. Consequência: funciona antes de o JavaScript carregar, e o
 * tema é aplicado pelo servidor no próximo HTML — sem piscar branco.
 */
export async function SeletorDeTema() {
  const atual = (await cookies()).get(COOKIE_TEMA)?.value ?? "sistema";

  const opcoes = [
    { valor: "claro", rotulo: "Claro", desc: "Fundo branco, o dia inteiro." },
    { valor: "escuro", rotulo: "Escuro", desc: "Fundo escuro, o dia inteiro." },
    { valor: "sistema", rotulo: "Do aparelho", desc: "Acompanha o seu celular ou computador." },
  ];

  return (
    <form action={definirTemaAction}>
      <div className="tema-opcoes">
        {opcoes.map((o) => (
          <button
            key={o.valor}
            type="submit"
            name="tema"
            value={o.valor}
            className={`tema-opcao${atual === o.valor ? " picked" : ""}`}
            aria-pressed={atual === o.valor}
          >
            <Amostra tema={o.valor} />
            <b>{o.rotulo}</b>
            <span>{o.desc}</span>
          </button>
        ))}
      </div>
    </form>
  );
}

/**
 * A miniatura de cada tema.
 *
 * As cores aqui são LITERAIS, e é a única exceção da folha — de
 * propósito. Elas precisam mostrar o tema que NÃO está ativo: se
 * usassem os tokens, as três amostras ficariam idênticas, pintadas pelo
 * tema atual, e a escolha viraria adivinhação.
 */
function Amostra({ tema }: { tema: string }) {
  if (tema === "sistema") {
    return (
      <span className="tema-amostra" aria-hidden="true">
        <span style={{ background: "#F1F6F7" }}>
          <i style={{ background: "#0743DC" }} />
        </span>
        <span style={{ background: "#050A13" }}>
          <i style={{ background: "#D5EF25" }} />
        </span>
      </span>
    );
  }
  const claro = tema === "claro";
  return (
    <span className="tema-amostra" aria-hidden="true">
      <span style={{ background: claro ? "#F1F6F7" : "#050A13" }}>
        <i style={{ background: claro ? "#0743DC" : "#1B44E5" }} />
      </span>
      <span style={{ background: claro ? "#FFFFFF" : "#0C1523" }}>
        <i style={{ background: claro ? "#E8FC65" : "#D5EF25" }} />
      </span>
    </span>
  );
}
