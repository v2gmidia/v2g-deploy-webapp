import { notFound } from "next/navigation";
export default async function RevisaoPublicacaoDeExemplo() {
  const modulo = process.env.NODE_ENV !== "production" ? await import("./Previa") : null;
  if (!modulo) notFound();
  return <modulo.Previa />;
}
