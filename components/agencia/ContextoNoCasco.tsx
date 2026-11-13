"use client";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { NavItem } from "@/components/ui/NavItem";
import { hrefDoCliente, retornoDaCarteira, UUID_AGENCIA } from "@/lib/agencia/contexto";

export type ContextoDoCascoAgencia = { agencia: string; businessId?: string; anunciante?: string };

export function NavegacaoAgencia({ businessId, inicio, criativos, anuncios }: { businessId?: string; inicio: ReactNode; criativos: ReactNode; anuncios: ReactNode }) {
  const busca = useSearchParams(), pathname = usePathname();
  const valores = busca.getAll("cliente");
  const detalhe = Boolean(businessId && valores.length === 1 && valores[0] === businessId && UUID_AGENCIA.test(businessId));
  const retorno = retornoDaCarteira(Object.fromEntries(busca.entries()), true);
  return <>
    <NavItem href={detalhe && businessId ? hrefDoCliente("/inicio", businessId, retorno) : "/inicio"} ativo={pathname === "/inicio"} icone={inicio}>Início</NavItem>
    <NavItem href={detalhe && businessId ? hrefDoCliente("/criativos", businessId, retorno) : "/criativos"} ativo={pathname === "/criativos"} icone={criativos}>Criativos</NavItem>
    <NavItem href={detalhe && businessId ? hrefDoCliente("/anuncios", businessId, retorno) : "/anuncios"} ativo={pathname === "/anuncios"} icone={anuncios}>Anúncios</NavItem>
  </>;
}
export function NomeDoContextoAgencia({ businessId, agencia, anunciante }: ContextoDoCascoAgencia) {
  const busca = useSearchParams(), pathname = usePathname();
  const valores = busca.getAll("cliente");
  const detalhe = businessId && anunciante && ["/inicio", "/criativos", "/anuncios"].includes(pathname) && valores.length === 1 && valores[0] === businessId;
  return <b>{detalhe ? `${agencia} / ${anunciante}` : `${agencia} · Agência`}</b>;
}
