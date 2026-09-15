import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Casco } from "@/components/ui/Casco";
import { TelaDoInicio } from "@/app/(protected)/inicio/TelaDoInicio";
import { diaDeOntemEmSaoPaulo } from "@/lib/dia-seguinte/dia";

export const metadata: Metadata = {
  title: "Exemplo — V2G",
  robots: { index: false, follow: false },
};

/**
 * A BANCADA — telas internas com dado falso, sem login. Só em desenvolvimento.
 *
 * ============================================================
 * PARA QUE SERVE: conferir e fotografar a tela de verdade sem sessão. O
 * desenho é o MESMO componente que a rota real usa (`TelaDoInicio`, dentro
 * do `Casco`); só o dado muda, e ele vem de `lib/exemplo.ts`.
 *
 * COMO NÃO CHEGA A PRODUÇÃO — um trinco, e ele é o do build:
 *
 *   `process.env.NODE_ENV !== "production" ? await import(...) : null`
 *
 * No `pnpm build` o Next troca `NODE_ENV` pelo literal `"production"`: a
 * condição vira falsa, o `import()` morre, `lib/exemplo.ts` não entra no
 * pacote, e a rota cai no `notFound()` — 404. O preview da Vercel também
 * roda com `NODE_ENV=production`. A prova é o build: a sentinela de
 * `lib/exemplo.ts` com zero ocorrências no `.next/`, e a rota em 404 no
 * `next start`.
 *
 * O QUE ELA NÃO FAZ: não lê sessão, banco nem backend, e não mexe em
 * `proxy.ts` nem no layout protegido. Não usa variável `V2G_FIXTURE_*` nem a
 * fixture da `/inicio` — as travas `conferir:portao` e `conferir:inicio` §6
 * continuam valendo como estão. Ver docs/estado/portao-de-fixture-11-09.md.
 * ============================================================
 */
export default async function ExemploPage({ params }: { params: Promise<{ tela: string }> }) {
  const exemplo = process.env.NODE_ENV !== "production" ? await import("@/lib/exemplo") : null;
  if (!exemplo) notFound();

  const { tela } = await params;
  // Uma tela por vez. Nome que não existe é 404, não uma tela vazia.
  if (tela !== "inicio") notFound();

  const agora = new Date();
  const casco = exemplo.CASCO_DE_EXEMPLO;

  return (
    <Casco
      nome={casco.nome}
      nomeNegocio={casco.nomeNegocio}
      rotuloDaConta={casco.nomeNegocio}
      inicial={casco.inicial}
    >
      <TelaDoInicio
        estado={exemplo.exemploDoInicio(agora)}
        ultimaDecisao={null}
        diaDaPergunta={diaDeOntemEmSaoPaulo(agora)}
        atrasados={[]}
        faixa={null}
      />
    </Casco>
  );
}
