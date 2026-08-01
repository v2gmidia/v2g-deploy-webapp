"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  icone?: ReactNode;
  children: string;
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
export function NavItem({ href, icone, children }: NavItemProps) {
  const pathname = usePathname();
  const ativo = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <a
      className={`nav-item${ativo ? " active" : ""}`}
      href={href}
      aria-current={ativo ? "page" : undefined}
    >
      {icone}
      <span>{children}</span>
    </a>
  );
}
