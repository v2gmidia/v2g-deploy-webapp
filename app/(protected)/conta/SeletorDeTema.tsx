import { cookies } from "next/headers";
import { COOKIE_TEMA, temaDoCookie } from "@/app/layout";
import { definirTemaAction } from "./tema-actions";

/**
 * Escolha do tema: claro, escuro ou o padrão do aparelho.
 *
 * A Conta apresenta as três opções com amostras visuais. O Casco também
 * oferece a preferência compacta no topo, por PreferenciaDeTema/CampoDeTema.
 * Os dois controles usam definirTemaAction e o mesmo cookie: são duas
 * apresentações da mesma preferência, sem uma segunda regra de tema.
 *
 * É um Server Component com três botões de submit, sem `useState` e sem
 * `onClick`. Consequência: funciona antes de o JavaScript carregar, e o
 * tema é aplicado pelo servidor no próximo HTML — sem piscar branco.
 */
export async function SeletorDeTema() {
  // `temaDoCookie` e não `?? "sistema"`: o cookie apagado volta como
  // string VAZIA, e `??` não cai para o padrão em string vazia. Era o
  // item #8 do QA — as três opções desmarcadas até recarregar.
  const atual = temaDoCookie((await cookies()).get(COOKIE_TEMA)?.value);

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
 * As cores aqui são LITERAIS, de propósito, e acompanham os pares de
 * app/produto-editorial.css. Precisam mostrar o tema que NÃO está ativo: se
 * usassem os tokens, as três amostras ficariam idênticas, pintadas pelo
 * tema atual, e a escolha viraria adivinhação.
 */
function Amostra({ tema }: { tema: string }) {
  if (tema === "sistema") {
    return (
      <span className="tema-amostra" aria-hidden="true">
        <span style={{ background: "#F8FBFA" }}>
          <i style={{ background: "#0B40DA" }} />
        </span>
        <span style={{ background: "#0D1929" }}>
          <i style={{ background: "#9FBFFF" }} />
        </span>
      </span>
    );
  }
  const claro = tema === "claro";
  return (
    <span className="tema-amostra" aria-hidden="true">
      <span style={{ background: claro ? "#F8FBFA" : "#0D1929" }}>
        <i style={{ background: claro ? "#0B40DA" : "#9FBFFF" }} />
      </span>
      <span style={{ background: claro ? "#ECF5F2" : "#142337" }}>
        <i style={{ background: "#EAFF64" }} />
      </span>
    </span>
  );
}
