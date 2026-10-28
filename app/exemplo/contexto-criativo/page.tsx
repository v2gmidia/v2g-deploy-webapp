import { notFound } from "next/navigation";

export default async function PreviaContextoPage() {
  const previa = process.env.NODE_ENV !== "production" ? await import("../_contexto-criativo/Previa") : null;
  if (!previa) notFound();
  return <previa.Previa />;
}
