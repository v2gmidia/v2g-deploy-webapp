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
 * O valor cru do cookie, virado tema — e a normalização é o conserto do
 * item #8 do QA.
 *
 * ============================================================
 * `?? "sistema"` NÃO BASTAVA, E O MOTIVO É UMA LINHA DE JAVASCRIPT.
 *
 * `cookies().delete()` não some com o cookie na resposta: ele grava um
 * cookie VENCIDO, de valor vazio. Então, na mesma requisição em que o
 * cliente escolhe "Do aparelho", `get(COOKIE_TEMA)?.value` devolve `""`
 * — string vazia, não `undefined`.
 *
 * E `"" ?? "sistema"` é `""`, porque `??` só cai para o padrão em `null`
 * e `undefined`. O `SeletorDeTema` comparava `atual === o.valor` contra
 * uma string vazia, **nenhuma das três opções casava**, e as três saíam
 * com `aria-pressed="false"` até a pessoa recarregar a página. Medido no
 * QA de 11/09/2026: "o dono não vê qual tema está valendo".
 *
 * A função existe para os DOIS leitores usarem a mesma regra. O
 * `RootLayout` acertava por acidente — ele compara com os literais e
 * ignora o resto —, e "acerta por acidente" é o que deixa o próximo
 * leitor errar de novo.
 * ============================================================
 */
export function temaDoCookie(bruto: string | undefined): Tema {
  return bruto === "claro" || bruto === "escuro" ? bruto : "sistema";
}

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
  const escolhido = temaDoCookie((await cookies()).get(COOKIE_TEMA)?.value);

  // ============================================================
  // O TEMA FORÇADO — só desenvolvimento, mesmo portão duplo da fixture.
  //
  // Existe para a PROVA VISUAL ser reproduzível. Sem ele, o tema de uma
  // captura depende do `prefers-color-scheme` da máquina que capturou —
  // e o Chrome headless ignora as flags de esquema de cor, medido em
  // 11/09/2026: claro e escuro saíram com o mesmo tamanho em bytes.
  //
  // Uma captura que depende do sistema operacional de quem rodou não é
  // prova: ela não se repete na máquina do lado. Com a variável, as duas
  // versões do tema saem do mesmo comando, e a diferença entre elas é a
  // única coisa que mudou.
  //
  // Trincos idênticos aos de `V2G_FIXTURE_INICIO`: `NODE_ENV` dobrado
  // para literal no build, e uma variável que só existe em
  // `.env.development.local` — arquivo que o `next build` não abre.
  // ============================================================
  const forcado =
    process.env.NODE_ENV !== "production"
      ? temaDoCookie(process.env.V2G_FIXTURE_TEMA)
      : "sistema";

  // "sistema" NÃO vira atributo — quem decide é o `prefers-color-scheme`.
  const efetivo = forcado === "sistema" ? escolhido : forcado;
  const tema = efetivo === "sistema" ? null : efetivo;

  return (
    <html lang="pt-BR" className={archivo.variable} data-tema={tema ?? undefined}>
      <body>{children}</body>
    </html>
  );
}
