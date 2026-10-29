"use client";

import { useEffect, useState } from "react";
import styles from "./RecepcaoDoCadastro.module.css";

export interface RecepcaoOnboarding {
  businessId: string;
  reserva: { starts_at: string; ends_at: string } | null;
  falhaReuniao: boolean;
}

function horarioDaReuniao(reserva: NonNullable<RecepcaoOnboarding["reserva"]>) {
  const inicio = new Date(reserva.starts_at), fim = new Date(reserva.ends_at);
  if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fim.getTime())) return null;
  const dia = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "long", year: "numeric" });
  const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  return `${dia.format(inicio)}, das ${hora.format(inicio)} às ${hora.format(fim)} (Brasília).`;
}

export function RecepcaoDoCadastro({ businessId, reserva, falhaReuniao }: RecepcaoOnboarding) {
  const [visivel, setVisivel] = useState(false);
  const chave = `v2g:inicio:cadastro-concluido:v1:${businessId}`;
  useEffect(() => {
    try {
      // Uma celebração por negócio neste navegador; o estado real segue no servidor.
      if (window.localStorage.getItem(chave) === null) {
        window.localStorage.setItem(chave, "visto");
        setVisivel(true);
      }
    } catch {
      setVisivel(true);
    }
  }, [chave]);
  if (!visivel) return null;
  const confirmada = reserva !== null && !falhaReuniao;
  const horario = confirmada ? horarioDaReuniao(reserva) : null;
  return <section className={styles.recepcao} aria-labelledby="cadastro-concluido-titulo">
    <header className={styles.abertura}>
      <span className={styles.concluido} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
      <div><h1 id="cadastro-concluido-titulo">Cadastro concluído!</h1>
        <p>Você terminou esta etapa. As respostas sobre seu negócio, as contas e as informações da marca estão salvas.</p></div>
      <button type="button" className={styles.dispensar} onClick={() => setVisivel(false)} aria-label="Fechar confirmação do cadastro">Fechar</button>
    </header>

    <ol className={styles.progresso} aria-label="Do cadastro ao planejamento dos anúncios">
      <li><strong>Cadastro</strong><span>Concluído</span></li>
      <li aria-current="step"><strong>Reunião</strong><span>{confirmada ? "Horário confirmado" : falhaReuniao ? "Horário a conferir" : "Próximo passo"}</span></li>
      <li><strong>Planejamento dos anúncios</strong><span>Para alinhar com a equipe</span></li>
    </ol>

    <section className={styles.reuniao} aria-labelledby="proxima-reuniao-titulo">
      <div><h2 id="proxima-reuniao-titulo">{confirmada ? "Sua reunião está confirmada" : "Agora, vamos conversar sobre seu negócio"}</h2>
        {horario && <p className={styles.horario}>{horario}</p>}
        <p>Na reunião, você e a equipe alinham os acessos, o investimento e os próximos passos para o primeiro anúncio.</p>
        {!confirmada && <p>{falhaReuniao
          ? "Não conseguimos conferir seu horário agora. Seu cadastro continua salvo; confira a reunião para tentar novamente."
          : "A confirmação do horário ainda não aparece aqui. Se já agendou pelo Google, confira o convite no seu e-mail."}</p>}
      </div>
      <a className="cta" href="/onboarding/concluido">{confirmada ? "Ver minha reunião" : "Conferir reunião"}</a>
    </section>

    <section className={styles.explorar} aria-labelledby="explorar-painel-titulo">
      <h2 id="explorar-painel-titulo">Enquanto isso, conheça seu espaço</h2>
      <ul>
        <li><a href="/conta">Revisar meu negócio</a><p>Confira os dados e os materiais da marca.</p></li>
        <li><a href="/criativos">Conhecer meus criativos</a><p>Veja suas peças e os anúncios associados a elas.</p></li>
        <li><a href="/anuncios">Explorar anúncios</a><p>Acompanhe as campanhas disponíveis para este negócio.</p></li>
        <li><a href="/alertas">Ver avisos</a><p>Encontre os pedidos que precisam da sua atenção.</p></li>
      </ul>
    </section>
  </section>;
}
