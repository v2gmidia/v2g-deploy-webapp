import { notFound } from "next/navigation";

export const metadata = { title: "Novas interações — V2G", robots: { index: false, follow: false } };

export default async function InteracoesDeExemplo() {
  const modulo = process.env.NODE_ENV !== "production" ? await import("../_interacoes/Previa") : null;
  if (!modulo) notFound();
  return <modulo.PreviaInteracoes />;
}
