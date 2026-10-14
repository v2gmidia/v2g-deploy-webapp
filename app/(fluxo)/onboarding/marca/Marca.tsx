"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ImagemDeIdentidade } from "@/lib/identidade/armazenar";
import { TEXTO_DA_DECLARACAO } from "@/app/(protected)/conta/declaracao";
import { coresDaLogo, PAPEIS_DA_COR } from "@/lib/identidade/cores-da-logo";
import { coresDoPdf } from "@/lib/identidade/cores-do-pdf";
import { juntarPaleta } from "@/lib/identidade/paleta";
import { salvarMarcaAction, type EstadoMarca } from "./actions";
import { LogoDaMarca } from "./LogoDaMarca";
import { GuiaDaMarca } from "./GuiaDaMarca";
import type { GuiaVisual } from "./guia-actions";
import { VariacoesDaMarca } from "./VariacoesDaMarca";
import type { VariacaoVisual } from "./variacoes-actions";
import styles from "./Marca.module.css";

export function Marca({ inicial, logo, guia, variacoes }: { inicial: EstadoMarca; logo: ImagemDeIdentidade | null; guia: GuiaVisual | null; variacoes: VariacaoVisual[] }) {
  const router = useRouter();
  const [estado, setEstado] = useState(inicial);
  const [site, setSite] = useState(inicial.site);
  // A coluna atual prevalece sobre um marcador antigo da etapa da marca.
  // Se a pessoa corrigiu o site no bloco inicial, esta tela permite revisar
  // e gravar o novo estado sem abrir com site preenchido e caixa marcada.
  const [semSite, setSemSite] = useState(!inicial.site && (inicial.siteNaoTenhoDeclarado || inicial.marca?.siteNaoTenho === true));
  const [instagram, setInstagram] = useState(inicial.instagram);
  const [aparencia, setAparencia] = useState(inicial.marca?.aparencia ?? "");
  const [cores, setCores] = useState(inicial.marca?.coresConfirmadas ?? []);
  const [coresConferidas, setCoresConferidas] = useState((inicial.marca?.coresConfirmadas.length ?? 0) > 0);
  const [analisandoLogo, setAnalisandoLogo] = useState(false);
  const [recadoLogo, setRecadoLogo] = useState<string | null>(null);
  const [naoSei, setNaoSei] = useState(inicial.marca?.aparenciaNaoSei ?? false);
  const [confirmandoNaoSei, setConfirmandoNaoSei] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const rotulos = { nome: "Nome", ramo: "Ramo", descricao: "O que vende", praca: "Onde atende" } as const;

  async function salvar() {
    if (enviando || aviso) return;
    setEnviando(true);
    setErro(null);
    setAviso(null);
    try {
      const r = await salvarMarcaAction({ businessId: estado.businessId, site, siteNaoTenho: semSite, instagram, aparencia,
        coresConfirmadas: coresConferidas ? cores : [], aparenciaNaoSei: naoSei });
      if (!r.ok && r.recarregar) setAviso("Não conseguimos confirmar a gravação. Algumas respostas podem ter sido salvas. Recarregue para conferir antes de enviar de novo.");
      else if (!r.ok) setErro(r.erro ?? "Não conseguimos salvar esta etapa.");
      else if (r.estado) {
        setEstado(r.estado);
        if (r.estado.concluido) router.push("/onboarding/concluido");
        else setErro("Ainda falta confirmar uma parte da sua marca.");
      }
      else setAviso("Respostas enviadas, mas não conseguimos atualizar a tela. Recarregue para conferir o próximo passo.");
    } catch {
      setAviso("Não conseguimos confirmar se as respostas foram salvas. Recarregue para conferir antes de enviar de novo.");
    } finally { setEnviando(false); }
  }

  async function proporCores(arquivos: File[]) {
    setAnalisandoLogo(true);
    setRecadoLogo(null);
    setCoresConferidas(false);
    try {
      const propostas = (await Promise.all(arquivos.map((arquivo) => coresDaLogo(arquivo, 6)))).flat();
      setCores((anteriores) => juntarPaleta(anteriores, propostas));
      setRecadoLogo(propostas.length
        ? "Somamos as cores encontradas nas imagens. Confira e confirme as que representam sua marca."
        : "Não encontramos cores confiáveis nessas imagens. Você pode definir com o gestor.");
    } catch {
      setRecadoLogo("As imagens foram guardadas, mas não conseguimos ler as cores agora. Confira as cores manualmente ou defina com o gestor.");
    } finally {
      setAnalisandoLogo(false);
    }
  }

  async function proporCoresDoGuia(arquivo: File) {
    setAnalisandoLogo(true);
    setRecadoLogo(null);
    try {
      const propostas = await coresDoPdf(arquivo);
      if (propostas.length) {
        setCores((anteriores) => juntarPaleta(anteriores, propostas));
        setCoresConferidas(false);
      }
      setRecadoLogo(propostas.length
        ? "Lemos as primeiras páginas do PDF e somamos as cores sugeridas. Confira antes de confirmar."
        : "PDF guardado para o gestor. Não conseguimos extrair cores confiáveis dele; envie imagens ou defina as cores na reunião.");
    } catch {
      setRecadoLogo("PDF guardado para o gestor, mas a leitura automática das cores falhou. Confira as cores manualmente ou defina com o gestor.");
    } finally {
      setAnalisandoLogo(false);
    }
  }

  return <>
    <p className="mission-tag">Sua primeira missão · passo 2 de 3</p>
    <h1 className="auth-h">O visual da sua marca</h1>
    <p className="auth-sub">Mostre o logo que seus clientes reconhecem. Confira as cores sugeridas e deixe os detalhes que faltarem para a reunião.</p>
    <details className={styles.revisao}>
      <summary>Rever o que você contou sobre o negócio</summary>
      {Object.entries(estado.respostasBasicas).map(([chave, resposta]) =>
        <p key={chave}><strong>{rotulos[chave as keyof typeof rotulos]}:</strong> {resposta.echo}</p>
      )}
      <p><a href="/onboarding">Rever as perguntas do negócio</a> · <a href="/onboarding/contas">Rever as contas</a></p>
    </details>
    {estado.faltamBasicas.length ? <p className="form-warning">Faltam respostas sobre seu negócio: {estado.faltamBasicas.map((chave) => rotulos[chave]).join(", ")}. <a href="/onboarding">Continuar perguntas</a></p> :
    !estado.contasProntas ? <p className="form-warning">Termine suas contas antes desta etapa. <a href="/onboarding/contas">Voltar às contas</a></p> :
      <>
        {erro && <p className="form-error" role="alert">{erro}</p>}
        {aviso && <div className="form-warning" role="status">{aviso} <button className="chip-opt" type="button" onClick={() => window.location.reload()}>Recarregar</button></div>}
        <p className={styles.declaracao}>{TEXTO_DA_DECLARACAO}</p>
        <LogoDaMarca businessId={estado.businessId} logo={logo} aoEscolher={(arquivo) => proporCores([arquivo])} />
        <VariacoesDaMarca businessId={estado.businessId} variacoes={variacoes} aoEscolher={proporCores} />
        <GuiaDaMarca businessId={estado.businessId} guia={guia} aoEscolher={proporCoresDoGuia} />
        <section className={styles.coresBloco}>
          <h2>Essas são as cores da sua marca?</h2>
          <p>O palpite vem dos logos, das imagens e do manual enviados. Você pode ajustar cada cor antes de confirmar.</p>
          {analisandoLogo && <p role="status">Analisando cores…</p>}
          {recadoLogo && <p role="status">{recadoLogo}</p>}
          {cores.length > 0 && <>
            <div className={styles.cores}>
              {cores.map((cor, i) => <label key={i}>
                <span>{PAPEIS_DA_COR[i] ?? "Cor"}</span>
                <input type="color" value={cor} aria-label={`Ajustar cor ${i + 1}`} onChange={(e) => {
                  setCores(cores.map((c, j) => j === i ? e.target.value.toUpperCase() : c));
                  setCoresConferidas(false);
                }} />
                <code>{cor}</code>
                <button type="button" className={styles.removerCor} onClick={() => {
                  setCores(cores.filter((_, j) => j !== i));
                  setCoresConferidas(false);
                }}>Remover</button>
              </label>)}
            </div>
            {cores.length < 6 && <button type="button" className={styles.adicionarCor} onClick={() => {
              setCores([...cores, "#1250DC"]);
              setCoresConferidas(false);
            }}>Adicionar outra cor</button>}
            <button className={styles.confirmarCores} type="button" onClick={() => { setCoresConferidas(true); setNaoSei(false); }}>
              {coresConferidas ? "Cores confirmadas ✓" : "Confirmar estas cores"}
            </button>
          </>}
          {cores.length === 0 && <button type="button" className={styles.adicionarCor} onClick={() => setCores(["#1250DC"])}>Adicionar cor manualmente</button>}
        </section>
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
          <label htmlFor="aparencia">Algo importante sobre o visual da marca? <small>(opcional)</small></label>
          <textarea id="aparencia" value={aparencia} disabled={naoSei} maxLength={500} onChange={(e) => setAparencia(e.target.value)} placeholder="Ex.: não usar vermelho; o logo principal é o de fundo claro" />
        </div>
        <label className={styles.opcao}><input type="checkbox" checked={naoSei} onChange={(e) => {
          if (e.target.checked) setConfirmandoNaoSei(true);
          else setNaoSei(false);
        }} /> Ainda não sei quais cores usar; quero definir com o gestor</label>
        {confirmandoNaoSei && <div className="pendencia-bloco" role="group" aria-label="Confirmar cores pendentes">
          <p>Se você tiver um logo, ele pode sugerir as cores. Quer seguir sem definir isso agora?</p>
          <button className="chip-opt" type="button" onClick={() => setConfirmandoNaoSei(false)}>Vou conferir o logo</button>
          <button className="chip-opt" type="button" onClick={() => {
            setNaoSei(true);
            setCoresConferidas(false);
            setConfirmandoNaoSei(false);
          }}>Ainda não sei</button>
          <p className="conta-hint">O gestor verá essa pendência na conversa.</p>
        </div>}
        <button className="cta" type="button" disabled={enviando || !!aviso || analisandoLogo} onClick={salvar}>{enviando ? "Salvando…" : "Guardar e escolher horário"}</button>
      </>}
  </>;
}
