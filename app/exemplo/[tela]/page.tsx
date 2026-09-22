import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CasoDeFalha } from "../_onboarding/recados";
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
 */
const CANONICAS: Record<string, "preparando" | "no-ar" | "pausado"> = {
  "inicio-preparando": "preparando",
  "inicio-no-ar": "no-ar",
  "inicio-pausado": "pausado",
};

/**
 * ============================================================
 * O ONBOARDING NOVO (20/09/2026) ENTRA PELO MESMO TRINCO.
 *
 * `/exemplo/onboarding` desenha as ONZE perguntas do briefing de 20/09,
 * em `_onboarding/`. O onboarding do ar — `app/(fluxo)/onboarding/`, com
 * cinco perguntas — não foi tocado.
 *
 * Parâmetros de URL, só para CAPTURAR TELA:
 *   ?passo=N      abre direto na pergunta N (1 a 11; 12 é o resumo)
 *   ?exemplo=1    preenche as respostas anteriores com dado de bancada
 *   ?nicho=…      troca o tipo de negócio do dado de exemplo
 *   ?microfone=1  desenha o microfone LIGADO;  ?microfone=0 desenha DESLIGADO
 *   ?destino=1    mostra onde cada resposta vai cair em produção
 *   ?falha=<caso> desenha a tela de quando a transcrição não vem
 *   ?aovivo=1     desenha o bloco da fala ao vivo, com exemplo dentro
 *
 * Eles não existem no fluxo de verdade: quem entra pela porta cai no
 * passo 1 com o que o próprio navegador guardou.
 * ============================================================
 */
export default async function ExemploPage({
  params,
  searchParams,
}: {
  params: Promise<{ tela: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ehDesenvolvimento = process.env.NODE_ENV !== "production";
  const exemplo = ehDesenvolvimento ? await import("@/lib/exemplo") : null;
  if (!exemplo) notFound();

  const { tela } = await params;
  const agora = new Date();
  const casco = exemplo.CASCO_DE_EXEMPLO;

  // ---- o Inicio de quem acabou de chegar ----
  // Dois momentos, pelo sufixo da rota:
  //   /exemplo/chegada          -> falta conectar
  //   /exemplo/chegada-conectou -> ja conectou, e agora e com a gente
  if (tela === "chegada" || tela === "chegada-conectou") {
    const modulo = ehDesenvolvimento ? await import("../_chegada/TelaDeChegada") : null;
    const fixture = ehDesenvolvimento ? await import("../_chegada/estado-de-chegada") : null;
    if (!modulo || !fixture) notFound();
    const momento = tela === "chegada" ? "falta_conectar" : "e_com_a_gente";
    return (
      <modulo.TelaDeChegada estado={fixture.estadoDeChegada(agora, momento)} momento={momento} />
    );
  }

  // ---- a amostra das bordas de cobalto no tema escuro ----
  // As 14 regras consertadas em 20/09 moram no `globals.css` e pintam
  // telas atrás do login. Esta amostra renderiza a marcação real de cada
  // uma, para o conserto poder ser olhado nos dois temas.
  if (tela === "bordas") {
    const modulo = ehDesenvolvimento ? await import("../_bordas/Amostra") : null;
    if (!modulo) notFound();
    return <modulo.Amostra />;
  }

  // ---- o onboarding novo, onze perguntas ----
  if (tela === "onboarding") {
    const modulo = ehDesenvolvimento ? await import("../_onboarding/Onboarding") : null;
    if (!modulo) notFound();
    const { Onboarding } = modulo;

    const busca = await searchParams;
    const passo = Number(Array.isArray(busca.passo) ? busca.passo[0] : (busca.passo ?? "1"));
    const comExemplo = (Array.isArray(busca.exemplo) ? busca.exemplo[0] : busca.exemplo) === "1";
    // `?nicho=` troca só o tipo de negócio do dado de exemplo — existe
    // para capturar o passo 9 nos dois casos: com custo por contato
    // conhecido e sem ele.
    const nicho = Array.isArray(busca.nicho) ? busca.nicho[0] : busca.nicho;

    // A DECISÃO SOBRE O MICROFONE É DO SERVIDOR, e por dois motivos: a
    // chave não pode chegar ao navegador, e a tela precisa saber ANTES de
    // desenhar — um microfone que só falha depois do clique faz a pessoa
    // gravar para descobrir que não dá.
    const temChave = Boolean(process.env.OPENAI_API_KEY);

    // `?microfone=` DESENHA um dos dois estados, para capturar tela:
    //   1 → ligado    0 → desligado, com o motivo escrito
    // Sem o parâmetro vale o ambiente. Ele não inventa transcrição nenhuma:
    // com `1` e sem chave, gravar ainda esbarra no 501 da rota; com `0` e
    // com chave, o botão só deixa de ser oferecido.
    //
    // Os DOIS precisam ser capturáveis, e por isso o parâmetro tem três
    // estados em vez de dois: a chave entrou no `.env.local` desta máquina
    // em 20/09, então omitir o parâmetro deixou de mostrar o caminho sem
    // chave — que continua sendo o de qualquer máquina que não a tenha.
    const microfonePedido = Array.isArray(busca.microfone)
      ? busca.microfone[0]
      : busca.microfone;

    return (
      <Onboarding
        passoInicial={Number.isFinite(passo) ? Math.min(Math.max(passo - 1, 0), 11) : 0}
        transcricaoLigada={
          microfonePedido === "1" ? true : microfonePedido === "0" ? false : temChave
        }
        motivoSemTranscricao="A transcrição por áudio ainda não está ligada aqui. Pode escrever pelo teclado."
        comExemplo={comExemplo}
        mostrarDestino={
          (Array.isArray(busca.destino) ? busca.destino[0] : busca.destino) === "1"
        }
        falaDeExemplo={
          (Array.isArray(busca.aovivo) ? busca.aovivo[0] : busca.aovivo) === "1"
        }
        falhaDeExemplo={
          ((Array.isArray(busca.falha) ? busca.falha[0] : busca.falha) as
            | CasoDeFalha
            | undefined) ?? null
        }
        nichoDeExemplo={nicho ?? null}
      />
    );
  }

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
        <TelaCanonica estado={exemplo.exemploDoInicio(agora, canonica)} />
      </Casco>
    );
  }

  // ---- a tela atual, para comparação ----
  // Uma tela por vez. Nome que não existe é 404, não uma tela vazia.
  if (tela !== "inicio") notFound();

  const busca2 = await searchParams;
  const pedido = Array.isArray(busca2.estado) ? busca2.estado[0] : busca2.estado;
  const estadoDoExemplo: "chegada" | "preparando" | "no-ar" | "pausado" =
    pedido === "chegada" || pedido === "preparando" || pedido === "no-ar"
      ? pedido
      : "pausado";

  return (
    <Casco
      nome={casco.nome}
      nomeNegocio={casco.nomeNegocio}
      rotuloDaConta={casco.nomeNegocio}
      inicial={casco.inicial}
    >
      {/* ============================================================
          `?estado=` escolhe o momento, e existe para capturar o ANTES e o
          DEPOIS de um conserto na tela de produção.

          O padrao continua `pausado`, que e o que a bancada mostrava. O
          `preparando` e o estado em que os dois defeitos de 22/09
          aparecem: execucao existe (o pipeline disparou) e o anuncio
          NUNCA foi ao ar.
          ============================================================ */}
      <TelaDoInicio
        estado={exemplo.exemploDoInicio(agora, estadoDoExemplo)}
        ultimaDecisao={null}
        diaDaPergunta={diaDeOntemEmSaoPaulo(agora)}
        atrasados={[]}
        faixa={null}
      />
    </Casco>
  );
}
