import type { ReactNode } from "react";

/**
 * O TOM diz de que família é o selo. A FORMA diz o estado dentro dela.
 *
 * ============================================================
 * DOIS EIXOS, E O SEGUNDO ENTROU EM 11/09/2026 PELO ITEM C5.
 *
 * A regra: selos de estados diferentes se distinguem por **texto e
 * forma**, nunca por cor de julgamento.
 *
 * A `/anuncios` já respeitava metade dela — os três estados usam
 * `tone="off"`, cinza, porque verde ali seria semáforo: afirmaria que o
 * resultado está bom sem ninguém ter medido contra alvo nenhum. O que
 * faltava era a outra metade: três pílulas idênticas em cor E em forma,
 * diferentes só na palavra, pedem leitura atenta para uma distinção que
 * devia ser de relance.
 *
 * `forma` é independente de `tone` de propósito. Amarrar as duas —
 * "warn é sempre contorno" — recriaria o eixo único com outro nome, e o
 * primeiro estado que precisasse das duas combinações não teria como
 * ser escrito.
 * ============================================================
 */
type PillTone = "ok" | "warn" | "crit" | "info" | "off";

/**
 * `preenchido` é o padrão porque é o que as telas já desenhavam — trocar
 * o padrão mudaria calado todo selo existente. Quem quer o outro eixo
 * pede por ele.
 */
type PillForma = "preenchido" | "contorno";

interface PillProps {
  tone: PillTone;
  forma?: PillForma;
  children: ReactNode;
}

/**
 * Pill de status (classe `.pill` em app/globals.css).
 *
 * Usado hoje pela `/anuncios`, nos três estados de campanha. Ver
 * docs/arquitetura.md, Decisão 8.
 */
export function Pill({ tone, forma = "preenchido", children }: PillProps) {
  return <span className={`pill ${tone} ${forma}`}>{children}</span>;
}
