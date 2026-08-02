"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_TEMA, type Tema } from "@/app/layout";

const VALIDOS: Tema[] = ["claro", "escuro", "sistema"];

/**
 * Grava a preferência de tema num cookie.
 *
 * Não é dado de usuário: não vai para o banco, não identifica ninguém e
 * não precisa sobreviver a troca de aparelho. Cookie de um ano, e o
 * padrão de quem nunca escolheu é "sistema" — respeitar o aparelho é uma
 * escolha melhor que impor claro.
 *
 * `httpOnly: false` de propósito: nada aqui é segredo, e deixar legível
 * abre caminho para um botão instantâneo no futuro sem ida ao servidor.
 */
export async function definirTemaAction(formData: FormData): Promise<void> {
  const bruto = String(formData.get("tema") ?? "");
  const tema = (VALIDOS as string[]).includes(bruto) ? (bruto as Tema) : "sistema";

  const jar = await cookies();
  if (tema === "sistema") {
    // "sistema" é a AUSÊNCIA de escolha, não um terceiro valor. Apagar o
    // cookie devolve a decisão ao `prefers-color-scheme` do CSS — sem
    // JavaScript no meio.
    jar.delete(COOKIE_TEMA);
  } else {
    jar.set(COOKIE_TEMA, tema, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
    });
  }

  // O tema vive no `<html>`, que é renderizado pelo layout raiz — então
  // a revalidação precisa alcançar o layout, não só esta página.
  revalidatePath("/", "layout");
}
