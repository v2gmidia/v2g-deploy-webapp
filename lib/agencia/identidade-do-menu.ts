type MarcaDaAgencia = {
  status: string;
  agencyBusinessId?: string;
  marcaAgenciaCompartilhada?: boolean;
};

/** Só apresentação de uma relação já conferida pelo servidor. Não move arquivo. */
export function identidadeDoMenuDaAgencia<T extends { id: string; logoUrl: string | null }>(
  negocios: T[], agencia: MarcaDaAgencia | null | undefined,
): T[] {
  if (agencia?.status !== "agencia" || agencia.marcaAgenciaCompartilhada !== true) return negocios;
  return negocios.map(negocio => negocio.id === agencia.agencyBusinessId
    ? { ...negocio, logoUrl: null } : negocio);
}
