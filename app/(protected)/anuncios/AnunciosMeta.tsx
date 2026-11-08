import { Pill } from "@/components/ui/Pill";
import { rotuloDoIntervalo } from "@/lib/inicio/periodo";
import { entradaDaLeitura } from "@/lib/anuncios/retorno-login";
import { rotuloStatusMeta, type ContextoMeta, type LeituraMeta, type ObjetoMeta, type ResultadoAnunciosMeta, type ResultadoInventarioMeta, type PeriodoMeta } from "@/lib/anuncios/contrato-meta";
import styles from "./anuncios-meta.module.css";

export function AnunciosMeta({ resultado }: { resultado: ResultadoAnunciosMeta }) {
  if (!resultado.ok) return <section className="form-warning" role="status">
    <h2>Não foi possível consultar os anúncios</h2><p>{resultado.mensagem}</p>
    <p>Nenhum número foi preenchido ou substituído por zero.</p>
  </section>;
  const leitura = resultado.dados;
  return <section className={styles.painel} aria-label="Campanha da conta vinculada">
    <div className="section-title"><h2>Campanha consultada na Meta</h2></div>
    <FonteDaConsulta leitura={leitura} />
    <CampanhaDaConsulta leitura={leitura} />
  </section>;
}

export function InventarioDeAnunciosMeta({ resultado, periodo, negocioDoGestor, contaSolicitada }: {
  resultado: ResultadoInventarioMeta; periodo: PeriodoMeta; negocioDoGestor?: string; contaSolicitada?: string;
}) {
  const retorno = new URLSearchParams({ desde: periodo.desde, ate: periodo.ate });
  const conta = contaSolicitada ?? resultado.contaSelecionada;
  if (conta) retorno.set("conta", conta);
  if (negocioDoGestor) retorno.set("metricas", negocioDoGestor);
  return <section className={styles.painel} aria-label="Anúncios da conta vinculada">
    <h2>Anúncios da conta vinculada</h2>
    {(resultado.contas.length > 1 || (!resultado.ok && resultado.motivo === "escopo" && resultado.contas.length > 0)) &&
      <form data-consulta-anuncios className={styles.escolha} action={negocioDoGestor ? "/supergestor" : "/anuncios"} method="get">
      {negocioDoGestor && <input type="hidden" name="metricas" value={negocioDoGestor} />}
      <input type="hidden" name="desde" value={periodo.desde} /><input type="hidden" name="ate" value={periodo.ate} />
      <label htmlFor="meta-conta">Conta de anúncios</label>
      <select id="meta-conta" name="conta" required defaultValue={resultado.contaSelecionada ?? ""}>
        <option value="" disabled>Selecione uma conta</option>
        {resultado.contas.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
      </select>
      <button className="cta" type="submit">Consultar conta</button>
    </form>}
    {!resultado.ok ? <div className="form-warning" role="status">
      <p>{resultado.mensagem}</p>
      {resultado.motivo === "acesso" ? <a href={entradaDaLeitura(negocioDoGestor ? "/supergestor" : "/anuncios", retorno)}>Entrar novamente</a> : null}
    </div> : <>
      <FonteDaConsulta leitura={resultado.dados} />
      {resultado.dados.campanhas.length === 0 ? <p className={styles.ausente} role="status">
        A consulta não retornou campanhas nesta conta. Isso não é uma medição de gasto zero.
      </p> : resultado.dados.campanhas.map(campanha => <CampanhaDaConsulta key={campanha.id}
        leitura={{ ...resultado.dados, campanha }} />)}
    </>}
  </section>;
}

function FonteDaConsulta({ leitura }: { leitura: ContextoMeta }) {
  return <><p className={styles.fonte}>Conta {leitura.contaId} · {rotuloDoIntervalo(leitura.periodo)}
      <br />Consulta em {new Date(leitura.coletadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (horário de Brasília).
      {leitura.fuso ? <> Fuso da conta: {leitura.fuso}.</> : <> Fuso da conta não informado.</>}</p>
    <p className={styles.fonte}>Fonte: Meta Marketing API · Moeda da conta: {leitura.moeda ?? "Não informada"}.</p>
    <p className={styles.fonte}>O status mostra a configuração observada na Meta. Estar ativado não comprova entrega agora.
      Os números de cada nível são os medidos naquele nível; não somamos campanha, conjuntos e anúncios.</p>
  </>;
}

function CampanhaDaConsulta({ leitura }: { leitura: LeituraMeta }) {
  return <article className={styles.objeto}>
      <Cabecalho objeto={leitura.campanha} nivel="Campanha" />
      <Numeros objeto={leitura.campanha} leitura={leitura} />
      {leitura.campanha.conjuntos.length === 0 ? <p className={styles.ausente}>Nenhum conjunto retornou nesta consulta.</p> : null}
      {leitura.campanha.conjuntos.map(conjunto => <details key={conjunto.id} className={styles.conjunto} open>
        <summary><span>Conjunto: {conjunto.nome || "Nome não informado"}</span>
          <Pill tone="off">{rotuloStatusMeta(conjunto.statusEfetivo)}</Pill></summary>
        <p className={styles.identidade}>ID {conjunto.id} · Campanha {conjunto.campanhaId}</p>
        <Numeros objeto={conjunto} leitura={leitura} />
        {conjunto.anuncios.length === 0 ? <p className={styles.ausente}>Nenhum anúncio retornou para este conjunto.</p> : null}
        {conjunto.anuncios.map(anuncio => <article key={anuncio.id} className={styles.anuncio}>
          <Cabecalho objeto={anuncio} nivel="Anúncio" />
          <p className={styles.identidade}>Conjunto {anuncio.conjuntoId}</p>
          <Numeros objeto={anuncio} leitura={leitura} />
        </article>)}
      </details>)}
    </article>;
}

function Cabecalho({ objeto, nivel }: { objeto: ObjetoMeta; nivel: "Campanha" | "Anúncio" }) {
  return <header className={styles.cabecalho}>
    <div>{nivel === "Campanha" ? <h3>{objeto.nome || "Campanha sem nome informado"}</h3>
      : <h4>{objeto.nome || "Anúncio sem nome informado"}</h4>}
      <p className={styles.identidade}>{nivel} · ID {objeto.id}</p></div>
    <div><Pill tone="off">{rotuloStatusMeta(objeto.statusEfetivo)}</Pill>
      <p className={styles.identidade}>Configurado: {rotuloStatusMeta(objeto.statusConfigurado)}</p></div>
  </header>;
}

function Numeros({ objeto, leitura }: { objeto: ObjetoMeta; leitura: LeituraMeta }) {
  const m = objeto.metricas;
  const numero = (n: number | null) => n === null ? "Não medido" : n.toLocaleString("pt-BR");
  const gasto = m.gasto === null || !leitura.moeda ? "Não medido" : new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: leitura.moeda,
  }).format(m.gasto / 100);
  const estados = { sem_dados: "Sem medições neste período", zero_medido: "Zero medido neste período",
    parcial: "Medições parciais", observado: "Com medições" };
  const conversas = m.conversas === null ? "Não medido" : m.conversas.replace(".", ",");
  return <div>
    <p className={styles.estado}>{estados[m.estado]}</p>
    <dl className={styles.numeros}>{[["Investido", gasto], ["Impressões", numero(m.impressoes)],
      ["Cliques", numero(m.cliques)], ["Conversas no WhatsApp", conversas]].map(([rotulo, valor]) =>
      <div key={rotulo}><dt>{rotulo}</dt><dd className={valor === "Não medido" ? styles.ausente : undefined}>{valor}</dd></div>)}</dl>
    {m.estado === "parcial" ? <p className={styles.fonte}>Confira a cobertura, o período, a moeda e o fuso antes de comparar esta medição parcial.</p> : null}
    {m.conversas === null ? <p className={styles.fonte}>Conversas do WhatsApp ainda não foram confirmadas por esta leitura.</p> : null}
  </div>;
}
