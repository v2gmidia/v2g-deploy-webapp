import { Suspense, type ReactNode } from "react";
import { NavegacaoAgencia, NomeDoContextoAgencia } from "@/components/agencia/ContextoNoCasco";
import type { ContextoDoCascoAgencia } from "@/components/agencia/ContextoNoCasco";
import { identificarDocumentoContratante } from "@/lib/contratacao/documento-contratante";
import { Marca } from "@/components/ui/Marca";
import { NavItem } from "@/components/ui/NavItem";
import { DataDeHoje, Saudacao } from "@/components/ui/Saudacao";
import { PreferenciaDeTema } from "@/components/ui/PreferenciaDeTema";
import { ListaNegociosMenu } from "@/components/ui/ListaNegociosMenu";

const IcoInicio = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M3 9 10 3l7 6" />
    <path d="M5 8.5V16h10V8.5" />
  </svg>
);
/* `IcoVendas` saiu junto com o item da barra, em 12/09/2026. O ícone era
   usado só aqui, e componente que ninguém renderiza é código que envelhece
   sem ninguém notar. A rota `/vendas` continua no ar; se ela voltar para a
   barra, o ícone volta com ela — está no histórico do git. */
/** Criativos: uma imagem. É a peça que o dono mexe toda semana. */
const IcoCriativos = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="3" y="4" width="14" height="12" rx="2" />
    <circle cx="7.5" cy="8.5" r="1.3" />
    <path d="M3.5 13.5 8 10l3 2.5 2.5-2 3 3" />
  </svg>
);
const IcoAnuncios = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M3 8v4h3l8 4V4L6 8H3z" />
    <path d="M16 8a3 3 0 0 1 0 4" />
  </svg>
);
const IcoConta = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="10" cy="7" r="3" />
    <path d="M4 16.5a6 6 0 0 1 12 0" />
  </svg>
);
/** Falar com uma pessoa: o balão do `.topbar-help`, no traço dos outros cinco. */
const IcoConversa = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M10 3a7 7 0 0 0-6 10.6L3 17l3.5-1A7 7 0 1 0 10 3z" />
  </svg>
);

type NegocioDoMenu = { id: string; name: string; logoUrl: string | null; cnpj?: string | null };

function AvatarDoNegocio({ nome, url }: { nome: string; url: string | null }) {
  return <span className="avatar" aria-hidden="true">
    {url ? <img src={url} alt="" /> : nome.trim().charAt(0).toUpperCase() || "?"}
  </span>;
}

function MenuNegocios({ negocios, negocioAtivoId, rotuloDaConta, inicial, acaoSair,
  ehOperador, compacto, adicionarHref }: {
  negocios: NegocioDoMenu[];
  negocioAtivoId?: string;
  rotuloDaConta: string;
  inicial: string;
  acaoSair?: () => void | Promise<void>;
  ehOperador?: boolean;
  compacto?: boolean;
  adicionarHref: string;
}) {
  const atual = negocios.find((negocio) => negocio.id === negocioAtivoId);
  return <details className={`side-account-menu${compacto ? " topbar-account-menu" : ""}`}>
    <summary aria-label={`Negócio atual: ${rotuloDaConta}. Mostrar negócios`}>
      <AvatarDoNegocio nome={atual?.name ?? inicial} url={atual?.logoUrl ?? null} />
      <span className="who"><b>{rotuloDaConta}</b></span>
      <svg className="account-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg>
    </summary>
    <div className="side-account-opcoes">
      <ListaNegociosMenu>
        {negocios.map((negocio) =>
          <button key={negocio.id} type="submit" name="businessId" value={negocio.id}
            className="business-option" aria-current={negocio.id === negocioAtivoId ? "true" : undefined}
            aria-label={`Abrir ${negocio.name}, ${negocio.cnpj ? identificarDocumentoContratante(negocio.cnpj) : `cadastro ${negocio.id.slice(0, 8)}`}`}>
            <AvatarDoNegocio nome={negocio.name} url={negocio.logoUrl} />
            <span className="business-option-text">
              <span className="business-name">{negocio.name}</span>
              <span className="business-identity">{negocio.cnpj
                ? identificarDocumentoContratante(negocio.cnpj) : `Cadastro ${negocio.id.slice(0, 8)}`}</span>
            </span>
            {negocio.id === negocioAtivoId && <span className="business-current">Atual</span>}
          </button>)}
        {negocios.length === 0 && <span className="business-empty">Nenhum negócio disponível</span>}
      </ListaNegociosMenu>
      <div className="business-actions">
        <a className="link-btn" href={adicionarHref}>Adicionar negócio</a>
        {ehOperador && <a className="link-btn" href="/supergestor">Mesa do gestor</a>}
        {acaoSair && <form action={acaoSair}><button type="submit" className="link-btn">Sair</button></form>}
      </div>
    </div>
  </details>;
}

/**
 * O CASCO das telas de app — barra lateral (ou inferior) e topo.
 *
 * ============================================================
 * SEPARADO DO LAYOUT EM 15/09/2026, para a bancada `/exemplo`.
 *
 * Este componente NÃO decide quem entra, e não pode passar a decidir. Quem
 * exige sessão continua sendo o `app/(protected)/layout.tsx` (e o
 * `proxy.ts` antes dele): o layout confere o usuário, busca nome e negócio
 * e só então desenha isto. A `/exemplo` desenha o mesmo casco com nome
 * falso, sem ação de sair.
 * ============================================================
 */
export function Casco({
  nome,
  nomeNegocio,
  negocioAtivoId,
  rotuloDaConta,
  inicial,
  acaoSair,
  negocios = [],
  ehOperador,
  rotaAtiva,
  previa = false,
  contextoAgencia,
  children,
}: {
  previa?: boolean;
  nome: string;
  nomeNegocio?: string;
  negocioAtivoId?: string;
  /** o nome que aparece no bloco da conta: o do negócio, ou o e-mail */
  rotuloDaConta: string;
  inicial: string;
  /** a action de sair; sem ela (na bancada), o formulário não sai de lugar nenhum */
  acaoSair?: () => void | Promise<void>;
  negocios?: NegocioDoMenu[];
  ehOperador?: boolean;
  rotaAtiva?: "/inicio" | "/criativos" | "/anuncios" | "/alertas" | "/conta";
  contextoAgencia?: ContextoDoCascoAgencia;
  children: ReactNode;
}) {
  const adicionarHref = "/entrar?adicionar=1";
  return (
    <div className="app-shell v2g-editorial">
      <a className="pular-conteudo" href="#conteudo-principal">Pular para o conteúdo</a>
      <aside className="sidebar">
        <Marca href={previa ? "/exemplo/inicio" : "/inicio"} className="side-brand" editorial />

        <nav className="side-nav" aria-label="Navegação principal">
          {/* Pendências ficam nas telas correspondentes; quatro destinos no menu. */}
          {contextoAgencia ? <Suspense fallback={<>
            <NavItem href="/inicio" icone={<IcoInicio />}>Início</NavItem><NavItem href="/criativos" icone={<IcoCriativos />}>Criativos</NavItem><NavItem href="/anuncios" icone={<IcoAnuncios />}>Anúncios</NavItem>
          </>}><NavegacaoAgencia businessId={contextoAgencia.businessId} inicio={<IcoInicio />} criativos={<IcoCriativos />} anuncios={<IcoAnuncios />} /></Suspense> : <>
          <NavItem href="/inicio" icone={<IcoInicio />} ativo={rotaAtiva ? rotaAtiva === "/inicio" : undefined}>
            Início
          </NavItem>
          <NavItem href="/criativos" icone={<IcoCriativos />} ativo={rotaAtiva ? rotaAtiva === "/criativos" : undefined}>
            Criativos
          </NavItem>
          <NavItem href="/anuncios" icone={<IcoAnuncios />} ativo={rotaAtiva ? rotaAtiva === "/anuncios" : undefined}>
            Anúncios
          </NavItem>
          </>}
          <NavItem href="/conta" icone={<IcoConta />} ativo={rotaAtiva ? rotaAtiva === "/conta" : undefined}>
            Conta
          </NavItem>
        </nav>

        <div className="side-spacer" />

        {/* Atendimento na base da navegação; no celular, no rodapé do conteúdo. */}
        <a className="nav-item side-falar" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
          <IcoConversa />
          <span>Falar com alguém</span>
        </a>

        <div className="side-account">
          <MenuNegocios negocios={negocios} negocioAtivoId={negocioAtivoId}
            rotuloDaConta={rotuloDaConta} inicial={inicial} acaoSair={acaoSair}
            ehOperador={ehOperador} adicionarHref={adicionarHref} />
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="greet">
            <Saudacao nome={nome} />
            <div className="sub">
              {nomeNegocio && (
                <>
                  {contextoAgencia ? <Suspense fallback={<b>{nomeNegocio}</b>}><NomeDoContextoAgencia businessId={contextoAgencia.businessId}
                    agencia={contextoAgencia.agencia} anunciante={contextoAgencia.anunciante} /></Suspense> : <b>{nomeNegocio}</b>}
                  {" · "}
                </>
              )}
              <DataDeHoje />
            </div>
          </div>

          <div className="topbar-actions">
            {ehOperador && <a className="link-btn" href="/supergestor">Mesa do gestor</a>}
            <div className="topbar-account">
              <MenuNegocios negocios={negocios} negocioAtivoId={negocioAtivoId}
                rotuloDaConta={rotuloDaConta} inicial={inicial} acaoSair={acaoSair}
                ehOperador={ehOperador} compacto adicionarHref={adicionarHref} />
            </div>
            <PreferenciaDeTema />

          </div>
        </header>
        <main className="canvas" id="conteudo-principal" tabIndex={-1}>{children}<footer className="suporte-mobile"><a href="https://wa.me/5521936182176" target="_blank" rel="noopener"><IcoConversa />Falar com alguém</a></footer></main>
      </div>
    </div>
  );
}
