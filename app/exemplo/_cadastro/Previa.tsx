"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { TelaEntrada } from "@/app/(public)/entrar/TelaEntrada";
import type { AuthActionState } from "@/app/(public)/entrar/actions";

/** Só ações locais: não importa as Server Actions nem persiste os campos. */
export function PreviaCadastro({ mensagem }: { mensagem: string }) {
  const [chamadas, setChamadas] = useState(0);
  const [aguardando, setAguardando] = useState(false);
  const resposta = useRef<((estado: AuthActionState) => void) | null>(null);
  const simular = async (): Promise<AuthActionState> => {
    // Os controles do ensaio precisam responder fora da transição da action.
    flushSync(() => {
      setChamadas(valor => valor + 1);
      setAguardando(true);
    });
    return new Promise(resolve => { resposta.current = resolve; });
  };
  function concluir(estado: AuthActionState) {
    resposta.current?.(estado);
    resposta.current = null;
    setAguardando(false);
  }
  return <>
    <aside aria-label="Controles da prévia" className="previa-cadastro-controles">
      <p>Simulação local — não cria contas nem envia e-mail. Envios: <output>{chamadas}</output></p>
      <button disabled={!aguardando} onClick={() => concluir({ message: mensagem })}>Simular confirmação</button>
      <button disabled={!aguardando} onClick={() => concluir({ error: "Não foi possível conferir seu acesso. Tente novamente." })}>Simular erro</button>
      <a href="/exemplo/cadastro">Reiniciar simulação</a>
    </aside>
    <div className="auth-shell"><main className="auth-wrap">
      <TelaEntrada mode="cadastro" next="/inicio" signUpAction={simular} signInAction={simular} />
    </main></div>
  </>;
}
