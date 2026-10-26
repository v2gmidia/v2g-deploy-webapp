"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { comTetoDeEspera, EsperaEstourou } from "@/lib/criativos/espera";
import { TAMANHO_MAXIMO_REVISAO } from "@/lib/criativos/revisao";
import { apresentarVeredito } from "@/lib/criativos/veredito";
import { analisarPecaAction } from "./actions";
import { solicitarRevisaoAction } from "./revisao-actions";
import { OBJETIVOS_DO_ENVIO, validarIntencaoDoEnvio, type ObjetivoDoEnvio } from "@/lib/criativos/intencao-envio";
import estilos from "./PedirRevisao.module.css";

type Aviso = { tom: "notice" | "warning" | "error"; texto: string; motivos?: string[] };
type Fase = "pronto" | "enviando" | "analisando";

export function PedirRevisao({ businessId, hoje, previa = false }: { businessId: string; hoje: string; previa?: boolean }) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [id, setId] = useState(() => crypto.randomUUID());
  const [fase, setFase] = useState<Fase>("pronto");
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const resumo = useRef<HTMLHeadingElement>(null);
  const [objetivo, setObjetivo] = useState<ObjetivoDoEnvio | "">("");
  const [promocao, setPromocao] = useState(false);
  const [validade, setValidade] = useState("");
  const [conferindo, setConferindo] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [incerto, setIncerto] = useState(false);
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const ajudaDoArquivo = useId();
  const erroDaValidade = useId();
  const validadeVencida = promocao && Boolean(validade) && validade < hoje;
  const preparoCompleto = Boolean(arquivo && objetivo && (!promocao || (validade && !validadeVencida)));
  useEffect(() => {
    if (!arquivo) { setImagemUrl(null); return; }
    const url = URL.createObjectURL(arquivo);
    setImagemUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);
  useEffect(() => { if (conferindo) resumo.current?.focus(); }, [conferindo]);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!arquivo || fase !== "pronto") return;
    if (arquivo.size < 1 || arquivo.size > TAMANHO_MAXIMO_REVISAO ||
      !["image/jpeg", "image/png"].includes(arquivo.type)) {
      setAviso({ tom: "error", texto: "Escolha uma imagem JPG ou PNG de até 9 MB." });
      return;
    }
    const validacao = validarIntencaoDoEnvio({ objetivo, promocao,
      validade: promocao ? validade : null, confirmado: conferindo ? confirmado : true }, hoje);
    if (!validacao.ok) { setAviso({ tom: "error", texto: validacao.erro }); return; }
    if (!conferindo) { setConferindo(true); setAviso(null); return; }
    if (previa) {
      setAviso({ tom: "notice", texto: "Conferência testada na prévia. Nenhum arquivo ou pedido foi gravado, analisado ou publicado." });
      return;
    }
    setFase("enviando");
    setAviso(null);
    let recebido = false;
    try {
      const dados = new FormData();
      dados.set("submissaoId", id);
      dados.set("businessId", businessId);
      dados.set("arquivo", arquivo);
      dados.set("objetivo", objetivo);
      dados.set("promocao", promocao ? "sim" : "nao");
      dados.set("validade", promocao ? validade : "");
      dados.set("confirmado", confirmado ? "sim" : "nao");
      const resultado = await solicitarRevisaoAction(dados);
      if (!resultado.ok) {
        setAviso({ tom: "error", texto: resultado.recado });
        return;
      }
      recebido = true;
      setIncerto(false);
      setConferindo(false);
      setConfirmado(false);
      setObjetivo(""); setPromocao(false); setValidade("");
      setArquivo(null);
      setId(crypto.randomUUID());
      if (campo.current) campo.current.value = "";
      if (!resultado.analisarAgora) {
        setAviso({ tom: "notice", texto: resultado.repetido
          ? "Esta peça já estava registrada para revisão. Ela não foi publicada."
          : "Peça recebida para revisão do gestor. Ela ainda não foi publicada." });
        return;
      }

      setFase("analisando");
      setAviso({ tom: "notice", texto: "Peça recebida. A análise automática está conferindo a imagem; ela ainda não foi publicada." });
      const dadosDaAnalise = new FormData();
      dadosDaAnalise.set("businessId", businessId);
      dadosDaAnalise.set("arquivos", arquivo);
      const analise = await comTetoDeEspera(analisarPecaAction(dadosDaAnalise));
      if (!analise.ok) {
        setAviso({ tom: "warning", texto: "Peça recebida para revisão, mas a análise automática não terminou. O gestor ainda pode conferir a imagem. Ela não foi publicada." });
        return;
      }
      const apresentacao = apresentarVeredito(analise.analise.veredito);
      if (!apresentacao) {
        setAviso({
          tom: "warning",
          texto: "Peça recebida para revisão, mas a análise automática não conseguiu avaliar a imagem. O gestor vai conferir; ela não foi publicada.",
          motivos: [analise.analise.motivo, ...analise.analise.recusados].filter((motivo): motivo is string => Boolean(motivo)),
        });
        return;
      }
      setAviso({
        tom: apresentacao.estilo === "v-fraco" ? "warning" : "notice",
        texto: `Análise automática concluída: ${apresentacao.titulo}. O gestor ainda vai revisar a peça antes de qualquer publicação.`,
        motivos: analise.analise.motivos,
      });
    } catch (motivo) {
      if (!recebido) setIncerto(true);
      setAviso(recebido
        ? { tom: "warning", texto: motivo instanceof EsperaEstourou
          ? "Peça recebida para revisão. A análise automática está demorando e esta tela parou de esperar. Confira a galeria antes de enviar de novo; ela não foi publicada."
          : "Peça recebida para revisão, mas a análise automática não terminou nesta tela. Confira a galeria antes de enviar de novo; ela não foi publicada." }
        : { tom: "error", texto: "A conexão foi interrompida. Confira a galeria antes de repetir o envio." });
    } finally {
      setFase("pronto");
      router.refresh();
    }
  }

  return <form onSubmit={enviar} className={estilos.formulario}>
    {previa && <p className="form-warning">Prévia local · sem envio, análise ou publicação.</p>}
    <ol className={estilos.etapa} aria-label="Etapas do envio">
      <li aria-current={!conferindo ? "step" : undefined}><span>1</span>Preparar criativo</li>
      <li aria-current={conferindo ? "step" : undefined}><span>2</span>Conferir e enviar</li>
    </ol>
    <div hidden={conferindo} className={estilos.preparo}>
    <div className={estilos.colunaImagem}>
      <h3>Sua imagem</h3>
      <label className={estilos.zonaArquivo}>
      <input className={estilos.entradaArquivo} ref={campo} type="file" accept="image/jpeg,image/png"
        aria-label={arquivo ? "Trocar imagem" : "Selecionar imagem"} aria-describedby={ajudaDoArquivo}
        required disabled={fase !== "pronto"}
        onChange={(evento) => {
          setArquivo(evento.target.files?.[0] ?? null);
          setId(crypto.randomUUID());
          setAviso(null);
        }} />
      {arquivo && imagemUrl ? <>
        <div className={estilos.imagemEscolhida}><img src={imagemUrl} alt="Prévia do criativo escolhido" /></div>
        <div className={estilos.arquivoEscolhido}><span><strong>{arquivo.name}</strong>
          <small>{arquivo.size < 1024 * 1024 ? `${Math.ceil(arquivo.size / 1024)} KB` : `${(arquivo.size / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`}</small></span>
          <span className={estilos.trocar}>Trocar imagem<IconeUpload /></span>
        </div>
      </> : <div className={estilos.escolhaVazia}>
        <span className={estilos.iconeImagem}><IconeImagem /></span>
        <strong>Seu próximo criativo começa aqui</strong>
        <span>Escolha a imagem pronta do seu negócio.</span>
        <span className={estilos.selecionar}><IconeUpload />Selecionar imagem</span>
      </div>}
      </label>
      <p id={ajudaDoArquivo} className={estilos.formato}>JPG ou PNG · até 9 MB</p>
    </div>
    <div className={estilos.configuracao}>
    <fieldset className={estilos.objetivos} disabled={fase !== "pronto"}>
      <legend>Qual o objetivo desse criativo?</legend>
      {OBJETIVOS_DO_ENVIO.map((opcao) => <label className={estilos.opcao} key={opcao.valor}>
        <input type="radio" name="objetivo" value={opcao.valor} checked={objetivo === opcao.valor}
          onChange={() => { setObjetivo(opcao.valor); setAviso(null); }} required />
        <span><strong>{opcao.rotulo}</strong><small>{opcao.apoio}</small></span>
      </label>)}
    </fieldset>
    <div className={estilos.promocao}>
      <label className={estilos.marcacao}><input type="checkbox" checked={promocao} disabled={fase !== "pronto"} onChange={(e) => {
        setPromocao(e.target.checked); setValidade(""); setAviso(null);
      }} />Este criativo tem uma promoção com prazo</label>
      {promocao && <label className={estilos.data}>Até quando a promoção vale?
        <input type="date" value={validade} min={hoje} required disabled={fase !== "pronto"}
          aria-invalid={validadeVencida} aria-describedby={validadeVencida ? erroDaValidade : undefined}
          onInput={(e) => setValidade(e.currentTarget.value)} onChange={(e) => setValidade(e.target.value)} />
        {validadeVencida
          ? <small id={erroDaValidade} className="form-error" role="alert">Essa data já passou. Escolha hoje ou uma data futura.</small>
          : <small>A data acompanha o pedido para o gestor conferir.</small>}
      </label>}
    </div>
    </div>
    <div className={estilos.rodapePreparo}><p>Confira os dados antes de enviar para revisão.</p>
      <button className="cta" type="submit" disabled={!preparoCompleto || fase !== "pronto"}>Conferir criativo<IconeSeta /></button>
    </div>
    </div>{conferindo && <>
      <h3 ref={resumo} tabIndex={-1}>Confira seu criativo</h3>
      <div className={estilos.resumo}>
        {imagemUrl && <img className={estilos.previa} src={imagemUrl} alt="Prévia do criativo escolhido" />}
        <dl><dt>Arquivo</dt><dd>{arquivo?.name}</dd><dt>Objetivo</dt><dd>{OBJETIVOS_DO_ENVIO.find((o) => o.valor === objetivo)?.rotulo}</dd>
          <dt>Promoção com prazo</dt><dd>{promocao ? `Até ${validade.split("-").reverse().join("/")}` : "Não informada"}</dd></dl>
      </div>
      <label className={estilos.marcacao}><input type="checkbox" required checked={confirmado}
        disabled={fase !== "pronto" || incerto} onChange={(e) => setConfirmado(e.target.checked)} />Conferi a imagem, o objetivo e a validade.</label>
      <div className={estilos.acoes}>
        <button type="button" className={`cta ghost ${estilos.voltar}`} disabled={fase !== "pronto" || incerto} onClick={() => {
          setConferindo(false); setConfirmado(false); setId(crypto.randomUUID()); setAviso(null);
        }}>Voltar e ajustar</button>
        <button className="cta" type="submit" disabled={!confirmado || fase !== "pronto"}>{fase === "enviando" ? "Enviando criativo..." : fase === "analisando" ? "Analisando imagem..." : incerto ? "Conferir o mesmo envio" : "Enviar para revisão"}</button>
      </div>
    </>}
    <p className={estilos.limite}>O gestor revisa antes da publicação. Enviar não coloca o anúncio no ar.</p>
    {incerto && <p className="form-warning">Não altere o pedido ainda. <a href="/criativos">Confira a galeria</a> ou tente confirmar o mesmo envio.</p>}
    {aviso && <div className={aviso.tom === "notice" ? "form-notice" : aviso.tom === "warning" ? "form-warning" : "form-error"} role="status">
      <p>{aviso.texto}</p>
      {aviso.motivos && aviso.motivos.length > 0 && <ul>{aviso.motivos.map((motivo, indice) => <li key={`${indice}-${motivo}`}>{motivo}</li>)}</ul>}
    </div>}
  </form>;
}

const IconeUpload = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M10 13V3M6 7l4-4 4 4M4 12v4h12v-4" /></svg>;
const IconeImagem = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 17 5-4 3.5 3 3-2.5 4.5 4" /></svg>;
const IconeSeta = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 10h13M11 5l5 5-5 5" /></svg>;
