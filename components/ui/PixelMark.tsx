/**
 * Logomark pixelada (classe `.mark` em app/globals.css).
 *
 * O desenho é o mesmo de `MARK` em `assets/v2g.js` do repositório de
 * referência: 6 colunas × 5 linhas, `1` = pixel aceso.
 *
 * Extraído porque aparece em mais de uma tela — na trilha do onboarding
 * (onde é montada por partes, com lógica própria) e no estado vazio de
 * /alertas. O padrão vive aqui para não existir em duas versões que
 * podem divergir.
 */
export const MARK = ["011010", "110110", "011011", "110110", "011010"];

export const MARK_COLUNAS = 6;

interface PixelMarkProps {
  /** tamanho do pixel; vira a variável CSS `--px` */
  px?: number;
  /** cor dos pixels acesos; vira `--mark-c` */
  cor?: string;
  className?: string;
}

export function PixelMark({ px = 8, cor, className }: PixelMarkProps) {
  const estilo: Record<string, string> = {
    gridTemplateColumns: `repeat(${MARK_COLUNAS}, var(--px))`,
    "--px": `${px}px`,
  };
  if (cor) estilo["--mark-c"] = cor;

  return (
    <div className={`mark${className ? ` ${className}` : ""}`} style={estilo} aria-hidden="true">
      {MARK.join("")
        .split("")
        .map((c, i) => (
          <i key={i} className={c === "1" ? undefined : "off"} />
        ))}
    </div>
  );
}
