import "server-only";
import { randomUUID } from "node:crypto";
import { hojeEmSaoPaulo } from "../intencao-envio.ts";
import { canonico, congelarContexto, sha256, snapshotConfere,
  type ContextoDaGeracao, type SnapshotGeracao } from "./contexto.ts";
import { conferirPngLocal } from "./png-local.ts";
import { FalhaDoProvedor, type ProvedorDeImagem } from "./provedor.ts";
import { RepositorioGeracaoLocal, type ExecucaoGeracao } from "./repositorio-local.ts";

export interface SessaoGeracao { profileId: string; businessId: string }
export interface StorageDoEnsaio {
  guardarSeAusente(caminho: string, bytes: Uint8Array, hash: string): Promise<void>;
  ler(caminho: string): Promise<Uint8Array>;
}
export interface PortasGeracaoLocal {
  habilitado?: boolean;
  sessao(): Promise<SessaoGeracao | null>;
  carregarContexto(requestId: string, sessao: SessaoGeracao): Promise<ContextoDaGeracao | null>;
  /** Consentimento/propriedade atuais: snapshot histórico não autoriza uso revogado. */
  autorizarSnapshot(snapshot: SnapshotGeracao, sessao: SessaoGeracao): Promise<boolean>;
  repositorio: RepositorioGeracaoLocal;
  storage: StorageDoEnsaio;
  provedor: ProvedorDeImagem;
  agora?: () => Date;
}
type FalhaLocal = "desligado" | "acesso_negado" | "contexto_bloqueado" | "indisponivel";
export type ResultadoGeracaoLocal = { ok: false; motivo: FalhaLocal; mensagem: string }
  | { ok: true; simulated: true; runId: string; attemptId: string; version: 1;
      status: ExecucaoGeracao["status"]; mensagem: string };
const mensagens: Record<FalhaLocal, string> = {
  desligado: "Ensaio simulado indisponível neste ambiente. Nenhuma geração foi iniciada.",
  acesso_negado: "Não foi possível autorizar este pedido para o negócio selecionado.",
  contexto_bloqueado: "O contexto ou as permissões precisam de conferência antes de gerar.",
  indisponivel: "Não foi possível conferir a execução. Consulte seu estado antes de tentar novamente.",
};
const negar = (motivo: FalhaLocal) => ({ ok: false as const, motivo, mensagem: mensagens[motivo] });
const uuid = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
function liberado(portas: PortasGeracaoLocal) {
  // Não aceitar NODE_ENV de um formulário. Não há rota, flag comercial ou worker remoto ligado aqui.
  return process.env.NODE_ENV === "development" && portas.habilitado === true
    && portas.provedor.modo === "simulado" && portas.provedor.id === "fake-local-v1";
}
function resumo(e: ExecucaoGeracao): ResultadoGeracaoLocal {
  const avisos: Record<ExecucaoGeracao["status"], string> = {
    running: "SIMULAÇÃO LOCAL: execução em andamento; não inicie outra geração.",
    storage_pending: "SIMULAÇÃO LOCAL: resultado preservado; falta concluir o armazenamento.",
    artifact_available: "SIMULAÇÃO LOCAL: arquivo de teste disponível. Não foi criado por IA nem aprovado/publicado.",
    reconciliation_required: "SIMULAÇÃO LOCAL: resultado incerto; exige reconciliação, sem geração automática adicional.",
    failed: "SIMULAÇÃO LOCAL: provedor recusou antes do envio; não houve nova tentativa automática.",
  };
  return { ok: true, simulated: true, runId: e.id, attemptId: e.attempt_id,
    version: 1, status: e.status, mensagem: avisos[e.status] };
}

/** Fatia executável de laboratório, sem rota/botão de cliente nem acesso a provedor real. */
export async function executarGeracaoLocal(entrada: { requestId: string; businessId: string },
  portas: PortasGeracaoLocal): Promise<ResultadoGeracaoLocal> {
  if (!liberado(portas)) return negar("desligado");
  try {
    const sessao = await portas.sessao();
    if (!sessao || !uuid(sessao.profileId) || !uuid(entrada.requestId) || !uuid(entrada.businessId)
      || sessao.businessId !== entrada.businessId) return negar("acesso_negado");
    const agora = (portas.agora ?? (() => new Date()))();
    const pedido = await portas.repositorio.pedido(entrada.requestId, sessao.businessId, sessao.profileId);
    if (!pedido) return negar("acesso_negado");
    if (pedido.payload.promocao && (!pedido.payload.validade || pedido.payload.validade < hojeEmSaoPaulo(agora)))
      return negar("contexto_bloqueado");
    let execucao = await portas.repositorio.buscar(pedido.id, sessao.businessId, sessao.profileId);
    let adquiriu = false;
    if (!execucao) {
      const contexto = await portas.carregarContexto(pedido.id, sessao);
      let snapshot: SnapshotGeracao;
      try { if (!contexto) return negar("contexto_bloqueado"); snapshot = congelarContexto(pedido, contexto); }
      catch { return negar("contexto_bloqueado"); }
      if (!await portas.autorizarSnapshot(snapshot, sessao)) return negar("contexto_bloqueado");
      const inicio = await portas.repositorio.iniciar(snapshot, randomUUID(), randomUUID(), agora);
      execucao = inicio.execucao; adquiriu = inicio.adquiriu;
      if (!execucao || execucao.snapshot_hash !== sha256(canonico(snapshot))) return negar("contexto_bloqueado");
    }
    if (!snapshotConfere(execucao.snapshot, execucao.snapshot_hash, pedido)
      || !await portas.autorizarSnapshot(execucao.snapshot, sessao)) return negar("contexto_bloqueado");

    if (adquiriu) {
      try {
        const saida = await portas.provedor.gerar({ snapshot: structuredClone(execucao.snapshot),
          attemptId: execucao.attempt_id, idempotencyKey: `${execucao.id}:${execucao.attempt_id}` });
        if (saida.simulated !== true || saida.mime !== "image/png" || saida.billedMinor !== null
          || saida.usageReported !== null) throw new Error("saida_divergente");
        const dimensoes = conferirPngLocal(saida.bytes);
        execucao = await portas.repositorio.receber(execucao, saida.bytes, dimensoes) ?? execucao;
      } catch (erro) {
        // Só a falha classificada ANTES de envio encerra sem resultado incerto.
        if (erro instanceof FalhaDoProvedor && erro.certeza === "nao_enviado")
          await portas.repositorio.falhouSemEnvio(execucao);
        else await portas.repositorio.incerto(execucao);
        const atual = await portas.repositorio.buscar(pedido.id, sessao.businessId, sessao.profileId);
        if (!atual) return negar("indisponivel");
        execucao = atual; // staging pode ter sido confirmado, mas a resposta ter se perdido.
      }
    } else if (execucao.status === "running" && new Date(execucao.lease_until).getTime() <= agora.getTime()) {
      await portas.repositorio.incerto(execucao); // Worker morto não autoriza uma segunda chamada.
      execucao = await portas.repositorio.buscar(pedido.id, sessao.businessId, sessao.profileId) ?? execucao;
    }

    if (execucao.status === "storage_pending") {
      if (!await portas.autorizarSnapshot(execucao.snapshot, sessao)) return negar("contexto_bloqueado");
      try {
        if (!execucao.result_bytes || !execucao.artifact_path
          || sha256(execucao.result_bytes) !== execucao.artifact_sha256) throw new Error("resultado_divergente");
        const dimensoes = conferirPngLocal(execucao.result_bytes);
        if (dimensoes.largura !== execucao.largura || dimensoes.altura !== execucao.altura)
          throw new Error("dimensoes_divergentes");
        await portas.storage.guardarSeAusente(execucao.artifact_path, execucao.result_bytes, execucao.artifact_sha256!);
        const bytes = await portas.storage.ler(execucao.artifact_path);
        if (sha256(bytes) !== execucao.artifact_sha256) throw new Error("storage_divergente");
        await portas.repositorio.vincularBiblioteca(execucao);
      } catch { /* Resultado durável permanece pendente; não chamar gerador para consertar Storage. */ }
      execucao = await portas.repositorio.buscar(pedido.id, sessao.businessId, sessao.profileId) ?? execucao;
    }
    return resumo(execucao);
  } catch { return negar("indisponivel"); }
}

/** Usa a biblioteca EXISTENTE (creatives), não um segundo acervo. Sem URLs públicas/assinadas em estado. */
export async function carregarBibliotecaGeradaLocal(businessId: string, portas: PortasGeracaoLocal) {
  if (!liberado(portas)) return { ok: false as const, itens: [] };
  try {
    const sessao = await portas.sessao();
    if (!sessao || sessao.businessId !== businessId) return { ok: false as const, itens: [] };
    const linhas = await portas.repositorio.biblioteca(businessId, sessao.profileId);
    const itens = [];
    for (const e of linhas) {
      const pedido = await portas.repositorio.pedido(e.request_id, businessId, sessao.profileId);
      if (!pedido || !snapshotConfere(e.snapshot,e.snapshot_hash,pedido)
        || !await portas.autorizarSnapshot(e.snapshot,sessao) || !e.artifact_path) throw new Error("acesso_negado");
      const bytes = await portas.storage.ler(e.artifact_path);
      if (sha256(bytes) !== e.artifact_sha256) throw new Error("arquivo_divergente");
      const dimensoes = conferirPngLocal(bytes);
      if (dimensoes.largura !== e.largura || dimensoes.altura !== e.altura) throw new Error("dimensoes_divergentes");
      itens.push({ id: e.id, businessId, requestId: e.request_id, attemptId: e.attempt_id, version: 1 as const,
        hash: e.artifact_sha256!, snapshotHash: e.snapshot_hash, nome: e.file_name, bytes,
        simulated: true as const, aprovacao: null, publicado: false as const,
        custo: { simulated: true, currency: e.currency, estimatedMinor: e.estimated_minor,
          reservedMinor: e.reserved_minor, billedMinor: null, usageReported: null } });
    }
    return { ok: true as const, itens };
  } catch { return { ok: false as const, itens: [] }; }
}
