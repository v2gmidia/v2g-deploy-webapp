import { createClient } from "@/lib/supabase/server";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { esteveNoAr, estaNoArAgora, fraseDeVeiculacao } from "@/lib/veiculacao/estado";
import { tituloDaAba } from "@/lib/titulos";
import { rotuloDaRevisao, type StatusRevisao } from "@/lib/criativos/revisao";
import { TIPOS_VISIVEIS_AO_CLIENTE } from "@/lib/decisoes/visibilidade";
import { resumirPendencias } from "@/lib/alertas/pendencias";
import { AbasDeAvisos } from "./AbasDeAvisos";

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
  if (!estado.negocioId) return <div className="avisos-editorial">
    <div className="page-head"><h1>Avisos</h1><p>Os avisos são separados por negócio.</p></div>
    <div className="card"><p>Não conseguimos identificar um negócio nesta consulta. Se acabou de entrar, escolha ou cadastre seu negócio; se já tinha um selecionado, tente novamente.</p>
      <a href="/escolher-negocio">Conferir meus negócios</a></div>
  </div>;

  // A RLS limita aos negócios do perfil, mas um perfil pode ter mais de
  // um. A tela precisa acompanhar o mesmo negócio do restante do app.
  const { data: pendentes, error: erroPendentes, count: totalDecisoes } = estado.negocioId
    ? await supabase
        .from("decisions")
        .select("id, kind, payload, created_at", { count: "exact" })
        .eq("business_id", estado.negocioId)
        .in("kind", [...TIPOS_VISIVEIS_AO_CLIENTE])
        .eq("needs_review", true)
        .order("created_at", { ascending: false })
    : { data: [], error: null, count: 0 };

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

  const ajustes = process.env.V2G_CREATIVE_REVIEW_ENABLED === "true" && estado.negocioId
    ? await supabase.from("creative_review_requests")
        .select("id", { count: "exact", head: true })
        .eq("business_id", estado.negocioId).eq("status", "changes_requested")
    : { count: 0, error: null };

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
  const ajustesDeCriativo = (revisoes.data ?? []).filter((r) => r.status === "changes_requested");
  const resumoPendencias = resumirPendencias({
    decisoesExibidas: pendentes?.length ?? 0,
    decisoesTotal: erroPendentes ? null : totalDecisoes,
    ajustesExibidos: ajustesDeCriativo.length,
    ajustesTotal: ajustes.error ? null : ajustes.count,
  });

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
  const quantasPendentes = resumoPendencias.total;
  const revisoesInformativas = (revisoes.data ?? []).filter((r) => r.status !== "changes_requested");
  const quantasAtualizacoes = revisoesInformativas.length + (registradas?.length ?? 0);

  const blocoDePendencias = <section className="avisos-secao" aria-labelledby="titulo-pendencias">
    <div className="section-title">
      <div><span className="avisos-kicker">Prioridade</span><h2 id="titulo-pendencias">Precisa de você</h2></div>
      {quantasPendentes !== null && quantasPendentes > 0 && <span className="grp-count">
        {quantasPendentes} {quantasPendentes === 1 ? "item" : "itens"}
      </span>}
    </div>

    {!resumoPendencias.leituraCompleta && <p className="form-warning">
      Não conseguimos conferir todas as pendências agora. A lista pode estar incompleta.
    </p>}

    {temPendencia || ajustesDeCriativo.length > 0 || (ajustes.count ?? 0) > 0 ? <div className="avisos-pendencias">
      {ajustesDeCriativo.map((r) => <article className="aviso-linha atencao" key={r.id}>
        <span className="aviso-sinal" aria-hidden="true" />
        <div className="aviso-corpo">
          <div className="aviso-meta"><span>Criativos</span><time dateTime={r.created_at}>{formatarData(r.created_at)}</time></div>
          <h3>Ajuste pedido no criativo {r.original_name}</h3>
          <p>{r.review_note || "O gestor pediu uma alteração antes da publicação."}</p>
        </div>
        <a className="aviso-acao" href="/criativos">Ver criativo <span aria-hidden="true">→</span></a>
      </article>)}
      {resumoPendencias.ajustesNaoExibidos > 0 && <article className="aviso-linha atencao">
        <span className="aviso-sinal" aria-hidden="true" />
        <div className="aviso-corpo"><div className="aviso-meta"><span>Criativos</span></div>
          <h3>Há mais {resumoPendencias.ajustesNaoExibidos} peça(s) com ajustes pedidos</h3>
          <p>Abra sua biblioteca para conferir todas as pendências recentes.</p>
        </div>
        <a className="aviso-acao" href="/criativos">Ver criativos <span aria-hidden="true">→</span></a>
      </article>}
      {(pendentes ?? []).map((d) => <article className="aviso-linha atencao" key={d.id}>
        <span className="aviso-sinal" aria-hidden="true" />
        <div className="aviso-corpo">
          <div className="aviso-meta"><span>Negócio</span><time dateTime={d.created_at}>{formatarData(d.created_at)}</time></div>
          <h3>{tituloDaDecisao(d.kind)}</h3><p>{resumoDaDecisao(d.payload)}</p>
        </div>
      </article>)}
    </div> : resumoPendencias.leituraCompleta ? <div className="empty-hero">
      <div className="avisos-vazio-titulo"><h3>Tudo em dia por aqui.</h3><span className="badge">Nada pendente</span></div>
      <p>Quando algo precisar da sua decisão, vai aparecer aqui primeiro.</p>
      <p className="eh-note">{fraseDeVeiculacao(veiculacao, "manchete")} {estaNoArAgora(veiculacao)
        ? "Nada travou." : temCampanha ? "Não há nenhuma ação esperando por você." : "Ainda não há campanha em circulação."}</p>
    </div> : null}
  </section>;

  const blocoDeAtualizacoes = <section className="avisos-secao" aria-labelledby="titulo-atualizacoes">
    <div className="section-title"><div><span className="avisos-kicker">Histórico recente</span>
      <h2 id="titulo-atualizacoes">Atualizações</h2></div></div>
    {revisoes.error || erroRegistradas ? <p className="form-warning">Não conseguimos carregar todo o histórico agora.</p> : null}
    {quantasAtualizacoes > 0 ? <div className="avisos-registros">
      {revisoesInformativas.map((r) => <article className="atualizacao-linha" key={r.id}>
        <time dateTime={r.reviewed_at || r.created_at}>{formatarData(r.reviewed_at || r.created_at)}</time>
        <div><span className="avisos-origem">Retorno dos criativos</span><h3>{r.original_name}</h3>
          <p>{rotuloDaRevisao(r.status as StatusRevisao)}.
            {r.status === "approved_for_manual_publish" && " A publicação pelo gestor ainda precisa ser confirmada."}
            {r.review_note && ` ${r.review_note}`}</p></div>
      </article>)}
      {(registradas ?? []).map((d) => <article className="atualizacao-linha" key={d.id}>
        <time dateTime={d.created_at}>{formatarData(d.created_at)}</time>
        <div><span className="avisos-origem">Negócio</span><h3>{tituloDaDecisao(d.kind)}</h3><p>{resumoDaDecisao(d.payload)}</p></div>
      </article>)}
    </div> : <div className="card"><p className="hint" style={{ marginBottom: 0 }}>Ainda não há atualizações registradas para este negócio.</p></div>}
    {(revisoes.data?.length ?? 0) === 20 && <p className="form-warning">Mostrando as 20 peças mais recentes.</p>}
  </section>;

  return (
    <div className="avisos-editorial">
      <div className="page-head avisos-cabecalho">
        <h1>Avisos</h1>
        <p>O que precisa de você aparece primeiro.</p>
      </div>
      <AbasDeAvisos pendencias={blocoDePendencias} atualizacoes={blocoDeAtualizacoes}
        quantasPendencias={quantasPendentes} quantasAtualizacoes={quantasAtualizacoes} />
      <footer className="avisos-suporte"><span>Precisa de ajuda com algum aviso?</span>
        <a href="https://wa.me/5521936182176" target="_blank" rel="noopener">Falar com uma pessoa →</a>
        <small>Os avisos aparecem no app. O envio automático pelo WhatsApp ainda não está disponível.</small>
      </footer>
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
