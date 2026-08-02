import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

// Substitui a Bahnschrift do protótipo original (exclusiva do Windows,
// não embutida) — ver docs/arquitetura.md, Decisão 6. Auto-hospedada
// pelo Next.js no build: sem chamada de rede em runtime.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "V2G",
  description: "V2G — gestão de tráfego pago com IA para pequenos negócios.",
};

export const COOKIE_TEMA = "v2g_tema";
export type Tema = "claro" | "escuro" | "sistema";

/**
 * O tema é decidido NO SERVIDOR, a partir de um cookie.
 *
 * Por que cookie e não `localStorage`: com `localStorage` o HTML chega
 * sempre no tema padrão e só depois o JavaScript corrige — o usuário de
 * tema escuro leva um flash branco na cara a cada navegação. A alternativa
 * comum é um `<script>` bloqueante no `<head>`, que resolve o flash às
 * custas de rodar script antes de pintar qualquer coisa. O cookie chega
 * junto com a requisição, então o servidor já manda o HTML certo.
 *
 * "sistema" NÃO vira atributo. Sem `data-tema`, quem decide é o
 * `@media (prefers-color-scheme)` do CSS — ou seja, o padrão do aparelho,
 * sem nenhuma linha de JavaScript envolvida.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const escolhido = (await cookies()).get(COOKIE_TEMA)?.value;
  const tema = escolhido === "claro" || escolhido === "escuro" ? escolhido : null;

  return (
    <html lang="pt-BR" className={archivo.variable} data-tema={tema ?? undefined}>
      <body>{children}</body>
    </html>
  );
}
