"use client";

import { useState } from "react";
import { salvarMarcaAction, type EstadoMarca } from "./actions";
import styles from "./Marca.module.css";

export function Marca({ inicial }: { inicial: EstadoMarca }) {
  const [estado, setEstado] = useState(inicial);
  const [site, setSite] = useState(inicial.site);
  const [semSite, setSemSite] = useState(inicial.marca?.siteNaoTenho ?? false);
  const [instagram, setInstagram] = useState(inicial.instagram);
  const [aparencia, setAparencia] = useState(inicial.marca?.aparencia ?? "");
  const [naoSei, setNaoSei] = useState(inicial.marca?.aparenciaNaoSei ?? false);
  const [confirmandoNaoSei, setConfirmandoNaoSei] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const rotulos = { nome: "Nome", ramo: "Ramo", descricao: "O que vende", praca: "Onde atende" } as const;

  async function salvar() {
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const r = await salvarMarcaAction({ businessId: estado.businessId, site, siteNaoTenho: semSite, instagram, aparencia, aparenciaNaoSei: naoSei });
      if (!r.ok) setErro(r.erro ?? "Não conseguimos salvar esta etapa.");
      else if (r.estado) setEstado(r.estado);
      else window.location.href = "/onboarding/concluido";
    } catch {
      setErro("Não conseguimos salvar esta etapa. Tente de novo.");
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
      estado.concluido ? <>
        <p className="form-notice">Esta etapa está guardada.</p>
        <a className="cta" href="/onboarding/concluido">Ver o próximo passo</a>
      </> : <>
        {erro && <p className="form-error" role="alert">{erro}</p>}
        <div className={styles.campo}>
          <label htmlFor="instagram">Instagram da marca (se tiver)</label>
          <input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seunegocio" />
        </div>
        <div className={styles.campo}>
          <label htmlFor="site">Site</label>
          <input id="site" value={site} disabled={semSite} onChange={(e) => setSite(e.target.value)} placeholder="seunegocio.com.br" />
        </div>
        <label className={styles.opcao}><input type="checkbox" checked={semSite} disabled={!!inicial.site} onChange={(e) => {
          setSemSite(e.target.checked);
          if (e.target.checked) setSite("");
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
        <button className="cta" type="button" disabled={enviando} onClick={salvar}>{enviando ? "Salvando…" : "Guardar e concluir"}</button>
      </>}
  </>;
}
