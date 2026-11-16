"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { GaleriaCriativos, type ItemDaGaleria } from "./GaleriaCriativos";
import type { EstadoDeVeiculacao } from "@/lib/veiculacao/estado";
import estilos from "./biblioteca.module.css";

const RevisaoRecebida = createContext<(() => void) | undefined>(undefined);
export const useRevisaoRecebida = () => useContext(RevisaoRecebida);

export function TelaDeCriativos({ itens, envio, envioDisponivel = true, previa = false, bibliotecaFalhou = false, abaInicial = "biblioteca", selecionado = "" }: {
  itens: ItemDaGaleria[];
  abaInicial?: "biblioteca" | "revisao";
  selecionado?: string;
  envio: ReactNode;
  analise?: ReactNode;
  criacao?: ReactNode;
  retencaoAtiva?: boolean;
  previa?: boolean;
  envioDisponivel?: boolean;
  bibliotecaFalhou?: boolean;
  veiculacao?: EstadoDeVeiculacao;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [recebidos, setRecebidos] = useState(0);
  return <div className={`criativos-editorial ${estilos.pagina}`}>
    <header className={estilos.topo}>
      <div className="page-head"><h1>Criativos</h1><p>Suas imagens e os anúncios associados.</p></div>
      <button className="cta" type="button" aria-haspopup="dialog" onClick={() => dialogo.current?.showModal()}><IconeUpload />Subir criativo</button>
    </header>
    <GaleriaCriativos itens={itens} previa={previa} abaInicial={abaInicial} selecionado={selecionado} falhou={bibliotecaFalhou} revisaoRecebida={recebidos} />
    <dialog ref={dialogo} className={estilos.dialogo} aria-labelledby="envio-titulo">
      <div className={estilos.dialogoTopo}><h2 id="envio-titulo">Subir criativo</h2>
        <button type="button" className="cta ghost" onClick={() => dialogo.current?.close()}>Fechar</button></div>
      {envioDisponivel && envio ? <>
        <p className={estilos.apoio}>Envie uma imagem para a revisão do seu gestor.</p>
        <RevisaoRecebida.Provider value={() => setRecebidos((total) => total + 1)}>{envio}</RevisaoRecebida.Provider>
      </> : <p className="form-warning">O envio ainda não está disponível nesta conta. <a href="https://wa.me/5521936182176" target="_blank" rel="noopener">Falar com a equipe</a></p>}
    </dialog>
  </div>;
}

const IconeUpload = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M10 13V3M6 7l4-4 4 4M4 12v4h12v-4" /></svg>;
