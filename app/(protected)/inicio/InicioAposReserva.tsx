"use client";

import { useEffect, useState } from "react";
import styles from "./InicioAposReserva.module.css";

const data = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long",
});
const hora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit",
});

export function InicioAposReserva({ inicio, fim }: { inicio: string; fim: string }) {
  const [passo, setPasso] = useState(0);
  const [guiaAberto, setGuiaAberto] = useState(true);
  const passos = [
    {
      titulo: "Sua reunião",
      texto: `Você reservou ${data.format(new Date(inicio))}, das ${hora.format(new Date(inicio))} às ${hora.format(new Date(fim))} (Brasília). Confira o horário e o convite na página da reunião.`,
      href: "/onboarding/concluido", rotulo: "Ver minha reunião",
    },
    {
      titulo: "Seu negócio",
      texto: "A opção Conta está destacada no menu. Ali você revê os dados e os acessos deste negócio. Se tiver mais de um CNPJ, troque de negócio pelo menu no topo ou na lateral.",
      href: "/conta", rotulo: "Ver minha conta",
    },
    {
      titulo: "Seus anúncios",
      texto: "A opção Anúncios está destacada no menu. Você acompanhará a campanha ali quando ela estiver disponível. O gestor alinhará os acessos e o primeiro anúncio na reunião.",
      href: "/anuncios", rotulo: "Conhecer anúncios",
    },
    {
      titulo: "Avisos",
      texto: "A opção Avisos está destacada no menu. Ela reúne o que precisa da sua atenção durante a preparação e a gestão dos anúncios.",
      href: "/alertas", rotulo: "Ver avisos",
    },
  ];
  const atual = passos[passo]!;

  useEffect(() => {
    if (!guiaAberto || passo === 0) return;
    const destino = passos[passo]?.href;
    const links = document.querySelectorAll<HTMLAnchorElement>(".side-nav .nav-item");
    const destacados = Array.from(links).filter((link) => link.getAttribute("href") === destino);
    destacados.forEach((link) => {
      link.dataset.guiaAtivo = "true";
      link.setAttribute("aria-describedby", "guia-passo");
    });
    return () => destacados.forEach((link) => {
      delete link.dataset.guiaAtivo;
      link.removeAttribute("aria-describedby");
    });
  }, [guiaAberto, passo]);

  return <section className={styles.raiz} aria-labelledby="inicio-apos-reserva">
    <p className={styles.marcador}>Boas vindas ao seu painel</p>
    <h1 id="inicio-apos-reserva">Seu cadastro está guardado</h1>
    <p className={styles.intro}>A reunião está registrada para este negócio. Enquanto a equipe prepara os próximos passos, conheça onde acompanhar tudo.</p>
    {guiaAberto ? <div className={styles.cartao} id="guia-passo" aria-live="polite">
      <span className={styles.contador}>Passo {passo + 1} de {passos.length}</span>
      <h2>{atual.titulo}</h2>
      <p>{atual.texto}</p>
      <a href={atual.href}>{atual.rotulo} →</a>
    </div> : <p className={styles.resumo}>O guia ficou recolhido. Você pode abri-lo de novo quando quiser.</p>}
    <div className={styles.navegacao}>
      {guiaAberto && <>
      <button type="button" onClick={() => setPasso((valor) => Math.max(0, valor - 1))} disabled={passo === 0}>Anterior</button>
      <button type="button" onClick={() => setPasso((valor) => Math.min(passos.length - 1, valor + 1))} disabled={passo === passos.length - 1}>Próximo</button>
      </>}
      <button type="button" onClick={() => setGuiaAberto((aberto) => !aberto)}>{guiaAberto ? "Fechar guia" : "Abrir guia"}</button>
    </div>
  </section>;
}
