import GestorPage from "@/app/(protected)/gestor/page";
import { tituloDaAba } from "@/lib/titulos";

export const metadata = tituloDaAba("/gestor");
export const dynamic = "force-dynamic";

export default function SupergestorPage({ searchParams }: {
  searchParams: Promise<{ q?: string; filtro?: string; metricas?: string }>;
}) {
  return <GestorPage searchParams={searchParams} />;
}
