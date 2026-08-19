import { createClient } from "@/lib/supabase/server";

/**
 * Montando sua campanha — porte de `tela-04-processamento-desktop.html`.
 *
 * O protótipo tinha três estados (em andamento, espera longa, concluído)
 * e um alternador de demonstração para vê-los lado a lado. O alternador
 * não veio: no produto quem troca o estado é o que está acontecendo de
 * verdade, como o próprio comentário do HTML dizia.
 *
 * O QUE FOI ACRESCENTADO: o estado de FALHA. O protótipo não tinha, e
 * sem ele a tela gira para sempre quando a geração quebra — o usuário
 * fica olhando um passo "em andamento" que nunca termina, sem saber se
 * o problema é dele, da internet ou nosso. Uma tela de espera sem saída
 * de erro é uma armadilha.
 *
 * A fonte do estado é `analysis_runs.status`, que o N8N escreve
 * (ver docs/n8n-repontamento.md §4). Os valores esperados:
 *   - `running`               → em andamento
 *   - `generated`             → concluído, esperando revisão
 *   - `failed` / `error`      → falha
 * Qualquer outro valor cai em "em andamento", que é o padrão seguro:
 * na dúvida, a tela espera em vez de dizer que deu errado.
 *
 * ============================================================
 * ESTA TELA NUNCA FUNCIONOU. NÃO MEXA SEM LER ISTO.
 *
 * `analysis_runs` tem ZERO linhas, e ninguém escreve nela. Quem
 * escreveria é o N8N depois do repontamento do `n8n-repontamento.md`,
 * cujo checklist da §7 está com os sete itens em aberto. `offers` e
 * `decisions` — as outras duas tabelas do mesmo repontamento — também
 * estão em zero.
 *
 * Consequência: o `if (!run)` abaixo pega SEMPRE, e a tela mostra "Não
 * há nada sendo montado agora" para todo mundo, inclusive para quem tem
 * execução rodando. Não é caso de borda; é o comportamento único.
 *
 * Desde quando: commit 974be8d, 01/08/2026 ("Fecha o lote 3"). O
 * `git log -S "analysis_runs"` sobre este arquivo devolve esse commit e
 * só esse — a tabela entrou junto com a tela e nunca foi trocada.
 *
 * Por que ninguém viu: o estado vazio é bonito e plausível. Uma tela
 * vazia não prova ausência de dado, do mesmo jeito que log vazio não
 * prova ausência de evento.
 *
 * A PARTIR DO LOTE E ISTO VIROU CONTRADIÇÃO ATIVA, não só dívida: o
 * front passou a disparar o pipeline de verdade
 * (`lib/pipeline/disparar.ts`). O cliente responde o último campo, a
 * execução nasce em `execucoes`, e esta tela continua dizendo que não há
 * nada sendo montado. Isso vai aparecer no primeiro uso real.
 *
 * O CONSERTO É O LOTE SEGUINTE, e o desenho dele está pronto:
 * `docs/disparo-pipeline.md` §3, incluindo o levantamento §3.4 dos seis
 * estados de `EstadoExecucao` contra os quatro desta tela. Os quatro
 * pontos que ele precisa resolver, e que um `.from("execucoes")` sozinho
 * NÃO resolve:
 *
 *   1. `cadastro_completo` cairia em "em andamento" e diria "estamos
 *      montando" quando ninguém pegou a execução ainda.
 *   2. `aguardando_fotos` é espera DELE, não nossa — "pode fechar o app,
 *      a gente te avisa" ali manda o cliente esperar a si mesmo.
 *   3. `EstadoExecucao` não tem estado de falha. O `Falha` abaixo ficaria
 *      sem fonte; quem o produz é o silêncio medido em
 *      `lib/pipeline/relogios.ts`.
 *   4. A leitura do cliente não pode ser `select *`:
 *      `docs/auditoria-resultados.md` achou raciocínio interno da IA
 *      sobre o negócio dele, estratégia de nicho e saída de mock nas
 *      mesmas colunas. A tela precisa de `status` e `atualizado_em`, e
 *      de nada mais.
 *
 * Trocar só o `.from()` foi considerado e RECUSADO: trocaria tela muda
 * por tela errada em quatro estados.
 * ============================================================
 */

const LIMITE_ESPERA_LONGA_MIN = 30;

interface Passo {
  titulo: string;
  detalhe: string;
  estado: "done" | "active" | "pending" | "fail";
  tag?: string;
}

export default async function ProcessandoPage() {
  const supabase = await createClient();

  const { data: run } = await supabase
    .from("analysis_runs")
    .select("id, status, needs_review, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!run) {
    return (
      <div className="auth-grid solo">
        <main className="auth-card">
          <p className="eyebrow">Sua primeira missão</p>
          <h1 className="auth-h">Não há nada sendo montado agora.</h1>
          <p className="auth-sub">
            Esta tela mostra a IA montando sua campanha. Ela começa depois que você conta sobre o
            seu negócio — são quatro perguntas rápidas.
          </p>
          <a className="cta" href="/onboarding">
            Começar agora
          </a>
        </main>
      </div>
    );
  }

  const status = (run.status ?? "").toLowerCase();
  const falhou = status === "failed" || status === "error";
  const concluido = status === "generated" || run.needs_review === true;

  const minutosCorridos = Math.floor(
    (Date.now() - new Date(run.created_at).getTime()) / 60000,
  );
  const esperaLonga = !falhou && !concluido && minutosCorridos >= LIMITE_ESPERA_LONGA_MIN;

  return (
    <div className="auth-grid">
      <main className="auth-card">
        {falhou ? (
          <Falha minutos={minutosCorridos} />
        ) : concluido ? (
          <Concluido />
        ) : esperaLonga ? (
          <EsperaLonga minutos={minutosCorridos} />
        ) : (
          <EmAndamento />
        )}
      </main>

      <aside className="auth-aside">
        <section className="proof-card">
          <b className="title">{falhou ? "O que acontece agora" : "Pode fechar o app"}</b>
          <p>
            {falhou
              ? "Nada foi cobrado e nenhum anúncio foi ao ar. O que você já respondeu continua salvo — não precisa recomeçar do zero."
              : "Nada aqui depende de você ficar olhando a tela. A gente continua montando com o app fechado, com você atendendo cliente."}
          </p>
          <ul className="proof-list">
            <li>
              <Tick />
              <span>
                {falhou ? (
                  <>
                    <b>Seus dados continuam lá.</b> O que você contou sobre o negócio está salvo
                    e não se perde.
                  </>
                ) : (
                  <>
                    O aviso chega no <b>WhatsApp</b>, no número que você cadastrou — não é e-mail
                    que some na promoção.
                  </>
                )}
              </span>
            </li>
            <li>
              <Tick />
              <span>
                {falhou ? (
                  <>
                    <b>Ninguém foi cobrado.</b> O primeiro real só entra depois que um anúncio
                    existe de verdade.
                  </>
                ) : (
                  <>
                    Ao voltar, você cai <b>neste mesmo lugar</b>, no passo em que a gente parou.
                  </>
                )}
              </span>
            </li>
            <li>
              <Tick />
              <span>
                Se algo travar, <b>a gente te procura</b>. Você não precisa ficar de olho.
              </span>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

function Stepper({ passos }: { passos: Passo[] }) {
  return (
    <ul className="stepper">
      {passos.map((p) => (
        <li className={p.estado} key={p.titulo}>
          <div className="node">{iconeDoNo(p.estado)}</div>
          <div className="s-copy">
            {p.tag && <span className="split-tag">{p.tag}</span>}
            <b>{p.titulo}</b>
            <span>{p.detalhe}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmAndamento() {
  return (
    <>
      <p className="eyebrow">Sua primeira missão</p>
      <h1 className="auth-h">Estamos montando sua campanha</h1>
      <p className="auth-sub">
        A IA está lendo seu negócio de verdade — o que você vende, para quem e onde — antes de
        colocar 1 real em anúncio.
      </p>

      <Stepper
        passos={[
          { titulo: "Lendo seu negócio", detalhe: "Concluído", estado: "done" },
          {
            titulo: "Montando sua estrutura de anúncios",
            detalhe: "Definindo público e verba",
            estado: "active",
          },
          { titulo: "Criando seus primeiros anúncios", detalhe: "A seguir", estado: "pending" },
          {
            titulo: "Colocando no ar",
            detalhe: "Depois disso, seus anúncios passam pela aprovação da plataforma",
            estado: "pending",
            tag: "Último passo · não depende da gente",
          },
        ]}
      />

      <div className="trust">
        <b>Sobre o seu dinheiro</b>
        O primeiro real só entra depois que a aprovação dos anúncios sair. Não antes disso — você
        não paga por um anúncio que ainda não existe.
      </div>

      <p className="card-note">
        Pode fechar o app — a gente continua e te avisa no WhatsApp quando terminar.
      </p>
    </>
  );
}

function EsperaLonga({ minutos }: { minutos: number }) {
  return (
    <>
      <p className="eyebrow">Último passo · não depende da gente</p>
      <h1 className="auth-h">Isso está levando mais que o normal</h1>
      <p className="auth-sub">
        Já são {minutos} minutos. Costuma levar bem menos, mas ainda está dentro do que acontece —
        a revisão das plataformas às vezes demora.
      </p>

      <Stepper
        passos={[
          { titulo: "Lendo seu negócio", detalhe: "Concluído", estado: "done" },
          { titulo: "Montando sua estrutura de anúncios", detalhe: "Concluído", estado: "done" },
          {
            titulo: "Criando seus primeiros anúncios",
            detalhe: "Em andamento",
            estado: "active",
          },
          {
            titulo: "Colocando no ar",
            detalhe: "A seguir",
            estado: "pending",
            tag: "Último passo · não depende da gente",
          },
        ]}
      />

      <div className="trust">
        <b>Você não precisa esperar aqui</b>
        Feche o app à vontade. Se passar do razoável, a gente te procura no WhatsApp — você não
        vai descobrir por conta própria que algo travou.
      </div>

      <p className="card-note">
        Se preferir falar com alguém agora,{" "}
        <a href="https://wa.me/5521936182176" target="_blank" rel="noopener">
          chame a gente no WhatsApp
        </a>
        .
      </p>
    </>
  );
}

function Concluido() {
  return (
    <>
      <p className="eyebrow">Sua primeira missão</p>
      <h1 className="auth-h">Prontinho. Sua campanha está montada.</h1>
      <p className="auth-sub">
        A IA terminou. Agora é com você: nada vai ao ar antes de você ler o texto e aprovar a
        arte, uma peça de cada vez.
      </p>

      <Stepper
        passos={[
          { titulo: "Lendo seu negócio", detalhe: "Concluído", estado: "done" },
          { titulo: "Montando sua estrutura de anúncios", detalhe: "Concluído", estado: "done" },
          { titulo: "Criando seus primeiros anúncios", detalhe: "Concluído", estado: "done" },
          {
            titulo: "Colocando no ar",
            detalhe: "Espera sua aprovação",
            estado: "active",
            tag: "Depende de você",
          },
        ]}
      />

      <a className="cta" href="/anuncios">
        Ver o que a IA preparou
      </a>
    </>
  );
}

/**
 * O estado que o protótipo não tinha.
 *
 * Três coisas que uma tela de falha precisa fazer, e que a de espera
 * infinita não faz: dizer que parou, dizer que não custou nada, e dar
 * um caminho de saída que não seja recarregar a página na esperança.
 */
function Falha({ minutos }: { minutos: number }) {
  return (
    <>
      <p className="eyebrow">Sua primeira missão</p>
      <h1 className="auth-h">A montagem parou no meio.</h1>
      <p className="auth-sub">
        Alguma coisa quebrou do nosso lado depois de {minutos} minutos. Não foi você, e não foi
        o que você respondeu.
      </p>

      <Stepper
        passos={[
          { titulo: "Lendo seu negócio", detalhe: "Concluído", estado: "done" },
          {
            titulo: "Montando sua estrutura de anúncios",
            detalhe: "Parou aqui",
            estado: "fail",
          },
          { titulo: "Criando seus primeiros anúncios", detalhe: "Não chegou a começar", estado: "pending" },
          { titulo: "Colocando no ar", detalhe: "Não chegou a começar", estado: "pending" },
        ]}
      />

      <div className="fail-block">
        <b>Nada foi cobrado e nenhum anúncio foi ao ar</b>
        <p>
          A montagem parou antes de qualquer anúncio existir, então não houve gasto nenhum. Suas
          respostas continuam salvas — quando isso voltar, retoma de onde parou, sem recomeçar.
        </p>
      </div>

      <a className="cta" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
        Falar com uma pessoa agora
      </a>
      <p className="card-note" style={{ marginTop: 12 }}>
        A gente já foi avisado da falha e está olhando. Se preferir esperar, pode fechar o app —
        te chamamos no WhatsApp assim que resolver.
      </p>
    </>
  );
}

function iconeDoNo(estado: Passo["estado"]) {
  if (estado === "done") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      </svg>
    );
  }
  if (estado === "active") {
    return (
      <svg width="14" height="4" viewBox="0 0 14 4" fill="currentColor" aria-hidden="true">
        <circle cx="2" cy="2" r="1.6" />
        <circle cx="7" cy="2" r="1.6" />
        <circle cx="12" cy="2" r="1.6" />
      </svg>
    );
  }
  if (estado === "fail") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M2 2l6 6M8 2l-6 6" />
      </svg>
    );
  }
  return (
    <svg className="lock" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <rect x="1" y="4" width="8" height="6" />
      <rect x="3" y="1" width="1.4" height="4" />
      <rect x="5.6" y="1" width="1.4" height="4" />
      <rect x="3" y="1" width="4" height="1.4" />
    </svg>
  );
}

const Tick = () => (
  <span className="tick">
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  </span>
);
