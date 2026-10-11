"use client";

import { criteriosDaSenha, TAMANHO_MINIMO_SENHA } from "@/lib/auth-senha";

export function CriteriosSenha({ senha, id }: { senha: string; id: string }) {
  const criterios = criteriosDaSenha(senha);
  const itens = [
    { ok: criterios.tamanho, texto: `${TAMANHO_MINIMO_SENHA} caracteres ou mais` },
    { ok: criterios.maiuscula, texto: "Letra maiúscula" },
    { ok: criterios.minuscula, texto: "Letra minúscula" },
    { ok: criterios.numero, texto: "Número" },
    { ok: criterios.especial, texto: "Caractere especial, como !, ? ou @" },
  ];

  return <ul className="criterios-senha" id={id} aria-label="Para uma senha forte, inclua:">
    {itens.map(({ ok, texto }) => <li key={texto} className={ok ? "atendido" : undefined}>
      <span aria-hidden="true">{ok ? "✓" : "○"}</span>{texto}
    </li>)}
  </ul>;
}
