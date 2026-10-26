"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { acompanharGeracaoAction } from "./geracao-actions";
import { RECADOS_GERACAO, rotuloDoAndamento, type AndamentoGeracao } from "@/lib/criativos/geracao/contrato-fila";
import styles from "./pedido-de-imagem.module.css";

type Operacao = "consultar" | "submeter" | "cancelar";
export type ConsultarGeracao = (businessId: string, requestId: string, operacao: Operacao) => Promise<AndamentoGeracao>;

/** Um controlador por pedido. Recarregar/montar só consulta; nunca envia POST. */
export function AndamentoDaImagem({ businessId, requestId, habilitada,
  consultar = acompanharGeracaoAction, simulacao = false,
}: { businessId: string; requestId: string; habilitada: boolean; consultar?: ConsultarGeracao; simulacao?: boolean }) {
  const router = useRouter();
  const [estado, setEstado] = useState<AndamentoGeracao | null>(null);
  const [pendente, setPendente] = useState(false);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const vivo = useRef(false);
  const ocupado = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const concluido = useRef(false);
  const ciclo = useRef(0);
  const consultarRef = useRef(consultar);
  consultarRef.current = consultar;

  const chamar = useCallback(async function consultarPedido(operacao: Operacao = "consultar") {
    if (!vivo.current || ocupado.current || !habilitada) return;
    ocupado.current = true;
    const iniciadoNoCiclo = ciclo.current;
    if (timer.current) clearTimeout(timer.current);
    setPendente(true);
    let resposta: AndamentoGeracao;
    try { resposta = await consultarRef.current(businessId, requestId, operacao); }
    catch { resposta = { ok: false, motivo: "conferir_estado" }; }
    if (!vivo.current || iniciadoNoCiclo !== ciclo.current) return;
    ocupado.current = false;
    if (resposta.ok && (resposta.businessId !== businessId || resposta.requestId !== requestId))
      resposta = { ok: false, motivo: "negocio_mudou" };
    setEstado(resposta);
    setPendente(false);
    setImagemFalhou(false);
    if (resposta.ok && resposta.status === "artifact_available" && !concluido.current) {
      concluido.current = true;
      router.refresh(); // Relê a biblioteca existente, sem nova submissão.
    }
    if (resposta.ok && resposta.consultarEm === 2000)
      timer.current = setTimeout(() => { void consultarPedido("consultar"); }, 2000);
  }, [businessId, requestId, habilitada, router]);

  useEffect(() => {
    ciclo.current += 1;
    vivo.current = true;
    ocupado.current = false;
    void chamar();
    return () => { vivo.current = false; ciclo.current += 1; if (timer.current) clearTimeout(timer.current); };
  }, [chamar]);

  if (!habilitada) return <p className="form-warning" role="status">{RECADOS_GERACAO.indisponivel}</p>;
  const falha = estado && !estado.ok ? estado.motivo : null;
  return <div className={styles.andamento} aria-label="Andamento da criação">
    {simulacao ? <p className={styles.avisoSimulacao}>Imagem fictícia para testar o fluxo. Nenhum anúncio será publicado.</p> : null}
    <div className={styles.estado} role="status" aria-live="polite" aria-atomic="true">
      {!estado ? <p>Consultando o pedido…</p> : estado.ok
        ? <><strong>{rotuloDoAndamento(estado.status, estado.simulada)}</strong>
          {estado.status === "queued" ? <p>Seu pedido está guardado e aguarda processamento.</p> : null}
          {estado.status === "storage_pending" ? <p>A imagem foi recebida. Estamos concluindo o arquivo, sem criar outra imagem.</p> : null}
          {estado.status === "reconciliation_required" ? <p>Estamos conferindo o que aconteceu. Nenhuma nova criação será iniciada por esta consulta.</p> : null}
          {estado.status === "failed" ? <p>O processamento foi encerrado. O pedido foi preservado para a equipe conferir.</p> : null}
          {estado.status === "cancelled" ? <p>Este pedido foi cancelado e não será reenviado automaticamente.</p> : null}
          {estado.status === "artifact_available" ? <p>{estado.simulada ? "Arquivo de teste guardado" : "Imagem guardada"} na biblioteca deste negócio. Nenhum anúncio foi publicado.</p> : null}</>
        : <p className={estado.motivo === "conferir_estado" ? "form-error" : "form-warning"}>{RECADOS_GERACAO[estado.motivo]}</p>}
    </div>
    {estado?.ok && estado.imagemUrl ? <div className={simulacao ? styles.resultadoSimulado : undefined}>
      {imagemFalhou ? <p className="form-warning" role="alert">Não foi possível abrir a imagem com o acesso atual. Consulte o andamento para conferir novamente.</p>
        : <img className={styles.resultado} src={estado.imagemUrl} alt={estado.simulada ? "Imagem fictícia do teste de criação" : "Imagem criada para este negócio"}
          width={1088} height={1088} onError={() => setImagemFalhou(true)} />}
      {simulacao && !imagemFalhou ? <span aria-hidden="true">SIMULAÇÃO LOCAL</span> : null}
    </div> : null}
    <div className={styles.acoes}>
      {estado && !estado.ok && estado.motivo === "nao_iniciado"
        && (estado.podeSubmeter === true || simulacao && estado.podeSubmeter === undefined) ? <button type="button" className="cta" disabled={pendente}
        onClick={() => { void chamar("submeter"); }}>{estado.tipoCriacao === "real" ? "Criar imagem" : "Criar imagem de teste"}</button> : null}
      <button type="button" className="cta ghost" disabled={pendente || falha === "negocio_mudou"}
        onClick={() => { void chamar("consultar"); }}>{pendente ? "Atualizando…" : "Atualizar andamento"}</button>
      {estado?.ok && estado.status === "queued" && estado.simulada ? <button type="button" className="cta ghost" disabled={pendente}
        onClick={() => { void chamar("cancelar"); }}>Cancelar pedido na fila</button> : null}
    </div>
  </div>;
}
