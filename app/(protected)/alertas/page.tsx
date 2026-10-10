import { createClient } from "@/lib/supabase/server";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { esteveNoAr, estaNoArAgora, fraseDeVeiculacao } from "@/lib/veiculacao/estado";
import { tituloDaAba } from "@/lib/titulos";
import { rotuloDaRevisao, type StatusRevisao } from "@/lib/criativos/revisao";
import { TIPOS_VISIVEIS_AO_CLIENTE } from "@/lib/decisoes/visibilidade";

export const metadata = tituloDaAba("/alertas");

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
  const estado = await estadoDoCliente(new Date());

  // A RLS limita aos negócios do perfil, mas um perfil pode ter mais de
  // um. A tela precisa acompanhar o mesmo negócio do restante do app.
  const { data: pendentes, error: erroPendentes } = estado.negocioId
    ? await supabase
        .from("decisions")
        .select("id, kind, payload, created_at")
        .eq("business_id", estado.negocioId)
        .in("kind", [...TIPOS_VISIVEIS_AO_CLIENTE])
        .eq("needs_review", true)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const { data: registradas, error: erroRegistradas } = estado.negocioId
    ? await supabase
        .from("decisions")
        .select("id, kind, payload, created_at")
        .eq("business_id", estado.negocioId)
        .in("kind", [...TIPOS_VISIVEIS_AO_CLIENTE])
        .eq("status", "done")
        .eq("needs_review", false)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [], error: null };

  // A solicitação é a fonte do aviso dentro do app. Revisão aprovada não
  // significa publicação: só o gestor pode confirmar o anúncio no ar.
  const revisoes = process.env.V2G_CREATIVE_REVIEW_ENABLED === "true" && estado.negocioId
    ? await supabase.from("creative_review_requests")
        .select("id, original_name, status, review_note, created_at, reviewed_at")
        .eq("business_id", estado.negocioId)
        .in("status", ["awaiting_review", "approved_for_manual_publish", "changes_requested", "rejected"])
        .order("created_at", { ascending: false }).limit(20)
    : { data: [], error: null };

  if (erroPendentes) console.error("[alertas] falha ao ler pendências ::", erroPendentes.message);
  if (erroRegistradas) console.error("[alertas] falha ao ler registros ::", erroRegistradas.message);

  // ============================================================
  // "NADA PENDENTE" TEM DOIS SIGNIFICADOS, E A FONTE ESTAVA VAZIA.
  //
  // Ninguém começou ainda, ou tudo está rodando e em ordem. Dizer "seus
  // anúncios ainda não estão no ar" para quem tem campanha rodando seria
  // simplesmente falso — e era exatamente o que acontecia.
  //
  // Esta tela contava `campaigns` com `published_at` preenchido. Medido
  // em 11/09/2026: **`campaigns` tem ZERO linhas na tabela inteira**, não
  // só nesta conta. Então `temCampanha` era `false` para todo mundo, para
  // sempre, e a `/alertas` afirmava "Seus anúncios ainda não estão no ar"
  // na mesma conta em que a `/vendas` afirmava "Seu anúncio está no ar".
  // Duas telas do mesmo app, o mesmo minuto, respostas opostas.
  //
  // Agora vem de `estado.veiculacao` — a fonte única. Item B3.
  // ============================================================
  const veiculacao = estado.veiculacao;
  const temCampanha = esteveNoAr(veiculacao);
  const temPendencia = (pendentes?.length ?? 0) > 0;
  const temRegistro = (registradas?.length ?? 0) > 0;
  const ajustesDeCriativo = (revisoes.data ?? []).filter((r) => r.status === "changes_requested");

  // A CONTAGEM VIVE NO TÍTULO DA SEÇÃO, não numa faixa.
  //
  // A faixa condicional chegou a existir aqui e foi removida na revisão.
  // Ela contava o que a seção logo abaixo já lista, e três defeitos
  // independentes apontaram para ela: o rótulo "Precisa de você" duplicado
  // a três centímetros de distância, um CTA que saltava para um card já
  // visível, e o número no tamanho herói — calibrado para um número que É
  // o assunto da tela — usado para contar itens de uma lista.
  //
  // Ver docs/padrao-visual.md §5 para o critério de reabertura.
  const quantasPendentes = (pendentes?.length ?? 0) + ajustesDeCriativo.length;

  return (
    <div className="avisos-editorial">
      <div className="page-head">
        <h1>Avisos</h1>
        <p>
          Veja primeiro as pendências que precisam da sua atenção. Abaixo, os registros que
          não pedem ação sua.
        </p>
      </div>

      <div className="dash-grid avisos-layout">
        <div className="dash-main avisos-listas">
          <section className="avisos-secao">
            <div className="section-title">
              <h2>Precisa de você</h2>
              {quantasPendentes > 0 && (
                <span className="grp-count">
                  {quantasPendentes} {quantasPendentes === 1 ? "coisa" : "coisas"}
                </span>
              )}
            </div>

            {erroPendentes ? (
              <div className="card">
                <p className="form-error">Não conseguimos carregar seus avisos agora. Tente novamente em instantes.</p>
              </div>
            ) : temPendencia || ajustesDeCriativo.length > 0 ? (
              <div className="avisos-pendencias">
                {ajustesDeCriativo.map((r) => <article className="alert-card warn" key={r.id}>
                  <b>Ajustes pedidos na peça {r.original_name}</b>
                  <p>{r.review_note || "Abra Criativos para ver a revisão do gestor."}</p>
                  <a href="/criativos#casa-revisao">Ver meus criativos</a>
                </article>)}
                {pendentes!.map((d) => (
                  <article className="alert-card warn" key={d.id}>
                    <b>{tituloDaDecisao(d.kind)}</b>
                    <p>{resumoDaDecisao(d.payload)}</p>
                    <time dateTime={d.created_at}>{formatarData(d.created_at)}</time>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-hero">
                <div className="avisos-vazio-titulo">
                  <h3>Tudo em dia por aqui.</h3>
                  <span className="badge">Nada pendente</span>
                </div>
                <p>
                  Quando houver um aviso registrado para este negócio, ele aparece nesta tela.
                </p>
                {/* A frase do ar vem do módulo; o que esta tela acrescenta
                    é o que ELA sabe — que não há aviso pendente. Repare que
                    são três casos e não dois: um anúncio que já rodou e
                    parou não é "ainda não foi ao ar" nem "está rodando", e
                    era essa a terceira frase que não existia em lugar
                    nenhum do app. */}
                <p className="eh-note">
                  {fraseDeVeiculacao(veiculacao, "manchete")}{" "}
                  {estaNoArAgora(veiculacao)
                    ? "Nada travou. Se algo precisar de você, aparece aqui antes de virar problema."
                    : temCampanha
                      ? "Enquanto ele estiver parado não há o que avisar. Se algo precisar de você quando ele voltar, aparece aqui."
                      : "Então não há o que avisar. Assim que a primeira campanha começar a rodar, é aqui que você acompanha."}
                </p>
              </div>
            )}
          </section>

          {process.env.V2G_CREATIVE_REVIEW_ENABLED === "true" && <section className="avisos-secao">
            <div className="section-title"><h2>Retorno dos criativos</h2></div>
            {revisoes.error ? <p className="form-warning">Não conseguimos carregar o retorno das peças agora.</p>
              : (revisoes.data?.length ?? 0) === 0 ? <p className="hint">Nenhuma peça enviada para revisão nesta conta.</p>
              : <div className="avisos-registros">{revisoes.data!.map((r) => <div className="log-row" key={r.id}>
                  <time dateTime={r.reviewed_at || r.created_at}>{formatarData(r.reviewed_at || r.created_at)}</time>
                  <p><b>{r.original_name}</b>: {rotuloDaRevisao(r.status as StatusRevisao)}.
                    {r.status === "approved_for_manual_publish" && " A publicação pelo gestor ainda precisa ser confirmada."}
                    {r.review_note && ` ${r.review_note}`}</p>
                </div>)}</div>}
            {(revisoes.data?.length ?? 0) === 20 && <p className="form-warning">Mostrando as 20 peças mais recentes.</p>}
            <p className="foot-line">Esses avisos aparecem no app ao abrir a página; não confirmam entrega por e-mail ou WhatsApp.</p>
          </section>}

          <section className="avisos-secao">
            <div className="section-title">
              <h2>Só pra você saber</h2>
              <span className="st-note">Registros que não pedem ação sua.</span>
            </div>

            {erroRegistradas ? (
              <div className="card">
                <p className="form-error">Não conseguimos carregar o histórico agora. Tente novamente em instantes.</p>
              </div>
            ) : temRegistro ? (
              <div className="avisos-registros">
                {registradas!.map((d) => (
                  <div className="log-row" key={d.id}>
                    <time dateTime={d.created_at}>{formatarData(d.created_at)}</time>
                    <p>{resumoDaDecisao(d.payload)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <p className="hint" style={{ marginBottom: 0 }}>
                  {temCampanha
                    ? "Ainda não há decisões registradas para este negócio. Quando houver, você poderá consultá-las aqui."
                    : "Ainda não há decisões registradas para este negócio. A primeira campanha será preparada e publicada pelo gestor após a reunião e as conferências necessárias."}
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="dash-aside avisos-atendimento">
          <section>
            <h2 className="pc-title">
              Atendimento pelo WhatsApp
            </h2>
            <p className="hint">
              Se precisar tratar de uma pendência com a equipe, use o canal de atendimento abaixo.
            </p>
            <p className="foot-line">
              O envio automático de avisos pelo WhatsApp ainda não está disponível.
            </p>
          </section>

          <section className="trust support-block">
            <b className="title">Fala com gente de verdade</b>
            Dúvida de cobrança, de resultado ou de saída: é a mesma pessoa que responde.
            Você pode falar com a equipe pelo WhatsApp.
            <a className="wa" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
              Chamar no WhatsApp &rarr;
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}

const TITULOS: Record<string, string> = {
  classification: "Revisão do negócio",
  diagnosis: "Diagnóstico do negócio",
};

function tituloDaDecisao(kind: string): string {
  return TITULOS[kind] ?? "Pendência para revisar";
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
