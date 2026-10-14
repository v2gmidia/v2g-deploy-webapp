"use client";

import { useEffect, useRef, useState } from "react";
import { SeletorDeNicho } from "@/components/ui/SeletorDeNicho";
import type { Nicho } from "@/lib/nichos/tipos";
import { RespostaPorVoz } from "./RespostaPorVoz";
import { salvarRespostaAction, type RespostaGravada } from "./actions";
import { ORDEM, PERGUNTAS, RAIO_KM, proximaPergunta, type Pergunta } from "./perguntas";
import styles from "./OnboardingNovo.module.css";

const QUESTOES = ORDEM.map((id) => PERGUNTAS.find((p) => p.id === id)!);
function partes(pergunta: Pergunta): [string, string | null] {
  const match = pergunta.texto.match(/^(.+?[?.!])\s+(.+)$/s);
  return match ? [match[1] ?? pergunta.texto, match[2] ?? null] : [pergunta.texto, null];
}

export function Chat({ businessId, inicial, nichos, vozHabilitada }: {
  businessId: string; inicial: Record<string, RespostaGravada>; nichos: Nicho[] | null; vozHabilitada: boolean;
}) {
  const [respostas, setRespostas] = useState(inicial);
  const [conviteAceito, setConviteAceito] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");
  const [alcanceLocal, setAlcanceLocal] = useState<string | null>(null);
  const [textoAberto, setTextoAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [vozOcupada, setVozOcupada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [incerto, setIncerto] = useState(false);
  const campo = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const pendente = proximaPergunta(ORDEM.filter((id) => !!respostas[id]));
  const atual = editando ? QUESTOES.find((p) => p.id === editando) ?? pendente : pendente;
  const indice = atual ? QUESTOES.findIndex((p) => p.id === atual.id) : QUESTOES.length;
  const salvas = QUESTOES.filter((p) => respostas[p.id]);
  const mostrarConvite = !conviteAceito && salvas.length === 0 && !editando;

  useEffect(() => {
    campo.current?.focus();
  }, [atual?.id]);

  function limparEdicao() {
    setEditando(null); setTexto(""); setCidade(""); setCep(""); setAlcanceLocal(null); setTextoAberto(false); setErro(null);
  }
  function corrigir(pergunta: Pergunta) {
    const resposta = respostas[pergunta.id];
    if (!resposta || enviando || incerto || vozOcupada) return;
    setEditando(pergunta.id);
    setTexto(resposta.texto);
    setCidade(resposta.cidade ?? "");
    setCep(resposta.cep ?? "");
    setAlcanceLocal(pergunta.id === "praca" && Object.hasOwn(RAIO_KM, resposta.texto) ? resposta.texto : null);
    setTextoAberto(resposta.origem === "texto");
    setErro(null);
  }
  async function enviar(pergunta: Pergunta, valor: string, origem: "chip" | "texto") {
    if (enviando || incerto || vozOcupada) return;
    if (pergunta.pedeCidade && origem === "chip" && valor !== "Brasil inteiro" && !cidade.trim()) { setErro("Informe sua cidade para escolher a distância."); return; }
    if (!valor.trim()) { setErro("Escreva uma resposta antes de continuar."); campo.current?.focus(); return; }
    if (pergunta.minimo && valor.trim().length < pergunta.minimo.tamanho) { setErro(pergunta.minimo.recado); campo.current?.focus(); return; }
    setEnviando(true); setErro(null);
    try {
      const resultado = await salvarRespostaAction({ businessId, qid: pergunta.id, texto: valor, origem,
        ...(pergunta.pedeCidade && origem === "chip" ? { cidade: cidade.trim(), cep: cep.trim() } : {}) });
      if (!resultado.ok && resultado.recarregar) { setIncerto(true); setErro("Não conseguimos confirmar a gravação. Recarregue para conferir antes de tentar novamente."); return; }
      if (!resultado.ok) { setErro(resultado.erro ?? "Não conseguimos salvar. Tente novamente."); return; }
      if (!resultado.estado) { setIncerto(true); setErro("A resposta pode ter sido salva. Recarregue para conferir antes de continuar."); return; }
      setRespostas(resultado.estado.respostas); limparEdicao();
    } catch {
      setIncerto(true); setErro("Não sabemos se a resposta foi salva. Recarregue para conferir antes de tentar novamente.");
    } finally { setEnviando(false); }
  }

  const semLista = !!atual?.seletorDeNicho && nichos === null;
  const usaSeletor = !!atual?.seletorDeNicho && nichos !== null;
  const mostrarTexto = !!atual && !usaSeletor && (atual.soTexto || semLista || textoAberto);

  return <div className={styles.jornada}>
    <div className={styles.progresso} aria-label={mostrarConvite ? "Onboarding ainda não iniciado" : `${Math.min(indice + 1, QUESTOES.length)} de ${QUESTOES.length} perguntas`}>
      <span style={{ width: `${(mostrarConvite ? 0 : (atual ? indice : QUESTOES.length) / QUESTOES.length) * 100}%` }} />
    </div>
    <div className={styles.topo}><span>{mostrarConvite ? "Seu primeiro passo" : atual ? `Pergunta ${indice + 1} de ${QUESTOES.length}` : "Respostas registradas"}</span><span>Sobre seu negócio</span></div>
    {mostrarConvite ? <section className={`${styles.pergunta} ${styles.convite}`}>
      <h1>Quer começar a preparar seu negócio agora?</h1>
      <p className={styles.ajuda}>Conte com cuidado o que seu negócio vende e para quem. Essas respostas ajudam o gestor a preparar a conversa e a primeira campanha. Você pode sair e continuar depois; cada resposta fica salva para este negócio.</p>
      <div className={styles.acoesConvite}>
        <button className={styles.primario} type="button" onClick={() => setConviteAceito(true)}>Começar onboarding</button>
        <a className={styles.link} href="/inicio">Fazer depois</a>
      </div>
    </section> : atual ? <section className={styles.pergunta} key={atual.id}>
      <h1>{partes(atual)[0]}</h1>
      {partes(atual)[1] && <p className={styles.ajuda}>{partes(atual)[1]}</p>}
      {usaSeletor && nichos && <SeletorDeNicho nichos={nichos} ocupado={enviando || incerto}
        aoEscolher={(n) => enviar(atual, n.rotulo, "chip")} aoEscreverLivre={(t) => enviar(atual, t, "texto")}
        rotuloOutro={atual.chipAbreTexto ?? "Outro"} placeholderLivre={atual.fallbackPlaceholder} rotuloLivre={atual.fallbackLabel} minimoTextoLivre={atual.minimo?.tamanho} />}
      {semLista && <p className={styles.ajuda}>As sugestões de tipo de negócio estão indisponíveis agora. Escreva o que você faz; a equipe confere na reunião.</p>}
      {!usaSeletor && !semLista && atual.opcoes.length > 0 && <div className={styles.opcoes}>
        {atual.opcoes.map((opcao) => <button type="button" key={opcao.echo} disabled={enviando || incerto}
          aria-pressed={atual.pedeCidade && opcao.echo !== "Brasil inteiro" ? alcanceLocal === opcao.echo : undefined}
          onClick={() => {
            if (atual.pedeCidade && opcao.echo !== "Brasil inteiro") { setAlcanceLocal(opcao.echo); setErro(null); }
            else enviar(atual, opcao.echo, "chip");
          }}>{opcao.rotulo}</button>)}
      </div>}
      {atual.pedeCidade && alcanceLocal && <div className={styles.local}>
        <label className={styles.campo}>Em qual cidade fica seu negócio?<input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex.: São Paulo" disabled={enviando || incerto} /></label>
        <label className={styles.campo}>CEP <small>(se souber)</small><input type="text" inputMode="numeric" autoComplete="postal-code" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" disabled={enviando || incerto} /></label>
        <button className={styles.primario} type="button" disabled={enviando || incerto} onClick={() => enviar(atual, alcanceLocal, "chip")}>{enviando ? "Salvando…" : "Salvar e continuar"}</button>
      </div>}
      {atual.id === "inicio" && <a className={styles.link} href="/inicio">Fazer depois</a>}
      {!usaSeletor && !semLista && atual.chipAbreTexto && !textoAberto && <button className={styles.link} type="button" onClick={() => setTextoAberto(true)}>Escrever do meu jeito</button>}
      {mostrarTexto && <div className={styles.resposta}>
        <label className={styles.campo}>{atual.fallbackLabel ?? "Sua resposta"}
          {atual.id === "descricao"
            ? <textarea ref={campo as React.RefObject<HTMLTextAreaElement>} rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={atual.fallbackPlaceholder} disabled={enviando || incerto} />
            : <input ref={campo as React.RefObject<HTMLInputElement>} type="text" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={atual.fallbackPlaceholder} disabled={enviando || incerto}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviar(atual, texto, "texto"); } }} />}
        </label>
        {atual.id === "descricao" && vozHabilitada && <RespostaPorVoz ocupado={enviando || incerto}
          aoTranscrever={(fala) => setTexto((atual) => [atual.trim(), fala].filter(Boolean).join(" "))}
          aoOcupar={setVozOcupada} />}
        <button className={styles.primario} type="button" disabled={enviando || incerto || vozOcupada} onClick={() => enviar(atual, texto, "texto")}>{enviando ? "Salvando…" : "Salvar e continuar"}</button>
      </div>}
      {erro && <div className={incerto ? "form-warning" : "form-error"} role="alert">{erro}{incerto && <button type="button" onClick={() => window.location.reload()}>Recarregar</button>}</div>}
      {editando && <button className={styles.link} type="button" onClick={limparEdicao}>Cancelar correção</button>}
    </section> : <section className={styles.pergunta}>
      <h1>Seu negócio, contado por você.</h1>
      <p className={styles.ajuda}>As respostas estão salvas. Agora vamos olhar as contas com calma. Se algum número não estiver à mão, você pode dizer que não sabe.</p>
      <a className={styles.primario} href="/onboarding/contas">Continuar para as contas</a>
    </section>}
    {salvas.length > 0 && <details className={styles.revisao}><summary>Ver e corrigir respostas salvas ({salvas.length})</summary><ol>
      {salvas.map((p) => <li key={p.id}><span>{partes(p)[0]}<strong>{respostas[p.id]?.echo}</strong></span>
        <button type="button" disabled={enviando || incerto || vozOcupada} onClick={() => corrigir(p)}>Corrigir</button></li>)}
    </ol></details>}
  </div>;
}
