"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ChatConversa.module.css";

const MAX_AUDIO = 3 * 1024 * 1024;
const MAX_TEMPO = 60_000;

function formato(): { mime: string; extensao: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const opcoes: Array<[string, string]> = [["audio/webm;codecs=opus", "webm"], ["audio/webm", "webm"], ["audio/mp4", "mp4"]];
  for (const [mime, extensao] of opcoes) {
    if (MediaRecorder.isTypeSupported(mime)) return { mime, extensao };
  }
  return null;
}

export function RespostaPorVoz({ ocupado, aoTranscrever, aoOcupar }: {
  ocupado: boolean;
  aoTranscrever: (texto: string) => void;
  aoOcupar: (ocupado: boolean) => void;
}) {
  const [suporta, setSuporta] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const gravador = useRef<MediaRecorder | null>(null);
  const fluxo = useRef<MediaStream | null>(null);
  const tempo = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setSuporta(!!formato() && !!navigator.mediaDevices?.getUserMedia); }, []);
  useEffect(() => { aoOcupar(gravando || enviando); }, [gravando, enviando, aoOcupar]);
  useEffect(() => () => { aoOcupar(false); }, [aoOcupar]);
  useEffect(() => () => {
    if (tempo.current) clearTimeout(tempo.current);
    if (gravador.current?.state === "recording") {
      gravador.current.onstop = null;
      gravador.current.stop();
    }
    fluxo.current?.getTracks().forEach((track) => track.stop());
  }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  async function transcrever(arquivo: File) {
    setEnviando(true);
    setErro(null);
    try {
      const dados = new FormData();
      dados.set("audio", arquivo);
      const resposta = await fetch("/api/onboarding/transcrever", { method: "POST", body: dados, cache: "no-store" });
      const payload = await resposta.json().catch(() => null) as { texto?: unknown; motivo?: unknown } | null;
      if (!resposta.ok || typeof payload?.texto !== "string") {
        setErro(typeof payload?.motivo === "string" ? payload.motivo : "Não consegui transcrever. Você pode escrever a resposta.");
        return;
      }
      aoTranscrever(payload.texto);
      setAudio(null);
      setAudioUrl(null);
    } catch {
      setErro("A conexão falhou. Você pode tentar de novo ou escrever a resposta.");
    } finally { setEnviando(false); }
  }

  async function iniciar() {
    if (ocupado || enviando || gravando) return;
    const tipo = formato();
    if (!tipo) { setErro("Seu navegador não consegue gravar áudio aqui. Escreva sua resposta."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      fluxo.current = stream;
      const media = new MediaRecorder(stream, { mimeType: tipo.mime });
      gravador.current = media;
      const partes: BlobPart[] = [];
      media.ondataavailable = (evento) => { if (evento.data.size) partes.push(evento.data); };
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        fluxo.current = null;
        setGravando(false);
        if (tempo.current) clearTimeout(tempo.current);
        const arquivo = new File(partes, `resposta.${tipo.extensao}`, { type: tipo.mime });
        if (!arquivo.size || arquivo.size > MAX_AUDIO) {
          setErro("O áudio ficou longo. Grave um trecho mais curto ou escreva a resposta.");
          return;
        }
        setAudio(arquivo);
        setAudioUrl(URL.createObjectURL(arquivo));
        void transcrever(arquivo);
      };
      media.start();
      setErro(null);
      setGravando(true);
      tempo.current = setTimeout(() => { if (media.state === "recording") media.stop(); }, MAX_TEMPO);
    } catch {
      fluxo.current?.getTracks().forEach((track) => track.stop());
      setErro("Não consegui abrir o microfone. Você pode escrever sua resposta.");
    }
  }

  return <div className={styles.voz}>
    {suporta && <button type="button" disabled={ocupado || enviando} aria-pressed={gravando}
      title={gravando ? "Parar gravação" : enviando ? "Transcrevendo áudio" : "Gravar resposta por voz"}
      aria-label={gravando ? "Parar gravação" : enviando ? "Transcrevendo áudio" : "Gravar resposta por voz"}
      onClick={() => gravando ? gravador.current?.stop() : void iniciar()}>
      {gravando ? <span aria-hidden="true">■</span> : enviando ? <span aria-hidden="true">…</span> :
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5.5 10.5a6.5 6.5 0 0 0 13 0M12 17v4m-4 0h8" /></svg>}
    </button>}
    {(gravando || enviando) && <span className={styles.vozEstado} role="status">{gravando ? "Gravando… toque para parar" : "Transcrevendo…"}</span>}
    {audio && erro && <><audio controls src={audioUrl ?? undefined} aria-label="Ouvir sua gravação" />
      <button type="button" disabled={ocupado || enviando} onClick={() => void transcrever(audio)}>Tentar transcrever de novo</button></>}
    {erro && <p className="form-error" role="alert">{erro}</p>}
  </div>;
}
