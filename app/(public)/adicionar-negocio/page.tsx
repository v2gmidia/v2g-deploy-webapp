import { redirect } from "next/navigation";
export const metadata = { title: "Entrar | V2G", robots: { index: false, follow: false } };

export default async function AdicionarNegocioPage() {
  redirect("/entrar?adicionar=1");
}
