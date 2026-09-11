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
  // O TEMA FORÇADO POR VARIÁVEL SAIU DAQUI — 11/09/2026.
  //
  // Entre 72bb099 e hoje, uma variável de ambiente decidia o tema deste
  // layout (o nome dela está no diff daquele commit e em
  // docs/estado/inicio-recomposto-11-09.md — aqui ele não pode mais ser
  // escrito, e é o `conferir:portao` que não deixa).
  //
  // Este é o layout RAIZ: aquilo valia para o site inteiro, `/` e
  // `/entrar` inclusive — a maior superfície dos três portões de fixture,
  // guardando a menor necessidade, que era tirar oito capturas.
  //
  // Saiu sem perder nada, porque o que ele fazia já existia sem ele: o
  // tema vem de um cookie (`v2g_tema`), e esse cookie é `httpOnly: false`
  // (ver `app/(protected)/conta/tema-actions.ts`). Quem automatiza a
  // captura já precisa escrever o cookie de sessão — escreve este junto:
  //
  //     curl -b "v2g_tema=escuro" ...        # ou Network.setCookie, no CDP
  //
  // E o resultado é MAIS fiel que o da variável: o caminho da captura
  // passa a ser o mesmo caminho do cliente que escolheu o tema na
  // `/conta`, em vez de um ramo que só existe em desenvolvimento.
  // ============================================================

  // "sistema" NÃO vira atributo — quem decide é o `prefers-color-scheme`.
  const tema = escolhido === "sistema" ? null : escolhido;

  return (
    <html lang="pt-BR" className={archivo.variable} data-tema={tema ?? undefined}>
      <body>{children}</body>
    </html>
  );
}
