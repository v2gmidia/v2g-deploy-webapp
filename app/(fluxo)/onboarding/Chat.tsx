"use client";

import { useEffect, useRef, useState } from "react";
import { SeletorDeNicho } from "@/components/ui/SeletorDeNicho";
import type { Nicho } from "@/lib/nichos/tipos";
import { ouvinteDeFala, temFalaAoVivo, type Ouvinte } from "@/lib/onboarding/fala-ao-vivo";
import { salvarRespostaAction, type RespostaGravada } from "./actions";
import { ORDEM, PERGUNTAS, proximaPergunta, type Pergunta } from "./perguntas";
import styles from "./OnboardingNovo.module.css";

const QUESTOES = ORDEM.map((id) => PERGUNTAS.find((p) => p.id === id)!);
function partes(pergunta: Pergunta): [string, string | null] {
  const match = pergunta.texto.match(/^(.+?[?.!])\s+(.+)$/s);
  return match ? [match[1] ?? pergunta.texto, match[2] ?? null] : [pergunta.texto, null];
}

export function Chat({ businessId, inicial, nichos }: {
  businessId: string; inicial: Record<string, RespostaGravada>; nichos: Nicho[] | null;
}) {
  const [respostas, setRespostas] = useState(inicial);
  const [conviteAceito, setConviteAceito] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");
  const [textoAberto, setTextoAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [incerto, setIncerto] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [suportaVoz, setSuportaVoz] = useState<boolean | null>(null);
  const ouvinte = useRef<Ouvinte | null>(null);
  const baseDaFala = useRef("");
  const campo = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const pendente = proximaPergunta(ORDEM.filter((id) => !!respostas[id]));
  const atual = editando ? QUESTOES.find((p) => p.id === editando) ?? pendente : pendente;
  const indice = atual ? QUESTOES.findIndex((p) => p.id === atual.id) : QUESTOES.length;
  const salvas = QUESTOES.filter((p) => respostas[p.id]);
  const mostrarConvite = !conviteAceito && salvas.length === 0 && !editando;

  useEffect(() => { setSuportaVoz(temFalaAoVivo()); }, []);
  useEffect(() => {
    campo.current?.focus();
    ouvinte.current?.parar();
    ouvinte.current = null;
    setOuvindo(false);
  }, [atual?.id]);
  useEffect(() => () => { ouvinte.current?.parar(); }, []);

  function limparEdicao() {
    setEditando(null); setTexto(""); setCidade(""); setCep(""); setTextoAberto(false); setErro(null);
  }
  function corrigir(pergunta: Pergunta) {
    const resposta = respostas[pergunta.id];
    if (!resposta || enviando || incerto) return;
    setEditando(pergunta.id);
    setTexto(resposta.texto);
    setCidade(resposta.cidade ?? "");
    setCep(resposta.cep ?? "");
    setTextoAberto(resposta.origem === "texto");
    setErro(null);
  }
  function alternarVoz() {
    if (ouvindo) {
      ouvinte.current?.parar(); ouvinte.current = null; setOuvindo(false); return;
    }
    baseDaFala.current = texto;
    const escuta = ouvinteDeFala(
      ({ fechado, provisorio }) => setTexto([baseDaFala.current, fechado, provisorio].filter(Boolean).join(" ").trim()),
      () => { setErro("O microfone falhou. Escreva sua resposta ou tente de novo."); setOuvindo(false); ouvinte.current?.parar(); ouvinte.current = null; },
    );
    if (!escuta) { setErro("O reconhecimento de voz não está disponível neste navegador. Escreva sua resposta."); return; }
    ouvinte.current = escuta; setErro(null); setOuvindo(true);
  }
  async function enviar(pergunta: Pergunta, valor: string, origem: "chip" | "texto") {
    if (enviando || incerto) return;
    if (pergunta.pedeCidade && origem === "chip" && !cidade.trim()) { setErro("Informe sua cidade para escolher a distância."); return; }
    if (!valor.trim()) { setErro("Escreva uma resposta antes de continuar."); campo.current?.focus(); return; }
    ouvinte.current?.parar(); ouvinte.current = null; setOuvindo(false);
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
    {mostrarConvite ? <section className={styles.pergunta}>
      <h1>Quer começar a preparar seu negócio agora?</h1>
      <p className={styles.ajuda}>Conte um pouco sobre sua empresa para a conversa com o gestor. Você pode sair e continuar depois; cada resposta será salva para este negócio.</p>
      <button className={styles.primario} type="button" onClick={() => setConviteAceito(true)}>Começar onboarding</button>
      <a className={styles.link} href="/inicio">Fazer depois</a>
    </section> : atual ? <section className={styles.pergunta} key={atual.id}>
      <h1>{partes(atual)[0]}</h1>
      {partes(atual)[1] && <p className={styles.ajuda}>{partes(atual)[1]}</p>}
      {atual.pedeCidade && <div className={styles.local}>
        <label className={styles.campo}>Sua cidade<input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: São Paulo" disabled={enviando || incerto} /></label>
        <label className={styles.campo}>CEP de onde você atende <small>(se souber)</small><input type="text" inputMode="numeric" autoComplete="postal-code" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" disabled={enviando || incerto} /></label>
      </div>}
      {usaSeletor && nichos && <SeletorDeNicho nichos={nichos} ocupado={enviando || incerto}
        aoEscolher={(n) => enviar(atual, n.rotulo, "chip")} aoEscreverLivre={(t) => enviar(atual, t, "texto")}
        rotuloOutro={atual.chipAbreTexto ?? "Outro"} placeholderLivre={atual.fallbackPlaceholder} rotuloLivre={atual.fallbackLabel} />}
      {semLista && <p className={styles.ajuda}>A lista de ramos não carregou. Escreva como você chama seu negócio; a equipe confere depois.</p>}
      {!usaSeletor && !semLista && atual.opcoes.length > 0 && <div className={styles.opcoes}>
        {atual.opcoes.map((opcao) => <button type="button" key={opcao.echo} disabled={enviando || incerto}
          onClick={() => enviar(atual, opcao.echo, "chip")}>{opcao.rotulo}</button>)}
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
        {atual.id === "descricao" && suportaVoz && <div className={styles.voz}>
          <button type="button" disabled={enviando || incerto} onClick={alternarVoz} aria-pressed={ouvindo}>{ouvindo ? "Parar de ouvir" : "Responder falando"}</button>
          <p>{ouvindo ? "Confira o texto que aparece enquanto você fala." : "Toque e fale. Revise o texto antes de salvar; o WebApp não guarda o áudio."}</p>
        </div>}
        {atual.id === "descricao" && suportaVoz === false && <p className={styles.ajuda}>Este navegador não oferece resposta por voz. Você pode escrever normalmente.</p>}
        <button className={styles.primario} type="button" disabled={enviando || incerto || ouvindo} onClick={() => enviar(atual, texto, "texto")}>{enviando ? "Salvando…" : "Salvar e continuar"}</button>
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
        <button type="button" disabled={enviando || incerto} onClick={() => corrigir(p)}>Corrigir</button></li>)}
    </ol></details>}
    <p className={styles.rodape}>Cada resposta é salva para este negócio. Você pode sair e voltar depois.</p>
  </div>;
}
