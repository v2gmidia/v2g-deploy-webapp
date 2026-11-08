"use client";

import { useRef, useState } from "react";
import { CarregandoInicio } from "@/app/(protected)/inicio/CarregandoInicio";
import { SeletorDePeriodo } from "@/app/(protected)/inicio/SeletorDePeriodo";
import { PerguntaDoDia } from "@/app/(protected)/inicio/PerguntaDoDia";
import { intervaloDoInicio, rotuloDoIntervalo } from "@/lib/inicio/periodo";

const registrar = async () => {};
const pausar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function PreviaCarregamentoInicio() {
  const [duracao, setDuracao] = useState(3000);
  const [falhar, setFalhar] = useState(false);
  const [ocupada, setOcupada] = useState(false);
  const [entrada, setEntrada] = useState(false);
  const [falhaEntrada, setFalhaEntrada] = useState(false);
  const [medicao, setMedicao] = useState("");
  const [chave, setChave] = useState(0);
  const chamadas = useRef(0);
  const [intervalo, setIntervalo] = useState(intervaloDoInicio({}, "2026-11-06"));
  async function simular() {
    setOcupada(true);
    const numero = ++chamadas.current;
    const inicio = performance.now();
    await pausar(duracao);
    setMedicao(`Simulação local: ${(performance.now() - inicio).toFixed(0)} ms · ${numero} chamada(s). Nenhuma consulta ou gravação externa.`);
    setOcupada(false);
    if (falhar) { setFalhar(false); throw new Error("Falha simulada"); }
  }
  async function testarEntrada() {
    setEntrada(true);
    setFalhaEntrada(false);
    try { await simular(); } catch { setFalhaEntrada(true); }
    finally { setEntrada(false); }
  }
  return <>
    <section aria-label="Controles da prévia" style={{ marginBottom: 28 }}>
      <h1>Carregamentos do Início</h1>
      <p>Ensaio local com os componentes reais e espera simulada. Não mede a velocidade da conta real.</p>
      <fieldset disabled={ocupada} style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: 16, border: "1px solid var(--line)" }}>
        <label>Duração simulada <select value={duracao} onChange={(e) => setDuracao(Number(e.target.value))}><option value={200}>Rápida · 0,2 s</option><option value={3000}>Lenta · 3 s</option><option value={12000}>Demorada · 12 s</option></select></label>
        <label><input type="checkbox" checked={falhar} onChange={(e) => setFalhar(e.target.checked)} /> Falhar na próxima tentativa</label>
        <button type="button" onClick={testarEntrada}>Testar entrada</button>
        <button type="button" onClick={() => setChave((valor) => valor + 1)}>Limpar resposta de exemplo</button>
      </fieldset>
      <p role="status">{medicao}</p>
    </section>
    {entrada ? <CarregandoInicio /> : falhaEntrada ? <section><h2>Não conseguimos abrir seu Início</h2><p role="alert">Falha simulada de consulta.</p><button type="button" className="cta" onClick={testarEntrada}>Tentar novamente</button></section> : <div className="inicio-editorial">
      <header className="inicio-cabecalho"><h2>Início</h2><SeletorDePeriodo intervalo={intervalo} aoAplicar={async (destino) => {
        await simular();
        const params = new URL(destino, "http://localhost").searchParams;
        setIntervalo(intervaloDoInicio(Object.fromEntries(params), "2026-11-06"));
      }} /></header>
      <section className="sinais-bloco"><h2>Resumo do período</h2><p>Dados ilustrativos de {rotuloDoIntervalo(intervalo)}</p><div className="sinais">
        {[['Investido', 'R$ 120,00'], ['Cliques', '80'], ['Impressões', '1.600'], ['Conversas', '—']].map(([nome, valor]) => <div className="sinal" key={nome}><span className="s-label">{nome}</span><span className="s-valor">{valor}</span></div>)}
      </div></section>
      <PerguntaDoDia key={chave} businessId="previa-carregamento" idExecucao="previa-carregamento" dia="2026-11-05" vendasAtuais={null} receitaAtualCentavos={null} respondeuAlgo={false} atrasados={[]} valoresPorDia={{}} acoes={{ registrar, responder: async () => { await simular(); return { ok: true }; } }} />
    </div>}
  </>;
}
