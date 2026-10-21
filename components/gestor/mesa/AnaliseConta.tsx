"use client";

import { useState } from "react";
import { diasDoPeriodo, estadoDoCustoMesa, estadoDoRitmoMesa, intervaloMesa, leituraCompletaMesa, metricasMesa, sinaisDaConta, sinalPrincipalMesa, variacaoMesa, verbaMesa, type ContaMesa, type PeriodoMesa } from "@/lib/gestor/painel";
import { dataMesa, GraficoMesa, IconeMesa, MiniaturaCriativo, moedaMesa, numeroMesa, percentualMesa, SeloMesa, VariacaoMesa } from "./elementos";
import styles from "./MesaDoGestor.module.css";

const abas = ["Visão geral", "Criativos", "Dia da semana", "Comparativo", "Diagnóstico"] as const;

export function AnaliseConta({ conta, referencia, periodo, voltar }: {
  conta: ContaMesa; referencia: string; periodo: PeriodoMesa; voltar: () => void;
}) {
  const [aba, setAba] = useState<(typeof abas)[number]>("Visão geral");
  const dias = diasDoPeriodo(conta.dias, referencia, periodo);
  const anterior = metricasMesa(diasDoPeriodo(conta.dias, referencia, periodo, true));
  const atual = metricasMesa(dias);
  const disponivel = leituraCompletaMesa(conta, referencia, periodo);
  const sinais = sinaisDaConta(conta, referencia, periodo);
  const principal = sinalPrincipalMesa(sinais);
  const verba = verbaMesa(conta, referencia);
  const estadoRitmo = disponivel ? estadoDoRitmoMesa(verba) : "sem_dados";
  const janela = intervaloMesa(referencia, periodo);
  const janelaAnterior = intervaloMesa(referencia, periodo, true);
  const frequencia = conta.frequenciaPorPeriodo[periodo];
  const metricas = [
    { nome: "Investimento", valor: moedaMesa(disponivel ? atual.gastoCentavos : null), mudanca: variacaoMesa(atual.gastoCentavos, anterior.gastoCentavos), custo: false },
    { nome: conta.tipoResultado === "conversas" ? "Conversas iniciadas" : conta.tipoResultado === "leads" ? "Leads registrados" : "Compras registradas", valor: numeroMesa(disponivel ? atual.resultados : null), mudanca: variacaoMesa(atual.resultados, anterior.resultados), custo: false },
    { nome: `Custo por ${conta.tipoResultado === "conversas" ? "conversa" : conta.tipoResultado === "leads" ? "lead" : "compra"}`, valor: moedaMesa(disponivel ? atual.cprCentavos : null), mudanca: variacaoMesa(atual.cprCentavos, anterior.cprCentavos), custo: true },
    { nome: "Impressões", valor: numeroMesa(disponivel ? atual.impressoes : null), mudanca: variacaoMesa(atual.impressoes, anterior.impressoes), custo: false },
    { nome: "CTR de link", valor: percentualMesa(disponivel ? atual.ctr : null), mudanca: variacaoMesa(atual.ctr, anterior.ctr), custo: false },
    { nome: "CPC de link", valor: moedaMesa(disponivel ? atual.cpcCentavos : null), mudanca: variacaoMesa(atual.cpcCentavos, anterior.cpcCentavos), custo: true },
  ];
  const comparativo = [
    ["Investimento", atual.gastoCentavos, anterior.gastoCentavos, "moeda"],
    ["Conversas iniciadas", atual.resultados, anterior.resultados, "numero"],
    ["Custo por conversa", atual.cprCentavos, anterior.cprCentavos, "moeda"],
    ["Impressões", atual.impressoes, anterior.impressoes, "numero"],
    ["Cliques no link", atual.cliquesLink, anterior.cliquesLink, "numero"],
    ["CTR de link", atual.ctr, anterior.ctr, "percentual"],
    ["CPC de link", atual.cpcCentavos, anterior.cpcCentavos, "moeda"],
    ["CPM", atual.cpmCentavos, anterior.cpmCentavos, "moeda"],
  ] as const;
  const semana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((nome, i) => {
    const pontos = dias.filter((d) => new Date(`${d.data}T12:00:00Z`).getUTCDay() === i);
    return { nome, ocorrencias: pontos.length, ...metricasMesa(pontos) };
  });

  const diagnostico = [
    { nome: "CTR de link", grupo: "Aquisição", valor: percentualMesa(atual.ctr), criterio: `Mínimo configurado: ${percentualMesa(conta.metas.ctrMin)}`, medido: disponivel },
    { nome: "CPC de link", grupo: "Aquisição", valor: moedaMesa(atual.cpcCentavos), criterio: "Comparar com a evolução da própria conta", medido: disponivel },
    { nome: "CPM", grupo: "Aquisição", valor: moedaMesa(atual.cpmCentavos), criterio: "Comparar mercado, período e estratégia", medido: disponivel },
    { nome: "Frequência do público frio", grupo: "Aquisição", valor: frequencia?.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) ?? "—", criterio: `Máximo configurado: ${conta.metas.frequenciaMax ?? "—"}`, medido: disponivel && frequencia !== null },
    { nome: "Frequência de remarketing", grupo: "Aquisição", valor: "Não aplicável", criterio: "Nenhuma campanha de remarketing separada neste exemplo", medido: false },
    { nome: "Conversão da landing page", grupo: "Conversão", valor: "Não aplicável", criterio: "O destino desta conta é o WhatsApp", medido: false },
    { nome: "Custo por resultado", grupo: "Conversão", valor: moedaMesa(atual.cprCentavos), criterio: `Limite configurado: ${moedaMesa(conta.metas.custoResultadoMaxCentavos)}`, medido: disponivel },
    { nome: "Custo por compra · CPA", grupo: "Conversão", valor: "Não medido", criterio: "Depende de compras vinculadas e verificadas", medido: false },
    { nome: "ROAS", grupo: "Conversão", valor: "Não medido", criterio: "Depende de receita atribuída, moeda e janela", medido: false },
    { nome: "Adicionar ao carrinho", grupo: "Conversão", valor: "Não aplicável", criterio: "A conta não usa jornada de e-commerce", medido: false },
    { nome: "Hook de vídeo · 3 segundos", grupo: "Criativos", valor: "Não aplicável", criterio: "Este recorte contém somente imagens", medido: false },
    { nome: "Retenção · ThruPlay", grupo: "Criativos", valor: "Não aplicável", criterio: "Métrica específica de vídeo", medido: false },
    { nome: "Thumb stop ratio", grupo: "Criativos", valor: "Não aplicável", criterio: "Métrica específica de vídeo", medido: false },
    { nome: "Taxa de engajamento", grupo: "Criativos", valor: "Não medido", criterio: "Falta o recorte de interações e sua definição", medido: false },
    { nome: "Volume de testes criativos", grupo: "Criativos", valor: `${conta.criativos.filter((c) => c.ativo).length} imagens ativas`, criterio: "Quantidade ativa não comprova teste controlado", medido: disponivel },
    { nome: "Início de checkout", grupo: "Experiência", valor: "Não aplicável", criterio: "O destino é o WhatsApp", medido: false },
    { nome: "Conversão em compra", grupo: "Experiência", valor: "Não medido", criterio: "Depende de acompanhamento comercial", medido: false },
    { nome: "Carregamento da landing page", grupo: "Experiência", valor: "Não aplicável", criterio: "Nenhuma landing page neste fluxo", medido: false },
    { nome: "Taxa de rejeição", grupo: "Experiência", valor: "Não aplicável", criterio: "Depende de analytics de uma página", medido: false },
    { nome: "Classificação de qualidade", grupo: "Experiência", valor: "Não medido", criterio: "Depende da classificação devolvida pela plataforma", medido: false },
    { nome: "Renovação criativa", grupo: "Escala", valor: "Não medido", criterio: "Depende do histórico de entrada e saída das peças", medido: false },
    { nome: "Escala de orçamento", grupo: "Escala", valor: "Não medido", criterio: "Depende do histórico de mudanças autorizado", medido: false },
    { nome: "Fase de aprendizado", grupo: "Escala", valor: "Não medido", criterio: "Depende da leitura do estado na plataforma", medido: false },
    { nome: "Qualidade de correspondência de eventos", grupo: "Escala", valor: "Não medido", criterio: "Depende de eventos e integração próprios", medido: false },
    { nome: "Janela de remarketing", grupo: "Escala", valor: "Não aplicável", criterio: "Nenhum público de remarketing neste exemplo", medido: false },
  ];

  return <div className={styles.analise}>
    <button type="button" onClick={voltar} className={styles.voltar}><IconeMesa nome="voltar" />Voltar à carteira</button>
    <header className={styles.cabecalhoAnalise}>
      <div><h1 tabIndex={-1}>{conta.negocio}</h1><p>{conta.canal} · {conta.nomeConta} · Responsável: {conta.responsavel}</p></div>
      <SeloMesa estado={principal.estado}>{principal.titulo}</SeloMesa>
    </header>
    <div className={styles.faixaConta}>
      <div><span>Forma de pagamento</span><strong>{conta.cobranca.tipo === "pre_pago" ? "Pré-pago" : "Cartão · pós-pago"}</strong></div>
      <div><span>{conta.cobranca.tipo === "pre_pago" ? "Saldo disponível" : "Valor em aberto"}</span><strong>{moedaMesa(conta.cobranca.tipo === "pre_pago" ? conta.cobranca.saldoCentavos : conta.cobranca.emAbertoCentavos)}</strong></div>
      <div><span>Período em análise</span><strong>{dataMesa(janela.inicio)} a {dataMesa(janela.fim)}</strong></div>
      <div><span>Última leitura</span><strong>{conta.atualizadoEm ? "20/10 · 10h15" : "Indisponível"}</strong></div>
    </div>
    <div className={styles.visaoNumeros}>
      <div className={styles.gradeMetricas}>{metricas.map((m) => <div className={styles.metrica} key={m.nome}>
        <span>{m.nome}</span><strong>{m.valor}</strong>{disponivel && <VariacaoMesa valor={m.mudanca} custo={m.custo} />}
      </div>)}</div>
      <section className={styles.orcamento} aria-labelledby="orcamento-conta">
        <div className={styles.tituloSecao}><h2 id="orcamento-conta">Orçamento da conta</h2><IconeMesa nome="calendario" /></div>
        <p>Outubro de 2026 · mês completo</p>
        <strong className={styles.valorOrcamento}>{moedaMesa(disponivel ? verba.gastoCentavos : null)}</strong>
        <p>de {moedaMesa(verba.tetoCentavos)} aprovados</p>
        <div className={styles.barraVerba} role={estadoRitmo === "sem_dados" ? "img" : "meter"} aria-label={estadoRitmo === "sem_dados" ? "Verba mensal sem leitura completa" : "Verba mensal utilizada"} aria-valuemin={estadoRitmo === "sem_dados" ? undefined : 0} aria-valuemax={estadoRitmo === "sem_dados" ? undefined : 100} aria-valuenow={estadoRitmo === "sem_dados" ? undefined : Math.min(100, verba.percentual ?? 0)} aria-valuetext={estadoRitmo === "sem_dados" ? undefined : `${percentualMesa(verba.percentual)} do orçamento`} data-estado={estadoRitmo}><span style={{ width: `${estadoRitmo === "sem_dados" ? 0 : Math.min(100, verba.percentual ?? 0)}%` }} /></div>
        <div className={styles.restoVerba}><span>Restante <b>{moedaMesa(disponivel ? verba.restanteCentavos : null)}</b></span><span>Dia {verba.dia}/{verba.diasNoMes}</span></div>
        <SeloMesa estado={estadoRitmo}>{estadoRitmo === "sem_dados" ? "Ritmo não confirmado" : verba.razaoDoRitmo !== null && verba.razaoDoRitmo > 1.2 ? "Acima do ritmo linear" : verba.razaoDoRitmo !== null && verba.razaoDoRitmo < .8 ? "Abaixo do ritmo linear" : "No ritmo de referência"}</SeloMesa>
      </section>
    </div>
    <section className={styles.sinaisConta} aria-label="Pontos para decisão">
      {sinais.map((sinal) => <details key={sinal.titulo} className={styles.sinalDetalhe} data-estado={sinal.estado} open={sinal.estado === "critico" || sinal.estado === "sem_dados"}>
        <summary><SeloMesa estado={sinal.estado}>{sinal.titulo}</SeloMesa><span>Ver evidência e próximo passo</span></summary>
        <p>{sinal.motivo}</p><p><strong>Próximo passo:</strong> {sinal.proximoPasso}</p>
      </details>)}
    </section>
    <nav className={styles.abasAnalise} aria-label="Seções da análise">{abas.map((item) => <button type="button" key={item} aria-pressed={aba === item} onClick={() => setAba(item)}>{item}</button>)}</nav>
    {!disponivel ? <div className={styles.vazio}><IconeMesa nome="relogio" tamanho={28} /><h2>A leitura desta conta está indisponível</h2><p>Os números e gráficos aparecem quando houver dados completos do período. A conta continua visível na carteira para acompanhamento.</p></div> : <>
      {aba === "Visão geral" && <>
        <div className={styles.gradeGraficos}>
          <GraficoMesa titulo="Resultados por dia" dados={dias.map((d) => ({ data: d.data, valor: d.resultados }))} />
          <GraficoMesa titulo="Custo por resultado diário" monetario dados={dias.map((d) => ({ data: d.data, valor: d.resultados ? d.gastoCentavos / d.resultados : null }))} />
          <GraficoMesa titulo="Investimento diário" monetario dados={dias.map((d) => ({ data: d.data, valor: d.gastoCentavos }))} />
          <div className={styles.quadroLeitura}><h3>Leitura do período</h3><dl><div><dt>Cliques no link</dt><dd>{numeroMesa(atual.cliquesLink)}</dd></div><div><dt>CPM</dt><dd>{moedaMesa(atual.cpmCentavos)}</dd></div><div><dt>Frequência</dt><dd>{frequencia?.toLocaleString("pt-BR") ?? "Não medida"}</dd></div><div><dt>Vendas verificadas</dt><dd>Não medidas</dd></div><div><dt>ROAS</dt><dd>Não medido</dd></div></dl><p>Conversas iniciadas não equivalem a vendas. Receita e conversão comercial precisam de acompanhamento próprio.</p></div>
        </div>
        <div className={styles.quadroTabela}><div className={styles.tituloTabela}><h2>Campanha em acompanhamento</h2><span>Exemplo de estrutura</span></div><div className={styles.rolagem}><table><thead><tr><th>Campanha</th><th>Resultado</th><th>Custo / resultado</th><th>Investimento</th><th>Situação</th></tr></thead><tbody><tr><td><strong>Conversas · {conta.nicho}</strong><small>Destino: WhatsApp</small></td><td>{numeroMesa(atual.resultados)}</td><td>{moedaMesa(atual.cprCentavos)}</td><td>{moedaMesa(atual.gastoCentavos)}</td><td><SeloMesa estado={principal.estado}>{principal.titulo}</SeloMesa></td></tr></tbody></table></div></div>
      </>}
      {aba === "Criativos" && <div className={styles.quadroTabela}>
        <div className={styles.tituloTabela}><div><h2>Ranking de criativos</h2><p>Imagens ativas · {dataMesa(janela.inicio)} a {dataMesa(janela.fim)}</p></div><span>{conta.criativos.length} peças</span></div>
        <div className={styles.rolagem}><table className={styles.tabelaCriativos}>
          <thead><tr><th>Criativo</th><th>Investimento</th><th>Impressões</th><th>CTR link</th><th>Resultados</th><th>Custo / resultado</th><th>Leitura</th></tr></thead>
          <tbody>{conta.criativos.map((peca) => ({ peca, m: metricasMesa(diasDoPeriodo(peca.dias, referencia, periodo)) }))
            .sort((a, b) => (a.m.cprCentavos ?? Infinity) - (b.m.cprCentavos ?? Infinity)).map(({ peca, m }) => {
              const estado = estadoDoCustoMesa(m.cprCentavos, conta.metas.custoResultadoMaxCentavos, m.resultados, conta.metas.amostraMinimaResultados);
              const rotulo = estado === "sem_dados" ? "Sem base para avaliar" : m.resultados < conta.metas.amostraMinimaResultados ? "Amostra pequena" : estado === "saudavel" ? "Dentro da meta" : "Conferir custo";
              return <tr key={peca.id}>
                <td><div className={styles.criativoNome}><MiniaturaCriativo conceito={peca.conceito} titulo={peca.titulo} /><div><strong>{peca.nome}</strong><small>{peca.formato} · {peca.id}</small></div></div></td>
                <td>{moedaMesa(m.gastoCentavos)}</td><td>{numeroMesa(m.impressoes)}</td><td>{percentualMesa(m.ctr)}</td><td>{numeroMesa(m.resultados)}</td><td><strong>{moedaMesa(m.cprCentavos)}</strong></td>
                <td><SeloMesa estado={estado}>{rotulo}</SeloMesa></td>
              </tr>;
            })}</tbody>
        </table></div>
        <p className={styles.notaTabela}>As miniaturas são ilustrações da demonstração. A classificação exige custo, meta e amostra da peça; não pausa nem substitui criativos.</p>
      </div>}
      {aba === "Dia da semana" && <div className={styles.quadroTabela}><div className={styles.tituloTabela}><div><h2>Desempenho por dia da semana</h2><p>A média considera quantas vezes o dia aparece no período.</p></div></div><div className={styles.rolagem}><table><thead><tr><th>Dia</th><th>Resultados</th><th>Média por ocorrência</th><th>Investimento</th><th>Custo / resultado</th></tr></thead><tbody>{semana.map((d) => <tr key={d.nome}><td><strong>{d.nome}</strong><small>{d.ocorrencias} ocorrência(s)</small></td><td><div className={styles.barraSemana}><span style={{ width: `${d.resultados / Math.max(...semana.map((s) => s.resultados), 1) * 100}%` }} /></div>{numeroMesa(d.resultados)}</td><td>{d.ocorrencias ? (d.resultados / d.ocorrencias).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—"}</td><td>{moedaMesa(d.gastoCentavos)}</td><td>{moedaMesa(d.cprCentavos)}</td></tr>)}</tbody></table></div></div>}
      {aba === "Comparativo" && <div className={styles.quadroTabela}><div className={styles.tituloTabela}><div><h2>Comparação de períodos</h2><p>Janelas consecutivas com a mesma duração.</p></div></div><div className={styles.rolagem}><table><thead><tr><th>Indicador</th><th>{dataMesa(janela.inicio)} a {dataMesa(janela.fim)}</th><th>{dataMesa(janelaAnterior.inicio)} a {dataMesa(janelaAnterior.fim)}</th><th>Variação</th></tr></thead><tbody>{comparativo.map(([nome, valor, antes, formato]) => <tr key={nome}><td><strong>{nome}</strong></td><td>{formato === "moeda" ? moedaMesa(valor) : formato === "percentual" ? percentualMesa(valor) : numeroMesa(valor)}</td><td>{formato === "moeda" ? moedaMesa(antes) : formato === "percentual" ? percentualMesa(antes) : numeroMesa(antes)}</td><td><VariacaoMesa valor={variacaoMesa(valor, antes)} custo={nome.startsWith("Custo") || nome === "CPC de link" || nome === "CPM"} /></td></tr>)}</tbody></table></div></div>}
      {aba === "Diagnóstico" && <div className={styles.quadroTabela}><div className={styles.tituloTabela}><div><h2>Indicadores para diagnóstico</h2><p>25 referências organizadas por aplicação. Limites pertencem à conta; dados ausentes continuam explícitos.</p></div></div><div className={styles.rolagem}><table><thead><tr><th>Indicador</th><th>Valor no período</th><th>Critério ou dependência</th></tr></thead><tbody>{diagnostico.map((m) => <tr key={m.nome}><td><strong>{m.nome}</strong><small>{m.grupo}</small></td><td>{m.medido ? m.valor : <span className={styles.textoDiscreto}>{m.valor}</span>}</td><td className={styles.criterioTexto}>{m.criterio}</td></tr>)}</tbody></table></div></div>}
    </>}
    <p className={styles.rodapeDados}>Dados sintéticos para avaliar a navegação. Os sinais usam metas ilustrativas desta conta e não são recomendações automáticas.</p>
  </div>;
}
