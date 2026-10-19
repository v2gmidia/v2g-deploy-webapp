"use client";

import { useEffect, useState } from "react";

export function ConclusaoDaJornada({ businessId }: { businessId: string }) {
  const chave = `v2g:inicio:jornada-concluida:v1:${businessId}`;
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      setVisivel(window.localStorage.getItem(chave) !== "dispensada");
    } catch {
      setVisivel(true);
    }
  }, [chave]);

  function dispensar() {
    setVisivel(false);
    try {
      window.localStorage.setItem(chave, "dispensada");
    } catch {
      // A mensagem continua dispensada nesta visita mesmo sem persistência local.
    }
  }

  if (!visivel) return null;

  return (
    <section className="inicio-conclusao" aria-labelledby="inicio-conclusao-titulo">
      <div>
        <h2 id="inicio-conclusao-titulo">Sua campanha completou todas as etapas.</h2>
        <p>Agora o Início fica focado no investimento e nos resultados.</p>
      </div>
      <button type="button" onClick={dispensar}>Entendi</button>
    </section>
  );
}
