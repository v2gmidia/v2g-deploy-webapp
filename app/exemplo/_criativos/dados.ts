import type { ItemDaGaleria } from "@/app/(protected)/criativos/GaleriaCriativos";

const anuncio = (nome: string) => [{ nome, href: nome === "Apresentação da marca" ? "/exemplo/anuncios?anuncio=apresentacao" : "/exemplo/anuncios?anuncio=conversas", ilustrativa: true }];

export const CRIATIVOS_DE_EXEMPLO: ItemDaGaleria[] = [
  { id: "c1", nome: "Clareza para anunciar", imagemUrl: "/criativos/v2g-clareza-feed-v1.png", grupo: "biblioteca", estado: "Disponível na biblioteca", tom: "neutro", criadoEm: "Imagem de exemplo", associacoes: anuncio("Apresentação da marca") },
  { id: "c2", nome: "Mais conversas", imagemUrl: "/criativos/criativo-conversas.svg", grupo: "biblioteca", estado: "Disponível na biblioteca", tom: "neutro", criadoEm: "Imagem de exemplo", associacoes: anuncio("Conversas no WhatsApp") },
  { id: "c3", nome: "Sua marca presente", imagemUrl: "/criativos/criativo-presenca.svg", grupo: "revisao", estado: "Ajustes solicitados pelo gestor", detalhe: "Exemplo de retorno: envie a imagem com o texto mais legível.", tom: "atencao", criadoEm: "Imagem de exemplo", associacoes: [] },
  { id: "c4", nome: "O próximo passo", imagemUrl: "/criativos/criativo-proximo.svg", grupo: "arquivados", estado: "Arquivado", tom: "neutro", criadoEm: "Imagem de exemplo", associacoes: [] },
];
