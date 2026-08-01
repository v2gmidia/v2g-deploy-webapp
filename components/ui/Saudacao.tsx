"use client";

import { useEffect, useState } from "react";

interface SaudacaoProps {
  nome: string;
}

/**
 * "Bom dia, Marina · Terça-feira, 8 de julho" da topbar do protótipo.
 *
 * Client Component de propósito: hora do dia e data dependem do relógio
 * de QUEM está olhando. Renderizado no servidor, isso sairia no fuso do
 * servidor — em produção, UTC — e diria "Boa noite" às 19h de Brasília.
 * Um erro pequeno, mas do tipo que faz o usuário desconfiar do resto.
 *
 * Até o `useEffect` rodar, mostra só o nome. É a razão de o texto vir
 * vazio na primeira renderização em vez de um palpite que muda depois.
 */
export function Saudacao({ nome }: SaudacaoProps) {
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
  }, []);

  // Só o primeiro nome, e só se for mesmo um nome. String vazia (perfil
  // sem `full_name`) vira saudação sem vocativo — nunca o e-mail.
  const primeiroNome = nome.trim().split(/\s+/)[0] ?? "";
  const vocativo = primeiroNome ? `, ${primeiroNome}` : "";

  if (!agora) {
    return <div className="hi">Olá{vocativo}</div>;
  }

  const hora = agora.getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  // A data não entra aqui: quem a renderiza é `DataDeHoje`, na linha de
  // baixo. Repetir num `sr-only` faria o leitor de tela ler duas vezes.
  return (
    <div className="hi">
      {saudacao}
      {vocativo}
    </div>
  );
}

/** A data por extenso, também do relógio de quem olha. */
export function DataDeHoje() {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    setData(
      new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }, []);

  if (!data) return null;
  return <>{data}</>;
}
