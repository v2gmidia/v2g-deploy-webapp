/**
 * Trilha de confiança da coluna direita: rail de 3 passos, logomark que
 * se monta e o card de garantias. Porte do `aside` de
 * `tela-03-onboarding-desktop.html`.
 *
 * Server Component: o estado vem pronto do banco, nada aqui é
 * interativo. No protótipo isso era montado por JS na mão
 * (`setRail`, `setMarkStage`, `V2G.buildMark`).
 */

import { MARK, MARK_COLUNAS } from "@/components/ui/PixelMark";

const LABELS = ["1 · Seu negócio", "2 · Sua marca", "3 · Aprovar e decolar"];

const Cadeado = () => (
  <svg className="lock" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
    <rect x="1" y="4" width="8" height="6" />
    <rect x="3" y="1" width="1.4" height="4" />
    <rect x="5.6" y="1" width="1.4" height="4" />
    <rect x="3" y="1" width="4" height="1.4" />
  </svg>
);

const Tick = () => (
  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M1.5 5.5 4 8 8.5 2.5" />
  </svg>
);

interface TrilhaProps {
  /** passo atual do fluxo (1 a 3) */
  passo: number;
  /** blocos acesos no passo atual, de 6 */
  blocos: number;
  /** minutos restantes; 0 mostra "quase lá" */
  minutos: number;
  /** peças da logomark já montadas (0 a 3) */
  pecas: number;
}

export function Trilha({ passo, blocos, minutos, pecas }: TrilhaProps) {
  const titulos: Record<number, string> = {
    1: "Passo 1 de 3 · Sobre o seu negócio",
    2: "Passo 2 de 3 · O visual da sua marca",
    3: "Passo 3 de 3 · Aprovar e decolar",
  };

  // A logomark tem 3 grupos de pixels: os já montados ficam lima, o
  // grupo seguinte pulsa em "construção", o resto fica apagado.
  const pixels = MARK.join("").split("");
  const acesos = pixels.filter((c) => c === "1").length;
  const porGrupo = Math.ceil(acesos / 3);
  let contadorAceso = 0;

  return (
    <>
      <div className="proof-card">
        <p className="eyebrow">Seu checklist de voo</p>

        <div className="rail">
          <div className="rail-track">
            {[1, 2, 3].map((s) => (
              <div className="rail-step" key={s}>
                <div className="rail-blocks">
                  {Array.from({ length: 6 }, (_, i) => (
                    <i key={i} className={s < passo ? "lit" : s === passo && i < blocos ? "on" : ""} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rail-labels">
            {LABELS.map((label, idx) => {
              const s = idx + 1;
              return (
                <span key={label} className={s < passo ? "done" : s === passo ? "now" : ""}>
                  {s > passo && <Cadeado />}
                  {label}
                </span>
              );
            })}
          </div>

          <p className="rail-note" role="status">
            <b>{titulos[passo]}</b>
            {minutos > 0 ? <> · faltam ~{minutos} min</> : <> · quase lá</>}
          </p>
        </div>

        <div className="assemble">
          <div className="mark-plate">
            <div
              className="mark"
              style={{
                gridTemplateColumns: `repeat(${MARK_COLUNAS}, var(--px))`,
                ["--px" as string]: "9px",
              }}
            >
              {pixels.map((c, i) => {
                if (c !== "1") return <i key={i} className="off" />;
                const grupo = Math.min(2, Math.floor(contadorAceso / porGrupo));
                contadorAceso += 1;
                const classe = grupo < pecas ? "pxon" : grupo === pecas ? "pxbuild" : "pxoff";
                return <i key={i} className={classe} />;
              })}
            </div>
          </div>
          <p className="hint">
            Seu painel se monta a cada passo.{" "}
            <b>{pecas >= 3 ? "Painel montado." : `Peça ${pecas + 1} de 3 em construção.`}</b>
          </p>
        </div>
      </div>

      <div className="proof-card">
        <b className="title">Você continua no comando</b>
        <ul className="proof-list">
          <li>
            <span className="tick">
              <Tick />
            </span>
            <span>
              <b>Salvar e continuar depois.</b> Fecha a página sem medo — suas respostas
              ficam guardadas.
            </span>
          </li>
          <li>
            <span className="tick">
              <Tick />
            </span>
            <span>
              <b>Falar com um humano.</b> Gente de verdade, sem robô, sempre que você travar.
            </span>
          </li>
          <li>
            <span className="tick">
              <Tick />
            </span>
            <span>
              <b>Nada vai ao ar sem o seu ok.</b> Você lê o texto e escolhe a arte antes de
              qualquer anúncio aparecer.
            </span>
          </li>
        </ul>

        {/* No protótipo "Salvar e continuar depois" era um botão sem
            função — as respostas viviam na memória do navegador. Agora
            cada resposta já está gravada, então o botão só precisa levar
            embora: sair daqui é seguro, que é o que a frase promete. */}
        <div className="proof-actions">
          <a className="cta quiet" href="/inicio">
            Salvar e continuar depois
          </a>
          <a
            className="cta quiet"
            href="https://wa.me/5521936182176"
            target="_blank"
            rel="noopener"
          >
            Falar com um humano
          </a>
        </div>
      </div>
    </>
  );
}
