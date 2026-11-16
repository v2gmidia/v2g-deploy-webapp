import { entradaDaLeitura } from "@/lib/anuncios/retorno-login";
import type { PeriodoMeta, ResultadoInventarioMeta } from "@/lib/anuncios/contrato-meta";
import { anunciosParaCliente, metricasDoCliente, type VinculoCriativo } from "@/lib/anuncios/lista-cliente";
import { ListaDeAnuncios } from "./ListaDeAnuncios";
import styles from "./lista-cliente.module.css";

/** Visão do cliente. O inventário hierárquico do gestor permanece separado. */
export function InventarioCliente({ resultado, periodo, contaSolicitada, vinculos = [], selecionado, vinculosFalharam }: {
  resultado: ResultadoInventarioMeta; periodo: PeriodoMeta; contaSolicitada?: string;
  vinculos?: VinculoCriativo[]; selecionado?: string; vinculosFalharam?: boolean;
}) {
  const retorno = new URLSearchParams({ desde: periodo.desde, ate: periodo.ate });
  const conta = contaSolicitada ?? resultado.contaSelecionada;
  if (conta) retorno.set("conta", conta);
  if (selecionado) retorno.set("anuncio", selecionado);
  return <section aria-label="Anúncios da conta vinculada" className={styles.pagina}>
    {(resultado.contas.length > 1 || (!resultado.ok && resultado.contas.length > 0)) && <form data-consulta-anuncios className={styles.contas} action="/anuncios" method="get">
      <input type="hidden" name="desde" value={periodo.desde} /><input type="hidden" name="ate" value={periodo.ate} />
      {selecionado && <input type="hidden" name="anuncio" value={selecionado} />}
      <label htmlFor="meta-conta">Conta de anúncios</label><select id="meta-conta" name="conta" required defaultValue={resultado.contaSelecionada ?? ""}>
        <option value="" disabled>Selecione uma conta</option>{resultado.contas.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
      </select><button className="cta ghost" type="submit">Consultar conta</button>
    </form>}
    {!resultado.ok ? <div className="form-warning" role="status"><p>{resultado.mensagem}</p>
      {resultado.motivo === "acesso" && <a href={entradaDaLeitura("/anuncios", retorno)}>Entrar novamente</a>}
      {resultado.motivo === "sem_conta" && <a href="/conta#conexoes">Conferir conexões</a>}
    </div> : <>
      {vinculosFalharam && <p className="form-warning">Não conseguimos conferir os criativos associados. Os resultados dos anúncios continuam abaixo.</p>}
      <ListaDeAnuncios anuncios={anunciosParaCliente(resultado.dados, vinculos)} selecionado={selecionado} />
      {resultado.dados.campanhas.length > 0 && <details className={styles.fonte}><summary>Resultados por campanha</summary>
        <p>Totais por campanha. Não some estes valores aos anúncios.</p>
        {resultado.dados.campanhas.map(c => <div key={c.id}><h3>{c.nome || "Campanha sem nome informado"}</h3>
          <dl className={styles.metricas}>{metricasDoCliente(c.metricas, resultado.dados.moeda).map(m => <div key={m.rotulo}><dt>{m.rotulo}</dt><dd>{m.valor ?? "—"}</dd></div>)}</dl>
        </div>)}
      </details>}
      <details className={styles.fonte}><summary>Sobre esta consulta</summary>
        <p>Meta · Conta {resultado.dados.contaId} · Moeda: {resultado.dados.moeda ?? "Não informada"}</p>
        <p>Consultado em {new Date(resultado.dados.coletadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília). Fuso da conta: {resultado.dados.fuso ?? "Não informado"}.</p>
        <p>Os números correspondem ao período selecionado. Ausência de medição não significa zero.</p>
        <p>Conversas iniciadas atribuídas pela Meta. Podem incluir mais de um canal; não são pessoas únicas nem vendas.</p>
      </details>
    </>}
  </section>;
}
