import { notFound } from "next/navigation";

export const metadata = { title: "Envio no onboarding — prévia local", robots: { index: false, follow: false } };

export default async function PreviaEnvioPage() {
  const modulo = process.env.NODE_ENV !== "production" ? await import("../_envio-onboarding/Previa") : null;
  if (!modulo) notFound();
  return <modulo.PreviaEnvio />;
}
