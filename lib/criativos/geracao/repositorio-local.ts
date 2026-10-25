import "server-only";
import type { PedidoDeImagem } from "../pedido-imagem.ts";
import { canonico, sha256, type SnapshotGeracao } from "./contexto.ts";

/** Implementação SQL de laboratório. Não abrir conexão Supabase/produção por esta porta. */
export interface SqlDescartavel {
  readonly destino: "postgres_descartavel";
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}
export type EstadoDaGeracao = "running" | "storage_pending" | "artifact_available" | "failed" | "reconciliation_required";
export interface ExecucaoGeracao {
  id: string; request_id: string; business_id: string; requested_by: string; attempt_id: string;
  snapshot: SnapshotGeracao; snapshot_hash: string; status: EstadoDaGeracao;
  lease_until: Date | string; result_bytes: Uint8Array | null; artifact_path: string | null;
  artifact_sha256: string | null; largura: number | null; altura: number | null;
  estimated_minor: number; reserved_minor: number; currency: "USD";
  reservation_state: "reserved" | "closed_simulated" | "retained_uncertain";
  billed_minor: null; usage_reported: null; simulated: true;
}
const COLUNAS = "id,request_id,business_id,requested_by,attempt_id,snapshot,snapshot_hash,status,lease_until,result_bytes,artifact_path,artifact_sha256,largura,altura,estimated_minor,reserved_minor,currency,reservation_state,billed_minor,usage_reported,simulated";

export class RepositorioGeracaoLocal {
  constructor(private readonly sql: SqlDescartavel) {
    if (sql.destino !== "postgres_descartavel") throw new Error("somente_sql_descartavel");
  }
  async pedido(id: string, businessId: string, profileId: string): Promise<PedidoDeImagem | null> {
    const r = await this.sql.query<PedidoDeImagem>(`select r.id,r.business_id,r.requested_by,r.content_hash,r.payload,r.status,r.created_at
      from public.creative_generation_requests r join public.businesses b on b.id=r.business_id
      where r.id=$1 and r.business_id=$2 and r.requested_by=$3 and b.profile_id=$3`, [id,businessId,profileId]);
    return r.rows[0] ?? null;
  }
  async buscar(requestId: string, businessId: string, profileId: string): Promise<ExecucaoGeracao | null> {
    const r = await this.sql.query<ExecucaoGeracao>(`select ${COLUNAS} from public.creative_generation_runs
      where request_id=$1 and business_id=$2 and requested_by=$3`, [requestId,businessId,profileId]);
    return r.rows[0] ?? null;
  }
  async iniciar(snapshot: SnapshotGeracao, id: string, attemptId: string, agora: Date) {
    // UNIQUE(request_id) arbitra disputa no banco; nenhuma geração antes do RETURNING vencedor.
    const r = await this.sql.query<ExecucaoGeracao>(`insert into public.creative_generation_runs
      (id,request_id,business_id,requested_by,attempt_id,snapshot,snapshot_hash,lease_until,estimated_minor,reserved_minor,budget_minor)
      select $1,r.id,r.business_id,r.requested_by,$5,$6,$7,$8,$9,$10,$11
      from public.creative_generation_requests r join public.businesses b on b.id=r.business_id
      where r.id=$2 and r.business_id=$3 and r.requested_by=$4 and b.profile_id=$4 and r.content_hash=$12
      on conflict(request_id) do nothing returning ${COLUNAS}`,
    [id,snapshot.requestId,snapshot.businessId,snapshot.requestedBy,attemptId,canonico(snapshot),sha256(canonico(snapshot)),
      new Date(agora.getTime()+120_000).toISOString(),snapshot.custo.estimativaMinor,snapshot.custo.reservaMinor,
      snapshot.custo.limiteMinor,snapshot.requestHash]);
    return { adquiriu: r.rows.length === 1,
      execucao: r.rows[0] ?? await this.buscar(snapshot.requestId,snapshot.businessId,snapshot.requestedBy) };
  }
  async receber(e: ExecucaoGeracao, bytes: Uint8Array, dimensoes: { largura: number; altura: number }) {
    const caminho = `geracao-local/${e.business_id}/${e.id}/${e.attempt_id}.png`;
    const r = await this.sql.query<ExecucaoGeracao>(`update public.creative_generation_runs
      set status='storage_pending',result_bytes=$3,artifact_sha256=$4,artifact_path=$5,largura=$6,altura=$7
      where id=$1 and attempt_id=$2 and snapshot_hash=$8 and status in ('running','reconciliation_required') returning ${COLUNAS}`,
    [e.id,e.attempt_id,bytes,sha256(bytes),caminho,dimensoes.largura,dimensoes.altura,e.snapshot_hash]);
    return r.rows[0] ?? null;
  }
  async incerto(e: ExecucaoGeracao) {
    await this.sql.query(`update public.creative_generation_runs set status='reconciliation_required',
      reservation_state='retained_uncertain' where id=$1 and attempt_id=$2 and status='running'`, [e.id,e.attempt_id]);
  }
  async falhouSemEnvio(e: ExecucaoGeracao) {
    await this.sql.query(`update public.creative_generation_runs set status='failed',reservation_state='closed_simulated'
      where id=$1 and attempt_id=$2 and status='running'`, [e.id,e.attempt_id]);
  }
  async vincularBiblioteca(e: ExecucaoGeracao): Promise<void> {
    // Arquivo é guardado/conferido antes. INSERT e vínculo/status são um único statement atômico.
    const r = await this.sql.query<{ id: string }>(`with permitido as (
      select * from public.creative_generation_runs where id=$1 and attempt_id=$2
      and status='storage_pending' and artifact_sha256=$3
    ), novo as (
      insert into public.creatives(id,business_id,type,file_name,storage_path,copy,uso,status)
      select id,business_id,'image','SIMULADO-LOCAL-'||id||'.png',artifact_path,
        jsonb_build_object('generation',jsonb_build_object('version',1,'simulated',true,'runId',id,
        'attemptId',attempt_id,'requestId',request_id,'snapshotHash',snapshot_hash,'artifactHash',artifact_sha256)),
        'campanha','draft' from permitido on conflict(id) do nothing returning id
    ), alvo as (
      select id from novo union all
      select c.id from public.creatives c join permitido p on c.id=p.id
        where c.business_id=p.business_id and c.storage_path=p.artifact_path
        and c.copy->'generation'->>'artifactHash'=p.artifact_sha256
        and c.copy->'generation'->>'snapshotHash'=p.snapshot_hash
        and c.copy->'generation'->>'attemptId'=p.attempt_id::text
        and c.copy->'generation'->'simulated'='true'::jsonb
    ) update public.creative_generation_runs set status='artifact_available',reservation_state='closed_simulated'
      where id=$1 and status='storage_pending' and id in(select id from alvo) returning id`,
    [e.id,e.attempt_id,e.artifact_sha256]);
    if (!r.rows.length) {
      const atual = await this.buscar(e.request_id,e.business_id,e.requested_by);
      if (atual?.status !== "artifact_available" || atual.artifact_sha256 !== e.artifact_sha256)
        throw new Error("vinculo_pendente");
    }
  }
  async biblioteca(businessId: string, profileId: string) {
    return (await this.sql.query<ExecucaoGeracao & { file_name: string }>(`select ${COLUNAS.split(",").map(c=>`r.${c}`).join(",")},c.file_name
      from public.creative_generation_runs r join public.creatives c on c.id=r.id
      join public.businesses b on b.id=r.business_id
      where r.business_id=$1 and r.requested_by=$2 and b.profile_id=$2 and r.status='artifact_available'
      and c.business_id=r.business_id and c.storage_path=r.artifact_path
      and c.copy->'generation'->>'snapshotHash'=r.snapshot_hash
      and c.copy->'generation'->>'artifactHash'=r.artifact_sha256
      and c.copy->'generation'->>'attemptId'=r.attempt_id::text
      and c.copy->'generation'->>'runId'=r.id::text and c.copy->'generation'->>'requestId'=r.request_id::text
      and c.copy->'generation'->'simulated'='true'::jsonb and c.copy->'generation'->>'version'='1'
      and c.uso='campanha' and c.arquivado_em is null order by r.created_at desc limit 120`,
    [businessId,profileId])).rows;
  }
}
