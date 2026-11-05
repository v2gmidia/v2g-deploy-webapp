import GestorPage from "@/app/(protected)/gestor/page";
import type { BuscaDoGestor } from "@/app/(protected)/gestor/page";
import { tituloDaAba } from "@/lib/titulos";

export const metadata = tituloDaAba("/gestor");
export const dynamic = "force-dynamic";

export default function SupergestorPage({ searchParams }: {
  searchParams: Promise<BuscaDoGestor>;
}) {
  return <GestorPage searchParams={searchParams} />;
}
