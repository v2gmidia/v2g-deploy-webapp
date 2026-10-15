"use client";

import { useEffect, useRef, useState } from "react";
import { SeletorDeAtividade } from "@/components/ui/SeletorDeAtividade";
import { exemplosDaAtividade } from "@/lib/onboarding/atividades";
import { NAO_SEI_BRIEFING } from "@/lib/onboarding/briefing-trafego";
import { cidadeDeclaradaValida, formatarCep } from "@/lib/onboarding/localizacao";
import { RespostaPorVoz } from "./RespostaPorVoz";
import { AnexosDaConversa } from "./AnexosDaConversa";
import { salvarRespostaAction, type RespostaGravada } from "./actions";
import { ORDEM, PERGUNTAS, RAIO_KM, proximaPergunta, type Pergunta } from "./perguntas";
import styles from "./ChatConversa.module.css";

const QUESTOES = ORDEM.map((id) => PERGUNTAS.find((p) => p.id === id)!);
function IconeEnviar() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20V4m-6 6 6-6 6 6" /></svg>;
}
function partes(pergunta: Pergunta): [string, string | null] {
  const match = pergunta.texto.match(/^(.+?[?.!])\s+(.+)$/s);
  return match ? [match[1] ?? pergunta.texto, match[2] ?? null] : [pergunta.texto, null];
}

export function Chat({ businessId, inicial, vozHabilitada }: {
  businessId: string; inicial: Record<string, RespostaGravada>; vozHabilitada: boolean;
}) {
  const [respostas, setRespostas] = useState(inicial);
  const [conviteAceito, setConviteAceito] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");
  const [alcanceLocal, setAlcanceLocal] = useState<string | null>(null);
  const [textoAberto, setTextoAberto] = useState(false);
  const [confirmandoNaoSei, setConfirmandoNaoSei] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [vozOcupada, setVozOcupada] = useState(false);
  const [arquivosOcupados, setArquivosOcupados] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [incerto, setIncerto] = useState(false);
  const campo = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const fim = useRef<HTMLDivElement>(null);

  const pendente = proximaPergunta(ORDEM.filter((id) => !!respostas[id]));
  const atual = editando ? QUESTOES.find((p) => p.id === editando) ?? pendente : pendente;
  const indice = atual ? QUESTOES.findIndex((p) => p.id === atual.id) : QUESTOES.length;
  const salvas = QUESTOES.filter((p) => respostas[p.id]);
  const exemplos = exemplosDaAtividade(respostas.ramo?.texto ?? "");
  const mostrarConvite = !conviteAceito && salvas.length === 0 && !editando;

  useEffect(() => {
    campo.current?.focus();
  }, [atual?.id]);
  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [atual?.id, conviteAceito, respostas]);

  function limparEdicao() {
    setEditando(null); setTexto(""); setCidade(""); setCep(""); setAlcanceLocal(null); setTextoAberto(false); setConfirmandoNaoSei(false); setErro(null);
  }
  function cancelarEdicao() {
    // Durante a transcrição, a resposta ainda pode voltar para este campo.
    // Trocar de pergunta nesse intervalo misturaria falas de duas perguntas.
    if (enviando || incerto || vozOcupada || arquivosOcupados) return;
    limparEdicao();
  }
  function corrigir(pergunta: Pergunta) {
    const resposta = respostas[pergunta.id];
    if (!resposta || enviando || incerto || vozOcupada || arquivosOcupados) return;
    setEditando(pergunta.id);
    setTexto(pergunta.admiteNaoSei && resposta.texto === NAO_SEI_BRIEFING ? "" : resposta.texto);
    setCidade(resposta.cidade ?? "");
    setCep(resposta.cep ?? "");
    setAlcanceLocal(pergunta.id === "praca" && Object.hasOwn(RAIO_KM, resposta.texto) ? resposta.texto : null);
    setTextoAberto(resposta.origem === "texto");
    setConfirmandoNaoSei(false);
    setErro(null);
  }
  async function enviar(pergunta: Pergunta, valor: string, origem: "chip" | "texto") {
    if (enviando || incerto || vozOcupada || arquivosOcupados) return;
    if (pergunta.pedeCidade && origem === "chip" && valor !== "Brasil inteiro" && !cidade.trim()) { setErro("Informe sua cidade para escolher a distância."); return; }
    if (pergunta.pedeCidade && origem === "chip" && valor !== "Brasil inteiro" && !cidadeDeclaradaValida(cidade)) {
      setErro("Confira o nome da cidade, sem números."); return;
    }
    if (pergunta.pedeCidade && origem === "chip" && valor === "Só aqui perto (até 5 km)" && cep.replace(/\D/g, "").length !== 8) {
      setErro("Informe o CEP com oito números para usar a área próxima."); return;
    }
    if (!valor.trim()) { setErro("Escreva uma resposta antes de continuar."); campo.current?.focus(); return; }
    if (pergunta.minimo && !(pergunta.admiteNaoSei && origem === "chip" && valor === NAO_SEI_BRIEFING)
      && valor.trim().length < pergunta.minimo.tamanho) { setErro(pergunta.minimo.recado); campo.current?.focus(); return; }
    setEnviando(true); setErro(null);
    try {
      const resultado = await salvarRespostaAction({ businessId, qid: pergunta.id, texto: valor, origem,
        ...(pergunta.pedeCidade && origem === "chip" && valor !== "Brasil inteiro"
          ? { cidade: cidade.trim(), cep: valor === "Só aqui perto (até 5 km)" ? cep.trim() : "" } : {}) });
      if (!resultado.ok && resultado.recarregar) { setIncerto(true); setErro("Não conseguimos confirmar a gravação. Recarregue para conferir antes de tentar novamente."); return; }
      if (!resultado.ok) { setErro(resultado.erro ?? "Não conseguimos salvar. Tente novamente."); return; }
      if (!resultado.estado) { setIncerto(true); setErro("A resposta pode ter sido salva. Recarregue para conferir antes de continuar."); return; }
      setRespostas(resultado.estado.respostas); limparEdicao();
    } catch {
      setIncerto(true); setErro("Não sabemos se a resposta foi salva. Recarregue para conferir antes de tentar novamente.");
    } finally { setEnviando(false); }
  }

  const seletorDeAtividade = !!atual?.seletorDeAtividade;
  const mostrarTexto = !!atual && !seletorDeAtividade && (atual.soTexto || textoAberto);

  return <main className={styles.jornada}>
    <div className={styles.andamento}><span>Sobre seu negócio</span><strong>{salvas.length} de {QUESTOES.length} respostas</strong></div>
    <div className={styles.progresso} role="progressbar" aria-valuemin={0} aria-valuemax={QUESTOES.length} aria-valuenow={salvas.length} aria-label="Respostas sobre seu negócio"><span style={{ width: `${salvas.length / QUESTOES.length * 100}%` }} /></div>
    <section className={styles.mensagens} aria-label="Conversa sobre seu negócio" aria-live="polite">
      <div className={styles.introducao}>
        <h1>Vamos preparar seu negócio.</h1>
        <p>São três etapas: seu negócio, suas contas e o visual da marca. Reserve cerca de 15 minutos. Cada resposta fica salva para você continuar depois.</p>
      </div>
      {salvas.map((p) => <div className={styles.troca} key={p.id}>
        <div className={styles.balao}><span>V2G</span><p>{partes(p)[0]}</p></div>
        <div className={`${styles.balao} ${styles.cliente}`}><span>Você</span><p>{respostas[p.id]?.echo}</p>
          <button type="button" disabled={enviando || incerto || vozOcupada || arquivosOcupados} onClick={() => corrigir(p)}>Corrigir</button></div>
      </div>)}
      {mostrarConvite ? <div className={styles.balao}><span>V2G</span><p>Comece pelo nome do negócio. Depois vamos entender o que você oferece, quem compra e onde atende.</p></div> :
      atual ? <div className={styles.balao} key={atual.id}><span>V2G · pergunta {indice + 1} de {QUESTOES.length}</span><p>{partes(atual)[0]}</p>
        {partes(atual)[1] && <small>{partes(atual)[1]}</small>}
        {atual.id === "descricao" && <small>Conte os principais produtos ou serviços. Você pode listar mais de um; a escolha do primeiro anúncio fica para a reunião.</small>}
      </div> : <div className={styles.balao}><span>V2G</span><p>Suas respostas estão guardadas. Agora vamos conferir as contas do negócio.</p>
        <a className={styles.primario} href="/onboarding/contas">Continuar para as contas</a></div>}
      <div ref={fim} />
    </section>
    <div className={styles.rodape}>
      {mostrarConvite ? <div className={styles.conviteAcoes}><button className={styles.primario} type="button" onClick={() => setConviteAceito(true)}>Começar a preparar meu negócio</button><a href="/inicio">Fazer depois</a></div> :
      atual ? <>
        {seletorDeAtividade && <SeletorDeAtividade ocupado={enviando || incerto}
          minimo={atual.minimo?.tamanho ?? 4} valorInicial={editando === "ramo" ? texto : ""}
          aoResponder={(atividade) => enviar(atual, atividade, "texto")} />}
        {!seletorDeAtividade && atual.opcoes.length > 0 && <div className={styles.opcoes}>
          {atual.opcoes.map((opcao) => <button type="button" key={opcao.echo} disabled={enviando || incerto}
            aria-pressed={atual.pedeCidade && opcao.echo !== "Brasil inteiro" ? alcanceLocal === opcao.echo : undefined}
            onClick={() => {
              if (atual.admiteNaoSei && opcao.echo === NAO_SEI_BRIEFING) { setConfirmandoNaoSei(true); setErro(null); return; }
              if (atual.pedeCidade && opcao.echo !== "Brasil inteiro") { setAlcanceLocal(opcao.echo); setErro(null); }
              else void enviar(atual, opcao.echo, "chip");
            }}>{opcao.rotulo}</button>)}
        </div>}
        {confirmandoNaoSei && atual.admiteNaoSei && <div className={styles.confirmacao} role="group" aria-label="Confirmar resposta pendente">
          <p>O gestor vai conferir este ponto com você na reunião.</p>
          <div><button type="button" onClick={() => setConfirmandoNaoSei(false)}>Vou responder</button>
            <button type="button" disabled={enviando || incerto} onClick={() => void enviar(atual, NAO_SEI_BRIEFING, "chip")}>Ainda não sei mesmo</button></div>
        </div>}
        {atual.pedeCidade && alcanceLocal && <div className={styles.local}>
          <label>Em qual cidade fica seu negócio?<input type="text" value={cidade} onChange={(e) => setCidade(e.target.value.replace(/[\d]/g, ""))} placeholder="Ex.: São Paulo" maxLength={80} disabled={enviando || incerto} /></label>
          {alcanceLocal === "Só aqui perto (até 5 km)" && <label>CEP do ponto de atendimento<input type="text" inputMode="numeric" autoComplete="postal-code" value={cep} onChange={(e) => setCep(formatarCep(e.target.value))} placeholder="00000-000" maxLength={9} disabled={enviando || incerto} /></label>}
          <button className={styles.primario} type="button" disabled={enviando || incerto} onClick={() => void enviar(atual, alcanceLocal, "chip")}>{enviando ? "Salvando…" : "Enviar localização"}</button>
        </div>}
        {!seletorDeAtividade && atual.chipAbreTexto && !textoAberto && <button className={styles.textoLivre} type="button" onClick={() => setTextoAberto(true)}>Escrever do meu jeito</button>}
        {mostrarTexto && <form className={styles.compositor} onSubmit={(e) => { e.preventDefault(); void enviar(atual, texto, "texto"); }}>
          <label htmlFor="resposta-onboarding">{atual.fallbackLabel ?? "Sua resposta"}</label>
          <textarea id="resposta-onboarding" ref={campo as React.RefObject<HTMLTextAreaElement>} rows={2} maxLength={800} value={texto}
            onChange={(e) => setTexto(e.target.value)} placeholder={exemplos[atual.id] ?? atual.fallbackPlaceholder ?? "Escreva sua resposta"} disabled={enviando || incerto}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(atual, texto, "texto"); } }} />
          <div className={styles.compositorAcoes}>
            <AnexosDaConversa businessId={businessId} ocupado={enviando || incerto || vozOcupada} aoOcupar={setArquivosOcupados} />
            <span className={styles.compositorNota}>Enter envia · Shift + Enter pula linha</span>
            {vozHabilitada && <RespostaPorVoz ocupado={enviando || incerto}
              aoTranscrever={(fala) => setTexto((valor) => [valor.trim(), fala].filter(Boolean).join(" "))}
              aoOcupar={setVozOcupada} />}
            <button className={styles.enviar} type="submit" disabled={enviando || incerto || vozOcupada || arquivosOcupados || !texto.trim()} aria-label={enviando ? "Salvando resposta" : "Enviar resposta"}><IconeEnviar /></button>
          </div>
        </form>}
        {erro && <div className={incerto ? "form-warning" : "form-error"} role="alert">{erro}{incerto && <button type="button" onClick={() => window.location.reload()}>Recarregar</button>}</div>}
        {editando && <button className={styles.cancelar} type="button" disabled={enviando || incerto || vozOcupada || arquivosOcupados} onClick={cancelarEdicao}>Cancelar correção</button>}
      </> : <p>Você pode revisar suas respostas acima ou seguir para as contas.</p>}
    </div>
  </main>;
}
