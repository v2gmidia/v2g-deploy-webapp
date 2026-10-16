"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ChatConversa.module.css";

const MAX_TEMPO = 60_000;
const ESPERA_FINAL = 1_200;

export function RespostaPorVoz({ ocupado, textoAtual, aoIniciar, aoParcial, aoTranscrever, aoOcupar }: {
  ocupado: boolean;
  textoAtual?: string;
  aoIniciar?: () => void;
  aoParcial?: (texto: string) => void;
  aoTranscrever: (texto: string) => void;
  aoOcupar: (ocupado: boolean) => void;
}) {
  const [gravando, setGravando] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fluxo = useRef<MediaStream | null>(null);
  const conexao = useRef<RTCPeerConnection | null>(null);
  const canal = useRef<RTCDataChannel | null>(null);
  const esperaFinal = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalizado = useRef(false);
  const parcial = useRef("");
  const trechosConcluidos = useRef<string[]>([]);
  const paradaSolicitada = useRef(false);
  const vivo = useRef(true);
  const gravandoRef = useRef(false);
  const token = useRef<{ valor: string; expira: number } | null>(null);
  const pedidoDeToken = useRef<Promise<string> | null>(null);
  const tempo = useRef<ReturnType<typeof setTimeout> | null>(null);

  function transcricaoAtual() {
    return [...trechosConcluidos.current, parcial.current].map((trecho) => trecho.trim()).filter(Boolean).join(" ");
  }

  async function obterToken(): Promise<string> {
    if (token.current && token.current.expira > Date.now() + 20_000) return token.current.valor;
    if (pedidoDeToken.current) return pedidoDeToken.current;
    const pedido = fetch("/api/onboarding/transcrever/ao-vivo", { method: "POST", cache: "no-store" })
      .then(async (resposta) => {
        const dados = await resposta.json().catch(() => null) as { token?: unknown; expiresAt?: unknown } | null;
        if (!resposta.ok || typeof dados?.token !== "string") throw new Error("Não consegui conectar o microfone.");
        token.current = { valor: dados.token,
          expira: typeof dados.expiresAt === "number" ? dados.expiresAt : Date.now() + 45_000 };
        return dados.token;
      });
    pedidoDeToken.current = pedido;
    try { return await pedido; }
    finally { pedidoDeToken.current = null; }
  }

  function liberar() {
    if (tempo.current) clearTimeout(tempo.current);
    if (esperaFinal.current) clearTimeout(esperaFinal.current);
    canal.current?.close();
    conexao.current?.close();
    fluxo.current?.getTracks().forEach((track) => track.stop());
    canal.current = null;
    conexao.current = null;
    fluxo.current = null;
    gravandoRef.current = false;
  }

  useEffect(() => { aoOcupar(iniciando || gravando || enviando); }, [iniciando, gravando, enviando, aoOcupar]);
  useEffect(() => () => { aoOcupar(false); }, [aoOcupar]);
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") return;
    void obterToken().catch(() => {});
  }, []);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
      liberar();
    };
  }, []);
  useEffect(() => { if (!iniciando && !gravando && !enviando) setErro(null); }, [textoAtual]);
  useEffect(() => { if (ocupado) setErro(null); }, [ocupado]);

  function concluirAoVivo(texto: string) {
    if (finalizado.current || !vivo.current || !texto.trim()) return;
    finalizado.current = true;
    liberar();
    setEnviando(false);
    setGravando(false);
    setErro(null);
    aoTranscrever(texto.trim());
  }

  function encerrarSemFala() {
    if (finalizado.current || !vivo.current) return;
    finalizado.current = true;
    liberar();
    setGravando(false);
    setEnviando(false);
    setErro(null);
  }

  function parar() {
    if (!gravandoRef.current || finalizado.current) return;
    paradaSolicitada.current = true;
    gravandoRef.current = false;
    fluxo.current?.getTracks().forEach((track) => track.stop());
    setGravando(false);
    setEnviando(true);
    if (tempo.current) clearTimeout(tempo.current);
    if (canal.current?.readyState === "open") canal.current.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    esperaFinal.current = setTimeout(() => {
      if (transcricaoAtual()) concluirAoVivo(transcricaoAtual());
      else encerrarSemFala();
    }, ESPERA_FINAL);
  }

  async function iniciar() {
    if (ocupado || iniciando || enviando || gravando) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
      setErro("Microfone indisponível neste navegador."); return;
    }
    setIniciando(true);
    setErro(null);
    finalizado.current = false;
    parcial.current = "";
    trechosConcluidos.current = [];
    paradaSolicitada.current = false;
    try {
      // Permissão do microfone e sessão temporária não dependem uma da outra.
      const [captura, sessao] = await Promise.allSettled([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        obterToken(),
      ]);
      if (captura.status === "fulfilled") fluxo.current = captura.value;
      if (captura.status !== "fulfilled") throw new Error("Não consegui abrir o microfone.");
      if (sessao.status !== "fulfilled") throw new Error("Não consegui conectar o microfone.");
      const stream = captura.value;
      const tokenDeVoz = sessao.value;
      if (!vivo.current) { liberar(); return; }

      const peer = new RTCPeerConnection();
      conexao.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const dc = peer.createDataChannel("oai-events");
      canal.current = dc;
      dc.onmessage = (evento) => {
        let mensagem: { type?: string; delta?: string; transcript?: string };
        try { mensagem = JSON.parse(evento.data); } catch { return; }
        if (mensagem.type === "conversation.item.input_audio_transcription.delta" && typeof mensagem.delta === "string") {
          parcial.current += mensagem.delta;
          if (vivo.current && transcricaoAtual()) aoParcial?.(transcricaoAtual());
        }
        if (mensagem.type === "conversation.item.input_audio_transcription.completed" && typeof mensagem.transcript === "string" && !finalizado.current) {
          const trecho = mensagem.transcript.trim();
          if (trecho) trechosConcluidos.current.push(trecho);
          parcial.current = "";
          if (vivo.current && transcricaoAtual()) aoParcial?.(transcricaoAtual());
          // Uma pausa pode concluir apenas um trecho; a gravação segue até a pessoa apertar parar.
          if (paradaSolicitada.current && transcricaoAtual()) concluirAoVivo(transcricaoAtual());
        }
        if (mensagem.type === "error" && !finalizado.current && vivo.current) {
          console.error("[onboarding:transcricao-ao-vivo] erro na sessão");
          if (transcricaoAtual()) concluirAoVivo(transcricaoAtual());
          else encerrarSemFala();
        }
      };

      const oferta = await peer.createOffer();
      await peer.setLocalDescription(oferta);
      const respostaSdp = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST", headers: { Authorization: `Bearer ${tokenDeVoz}`, "Content-Type": "application/sdp" },
        body: oferta.sdp,
      });
      if (!respostaSdp.ok) throw new Error("Não consegui conectar o microfone à transcrição ao vivo.");
      await peer.setRemoteDescription({ type: "answer", sdp: await respostaSdp.text() });
      await new Promise<void>((resolver, rejeitar) => {
        if (dc.readyState === "open") { resolver(); return; }
        const limite = setTimeout(() => rejeitar(new Error("A conexão de voz demorou demais.")), 10_000);
        dc.onopen = () => { clearTimeout(limite); resolver(); };
        dc.onerror = () => { clearTimeout(limite); rejeitar(new Error("A conexão de voz falhou.")); };
      });
      if (!vivo.current) { liberar(); return; }
      aoIniciar?.();
      setErro(null);
      gravandoRef.current = true;
      setGravando(true);
      tempo.current = setTimeout(parar, MAX_TEMPO);
    } catch (falha) {
      liberar();
      if (vivo.current) setErro(falha instanceof Error ? falha.message : "Não consegui abrir o microfone. Escreva sua resposta.");
    } finally { if (vivo.current) setIniciando(false); }
  }

  return <div className={styles.voz}>
    <button type="button" disabled={(!gravando && ocupado) || iniciando || enviando} aria-pressed={gravando}
      title={gravando ? "Parar e conferir transcrição" : iniciando ? "Conectando microfone" : enviando ? "Finalizando transcrição" : "Falar e ver a transcrição ao vivo"}
      aria-label={gravando ? "Parar e conferir transcrição" : iniciando ? "Conectando microfone" : enviando ? "Finalizando transcrição" : "Falar e ver a transcrição ao vivo"}
      onClick={() => gravando ? parar() : void iniciar()}>
      {gravando ? <span aria-hidden="true">■</span> : (iniciando || enviando) ? <span aria-hidden="true">…</span> :
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5.5 10.5a6.5 6.5 0 0 0 13 0M12 17v4m-4 0h8" /></svg>}
    </button>
    {(iniciando || gravando || enviando) && <span className={styles.vozEstado} role="status">{iniciando ? "Conectando…" : gravando ? "Ouvindo e escrevendo…" : "Finalizando…"}</span>}
    {erro && <span className={styles.vozAviso} role="alert">{erro}</span>}
  </div>;
}
