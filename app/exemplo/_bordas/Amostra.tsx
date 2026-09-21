import css from "./Amostra.module.css";

/**
 * AS BORDAS DE COBALTO NO TEMA ESCURO — amostra de bancada.
 *
 * ============================================================
 * POR QUE ESTA TELA EXISTE. As 14 regras consertadas em 20/09 moram em
 * `app/globals.css` e pintam telas que estão atrás do login — não dá para
 * capturar `/conta`, `/inicio` ou `/alertas` sem sessão. Esta amostra
 * renderiza a MARCAÇÃO REAL de cada uma, com as mesmas classes, para o
 * conserto poder ser olhado nos dois temas.
 *
 * Ela não é uma tela do produto e não vai a lugar nenhum: `/exemplo/` é
 * 404 em produção, pelo mesmo trinco das outras.
 * ============================================================
 *
 * ============================================================
 * O ESTADO FORÇADO. `:hover` e `:focus` não aparecem numa captura
 * estática. Onde a regra é de estado, a amostra mostra DOIS elementos: o
 * de repouso, como o CSS o pinta, e um com o estado forçado por `style`,
 * repetindo LITERALMENTE a declaração da regra — `borderColor:
 * "var(--cobalt-ink)"`. Nenhum valor de cor foi digitado aqui: o token é
 * o mesmo que o `globals.css` lê, então se ele mudar, esta tela muda
 * junto. O rótulo diz qual é qual.
 * ============================================================
 */

/** Uma regra consertada: onde ela mora e o que ela marca. */
interface Regra {
  linha: number;
  seletor: string;
  papel: string;
  /** contraste medido no tema escuro, antes e depois */
  antes: string;
  depois: string;
}

const FOCO: Regra[] = [
  { linha: 602, seletor: ".field input:focus", papel: "onde o cursor está", antes: "2,10", depois: "5,54" },
  { linha: 1398, seletor: ".city-row input:focus", papel: "onde o cursor está", antes: "2,10", depois: "5,54" },
  { linha: 1804, seletor: ".field select:focus", papel: "onde o cursor está", antes: "2,10", depois: "5,54" },
];

const MARCAS: Regra[] = [
  { linha: 817, seletor: ".auth-top .auth-help:hover", papel: "o que o mouse está tocando", antes: "2,10", depois: "5,54" },
  { linha: 1589, seletor: ".ec-dots i", papel: "quantos combinados faltam", antes: "2,28", depois: "6,00" },
  { linha: 1811, seletor: ".alert-card", papel: "a tarja do alerta", antes: "2,10", depois: "5,54" },
  { linha: 2024, seletor: ".topbar-help:hover", papel: "o que o mouse está tocando", antes: "2,10", depois: "5,54" },
  { linha: 2304, seletor: ".btn-sm.primary", papel: "qual botão é o principal da linha", antes: "2,10", depois: "5,54" },
  { linha: 2344, seletor: ".escolha-item:hover", papel: "o que o mouse está tocando", antes: "2,10", depois: "5,54" },
  { linha: 2345, seletor: ".escolha-item.picked", papel: "a opção que o cliente escolheu", antes: "2,24", depois: "5,90" },
  { linha: 2442, seletor: ".tema-opcao:hover", papel: "o que o mouse está tocando", antes: "2,10", depois: "5,54" },
  { linha: 2443, seletor: ".tema-opcao.picked", papel: "o tema que está ligado", antes: "2,10", depois: "5,54" },
  { linha: 3524, seletor: ".trilha-item.e-atual .trilha-marca", papel: "você está aqui", antes: "2,10", depois: "5,54" },
  { linha: 4383, seletor: ".casa-indice a:hover", papel: "o que o mouse está tocando", antes: "2,10", depois: "5,54" },
];

const FICARAM = [
  { linha: 672, seletor: ".cta.ghost", razao: "borda morta: o grupo dos cinco papéis põe `border: 0` depois. Medido 0px." },
  { linha: 1160, seletor: ".chip-opt", razao: "borda morta, pelo mesmo grupo. Medido 0px." },
  { linha: 1226, seletor: ".botao-leve:hover", razao: "borda morta, pelo mesmo grupo. Medido 0px." },
  { linha: 4018, seletor: ".pd-convite .botao-leve:hover", razao: "borda morta, pelo mesmo grupo. Medido 0px." },
  { linha: 3493, seletor: ".trilha-item.e-feita .trilha-marca", razao: "preenchimento: borda e fundo são o mesmo cobalto. Trocar só a borda criaria um anel que não existe hoje." },
  { linha: 3741, seletor: ".fase.f-atual .fase-marca", razao: "preenchimento com texto branco por cima. Branco sobre cobalto: 8,70:1; sobre a tinta cairia para 3,30:1." },
];

/** A declaração da regra, repetida como `style` para a captura estática. */
const FORCADO = { borderColor: "var(--cobalt-ink)" };

function Cabecalho({ r }: { r: Regra }) {
  return (
    <div className={css.rotulo}>
      <code className={css.seletor}>{r.seletor}</code>
      <span className={css.linha}>globals.css:{r.linha}</span>
      <span className={css.papel}>{r.papel}</span>
      <span className={css.medida}>
        {r.antes} → <strong>{r.depois}</strong>
      </span>
    </div>
  );
}

export function Amostra() {
  return (
    <div className={css.tela}>
      <header className={css.topo}>
        <h1 className={css.titulo}>As bordas de cobalto, no tema escuro</h1>
        <p className={css.texto}>
          Catorze regras de <code>border-color</code> ficaram para trás quando o{" "}
          <code>--cobalt-ink</code> entrou: a varredura daquela rodada cobriu{" "}
          <code>color:</code> e <code>outline:</code>, e não borda. No tema escuro elas
          mediam de 1,87 a 2,28:1 — o piso é 3:1.
        </p>
        <p className={css.texto}>
          <strong>No tema claro nada muda</strong>, e isso não é promessa: lá o{" "}
          <code>--cobalt-ink</code> é literalmente <code>var(--cobalt)</code>. Abra esta
          mesma tela nos dois temas e compare.
        </p>
      </header>

      <section className={css.bloco}>
        <h2 className={css.secao}>Foco de teclado — o caso mais sério</h2>
        <p className={css.texto}>
          Quem navega sem mouse perde o rastro de onde está. É o único grupo em que a
          borda não é ênfase: é a única informação.
        </p>
        {FOCO.map((r) => (
          <article key={r.linha} className={css.caso}>
            <Cabecalho r={r} />
            <div className={css.lado}>
              <div className={css.amostra}>
                <span className={css.estado}>repouso</span>
                <div className="field">
                  <input defaultValue="Bebidas do Porto" readOnly />
                </div>
              </div>
              <div className={css.amostra}>
                <span className={css.estado}>com o estado forçado</span>
                <div className="field">
                  <input defaultValue="Bebidas do Porto" readOnly style={FORCADO} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className={css.bloco}>
        <h2 className={css.secao}>Marcas de estado</h2>
        {MARCAS.map((r) => (
          <article key={r.linha} className={css.caso}>
            <Cabecalho r={r} />
            <div className={css.lado}>
              <div className={css.amostra}>
                <span className={css.estado}>repouso</span>
                <Peca seletor={r.seletor} />
              </div>
              <div className={css.amostra}>
                <span className={css.estado}>com o estado forçado</span>
                <Peca seletor={r.seletor} forcado />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className={css.bloco}>
        <h2 className={css.secao}>As seis que NÃO foram trocadas</h2>
        <p className={css.texto}>
          Quatro são borda morta — uma regra posterior zera a largura, e trocar a cor não
          mudaria um pixel. Duas são preenchimento, não marca.
        </p>
        <ul className={css.lista}>
          {FICARAM.map((f) => (
            <li key={f.linha} className={css.item}>
              <code className={css.seletor}>{f.seletor}</code>
              <span className={css.linha}>globals.css:{f.linha}</span>
              <span className={css.razaoTexto}>{f.razao}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** A marcação real de cada regra, com as classes de `globals.css`. */
function Peca({ seletor, forcado = false }: { seletor: string; forcado?: boolean }) {
  const s = forcado ? FORCADO : undefined;
  switch (seletor) {
    case ".auth-top .auth-help:hover":
      return (
        <div className="auth-top">
          <a className="auth-help" href="#" style={s}>
            Preciso de ajuda
          </a>
        </div>
      );
    case ".ec-dots i":
      return (
        <div className="ec-dots">
          <i style={s} />
          <i className="done" style={s} />
          <i className="now" style={s} />
        </div>
      );
    case ".alert-card":
      return (
        <div className="alert-card" style={forcado ? { borderLeftColor: "var(--cobalt-ink)" } : undefined}>
          A conta do Facebook parou de responder ontem.
        </div>
      );
    case ".topbar-help:hover":
      return (
        <div className="topbar">
          <a className="topbar-help" href="#" style={{ display: "inline-flex", ...(s ?? {}) }}>
            Preciso de ajuda
          </a>
        </div>
      );
    case ".btn-sm.primary":
      return (
        <button type="button" className="btn-sm primary" style={s}>
          Ver o anúncio
        </button>
      );
    case ".escolha-item:hover":
    case ".escolha-item.picked":
      return (
        <div className={seletor.includes("picked") ? "escolha-item picked" : "escolha-item"} style={s}>
          Distribuidora de bebidas
        </div>
      );
    case ".tema-opcao:hover":
    case ".tema-opcao.picked":
      return (
        <button
          type="button"
          className={seletor.includes("picked") ? "tema-opcao picked" : "tema-opcao"}
          style={s}
        >
          Escuro
        </button>
      );
    case ".trilha-item.e-atual .trilha-marca":
      return (
        <div className="trilha-item e-atual">
          <span className="trilha-marca" style={s} />
          <span className={css.trilhaTexto}>Conectar o Facebook</span>
        </div>
      );
    case ".casa-indice a:hover":
      return (
        <div className="casa-indice">
          <a href="#" style={s}>
            Ver todas as peças
          </a>
        </div>
      );
    default:
      return null;
  }
}
