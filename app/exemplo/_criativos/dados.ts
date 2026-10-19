import type { ItemDaGaleria } from "@/app/(protected)/criativos/GaleriaCriativos";

const anuncio = (nome: string) => [{ nome, href: "/exemplo/anuncios", ilustrativa: true }];

export const CRIATIVOS_DE_EXEMPLO: ItemDaGaleria[] = [
  { id: "c1", nome: "Cabelo luminoso", imagemUrl: null, arte: "crescimento", grupo: "biblioteca", estado: "Usado em 2 anúncios", tom: "positivo", criadoEm: "2 out, 11:47", associacoes: [...anuncio("Campanha Outubro — WhatsApp"), ...anuncio("Remarketing — Salão")], acao: { rotulo: "Analisar", href: "#" } },
  { id: "c2", nome: "Café e pão de queijo", imagemUrl: null, arte: "acompanhamento", grupo: "biblioteca", estado: "Usado em 1 anúncio", tom: "positivo", criadoEm: "1 out, 16:22", associacoes: anuncio("Campanha Outubro — WhatsApp"), acao: { rotulo: "Analisar", href: "#" } },
  { id: "c3", nome: "Produto natural", imagemUrl: null, arte: "clareza", grupo: "biblioteca", estado: "Disponível para usar", tom: "neutro", criadoEm: "30 set, 14:03", associacoes: [], acao: { rotulo: "Usar em novo anúncio", href: "/exemplo/anuncios" } },
  { id: "c4", nome: "Treino personal", imagemUrl: null, arte: "resultado", grupo: "revisao", estado: "Aguardando revisão", tom: "atencao", criadoEm: "28 set, 09:18", associacoes: [] },
  { id: "c5", nome: "Post do Instagram", imagemUrl: null, arte: "clareza", grupo: "instagram", estado: "Importado do Instagram", tom: "neutro", criadoEm: "24 set, 18:30", associacoes: [], acao: { rotulo: "Usar em novo anúncio", href: "/exemplo/anuncios" } },
  { id: "c6", nome: "Oferta de setembro", imagemUrl: null, arte: "resultado", grupo: "arquivados", estado: "Arquivado", tom: "neutro", criadoEm: "Arquivado em 30 set", associacoes: anuncio("Campanha Setembro — WhatsApp") },
];
