"use client";

import { useRef, useState } from "react";
import { Chat } from "../../(fluxo)/onboarding/Chat";
import type { RespostaGravada, SalvarResultado, salvarRespostaAction } from "../../(fluxo)/onboarding/actions";
import { ORDEM } from "../../(fluxo)/onboarding/perguntas";
import styles from "./Previa.module.css";

const businessId = "negocio-ficticio-envio-local";
const resposta = (texto: string): RespostaGravada => ({ texto, echo: texto, origem: "texto", em: "2026-10-27T12:00:00Z" });
const inicial = Object.fromEntries(ORDEM.slice(0, -1).map(id => [id, resposta(`Resposta fictícia sobre ${id}`)]));
type Entrada = Parameters<typeof salvarRespostaAction>[0];

export function PreviaEnvio() {
  const [chave, setChave] = useState(0);
  const [chamadas, setChamadas] = useState(0);
  const [aguardando, setAguardando] = useState(false);
  const estado = useRef<Record<string, RespostaGravada>>({ ...inicial });
  const pendente = useRef<{ entrada: Entrada; resolver: (valor: SalvarResultado) => void; rejeitar: () => void } | null>(null);
  const simular: typeof salvarRespostaAction = async entrada => {
    setChamadas(n => n + 1);
    setAguardando(true);
    return new Promise<SalvarResultado>((resolver, rejeitar) => {
      pendente.current = { entrada, resolver, rejeitar: () => rejeitar(new Error("Rede fictícia interrompida")) };
    });
  };
  function concluir(tipo: "sucesso" | "falha" | "incerto" | "rede") {
    const envio = pendente.current;
    if (!envio) return;
    pendente.current = null; setAguardando(false);
    if (tipo === "rede") { envio.rejeitar(); return; }
    if (tipo === "falha") { envio.resolver({ ok: false, erro: "Não foi possível salvar. Seu texto continua disponível para tentar novamente." }); return; }
    if (tipo === "incerto") { envio.resolver({ ok: false, recarregar: true }); return; }
    estado.current = { ...estado.current, [envio.entrada.qid]: { ...resposta(envio.entrada.texto), origem: envio.entrada.origem } };
    envio.resolver({ ok: true, estado: { businessId, respostas: estado.current } });
  }
  return <div className={styles.previa}>
    <aside className={styles.controles} aria-label="Controles da simulação local">
      <strong>Prévia local · nenhum dado é enviado</strong><span>Chamadas simuladas: {chamadas}</span>
      <button disabled={!aguardando} onClick={() => concluir("sucesso")}>Confirmar gravação</button>
      <button disabled={!aguardando} onClick={() => concluir("falha")}>Simular falha</button>
      <button disabled={!aguardando} onClick={() => concluir("incerto")}>Simular retorno incerto</button>
      <button disabled={!aguardando} onClick={() => concluir("rede")}>Simular queda de rede</button>
      <button disabled={aguardando} onClick={() => { estado.current = { ...inicial }; setChamadas(0); setChave(n => n + 1); }}>Reiniciar</button>
    </aside>
    <Chat key={chave} businessId={businessId} inicial={inicial} estadoDaVoz="desativada" salvarResposta={simular} />
  </div>;
}
