"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { salvarMarcaAction, type EstadoMarca } from "./actions";
import styles from "./Marca.module.css";

export function Marca({ inicial }: { inicial: EstadoMarca }) {
  const router = useRouter();
  const [estado, setEstado] = useState(inicial);
  const [site, setSite] = useState(inicial.site);
  // A coluna atual prevalece sobre um marcador antigo da etapa da marca.
  // Se a pessoa corrigiu o site no bloco inicial, esta tela permite revisar
  // e gravar o novo estado sem abrir com site preenchido e caixa marcada.
  const [semSite, setSemSite] = useState(!inicial.site && (inicial.siteNaoTenhoDeclarado || inicial.marca?.siteNaoTenho === true));
  const [instagram, setInstagram] = useState(inicial.instagram);
  const [aparencia, setAparencia] = useState(inicial.marca?.aparencia ?? "");
  const [naoSei, setNaoSei] = useState(inicial.marca?.aparenciaNaoSei ?? false);
  const [confirmandoNaoSei, setConfirmandoNaoSei] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const rotulos = { nome: "Nome", ramo: "Ramo", descricao: "O que vende", praca: "Onde atende" } as const;

  async function salvar() {
    if (enviando || aviso) return;
    setEnviando(true);
    setErro(null);
    setAviso(null);
    setSalvo(false);
    try {
      const r = await salvarMarcaAction({ businessId: estado.businessId, site, siteNaoTenho: semSite, instagram, aparencia, aparenciaNaoSei: naoSei });
      if (!r.ok && r.recarregar) setAviso("Não conseguimos confirmar a gravação. Algumas respostas podem ter sido salvas. Recarregue para conferir antes de enviar de novo.");
      else if (!r.ok) setErro(r.erro ?? "Não conseguimos salvar esta etapa.");
      else if (r.estado) {
        setEstado(r.estado);
        if (!estado.concluido && r.estado.concluido) router.push("/onboarding/concluido");
        else setSalvo(true);
      }
      else setAviso("Respostas enviadas, mas não conseguimos atualizar a tela. Recarregue para conferir o próximo passo.");
    } catch {
      setAviso("Não conseguimos confirmar se as respostas foram salvas. Recarregue para conferir antes de enviar de novo.");
    } finally { setEnviando(false); }
  }

  return <>
    <p className="mission-tag">Sua primeira missão · passo 2 de 3</p>
    <h1 className="auth-h">O visual da sua marca</h1>
    <p className="auth-sub">O que você contar fica guardado para a conversa com o gestor. A logo e o primeiro criativo serão tratados nessa reunião.</p>
    <section className="pendencia-bloco">
      <b>Confira o que você já contou</b>
      {Object.entries(estado.respostasBasicas).map(([chave, resposta]) =>
        <p key={chave}><strong>{rotulos[chave as keyof typeof rotulos]}:</strong> {resposta.echo}</p>
      )}
      <p><a href="/onboarding">Rever as perguntas do negócio</a> · <a href="/onboarding/contas">Rever as contas</a></p>
    </section>
    {estado.faltamBasicas.length ? <p className="form-warning">Faltam respostas sobre seu negócio: {estado.faltamBasicas.map((chave) => rotulos[chave]).join(", ")}. <a href="/onboarding">Continuar perguntas</a></p> :
    !estado.contasProntas ? <p className="form-warning">Termine suas contas antes desta etapa. <a href="/onboarding/contas">Voltar às contas</a></p> :
      <>
        {estado.concluido && <p className="form-notice">Questionário concluído. Você pode atualizar suas respostas sobre a marca antes da reunião.</p>}
        {salvo && <p className="form-notice" role="status">Respostas da marca guardadas.</p>}
        {estado.concluido && <p><a href="/onboarding/concluido">Ver o próximo passo</a></p>}
        {erro && <p className="form-error" role="alert">{erro}</p>}
        {aviso && <div className="form-warning" role="status">{aviso} <button className="chip-opt" type="button" onClick={() => window.location.reload()}>Recarregar</button></div>}
        <div className={styles.campo}>
          <label htmlFor="instagram">Instagram da marca (se tiver)</label>
          <input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seunegocio" />
        </div>
        <div className={styles.campo}>
          <label htmlFor="site">Site</label>
          <input id="site" value={site} disabled={semSite} onChange={(e) => setSite(e.target.value)} placeholder="seunegocio.com.br" />
        </div>
        <label className={styles.opcao}><input type="checkbox" checked={semSite} onChange={(e) => {
          setSemSite(e.target.checked);
          if (e.target.checked) setSite("");
          else if (!site) setSite(estado.site);
        }} /> Não tenho site</label>
        <div className={styles.campo}>
          <label htmlFor="aparencia">Como você descreveria as cores e o jeito da sua marca?</label>
          <textarea id="aparencia" value={aparencia} disabled={naoSei} maxLength={500} onChange={(e) => setAparencia(e.target.value)} placeholder="Ex.: azul escuro, fotos dos produtos e letras simples" />
        </div>
        <label className={styles.opcao}><input type="checkbox" checked={naoSei} onChange={(e) => {
          if (e.target.checked) setConfirmandoNaoSei(true);
          else setNaoSei(false);
        }} /> Ainda não sei; quero conversar com o gestor</label>
        {confirmandoNaoSei && <div className="pendencia-bloco" role="group" aria-label="Confirmar que não sabe descrever a marca">
          <p>Tem certeza de que não consegue descrever? Pense nas cores, fotos e letras que costuma usar. Uma frase aproximada já ajuda.</p>
          <button className="chip-opt" type="button" onClick={() => setConfirmandoNaoSei(false)}>Vou tentar descrever</button>
          <button className="chip-opt" type="button" onClick={() => {
            setNaoSei(true);
            setConfirmandoNaoSei(false);
          }}>Ainda não sei</button>
          <p className="conta-hint">O gestor verá essa pendência na conversa.</p>
        </div>}
        <p className="conta-hint">O Instagram é opcional. Sem site, registre “Não tenho site”; isso não cria um endereço fictício.</p>
        <button className="cta" type="button" disabled={enviando || !!aviso} onClick={salvar}>{enviando ? "Salvando…" : estado.concluido ? "Salvar alterações" : "Guardar e concluir"}</button>
      </>}
  </>;
}
