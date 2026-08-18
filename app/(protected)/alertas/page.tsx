import { PixelMark } from "@/components/ui/PixelMark";
import { createClient } from "@/lib/supabase/server";

/**
 * Avisos — porte de `tela-08-alertas-desktop.html`.
 *
 * ESTADO VAZIO COMO CAMINHO PRINCIPAL. O protótipo mostrava dois
 * alertas de exemplo (cobrança recusada, campanha esperando foto) e
 * escondia o estado vazio atrás de um botão de demonstração. Aqui é o
 * contrário: enquanto não houver campanha rodando, não há o que avisar,
 * e é isso que a tela diz.
 *
 * A tabela `decisions` já existe e é de onde os avisos vão sair — o
 * N8N grava lá o que a IA decidiu (ver docs/n8n-repontamento.md). A
 * consulta abaixo é real; hoje ela volta vazia porque nada foi gravado
 * ainda, não porque a tela seja um mock.
 */
export default async function AlertasPage() {
  const supabase = await createClient();

  // RLS já limita ao negócio do usuário logado — não é preciso filtrar
  // por business_id aqui (ver private.owns_business na migration 0001).
  const { data: pendentes } = await supabase
    .from("decisions")
    .select("id, kind, payload, created_at")
    .eq("needs_review", true)
    .order("created_at", { ascending: false });

  const { data: registradas } = await supabase
    .from("decisions")
    .select("id, kind, payload, created_at")
    .eq("needs_review", false)
    .order("created_at", { ascending: false })
    .limit(10);

  // "Nada pendente" tem dois significados muito diferentes: ninguém
  // começou ainda, ou tudo está rodando e em ordem. A copy do estado
  // vazio muda conforme o caso — dizer "seus anúncios ainda não estão
  // no ar" para quem tem campanha rodando seria simplesmente falso.
  const { count: campanhasNoAr } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .not("published_at", "is", null);

  const temCampanha = (campanhasNoAr ?? 0) > 0;
  const temPendencia = (pendentes?.length ?? 0) > 0;
  const temRegistro = (registradas?.length ?? 0) > 0;

  // A faixa CONTA, não descreve. Descrever repetiria os cards logo abaixo;
  // contar é a informação que hoje não existe — com sete pendências
  // ninguém sabe que são sete sem rolar a tela.
  //
  // SEM CASCATA DE URGÊNCIA, e isso é deliberado. A `/anuncios` ordena por
  // gravidade (publicação falhada > criativo reprovado > peça esperando)
  // porque aqueles três estados existem e têm gravidade conhecida. Aqui as
  // pendências são linhas de `decisions`, cujos `kind` são
  // `classification` e `diagnosis` — nenhum deles é mais urgente que o
  // outro. Inventar uma ordem de gravidade seria fingir um julgamento que
  // ninguém fez. A ordem é a que a consulta já usa: mais recente primeiro.
  const quantasPendentes = pendentes?.length ?? 0;
  const primeiraPendencia = pendentes?.[0];

  return (
    <>
      <div className="page-head">
        <h1>Avisos</h1>
        <p>
          Farol, não sirene. Primeiro o que precisa de você — com um botão só pra resolver.
          Depois, a prestação de contas do que a IA fez sozinha.
        </p>
      </div>

      {/* Condicional: existe só quando há motivo. Sem pendência não vira
          nada mais discreto — some inteira, e quem responde pelo estado
          vazio é o `.empty-hero` abaixo, que já distingue "ainda não
          começou" de "está tudo rodando". Faixa permanente viraria moldura,
          e moldura ensina a ignorar. */}
      {quantasPendentes > 0 && (
        <section className="hero-destaque">
          <span className="eyebrow">Precisa de você</span>
          <p className="hero-num">{quantasPendentes}</p>
          <p className="hero-legenda">
            {quantasPendentes === 1 ? "coisa precisa de você" : "coisas precisam de você"}
          </p>
          {primeiraPendencia && (
            <a className="cta cta-faixa" href={`#pendencia-${primeiraPendencia.id}`}>
              {quantasPendentes === 1 ? "Ver o que é" : "Ver a primeira"}
            </a>
          )}
        </section>
      )}

      <div className="dash-grid">
        <div className="dash-main">
          <section>
            <div className="section-title">
              <h2>Precisa de você</h2>
            </div>

            {temPendencia ? (
              <div className="dash-main">
                {pendentes!.map((d) => (
                  <article className="alert-card warn" key={d.id} id={`pendencia-${d.id}`}>
                    <b>{tituloDaDecisao(d.kind)}</b>
                    <p>{resumoDaDecisao(d.payload)}</p>
                    <time>{formatarData(d.created_at)}</time>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-hero">
                <PixelMark px={9} cor="var(--navy)" />
                <span className="badge">Nada pendente</span>
                <h3>Tudo em dia por aqui.</h3>
                <p>
                  Quando algo precisar de você — uma foto que falta, uma escolha entre dois
                  anúncios, uma cobrança que não passou — aparece nesta tela e também chega no
                  seu WhatsApp.
                </p>
                <p className="eh-note">
                  {temCampanha
                    ? "Sua campanha está rodando e nada travou. Se algo precisar de você, aparece aqui antes de virar problema."
                    : "Seus anúncios ainda não estão no ar, então não há o que avisar. Assim que a primeira campanha começar a rodar, é aqui que você acompanha."}
                </p>
              </div>
            )}
          </section>

          <section>
            <div className="section-title">
              <h2>Só pra você saber</h2>
              <span className="st-note">O que a IA fez sozinha. Nada aqui pede ação sua.</span>
            </div>

            {temRegistro ? (
              <div className="card">
                {registradas!.map((d) => (
                  <div className="log-row" key={d.id}>
                    {formatarData(d.created_at)} — {resumoDaDecisao(d.payload)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <p className="hint" style={{ marginBottom: 0 }}>
                  {temCampanha
                    ? "A IA ainda não fez nenhum ajuste nesta campanha. Quando fizer — mudar o investimento de um anúncio para outro, pausar o que não está rendendo — vira uma linha aqui, com o motivo em português."
                    : "A IA ainda não tomou nenhuma decisão porque não há campanha rodando. Quando houver, cada ajuste que ela fizer sozinha vira uma linha aqui, com o motivo em português."}
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="dash-aside">
          <section className="card">
            <b className="pc-title" style={{ display: "block", marginBottom: 6 }}>
              Também no seu WhatsApp
            </b>
            <p className="hint">
              Você escolhe quais avisos saem do app e chegam no seu WhatsApp. Um deles é fixo e
              não dá para desligar: campanha parada por pagamento — é dinheiro parado.
            </p>
            <p className="foot-line">
              A escolha em si ainda não está no app: falta onde guardar essa preferência. Por
              enquanto, todos os avisos importantes vão para o WhatsApp que você cadastrou.
            </p>
          </section>

          <section className="trust support-block">
            <b>Fala com gente de verdade</b>
            Dúvida de cobrança, de resultado ou de saída: é a mesma pessoa que responde.
            WhatsApp, resposta em até 2 horas úteis, sem robô e sem menu de atendimento.
            <a className="wa" href="https://wa.me/5521980351531" target="_blank" rel="noopener">
              Chamar no WhatsApp &rarr;
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}

const TITULOS: Record<string, string> = {
  classification: "A IA classificou seu negócio",
  diagnosis: "A IA fez um diagnóstico",
};

function tituloDaDecisao(kind: string): string {
  return TITULOS[kind] ?? "A IA precisa de uma resposta sua";
}

/**
 * O `payload` das decisões é jsonb livre — é saída de LLM, e o formato
 * ainda não assentou (ver docs/schema-consolidado.md §2). Por isso a
 * leitura é defensiva: procura um campo de resumo e, se não achar, diz
 * o que dá para dizer sem inventar.
 */
function resumoDaDecisao(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    for (const chave of ["resumo", "summary", "mensagem", "texto"]) {
      if (typeof p[chave] === "string" && p[chave]) return p[chave] as string;
    }
  }
  return "Abra a campanha para ver os detalhes.";
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
