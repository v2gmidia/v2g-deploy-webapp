"use client";

import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  children: string;
}

/**
 * Item da navegação lateral (classe `.nav-item` em app/globals.css).
 *
 * Client Component só por causa do `usePathname` — com mais de uma rota
 * protegida, qual item está ativo deixou de ser algo que dá para
 * cravar no layout.
 */
export function NavItem({ href, children }: NavItemProps) {
  const pathname = usePathname();
  const ativo = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <a
      className={`nav-item${ativo ? " active" : ""}`}
      href={href}
      aria-current={ativo ? "page" : undefined}
    >
      {children}
    </a>
  );
}
