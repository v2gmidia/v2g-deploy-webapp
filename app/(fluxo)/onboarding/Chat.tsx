"use client";

import { useEffect, useRef, useState } from "react";
import { SeletorDeAtividade } from "@/components/ui/SeletorDeAtividade";
import { NAO_SEI_BRIEFING } from "@/lib/onboarding/briefing-trafego";
import { RespostaPorVoz } from "./RespostaPorVoz";
import { salvarRespostaAction, type RespostaGravada } from "./actions";
import { ORDEM, PERGUNTAS, RAIO_KM, proximaPergunta, type Pergunta } from "./perguntas";
import styles from "./OnboardingNovo.module.css";

const QUESTOES = ORDEM.map((id) => PERGUNTAS.find((p) => p.id === id)!);
const RESPOSTAS_LONGAS = new Set(["descricao", "oferta", "publico", "motivo", "resultado", "diferencial", "prova"]);
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
    setEditando(null); setTexto(""); setCidade(""); setCep(""); setAlcanceLocal(null); setTextoAberto(false); setConfirmandoNaoSei(false); setErro(null);
  }
  function corrigir(pergunta: Pergunta) {
    const resposta = respostas[pergunta.id];
    if (!resposta || enviando || incerto || vozOcupada) return;
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
    if (enviando || incerto || vozOcupada) return;
    if (pergunta.pedeCidade && origem === "chip" && valor !== "Brasil inteiro" && !cidade.trim()) { setErro("Informe sua cidade para escolher a distância."); return; }
    if (!valor.trim()) { setErro("Escreva uma resposta antes de continuar."); campo.current?.focus(); return; }
    if (pergunta.minimo && !(pergunta.admiteNaoSei && origem === "chip" && valor === NAO_SEI_BRIEFING)
      && valor.trim().length < pergunta.minimo.tamanho) { setErro(pergunta.minimo.recado); campo.current?.focus(); return; }
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

  const seletorDeAtividade = !!atual?.seletorDeAtividade;
  const mostrarTexto = !!atual && !seletorDeAtividade && (atual.soTexto || textoAberto);

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
      {seletorDeAtividade && <SeletorDeAtividade ocupado={enviando || incerto}
        minimo={atual.minimo?.tamanho ?? 4} valorInicial={editando === "ramo" ? texto : ""}
        aoResponder={(atividade) => enviar(atual, atividade, "texto")} />}
      {!seletorDeAtividade && atual.opcoes.length > 0 && <div className={styles.opcoes}>
        {atual.opcoes.map((opcao) => <button type="button" key={opcao.echo} disabled={enviando || incerto}
          aria-pressed={atual.pedeCidade && opcao.echo !== "Brasil inteiro" ? alcanceLocal === opcao.echo : undefined}
          onClick={() => {
            if (atual.admiteNaoSei && opcao.echo === NAO_SEI_BRIEFING) {
              setConfirmandoNaoSei(true); setErro(null); return;
            }
            if (atual.pedeCidade && opcao.echo !== "Brasil inteiro") { setAlcanceLocal(opcao.echo); setErro(null); }
            else enviar(atual, opcao.echo, "chip");
          }}>{opcao.rotulo}</button>)}
      </div>}
      {confirmandoNaoSei && atual.admiteNaoSei && <div className="pendencia-bloco" role="group" aria-label="Confirmar resposta pendente">
        <p>Se souber agora, conte com suas palavras. Se deixar em aberto, o gestor vai conferir este ponto com você antes de preparar o anúncio.</p>
        <button className={styles.link} type="button" onClick={() => setConfirmandoNaoSei(false)}>Vou responder</button>{" "}
        <button className={styles.primario} type="button" disabled={enviando || incerto}
          onClick={() => enviar(atual, NAO_SEI_BRIEFING, "chip")}>Ainda não sei mesmo</button>
      </div>}
      {atual.pedeCidade && alcanceLocal && <div className={styles.local}>
        <label className={styles.campo}>Em qual cidade fica seu negócio?<input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex.: São Paulo" disabled={enviando || incerto} /></label>
        <label className={styles.campo}>CEP <small>(se souber)</small><input type="text" inputMode="numeric" autoComplete="postal-code" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" disabled={enviando || incerto} /></label>
        <button className={styles.primario} type="button" disabled={enviando || incerto} onClick={() => enviar(atual, alcanceLocal, "chip")}>{enviando ? "Salvando…" : "Salvar e continuar"}</button>
      </div>}
      {atual.id === "inicio" && <a className={styles.link} href="/inicio">Fazer depois</a>}
      {!seletorDeAtividade && atual.chipAbreTexto && !textoAberto && <button className={styles.link} type="button" onClick={() => setTextoAberto(true)}>Escrever do meu jeito</button>}
      {mostrarTexto && <div className={styles.resposta}>
        <label className={styles.campo}>{atual.fallbackLabel ?? "Sua resposta"}
          {RESPOSTAS_LONGAS.has(atual.id)
            ? <textarea ref={campo as React.RefObject<HTMLTextAreaElement>} rows={4} maxLength={800} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={atual.fallbackPlaceholder} disabled={enviando || incerto} />
            : <input ref={campo as React.RefObject<HTMLInputElement>} type="text" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={atual.fallbackPlaceholder} disabled={enviando || incerto}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviar(atual, texto, "texto"); } }} />}
        </label>
        {RESPOSTAS_LONGAS.has(atual.id) && vozHabilitada && <RespostaPorVoz ocupado={enviando || incerto}
          aoTranscrever={(fala) => setTexto((atual) => [atual.trim(), fala].filter(Boolean).join(" "))}
          aoOcupar={setVozOcupada} />}
        <button className={styles.primario} type="button" disabled={enviando || incerto || vozOcupada} onClick={() => enviar(atual, texto, "texto")}>{enviando ? "Salvando…" : "Salvar e continuar"}</button>
      </div>}
      {erro && <div className={incerto ? "form-warning" : "form-error"} role="alert">{erro}{incerto && <button type="button" onClick={() => window.location.reload()}>Recarregar</button>}</div>}
      {editando && <button className={styles.link} type="button" onClick={limparEdicao}>Cancelar correção</button>}
    </section> : <section className={styles.pergunta}>
      <h1>Seu negócio, contado por você.</h1>
      <p className={styles.ajuda}>Guardamos o que você contou sobre sua empresa, quem compra e a oferta inicial. O gestor vai conferir as respostas antes de preparar o anúncio. Agora vamos ver o valor médio de uma venda e os custos; se não souber algum número, pode deixar para a conversa.</p>
      <a className={styles.primario} href="/onboarding/contas">Continuar para as contas</a>
    </section>}
    {salvas.length > 0 && <details className={styles.revisao}><summary>Ver e corrigir respostas salvas ({salvas.length})</summary><ol>
      {salvas.map((p) => <li key={p.id}><span>{partes(p)[0]}<strong>{respostas[p.id]?.echo}</strong></span>
        <button type="button" disabled={enviando || incerto || vozOcupada} onClick={() => corrigir(p)}>Corrigir</button></li>)}
    </ol></details>}
  </div>;
}
