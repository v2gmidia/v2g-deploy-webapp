"use client";

import { useEffect, useState, type ReactNode } from "react";
import { dinheiro, diaCurto } from "@/lib/formato";
import type { ResultadoInventarioMeta } from "@/lib/anuncios/contrato-meta";
import { chaveDoEscopo, leituraAnteriorPermitida, resumirMeta, textoCoberturaMeta, type EscopoInicioMeta, type MemoriaInicioMeta } from "@/lib/inicio/resumo-meta";
import { formatarConversas } from "@/lib/anuncios/conversas-meta";
import { GraficoDiario } from "./GraficoDiario";
import type { IntervaloDoInicio } from "@/lib/inicio/periodo";
import type { PendenciaDoOnboarding } from "@/lib/onboarding/conclusao";
import { SeletorDePeriodo } from "./SeletorDePeriodo";
import { AtualizarInicio } from "./AtualizarInicio";
import styles from "./ResumoMetaDoInicio.module.css";
import { InicioDoCliente, type DetalheAgenciaDoInicio } from "@/components/agencia/InicioDoCliente";
import { ClienteIndisponivel } from "@/components/agencia/Comuns";
export type { DetalheAgenciaDoInicio } from "@/components/agencia/InicioDoCliente";

const contar = (n: number | null) => n === null ? "Não medido" : n.toLocaleString("pt-BR");
const valor = (n: number | null, moeda: string | null) => n === null || !moeda ? "Não medido" : dinheiro(n / 100, moeda);

export function ResumoMetaDoInicio({ resultado, escopo, intervalo, pendencia, falhaPendencia, faixa, complemento, detalheAgencia, previa = false }: {
  resultado: ResultadoInventarioMeta; escopo: EscopoInicioMeta; intervalo: IntervaloDoInicio;
  pendencia: PendenciaDoOnboarding | null; falhaPendencia: boolean; faixa: ReactNode; complemento: ReactNode;
  detalheAgencia?: DetalheAgenciaDoInicio;
  previa?: boolean;
}) {
  const chave = chaveDoEscopo(escopo);
  const [memoria, guardar] = useState<MemoriaInicioMeta>(null);
  const atual = resultado.ok && resultado.dados.businessId === escopo.businessId
    && resultado.dados.periodo.desde === escopo.desde && resultado.dados.periodo.ate === escopo.ate
    && (!escopo.conta || resultado.dados.contaId === escopo.conta) ? resultado.dados : null;
  useEffect(() => {
    if (atual) guardar({ chave, dados: atual });
    else if (!leituraAnteriorPermitida(resultado, escopo, memoria)) guardar(null);
  }, [atual, chave, resultado]);
  const anterior = leituraAnteriorPermitida(resultado, escopo, memoria);
  const dados = atual ?? anterior;
  const resumo = dados ? resumirMeta(dados) : null;
  const busca = new URLSearchParams({ desde: escopo.desde, ate: escopo.ate });
  if (dados?.contaId ?? escopo.conta) busca.set("conta", dados?.contaId ?? escopo.conta!);
  const anuncios = `${previa ? "/exemplo" : ""}/anuncios?${busca}`;

  if (detalheAgencia) {
    if (detalheAgencia.contexto.businessId !== escopo.businessId) return <ClienteIndisponivel />;
    return <InicioDoCliente detalhe={detalheAgencia} dados={dados} resumo={resumo} resultado={resultado} intervalo={intervalo}
      anuncios={anuncios} anterior={Boolean(anterior)} pendencia={pendencia} falhaPendencia={falhaPendencia} faixa={faixa} complemento={complemento} />;
  }

  return <div className={`inicio-editorial ${styles.raiz}`}>
    {faixa}
    <header className={styles.cabecalho}><h1>Início</h1><SeletorDePeriodo key={`${intervalo.desde}:${intervalo.ate}`} intervalo={intervalo} /></header>
    {intervalo.erro && <p className="form-error" role="alert">{intervalo.erro}</p>}
    {!resultado.ok && <div className={resultado.motivo === "escolher_conta" ? styles.nota : "form-warning"} role="status"><p>{resultado.mensagem}</p>
      {anterior && <p>Os números abaixo são da última consulta confirmada, com sua data original. Não são uma nova medição.</p>}
      {resultado.motivo !== "escolher_conta" && <AtualizarInicio />}
    </div>}
    {resultado.ok && !atual && <p className="form-error" role="alert">Não foi possível confirmar a conta e o período desta leitura.</p>}
    {(resultado.contas.length > 1 || !resultado.ok && resultado.contas.length > 0) && <form method="get" action="/inicio" className={styles.contas}>
      <label>Conta de anúncios<select name="conta" defaultValue={escopo.conta ?? dados?.contaId ?? resultado.contaSelecionada ?? ""}><option value="" disabled>Escolha uma conta</option>
        {resultado.contas.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}</select></label>
      <input type="hidden" name="desde" value={escopo.desde} /><input type="hidden" name="ate" value={escopo.ate} /><button className="cta">Consultar conta</button>
    </form>}
    {dados && resumo && <>
      <section aria-labelledby="inicio-resumo-titulo">
        <div className={styles.cabecalho}><h2 id="inicio-resumo-titulo">Resumo do período</h2><a href={anuncios}>Ver anúncios</a></div>
        <dl className={styles.numeros}>
          <div><dt>Investido</dt><dd>{valor(resumo.gasto, dados.moeda)}</dd></div>
          <div><dt>Impressões</dt><dd>{contar(resumo.impressoes)}</dd></div>
          <div><dt>Conversas por mensagem</dt><dd>{formatarConversas(resumo.conversasMensagem)}</dd></div>
        </dl>
        {resumo.parcial && <p className={styles.nota}>Medições parciais neste período.</p>}
        {!resumo.campanhas && <p className={styles.nota}>Nenhuma campanha retornou nesta consulta.</p>}
        <details className={styles.detalhes}><summary>Sobre os resultados</summary>
          <p className={styles.nota}>{resumo.entregaHistorica ? "Houve entrega neste período." : "A consulta descreve somente a conta e o período selecionados."} A configuração das campanhas não confirma se há entrega agora.</p>
          <p className={styles.fonte}>Conta {dados.contaId} · {diaCurto(dados.periodo.desde)} a {diaCurto(dados.periodo.ate)}<br />
            Meta Marketing API · {dados.moeda ?? "Moeda não confirmada"} · Fuso: {dados.fuso ?? "Não confirmado"}<br />
            Consulta em {new Date(dados.coletadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília)</p>
          <p className={styles.nota}>{textoCoberturaMeta(resumo)} Campos desconhecidos continuam não medidos. Não somamos campanhas aos seus conjuntos ou anúncios.</p>
          <p className={styles.nota}>Conversas iniciadas atribuídas pela Meta. Podem incluir mais de um canal. Não são pessoas únicas, vendas ou mensagens conferidas na caixa de entrada.</p>
        </details>
      </section>
      <GraficoDiario key={`${chave}:${dados.contaId}`} dias={resumo.dias} moeda={dados.moeda} inconsistente={resumo.serieInconsistente} />
    </>}
    {falhaPendencia && <p className="form-warning" role="status">Não conseguimos conferir as pendências do cadastro agora.</p>}
    {pendencia && <section className={styles.pendencia} aria-label="Pendência do cadastro"><div><h2>{pendencia.titulo}</h2><details className={styles.detalhes}><summary>Ver orientação</summary><p>{pendencia.corpo}</p></details></div><a className="cta" href={pendencia.href}>{pendencia.rotulo}</a></section>}
    {complemento}
  </div>;
}
