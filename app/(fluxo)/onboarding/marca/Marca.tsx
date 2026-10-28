"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ImagemDeIdentidade } from "@/lib/identidade/armazenar";
import { TEXTO_DA_DECLARACAO, TEXTO_DO_LIMITE_DE_IA } from "@/app/(protected)/conta/declaracao";
import { coresDaLogo, PAPEIS_DA_COR } from "@/lib/identidade/cores-da-logo";
import { juntarPaleta } from "@/lib/identidade/paleta";
import { validarInstagram, validarSite } from "@/lib/onboarding/enderecos";
import { salvarMarcaAction, type EstadoMarca } from "./actions";
import { LogoDaMarca } from "./LogoDaMarca";
import { VariacoesDaMarca } from "./VariacoesDaMarca";
import type { VariacaoVisual } from "./variacoes-actions";
import styles from "./Marca.module.css";

export function Marca({ inicial, logo, variacoes }: { inicial: EstadoMarca; logo: ImagemDeIdentidade | null; variacoes: VariacaoVisual[] }) {
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
  const [analisesAtivas, setAnalisesAtivas] = useState(0);
  const [uploadsAtivos, setUploadsAtivos] = useState(0);
  const [recadoLogo, setRecadoLogo] = useState<string | null>(null);
  const [naoSei, setNaoSei] = useState(inicial.marca?.aparenciaNaoSei ?? false);
  const [confirmandoNaoSei, setConfirmandoNaoSei] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroInstagram, setErroInstagram] = useState<string | null>(null);
  const [erroSite, setErroSite] = useState<string | null>(null);
  const rotulos = { nome: "Nome", ramo: "Ramo", descricao: "O que vende", praca: "Onde atende" } as const;

  async function salvar() {
    if (enviando || aviso || uploadsAtivos > 0 || analisesAtivas > 0) return;
    const instagramNormalizado = instagram.trim() ? validarInstagram(instagram) : "";
    const siteNormalizado = semSite ? "" : validarSite(site);
    const novoErroInstagram = instagram.trim() && !instagramNormalizado ? "Use apenas um @usuário válido ou cole a URL do perfil no Instagram." : null;
    const novoErroSite = !semSite && !siteNormalizado ? "Informe um domínio ou endereço válido, como seunegocio.com.br." : null;
    setErroInstagram(novoErroInstagram);
    setErroSite(novoErroSite);
    if (novoErroInstagram || novoErroSite) return;
    if (instagramNormalizado) setInstagram(instagramNormalizado);
    if (siteNormalizado) setSite(siteNormalizado);
    setEnviando(true);
    setErro(null);
    setAviso(null);
    try {
      const r = await salvarMarcaAction({ businessId: estado.businessId, site: siteNormalizado ?? "", siteNaoTenho: semSite, instagram: instagramNormalizado ?? "", aparencia,
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

  async function proporCores(arquivos: File[], origem: "logo-principal" | "imagem-de-apoio") {
    setAnalisesAtivas((atual) => atual + 1);
    setRecadoLogo(null);
    try {
      const propostas = (await Promise.all(arquivos.map((arquivo) => coresDaLogo(arquivo, 6))))
        .flat()
        .map((cor) => ({ ...cor, origem }));
      if (propostas.length) {
        setCores((anteriores) => juntarPaleta(anteriores, propostas));
        setCoresConferidas(false);
      }
      setRecadoLogo(propostas.length
        ? origem === "logo-principal"
          ? "Priorizamos as cores encontradas na logo principal. Confira, remova ou ajuste antes de confirmar."
          : "Usamos as outras imagens como apoio para completar a paleta. Confira, remova ou ajuste antes de confirmar."
        : "Não encontramos cores confiáveis nessas imagens. Você pode definir com o gestor.");
    } catch {
      setRecadoLogo("As imagens foram guardadas, mas não conseguimos ler as cores agora. Confira as cores manualmente ou defina com o gestor.");
    } finally {
      setAnalisesAtivas((atual) => Math.max(0, atual - 1));
    }
  }

  function aoMudarUpload(ativo: boolean) {
    setUploadsAtivos((atual) => Math.max(0, atual + (ativo ? 1 : -1)));
  }

  return <>
    <p className="mission-tag">Sua primeira missão · passo 2 de 3</p>
    <h1 className="auth-h">O visual da sua marca</h1>
    <p className="auth-sub">Envie seu logo principal e imagens que mostrem as cores da sua marca. Isso nos ajuda a criar anúncios com a sua identidade. Vamos sugerir uma paleta para você conferir e corrigir antes de continuar.</p>
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
        <ol className={styles.marcos} aria-label="Progresso do visual da marca">
          <li data-concluido={Boolean(logo)}>{logo ? "Logo salvo" : "Logo ainda não enviado"}</li>
          <li data-concluido={cores.length > 0}>{cores.length > 0 ? "Cores sugeridas ou adicionadas" : "Cores ainda não definidas"}</li>
          <li data-concluido={coresConferidas}>{coresConferidas ? "Cores confirmadas" : "Cores aguardando confirmação"}</li>
          <li data-concluido={estado.concluido}>{estado.concluido ? "Dados salvos" : "Dados ainda não salvos"}</li>
        </ol>
        <p className="form-warning"><strong>Envio não autoriza uso por IA.</strong> {TEXTO_DO_LIMITE_DE_IA}</p>
        <p className={styles.declaracao}>{TEXTO_DA_DECLARACAO}</p>
        <LogoDaMarca businessId={estado.businessId} logo={logo} aoEscolher={(arquivo) => proporCores([arquivo], "logo-principal")} aoMudarUpload={aoMudarUpload} />
        <VariacoesDaMarca businessId={estado.businessId} variacoes={variacoes} aoEscolher={(arquivos) => proporCores(arquivos, "imagem-de-apoio")} aoMudarUpload={aoMudarUpload} />
        <section className={styles.coresBloco}>
          <h2>Essas são as cores da sua marca?</h2>
          <p>A logo principal vem primeiro; as outras imagens ajudam a completar uma paleta coerente. Você escolhe quais tons manter e pode ajustar cada cor antes de confirmar.</p>
          {analisesAtivas > 0 && <p className={styles.statusAcao} role="status" aria-live="polite">Imagem salva. Analisando as cores agora…</p>}
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
            <button className={styles.confirmarCores} type="button" disabled={uploadsAtivos > 0 || analisesAtivas > 0} onClick={() => { setCoresConferidas(true); setNaoSei(false); }}>
              {coresConferidas ? "Cores confirmadas ✓" : "Confirmar estas cores"}
            </button>
          </>}
          {cores.length === 0 && <button type="button" className={styles.adicionarCor} onClick={() => setCores(["#1250DC"])}>Adicionar cor manualmente</button>}
        </section>
        <div className={styles.campo}>
          <label htmlFor="instagram">Instagram da marca (se tiver)</label>
          <input id="instagram" value={instagram} aria-invalid={Boolean(erroInstagram)} aria-describedby={erroInstagram ? "erro-instagram" : undefined}
            onChange={(e) => { setInstagram(e.target.value); setErroInstagram(null); }}
            onBlur={() => {
              if (!instagram.trim()) return;
              const normalizado = validarInstagram(instagram);
              if (normalizado) setInstagram(normalizado);
              else setErroInstagram("Use apenas um @usuário válido ou cole a URL do perfil no Instagram.");
            }} placeholder="@seunegocio" />
          {erroInstagram && <p id="erro-instagram" className={styles.erroCampo} role="alert">{erroInstagram}</p>}
        </div>
        <div className={styles.campo}>
          <label htmlFor="site">Site</label>
          <input id="site" value={site} disabled={semSite} aria-invalid={Boolean(erroSite)} aria-describedby={erroSite ? "erro-site" : undefined}
            onChange={(e) => { setSite(e.target.value); setErroSite(null); }}
            onBlur={() => {
              if (!site.trim() || semSite) return;
              const normalizado = validarSite(site);
              if (normalizado) setSite(normalizado);
              else setErroSite("Informe um domínio ou endereço válido, como seunegocio.com.br.");
            }} placeholder="seunegocio.com.br" />
          {erroSite && <p id="erro-site" className={styles.erroCampo} role="alert">{erroSite}</p>}
        </div>
        <label className={styles.opcao}><input type="checkbox" checked={semSite} onChange={(e) => {
          setSemSite(e.target.checked);
          if (e.target.checked) { setSite(""); setErroSite(null); }
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
        {enviando && <p className={styles.statusAcao} role="status" aria-live="polite">Salvando os dados da marca…</p>}
        <button className="cta" type="button" disabled={enviando || !!aviso || uploadsAtivos > 0 || analisesAtivas > 0} onClick={salvar}>{enviando ? "Salvando dados…" : uploadsAtivos > 0 ? "Enviando materiais…" : analisesAtivas > 0 ? "Analisando cores…" : "Guardar e escolher horário"}</button>
      </>}
  </>;
}
