import "server-only";
import { obter, TIMEOUTS } from "./cliente";
import { falha, registrarErroBackend, type Resultado } from "./erros";

/**
 * `GET /campanhas/pre-requisitos` — a conferência antes de criar campanha.
 *
 * READ-ONLY: não escreve nada, nem na Meta nem no banco. É seguro chamar
 * quantas vezes quiser, inclusive para montar tela.
 */

export interface PreRequisitos {
  ok: boolean;
  bloqueios: string[];
  avisos: string[];
  /**
   * `null` quando o backend não informou.
   *
   * NÃO É `false` NESSE CASO. A gente já se queimou com isso: os campos
   * de WhatsApp da Página do Facebook vêm ausentes mesmo quando o número
   * existe, e tratar ausência como "não tem" fez a interface acusar todo
   * cliente de não ter WhatsApp (`docs/oauth-meta.md` §2.1).
   * Ausência de informação e informação negativa são coisas diferentes.
   */
  temWhatsapp: boolean | null;
}

/**
 * Valida o que chegou, sem confiar no formato.
 *
 * Por que validar em vez de só declarar o tipo: `as PreRequisitos` é uma
 * promessa que o TypeScript acredita e o runtime não cumpre. Se o backend
 * mudar `bloqueios` de lista para objeto, o `as` deixa passar e a tela
 * quebra num `.map` — longe daqui, com um erro que não menciona o
 * backend. Validar na fronteira faz a falha aparecer onde ela nasceu.
 */
function validar(bruto: unknown): PreRequisitos | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const o = bruto as Record<string, unknown>;

  if (typeof o.ok !== "boolean") return null;

  // Listas de texto: aceita a ausência como lista vazia (o backend pode
  // omitir quando não há nada), mas recusa se vier com outro tipo — aí é
  // mudança de contrato, não omissão.
  const listaDeTexto = (v: unknown): string[] | null => {
    if (v === undefined || v === null) return [];
    if (!Array.isArray(v)) return null;
    return v.every((x) => typeof x === "string") ? (v as string[]) : null;
  };

  const bloqueios = listaDeTexto(o.bloqueios);
  const avisos = listaDeTexto(o.avisos);
  if (bloqueios === null || avisos === null) return null;

  return {
    ok: o.ok,
    bloqueios,
    avisos,
    temWhatsapp: typeof o.tem_whatsapp === "boolean" ? o.tem_whatsapp : null,
  };
}

export interface FiltrosPreRequisitos {
  idContaAnuncio?: string;
  idPagina?: string;
  aceitarFallbackMessenger?: boolean;
  vaiCriarAnuncio?: boolean;
}

export async function consultarPreRequisitos(
  filtros: FiltrosPreRequisitos = {},
): Promise<Resultado<PreRequisitos>> {
  const resposta = await obter("/campanhas/pre-requisitos", {
    contexto: "pre-requisitos",
    // Read-only e rápido: o timeout curto vale. Se este endpoint começar
    // a levar minutos, é sinal de que ele passou a fazer mais que ler.
    timeoutMs: TIMEOUTS.rapido,
    // O backend usa snake_case; o resto do nosso código usa camelCase. A
    // tradução acontece AQUI, na fronteira, e em nenhum outro lugar.
    params: {
      id_conta_anuncio: filtros.idContaAnuncio,
      id_pagina: filtros.idPagina,
      aceitar_fallback_messenger: filtros.aceitarFallbackMessenger,
      vai_criar_anuncio: filtros.vaiCriarAnuncio,
    },
  });

  if (!resposta.ok) return resposta;

  const validado = validar(resposta.dados);
  if (!validado) {
    registrarErroBackend("pre-requisitos", {
      metodo: "GET",
      caminho: "/campanhas/pre-requisitos",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }

  return { ok: true, dados: validado };
}
