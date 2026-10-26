"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AndamentoDaImagem, type ConsultarGeracao } from "@/app/(protected)/criativos/AndamentoDaImagem";
import { GaleriaCriativos, type ItemDaGaleria } from "@/app/(protected)/criativos/GaleriaCriativos";
import type { AndamentoGeracao } from "@/lib/criativos/geracao/contrato-fila";
import styles from "./Previa.module.css";

const BA = "33333333-3333-4333-8333-333333333333", BB = "44444444-4444-4444-8444-444444444444";
const ORIGEM = "http://127.0.0.1:3106";
type Evidencia = { businessId: string; requestId: string; pedidos: string[]; jobs: number; recibos: number; posts: number; gets: number };
export function PreviaFila() {
  const [businessId, setBusinessId] = useState(BA);
  const [evidencia, setEvidencia] = useState<Evidencia | null>(null);
  const [erro, setErro] = useState("");
  const [biblioteca, setBiblioteca] = useState<{ businessId: string; itens: ItemDaGaleria[] } | null>(null);
  const [leituraBiblioteca, setLeituraBiblioteca] = useState<"carregando" | "pronta" | "falhou">("carregando");
  const consultaBiblioteca = useRef(0);
  const [versao, setVersao] = useState(0);
  const [leitura, setLeitura] = useState<"carregando" | "pronta" | "falhou">("carregando");
  const [ocupado, setOcupado] = useState(false);
  const consultaAtual = useRef(0);
  const atualizar = useCallback(async () => {
    const consulta = ++consultaAtual.current;
    setLeitura("carregando");
    try {
      const r = await fetch(`${ORIGEM}/evidencias?negocio=${businessId}`, { cache: "no-store" });
      if (!r.ok) throw Error();
      const dados: Evidencia = await r.json();
      if (consulta !== consultaAtual.current) return;
      if (dados.businessId !== businessId || !Array.isArray(dados.pedidos)
        || dados.pedidos.some((id) => typeof id !== "string")) throw Error();
      setEvidencia(dados);setErro("");setLeitura("pronta");
    } catch {
      if (consulta !== consultaAtual.current) return;
      setLeitura("falhou");
      setErro("Não foi possível recuperar os pedidos. Consulte novamente; não é necessário preparar outro pedido.");
    }
  }, [businessId]);
  const atualizarBiblioteca = useCallback(async (biz: string) => {
    const consulta = ++consultaBiblioteca.current;
    setLeituraBiblioteca("carregando");
    try {
      const r = await fetch(`${ORIGEM}/biblioteca?negocio=${biz}`, { cache: "no-store" });
      if (!r.ok) throw Error();
      const dados: { businessId: string; itens: ItemDaGaleria[] } = await r.json();
      if (consulta !== consultaBiblioteca.current) return;
      if (dados.businessId !== biz || !Array.isArray(dados.itens)) throw Error();
      setBiblioteca({ businessId: biz, itens: dados.itens.map(item => ({ ...item,
        imagemUrl: item.imagemUrl ? ORIGEM + item.imagemUrl : null })) });
      setLeituraBiblioteca("pronta");
    } catch {
      if (consulta === consultaBiblioteca.current) setLeituraBiblioteca("falhou");
    }
  }, []);
  useEffect(() => {
    void atualizar();
    void atualizarBiblioteca(businessId);
    return () => { consultaAtual.current += 1;consultaBiblioteca.current += 1; };
  }, [atualizar, atualizarBiblioteca, businessId]);
  async function comando(path: string, body = {}) {
    const r = await fetch(ORIGEM + path, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, businessId }) });
    if (!r.ok) throw Error();return r.json();
  }
  const consultar: ConsultarGeracao = useCallback(async (biz, pedido, operacao) => {
    try {
      const r = await fetch(`${ORIGEM}/andamento`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz, requestId: pedido, operacao }) });
      const resultado: AndamentoGeracao = await r.json();
      return resultado.ok && resultado.imagemUrl ? { ...resultado, imagemUrl: ORIGEM + resultado.imagemUrl } : resultado;
    } finally { void atualizarBiblioteca(biz); }
  }, [atualizarBiblioteca]);
  const itens = biblioteca?.businessId === businessId ? biblioteca.itens : [];
  async function executar(path: string, body = {}) {
    setOcupado(true);
    try {
      const resposta = await comando(path, body);
      if (resposta.ok === false) throw Error();
      if (path === "/reset") { setBiblioteca(null);setEvidencia(null);setVersao(v => v + 1); }
      await Promise.all([atualizar(), atualizarBiblioteca(businessId)]);
    } catch { setErro("Não foi possível executar o passo do ensaio local."); }
    finally { setOcupado(false); }
  }
  const evidenciaDoNegocio = evidencia?.businessId === businessId ? evidencia : null;
  const pedidoRetomado = evidenciaDoNegocio?.pedidos[0] ?? null;
  const negocio = businessId === BA ? "A" : "B";
  return <div className={`app-shell v2g-editorial ${styles.shell}`}>
    <main className={`${styles.pagina} criativos-editorial`}>
      <header className={styles.cabecalho}>
        <div>
          <h1>Criação de imagem</h1>
          <p>Acompanhe um pedido fictício do início até a biblioteca, sem publicar anúncio ou chamar um serviço pago.</p>
        </div>
        <div className={styles.contexto} aria-label="Contexto do ensaio">
          <span>Ensaio local</span>
          <strong>Negócio {negocio} — fictício</strong>
        </div>
      </header>

      <section className={styles.fluxo} aria-labelledby="pedido-ensaio-titulo">
        <div className={styles.fluxoTopo}>
          <div>
            <h2 id="pedido-ensaio-titulo">Seu pedido</h2>
            <p>O pedido fica ligado a este negócio e pode ser recuperado depois de recarregar a página.</p>
          </div>
          <div className={styles.acoesTopo}>
            <button className="cta ghost" disabled={ocupado} onClick={() => { consultaAtual.current += 1;consultaBiblioteca.current += 1;setLeitura("carregando");setLeituraBiblioteca("carregando");setBiblioteca(null);setEvidencia(null);setBusinessId(businessId === BA ? BB : BA); }}>Trocar negócio</button>
            <button className="cta ghost" disabled={ocupado} onClick={() => { void executar("/reset"); }}>Recomeçar ensaio</button>
          </div>
        </div>

        {erro ? <p className="form-error" role="alert">{erro}</p> : null}
        {!pedidoRetomado && leitura === "pronta" ? <div className={styles.inicio}>
          <div><strong>Nenhum pedido em andamento</strong><p>Prepare um pedido para conferir a criação e a biblioteca deste negócio.</p></div>
          <button className="cta" disabled={ocupado} onClick={() => { void executar("/preparar"); }}>Preparar pedido de teste</button>
        </div> : null}
        {pedidoRetomado ? <AndamentoDaImagem key={`${businessId}:${pedidoRetomado}:${versao}`} businessId={businessId}
          requestId={pedidoRetomado} habilitada consultar={consultar} simulacao />
          : leitura === "carregando" ? <p className={styles.carregando} role="status">Recuperando o pedido deste negócio…</p>
          : leitura === "falhou" ? <div className={styles.recuperacao}><p role="status">Não foi possível recuperar o pedido agora. Nada foi apagado.</p><button className="cta ghost" onClick={() => { void atualizar(); }}>Tentar novamente</button></div>
          : null}
      </section>

      <details className={styles.laboratorio}>
        <summary><span>Ferramentas do ensaio</span><small>Simule falhas e confira evidências técnicas</small></summary>
        <div className={styles.laboratorioCorpo}>
          <div className={styles.gradeTecnica}>
            <button className="cta ghost" onClick={() => {void executar("/worker");}}>Processar fila</button>
            <button className="cta ghost" onClick={() => {void executar("/controle", {caso: "perder_resposta"});}}>Simular resposta perdida</button>
            <button className="cta ghost" onClick={() => {void executar("/controle", {caso: "falhar"});}}>Recusar contexto</button>
            <button className="cta ghost" onClick={() => {void executar("/controle", {caso: "esgotar"});}}>Esgotar tentativas</button>
            <button className="cta ghost" onClick={() => {void executar("/controle", {caso: "off"});}}>Desligar criação</button>
            <button className="cta ghost" onClick={() => {void executar("/controle", {caso: "on"});}}>Religar criação</button>
            <button className="cta ghost" onClick={() => {void executar("/controle", {caso: "biblioteca_off"});}}>Indisponibilizar biblioteca</button>
            <button className="cta ghost" onClick={() => {void executar("/controle", {caso: "biblioteca_on"});}}>Restaurar biblioteca</button>
            <button className="cta ghost" onClick={() => {void atualizar();}}>Atualizar evidências</button>
          </div>
          <dl className={styles.evidencias}>
            <div><dt>Pedido</dt><dd data-testid="fila-pedido">{pedidoRetomado ?? "Nenhum"}</dd></div>
            <div><dt>Trabalhos</dt><dd>{evidenciaDoNegocio?.jobs ?? "—"}</dd></div>
            <div><dt>Recibos fictícios</dt><dd>{evidenciaDoNegocio?.recibos ?? "—"}</dd></div>
            <div><dt>Envios</dt><dd>{evidenciaDoNegocio?.posts ?? "—"}</dd></div>
            <div><dt>Consultas</dt><dd data-testid="fila-evidencias">{evidenciaDoNegocio?.gets ?? "—"}</dd></div>
          </dl>
        </div>
      </details>

      <GaleriaCriativos key={businessId} itens={itens} previa falhou={leituraBiblioteca === "falhou"}
        carregando={leituraBiblioteca === "carregando"} />
    </main>
  </div>;
}
