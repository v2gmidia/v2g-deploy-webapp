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
 *
 * ============================================================
 * AS TELAS CANÔNICAS (16/09/2026) ENTRAM PELO MESMO TRINCO.
 *
 * `inicio-preparando`, `inicio-no-ar` e `inicio-pausado` desenham a
 * composição NOVA (`_canonico/TelaCanonica`), que é o laboratório visual da
 * sessão longa. O componente e o CSS Module dele são importados DENTRO do
 * mesmo `if` de desenvolvimento, e não no topo do arquivo, justamente para
 * a superfície nova não entrar no grafo de produção — a propriedade que o
 * build já prova para a fixture.
 *
 * `inicio` continua desenhando a tela ATUAL, para a comparação lado a lado
 * não depender de memória.
 * ============================================================
 *
 * ============================================================
 * RODADA 5 (17/09/2026): QUATRO ESTADOS.
 *
 * `inicio-concluiu` é o momento (b) — a preparação acabou de fechar. Ele
 * manda a MESMA veiculação que `inicio-no-ar` (`no_ar`); o que o separa é
 * `mostrarConclusao`, que aqui vem do NOME DA ROTA e em produção não vem
 * de lugar nenhum, porque nenhuma fonte diz "o dono ainda não viu a
 * conclusão". Sem fonte, o valor de produção é `false` e a tela cai no
 * momento (c). Ver DUVIDA-11.
 * ============================================================
 */
const CANONICAS: Record<string, "preparando" | "concluiu" | "no-ar" | "pausado"> = {
  "inicio-preparando": "preparando",
  "inicio-concluiu": "concluiu",
  "inicio-no-ar": "no-ar",
  "inicio-pausado": "pausado",
};

export default async function ExemploPage({ params }: { params: Promise<{ tela: string }> }) {
  const ehDesenvolvimento = process.env.NODE_ENV !== "production";
  const exemplo = ehDesenvolvimento ? await import("@/lib/exemplo") : null;
  if (!exemplo) notFound();

  const { tela } = await params;
  const agora = new Date();
  const casco = exemplo.CASCO_DE_EXEMPLO;

  // ---- a composição nova, três estados ----
  const canonica = CANONICAS[tela];
  if (canonica) {
    // MESMO TRINCO DA FIXTURE, e ele precisa ser o do `NODE_ENV` — não o do
    // parâmetro da rota. Medido em 16/09/2026: com o import atrás só do
    // `if (canonica)`, o build levava o componente e o CSS Module para o
    // pacote (`heroiManchete` aparecia em 3 arquivos do `.next`). A rota
    // continuava 404, mas o comentário que dizia "não entra no pacote"
    // estava falso — e afirmação falsa em comentário é defeito.
    const canon = ehDesenvolvimento ? await import("../_canonico/TelaCanonica") : null;
    if (!canon) notFound();
    const { TelaCanonica } = canon;
    return (
      <Casco
        nome={casco.nome}
        nomeNegocio={casco.nomeNegocio}
        rotuloDaConta={casco.nomeNegocio}
        inicial={casco.inicial}
      >
        <TelaCanonica
          estado={exemplo.exemploDoInicio(agora, canonica)}
          mostrarConclusao={canonica === "concluiu"}
          diaDaPergunta={diaDeOntemEmSaoPaulo(agora)}
        />
      </Casco>
    );
  }

  // ---- a tela atual, para comparação ----
  // Uma tela por vez. Nome que não existe é 404, não uma tela vazia.
  if (tela !== "inicio") notFound();

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
