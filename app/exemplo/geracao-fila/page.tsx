import { notFound } from "next/navigation";
export default async function PaginaDeEnsaio() {
  const modulo = process.env.NODE_ENV !== "production" ? await import("../_geracao_fila/Previa") : null;
  if (!modulo) notFound();
  return <modulo.PreviaFila />;
}
