"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItemProps {
  href: string;
  icone?: ReactNode;
  children: string;
  ativo?: boolean;
}

/**
 * Item da navegação lateral (classe `.nav-item` em app/globals.css).
 *
 * Client Component só por causa do `usePathname` — com mais de uma rota
 * protegida, qual item está ativo deixou de ser algo que dá para
 * cravar no layout.
 *
 * O rótulo vai dentro de um `<span>` porque a sidebar colapsa para só
 * os ícones abaixo de 900px (regra `.nav-item span { display: none }`).
 */
export function NavItem({ href, icone, children, ativo: ativoInformado }: NavItemProps) {
  const pathname = usePathname();
  // A bancada usa o mesmo menu, mantendo a navegação dentro das prévias.
  const emPrevia = pathname.startsWith("/exemplo/");
  const destino = emPrevia ? `/exemplo/${href === "/alertas" ? "avisos" : href.slice(1)}` : href;
  const ativo = ativoInformado ?? (pathname === destino || pathname.startsWith(`${destino}/`));

  return (
    <Link
      className={`nav-item${ativo ? " active" : ""}`}
      href={destino}
      prefetch={false}
      aria-current={ativo ? "page" : undefined}
    >
      {icone}
      <span>{children}</span>
    </Link>
  );
}
