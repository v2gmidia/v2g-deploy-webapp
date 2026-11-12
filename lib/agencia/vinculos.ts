import { UUID_AGENCIA } from "./contexto.ts";

export const COLUNAS_VINCULO = "agency_business_id, advertiser_business_id, owner_profile_id, advertiser_name, legacy_shared_business, revoked_at";
export type VinculoAnunciante = {
  agency_business_id: string; advertiser_business_id: string; owner_profile_id: string;
  advertiser_name: string; legacy_shared_business: boolean; revoked_at: string | null;
};

/** Relações explícitas; nome, onboarding e cookie nunca criam parentesco. */
export function conferirVinculos(linhas: unknown, perfilId: string): VinculoAnunciante[] | null {
  if (!UUID_AGENCIA.test(perfilId) || !Array.isArray(linhas) || linhas.length > 500) return null;
  const ids = new Set<string>();
  for (const r of linhas) {
    if (!r || r.owner_profile_id !== perfilId || !UUID_AGENCIA.test(r.agency_business_id)
      || !UUID_AGENCIA.test(r.advertiser_business_id) || typeof r.advertiser_name !== "string"
      || !r.advertiser_name.trim() || r.advertiser_name.length > 200 || r.revoked_at !== null
      || typeof r.legacy_shared_business !== "boolean"
      || (r.agency_business_id === r.advertiser_business_id) !== r.legacy_shared_business
      || ids.has(r.advertiser_business_id)) return null;
    ids.add(r.advertiser_business_id);
  }
  // Uma agência não pode ser anunciante de outra agência. Sem herança transitiva.
  if (linhas.some(r => !r.legacy_shared_business && linhas.some(p => p.agency_business_id === r.advertiser_business_id))) return null;
  return linhas;
}

export function raizDaAgencia(vinculos: VinculoAnunciante[], businessId: string): string | null {
  return vinculos.find(v => v.advertiser_business_id === businessId)?.agency_business_id
    ?? (vinculos.some(v => v.agency_business_id === businessId) ? businessId : null);
}

/** Só prepara o trabalho interno QA. Não cria direito financeiro, acesso Meta ou ativação. */
export function ampliarCarteiraQa<T extends { id: string; name: string }>(entrada: {
  negocios: T[]; liberados: { id: string; name: string }[]; vinculos: VinculoAnunciante[];
  paisPiloto: string[]; negociosComPedido: string[];
}): { id: string; name: string }[] {
  const base = new Set(entrada.liberados.map(n => n.id));
  const bloqueados = new Set(entrada.negociosComPedido);
  const permitidos = new Set(entrada.vinculos.filter(v => base.has(v.agency_business_id)
    && entrada.paisPiloto.includes(v.agency_business_id) && !bloqueados.has(v.advertiser_business_id))
    .map(v => v.advertiser_business_id));
  return entrada.negocios.filter(n => base.has(n.id) || permitidos.has(n.id)).map(({ id, name }) => ({ id, name }));
}

/** Não aumenta a lista elegível e não interfere numa escolha explícita. */
export function raizUnicaElegivel(vinculos: VinculoAnunciante[], liberados: { id: string }[]): string | null {
  const ids = new Set(liberados.map(n => n.id));
  const pais = [...new Set(vinculos.filter(v => ids.has(v.agency_business_id))
    .map(v => v.agency_business_id))];
  return pais.length === 1 && liberados.every(n => n.id === pais[0]
    || vinculos.some(v => v.agency_business_id === pais[0] && v.advertiser_business_id === n.id)) ? pais[0]! : null;
}
