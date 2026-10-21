import type { ResultadoDaLeituraDaCarteira } from "@/lib/backend/metricas-da-carteira";
import type { LeituraDaCampanha } from "@/lib/gestor/contrato-metricas";
import styles from "./LeituraDaConta.module.css";

const dia = (data: string) => data.split("-").reverse().join("/");
function decimal(valor: string) {
  const [inteiro, fracao] = valor.split(".");
  return `${inteiro!.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${fracao ? `,${fracao}` : ""}`;
}
function dinheiro(valor: number, moeda: string | null) {
  if (moeda && /^[A-Z]{3}$/.test(moeda)) {
    try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda }).format(valor / 100); } catch { /* sem moeda presumida */ }
  }
  return `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor / 100)} · moeda não informada`;
}
function carimbo(valor: string | null) {
  return valor ? `${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(new Date(valor))} UTC` : "Coleta não registrada";
}
function situacao(c: LeituraDaCampanha) {
  if (c.completude === "inconsistente") return { nome: "Dados inconsistentes", tom: "inconsistente" };
  if (c.completude === "sem_dados") return { nome: "Sem dados no período", tom: "ausente" };
  if (c.parcial || c.carimboAnteriorAoFim === true) return { nome: "Leitura parcial ou desatualizada", tom: "parcial" };
  if (c.zeroObservado === true) return { nome: "Zero observado na coleta", tom: "zero" };
  return { nome: "Dados observados · completude desconhecida", tom: "observado" };
}

function Campanha({ campanha: c }: { campanha: LeituraDaCampanha }) {
  const estado = situacao(c);
  // Motivos livres do backend permanecem no DTO técnico, nunca viram texto da tela.
  const avisos = [
    ...(c.completude === "desconhecida" ? ["Completude da coleta desconhecida."] : []),
    ...(c.parcial ? ["Há dias do período sem observação."] : []),
    ...(c.carimboAnteriorAoFim === true ? ["A coleta antecede o último dia solicitado; a causa não foi determinada."] : []),
    ...(!c.identidade.completa ? ["Identidade da campanha incompleta."] : []),
    ...(c.completude === "inconsistente" ? ["A origem ou os valores não formam uma leitura consistente."] : []),
  ];
  const atribuicoes: Record<string, string> = { "7d_click_1d_view": "7 dias após clique e 1 dia após visualização", "7d_click": "7 dias após clique", "1d_click": "1 dia após clique", "1d_view": "1 dia após visualização" };
  const linhas: Array<{ campo: keyof LeituraDaCampanha["metricas"]; nome: string; valor: string | null; nota?: string }> = [
    { campo: "investimentoCentavos", nome: "Gasto observado",
      valor: c.metricas.investimentoCentavos.valor === null ? null : dinheiro(c.metricas.investimentoCentavos.valor, c.moeda) },
    { campo: "impressoes", nome: "Impressões",
      valor: c.metricas.impressoes.valor === null ? null : c.metricas.impressoes.valor.toLocaleString("pt-BR") },
    { campo: "cliquesTotais", nome: "Cliques totais",
      valor: c.metricas.cliquesTotais.valor === null ? null : c.metricas.cliquesTotais.valor.toLocaleString("pt-BR"), nota: "Não são apenas cliques no link." },
    { campo: "cliquesNoLink", nome: "Cliques no link",
      valor: c.metricas.cliquesNoLink.valor === null ? null : c.metricas.cliquesNoLink.valor.toLocaleString("pt-BR") },
    { campo: "resultadosAtribuidos", nome: "Resultados atribuídos",
      valor: c.metricas.resultadosAtribuidos.valor === null ? null : decimal(c.metricas.resultadosAtribuidos.valor), nota: "Não confirma conversas nem vendas." },
    { campo: "conversas", nome: "Conversas",
      valor: c.metricas.conversas.valor === null ? null : decimal(c.metricas.conversas.valor) },
  ];
  return <article className={styles.campanha} data-situacao={estado.tom}>
    <header className={styles.cabecalho}>
      <div><h3>Campanha {c.identidade.campanhaId ?? "não identificada"}</h3>
        <p>Conta {c.identidade.contaId ?? "não identificada"}</p></div>
      <span className={styles.estado} data-tom={estado.tom}>{estado.nome}</span>
    </header>
    <dl className={styles.contexto}>
      <div><dt>Período solicitado</dt><dd>{dia(c.periodo.desde)} – {dia(c.periodo.ate)}</dd></div>
      <div><dt>Fonte</dt><dd>{c.origemHeterogenea ? "Múltiplas origens — conferir" : c.fonte === "meta_marketing_api" ? "Meta Marketing API" : c.fonte === "google_ads_api" ? "Google Ads API" : "Não informada"}</dd></div>
      <div><dt>Última coleta</dt><dd>{carimbo(c.coletadoEm)}</dd></div>
      <div><dt>Dias com observação</dt><dd>{c.diasComDados}</dd></div>
    </dl>
    {c.completude === "sem_dados" && <p className={styles.aviso}>Nenhuma observação foi recebida neste período. Ausência de dado não significa resultado zero.</p>}
    {c.completude === "inconsistente" && <p className={styles.aviso} data-tom="inconsistente">Os números foram retirados desta leitura. Confira a origem antes de tomar uma decisão.</p>}
    {c.zeroObservado === true && <p className={styles.nota}>Há uma observação com valores zerados. Campos não fornecidos continuam sem valor.</p>}
    <table className={styles.tabela}>
      <caption className={styles.srOnly}>Medições da campanha {c.identidade.campanhaId ?? c.execucaoId}</caption>
      <thead><tr><th scope="col">Medição</th><th scope="col">Valor</th><th scope="col">O que sabemos</th></tr></thead>
      <tbody>{linhas.map((l) => <tr key={l.campo} data-campo={l.campo}>
        <th scope="row">{l.nome}</th><td className={styles.valor} data-valor={l.valor === null ? "ausente" : "observado"}>{l.valor ?? "Não informado"}</td>
        <td>{[c.completude === "inconsistente" ? "Valor retirado por inconsistência."
          : c.completude === "sem_dados" ? "Sem observações no período."
          : l.valor === null ? "Informação não fornecida nesta leitura." : "Valor observado no recorte solicitado.", l.nota].filter(Boolean).join(" ")}</td>
      </tr>)}</tbody>
    </table>
    <details className={styles.detalhes}><summary>Limites e identificação desta leitura</summary>
      {avisos.length > 0 && <ul>{avisos.map((a) => <li key={a}>{a}</li>)}</ul>}
      <dl><div><dt>Execução</dt><dd>{c.execucaoId}</dd></div>
        <div><dt>Moeda</dt><dd>{c.moeda ?? "Não informada"}</dd></div>
        <div><dt>Fuso da conta</dt><dd>{c.fuso ?? "Não registrado"}</dd></div>
        <div><dt>Janela de atribuição</dt><dd>{c.atribuicao ? atribuicoes[c.atribuicao] ?? "Modelo não reconhecido nesta tela" : "Não registrada"}</dd></div>
        <div><dt>Origem do vínculo</dt><dd>{c.identidade.origemVinculo === "manual" ? "Associação manual registrada" : "Origem não reconhecida nesta tela"}</dd></div></dl>
      <p>Horários de coleta são apresentados em UTC; isso não informa o fuso da conta nem comprova coleta completa.</p>
    </details>
  </article>;
}

/** Apresentação do DTO validado. Não consulta rede e não inventa dados de apoio. */
export function DadosDaConta({ resultado, nome }: { resultado: ResultadoDaLeituraDaCarteira; nome: string }) {
  return <section className={styles.leitura} id="leitura-da-carteira" aria-labelledby="titulo-leitura-carteira">
    <div className={styles.titulo}><h2 id="titulo-leitura-carteira">Números de {nome}</h2>
      <p>Leitura da conta, com origem e limites explícitos. Sem ações automáticas.</p></div>
    {!resultado.ok ? <div className={styles.aviso} data-estado="indisponivel" role="status">
      <h3>{resultado.motivo === "acesso_negado" ? "Leitura não autorizada" : "Leitura indisponível"}</h3>
      <p>{resultado.motivo === "resposta_invalida" ? "Contrato de leitura ausente ou incompatível. Integração pendente; nenhum número foi preenchido." : resultado.mensagem}</p>
    </div> : resultado.campanhas.length === 0
      ? <p className={styles.aviso}>Nenhuma execução retornada para este negócio e período. Isso não equivale a zero observado.</p>
      : resultado.campanhas.map((c) => <Campanha key={c.execucaoId} campanha={c} />)}
  </section>;
}
