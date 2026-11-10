"use client";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { NavItem } from "@/components/ui/NavItem";
import { hrefDoCliente, retornoDaCarteira, UUID_AGENCIA } from "@/lib/agencia/contexto";

export function NavegacaoAgencia({ businessId, inicio, criativos }: { businessId: string; inicio: ReactNode; criativos: ReactNode }) {
  const busca = useSearchParams(), pathname = usePathname();
  const valores = busca.getAll("cliente");
  const detalhe = valores.length === 1 && valores[0] === businessId && UUID_AGENCIA.test(businessId);
  const retorno = retornoDaCarteira(Object.fromEntries(busca.entries()), true);
  return <>
    <NavItem href={detalhe ? hrefDoCliente("/inicio", businessId, retorno) : "/inicio"} ativo={pathname === "/inicio"} icone={inicio}>Início</NavItem>
    <NavItem href={detalhe ? hrefDoCliente("/criativos", businessId, retorno) : "/criativos"} ativo={pathname === "/criativos"} icone={criativos}>Criativos</NavItem>
  </>;
}
export function NomeDoContextoAgencia({ businessId, agencia, anunciante }: { businessId: string; agencia: string; anunciante: string }) {
  const busca = useSearchParams(), pathname = usePathname();
  const valores = busca.getAll("cliente");
  const detalhe = ["/inicio", "/criativos"].includes(pathname) && valores.length === 1 && valores[0] === businessId;
  return <b>{detalhe ? `${agencia} / ${anunciante}` : `${agencia} · Agência`}</b>;
}
