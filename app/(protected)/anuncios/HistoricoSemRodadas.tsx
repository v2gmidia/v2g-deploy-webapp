/** So aparece depois de o backend comprovar titular e ausencia de rodadas. */
export function HistoricoSemRodadas() {
  return <section aria-labelledby="historico-sem-rodadas-titulo">
    <div className="section-title"><h2 id="historico-sem-rodadas-titulo">Histórico por rodada da V2G</h2></div>
    <p>Ainda não há rodadas da V2G para este negócio.</p>
    <p className="hint">As campanhas e os resultados da Meta são acompanhados na consulta acima.</p>
  </section>;
}
