import { documento } from "../onboarding/marca";
import { lerBriefingDeTrafego } from "../onboarding/briefing-trafego";
import type { CampoDoContexto } from "./briefing-geracao";

export type CampoDoPreparo = {
  valor: string; origem: string; em: string | null;
  estado: "declarado_cliente" | "confirmado_cliente";
};
export type ContextoDoCriativo = {
  businessId: string;
  nome: CampoDoPreparo | null; cores: CampoDoPreparo | null;
  oferta: CampoDoPreparo | null; objetivo: CampoDoPreparo | null;
  apoio: { rotulo: string; campo: CampoDoPreparo }[];
  materiais: { logos: number; fotos: number; semTipo: number } | null;
};
function texto(valor: unknown, limite = 500): string | null {
  return typeof valor === "string" && valor.trim().length >= 2 && valor.trim().length <= limite
    ? valor.trim() : null;
}
function data(valor: unknown): string | null {
  return typeof valor === "string" && Number.isFinite(Date.parse(valor)) ? valor : null;
}
/** Projeção mínima de declarações. Não confirma oferta nem autoriza IA. */
export function contextoDoNegocio(negocio: { id: string; name: unknown; onboarding: unknown },
  cores: CampoDoContexto | null, materiais: ContextoDoCriativo["materiais"]): ContextoDoCriativo {
  const respostas = documento(documento(negocio.onboarding).respostas);
  function resposta(chave: string): CampoDoPreparo | null {
    const r = documento(respostas[chave]), valor = texto(r.texto);
    if (!valor || (r.origem === "chip" && ["Ainda não sei explicar", "Ainda não tenho provas para enviar"].includes(valor))) return null;
    return { valor, origem: `onboarding.respostas.${chave}`, em: data(r.em), estado: "declarado_cliente" };
  }
  const briefing = lerBriefingDeTrafego(negocio.onboarding);
  const nome = texto(negocio.name, 200);
  return {
    businessId: negocio.id,
    nome: nome && nome !== "Meu negócio" ? { valor: nome, origem: "businesses.name",
      em: resposta("nome")?.em ?? null, estado: "declarado_cliente" } : null,
    cores: cores?.valor && cores.origem && cores.estado === "confirmado_cliente"
      ? { valor: cores.valor, origem: cores.origem, em: data(cores.registradoEm), estado: "confirmado_cliente" } : null,
    oferta: briefing.oferta.estado === "informado" ? resposta("oferta") : null,
    // Objetivo só quando explicitamente respondido no legado. Resultado de compra não é objetivo de campanha.
    objetivo: resposta("objetivo"),
    apoio: ([ ["descricao", "O que o negócio oferece"], ["publico", "Quem compra"],
      ["motivo", "Motivo da procura"], ["resultado", "Entrega descrita"],
      ["diferencial", "Diferencial declarado"] ] as const).flatMap(([chave, rotulo]) => {
      const campo = resposta(chave); return campo ? [{ rotulo, campo }] : [];
    }),
    materiais,
  };
}

/** Prop de outro negócio nunca preenche campos, mesmo se a chamada da tela estiver incorreta. */
export function contextoDesteNegocio(contexto: ContextoDoCriativo | undefined, businessId: string) {
  return contexto?.businessId === businessId ? contexto : undefined;
}
