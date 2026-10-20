import { cookies } from "next/headers";
import { COOKIE_TEMA, temaDoCookie } from "@/lib/tema";
import { CampoDeTema } from "./CampoDeTema";

/** Mesmo cookie e mesma action da Conta; a escolha acompanha a navegação. */
export async function PreferenciaDeTema() {
  const atual = temaDoCookie((await cookies()).get(COOKIE_TEMA)?.value);
  return <CampoDeTema atual={atual} />;
}
