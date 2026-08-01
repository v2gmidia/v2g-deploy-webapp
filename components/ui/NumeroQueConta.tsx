"use client";

import { useEffect, useState } from "react";

interface Props {
  /** valor final, já calculado no servidor */
  valor: number;
  /** o que vem antes do número, ex. "R$ " */
  prefixo?: string;
  /** casas decimais */
  casas?: number;
  className?: string;
}

const DURACAO_MS = 900;

/**
 * Número que conta de zero até o valor, uma vez, ao aparecer.
 *
 * Movimento aqui é EVENTO, não ambiente: acontece quando o dado chega à
 * tela e nunca mais. Nada nesta interface pulsa, desliza ou respira em
 * loop — animação contínua num painel que a pessoa abre todo dia vira
 * ruído em uma semana.
 *
 * `prefers-reduced-motion` não é tratado como enfeite opcional: quem
 * pediu menos movimento recebe o valor final direto, sem quadro
 * intermediário nenhum.
 */
export function NumeroQueConta({ valor, prefixo = "", casas = 0, className }: Props) {
  const [atual, setAtual] = useState(valor);

  useEffect(() => {
    // Sem guard de "já animou". Tinha um aqui e ele QUEBRAVA o número:
    // em desenvolvimento o React monta o efeito duas vezes, e a segunda
    // passada caía no `return` antecipado enquanto a limpeza da primeira
    // já tinha cancelado o frame — o número ficava parado em zero, para
    // sempre. O `useEffect` já depende de `valor`, então re-executar só
    // acontece quando o valor muda de verdade.
    const querMenosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (querMenosMovimento || valor <= 0) {
      setAtual(valor);
      return;
    }

    // O zero NÃO é definido aqui fora: quem zera é o primeiro quadro da
    // animação. Se `requestAnimationFrame` nunca rodar — aba em segundo
    // plano, economia de energia, navegador sem composição — o número
    // simplesmente fica no valor certo em vez de congelar em zero.
    // O movimento é enfeite; o valor não pode depender dele.
    let inicio = 0;
    let frame = 0;

    const passo = (agora: number) => {
      if (!inicio) inicio = agora;
      const t = Math.min(1, (agora - inicio) / DURACAO_MS);
      // desacelera no fim: o número "assenta" em vez de parar seco
      const suave = 1 - Math.pow(1 - t, 3);
      setAtual(valor * suave);
      if (t < 1) frame = requestAnimationFrame(passo);
    };
    frame = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frame);
  }, [valor]);

  const texto = atual.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

  return (
    <span className={className}>
      {prefixo}
      {texto}
    </span>
  );
}
