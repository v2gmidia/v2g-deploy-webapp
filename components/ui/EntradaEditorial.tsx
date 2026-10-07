import type { ReactNode } from "react";
import { Marca } from "@/components/ui/Marca";
import { SITE_PUBLICO_ORIGEM } from "@/lib/site-publico";
import "@/app/entrada-editorial.css";

/** Identidade da entrada. As ações de autenticação continuam nas rotas. */
export function EntradaEditorial({ children }: { children: ReactNode }) {
  return (
    <div className="entrada-editorial">
      <a className="entrada-pular" href="#formulario-acesso">Ir para o formulário</a>
      <aside className="entrada-marca">
        <Marca editorial href={`${SITE_PUBLICO_ORIGEM}/`} />
        <div className="entrada-manifesto">
          <h2>Seus anúncios.<br /><span>Clareza em cada etapa.</span></h2>
          <p>Acompanhe seus anúncios e veja o que precisa da sua atenção, em um só lugar.</p>
        </div>
        <div className="entrada-conhecer">
          <p>Ainda não é cliente?</p>
          <a href={`${SITE_PUBLICO_ORIGEM}/#plano`}>Conheça o plano V2G
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </a>
        </div>
      </aside>

      <div className="entrada-acesso">
        <nav className="entrada-retorno" aria-label="Navegação da entrada">
          <a href={`${SITE_PUBLICO_ORIGEM}/`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
            Voltar ao site
          </a>
          <a href={`${SITE_PUBLICO_ORIGEM}/#pre-cadastro`}>Falar com a equipe</a>
        </nav>

        <section id="formulario-acesso" className="entrada-formulario" tabIndex={-1}>
          {children}
        </section>

        <nav className="entrada-legal" aria-label="Sobre a V2G">
          <a href={`${SITE_PUBLICO_ORIGEM}/termos`}>Termos de uso</a>
          <a href={`${SITE_PUBLICO_ORIGEM}/privacidade`}>Privacidade</a>
        </nav>
      </div>
    </div>
  );
}
