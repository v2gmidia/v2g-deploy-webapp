import type { ReactNode } from "react";
import { GaleriaCriativos, type ItemDaGaleria } from "./GaleriaCriativos";

export function TelaDeCriativos({ itens, envio, analise, envioDisponivel = true, retencaoAtiva = false, previa = false }: {
  itens: ItemDaGaleria[];
  envio: ReactNode;
  analise?: ReactNode;
  retencaoAtiva?: boolean;
  previa?: boolean;
  envioDisponivel?: boolean;
}) {
  return <div className="criativos-editorial">
    <header className="criativos-topo">
      <div className="page-head"><h1>Criativos</h1><p>Sua biblioteca de imagens e vídeos.</p></div>
      {envioDisponivel
        ? <a className="cta criativos-subir" href="#subir-criativo"><IconeUpload />Subir criativo</a>
        : <a className="cta ghost criativos-subir" href="https://wa.me/5521936182176" target="_blank" rel="noopener">Falar com a equipe</a>}
    </header>
    <GaleriaCriativos itens={itens} previa={previa} />
    <section className="criativos-envio" id="subir-criativo" aria-labelledby="subir-titulo">
      <div className="criativos-envio-copy"><h2 id="subir-titulo">{envioDisponivel ? "Subir um novo criativo" : "Envio indisponível"}</h2>
        <p>{envioDisponivel ? "Envie uma imagem deste negócio. Ela entra em revisão antes de qualquer publicação." : "O envio pelo aplicativo ainda não está disponível nesta conta. Fale com a equipe para saber como seguir."}</p></div>
      {envio}
    </section>
    {analise ? <details className="criativos-analise-extra"><summary>Analisar uma imagem<IconeMais /></summary><div>{analise}</div></details> : null}
    <details className="criativos-retencao" id="regra-retencao">
      <summary><IconeInfo />Histórico e armazenamento<IconeMais /></summary>
      <p>{retencaoAtiva ? "Arquivos que saem de circulação ficam disponíveis por 30 dias. Depois, o arquivo é removido e o histórico permanece." : "A exclusão automática após 30 dias ainda não está ativa."}</p>
      <p>Remover o arquivo não apaga o registro da peça. Nome, estado e resultados já medidos continuam disponíveis para consulta.</p>
    </details>
  </div>;
}

const IconeUpload = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M10 13V3M6 7l4-4 4 4M4 12v4h12v-4" /></svg>;
const IconeInfo = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10" cy="10" r="8" /><path d="M10 9v5M10 6.2v.2" /></svg>;
const IconeMais = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>;
