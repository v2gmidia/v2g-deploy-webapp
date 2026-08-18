import { acharCampo, chaveDoCampo, type Campo } from "./campos";
import { numeroApareceNoTrecho, semAcento } from "./numeros";
import type { CampoExtraido } from "./esquema";

/**
 * A verificação em código — o único mecanismo desta cadeia que não depende
 * de o modelo cooperar.
 *
 * O prompt torna a invenção improvável de três jeitos (estado `ausente`
 * como valor legítimo, saída estruturada, trecho obrigatório). Nenhum dos
 * três é uma garantia: um modelo que inventa um valor inventa a citação
 * junto, com a mesma naturalidade. Este arquivo é o que torna a invenção
 * DETECTÁVEL — e é a única parte que continua valendo se alguém editar o
 * prompt sem ler o desenho.
 *
 * O que ele NÃO pega, e é honesto dizer: trecho verdadeiro do qual se tirou
 * a conclusão errada. "Eu cobrava 200, hoje é 350" com o valor 200 e a
 * citação correta passa daqui. Contra isso não existe verificação
 * automática — existe a tela do lado a lado, que é para onde esse caso
 * precisa chegar inteiro.
 */

export interface ItemVerificado {
  campo: Campo;
  valor: unknown;
  confianca: "explicito" | "inferido";
  trecho: string;
}

export interface Descartado {
  chave: string;
  motivo: string;
  /** O que o modelo tinha proposto. Fica no registro, não vira item. */
  valor: unknown;
  trecho?: string;
}

export interface Verificacao {
  itens: ItemVerificado[];
  descartados: Descartado[];
}

/**
 * Normaliza para comparar trecho com transcrição.
 *
 * Espaço, quebra de linha e acento saem; a pontuação FICA. Tirar
 * pontuação afrouxaria a conferência a ponto de deixar passar recorte que
 * junta duas falas distantes — e é exatamente esse recorte que a gente
 * quer barrar. Caixa e acento saem porque o modelo às vezes normaliza a
 * primeira letra de um trecho que começa no meio da frase, e reprovar por
 * isso seria reprovar por nada.
 */
function normalizar(t: string): string {
  return semAcento(t).replace(/\s+/g, " ").trim();
}

export function trechoConfere(trecho: string, transcricao: string): boolean {
  const t = normalizar(trecho);
  // Trecho curto demais não prova nada: "sim" aparece em qualquer
  // transcrição, e passaria sempre.
  if (t.length < 12) return false;
  return normalizar(transcricao).includes(t);
}

/**
 * Filtra o que o modelo devolveu contra a transcrição de verdade.
 *
 * Item recusado não some: vai para `descartados`, com motivo. A alternativa
 * — sumir de vez — deixaria "o agente não achou" e "o agente inventou e a
 * gente pegou" com a mesma aparência na tela.
 */
export function verificar(
  extraidos: readonly CampoExtraido[],
  transcricao: string,
): Verificacao {
  const itens: ItemVerificado[] = [];
  const descartados: Descartado[] = [];
  const vistos = new Set<string>();

  for (const bruto of extraidos) {
    const campo = acharCampo(bruto.campo);

    if (!campo) {
      descartados.push({
        chave: bruto.campo,
        motivo: "campo fora do catalogo",
        valor: bruto.valor,
      });
      continue;
    }

    const chave = chaveDoCampo(campo);

    if (bruto.estado === "ausente") continue;

    // O `unique (proposta_id, tabela_alvo, campo)` do banco recusaria o
    // segundo, mas com erro de constraint no meio de uma inserção em lote
    // — e aí o lote inteiro cai por causa de um item repetido.
    if (vistos.has(chave)) {
      descartados.push({
        chave,
        motivo: "campo repetido na resposta",
        valor: bruto.valor,
        trecho: bruto.trecho,
      });
      continue;
    }

    const trecho = (bruto.trecho ?? "").trim();
    const confianca = bruto.confianca;

    if (!trecho || !confianca || bruto.valor === null || bruto.valor === undefined) {
      descartados.push({
        chave,
        motivo: "encontrado sem valor, trecho ou confianca",
        valor: bruto.valor,
        trecho,
      });
      continue;
    }

    if (!trechoConfere(trecho, transcricao)) {
      descartados.push({
        chave,
        motivo: "trecho nao encontrado na transcricao",
        valor: bruto.valor,
        trecho,
      });
      continue;
    }

    const valor = normalizarValor(campo, bruto.valor);
    if (valor === undefined) {
      descartados.push({
        chave,
        motivo: "valor nao bate com o tipo do campo",
        valor: bruto.valor,
        trecho,
      });
      continue;
    }

    // ---------- as duas regras extras de dinheiro ----------
    if (campo.dinheiro) {
      if (confianca !== "explicito") {
        descartados.push({
          chave,
          motivo: "campo de dinheiro so aceita explicito",
          valor,
          trecho,
        });
        continue;
      }
      if (!numeroApareceNoTrecho(valor as number, trecho)) {
        descartados.push({
          chave,
          motivo: "numero nao aparece no trecho citado",
          valor,
          trecho,
        });
        continue;
      }
    }

    vistos.add(chave);
    itens.push({ campo, valor, confianca, trecho });
  }

  return { itens, descartados };
}

/**
 * O tipo declarado no catálogo vence o que veio na resposta.
 *
 * `undefined` quer dizer recusado. Um número que chega como `"80"` é
 * aceito e convertido — a coluna é `numeric` e o modelo às vezes
 * serializa como texto; um número que chega como `"uns oitenta"` não é.
 */
function normalizarValor(campo: Campo, valor: unknown): unknown | undefined {
  switch (campo.tipo) {
    case "numero": {
      const n = typeof valor === "string" ? Number(valor.replace(",", ".")) : valor;
      if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
      // Dinheiro negativo ou zero não é dado, é ruído de transcrição.
      if (campo.dinheiro && n <= 0) return undefined;
      return n;
    }
    case "booleano":
      return typeof valor === "boolean" ? valor : undefined;
    case "lista": {
      if (!Array.isArray(valor)) return undefined;
      const limpa = valor
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean);
      return limpa.length ? limpa : undefined;
    }
    case "texto": {
      if (typeof valor !== "string") return undefined;
      const t = valor.trim();
      return t ? t : undefined;
    }
  }
}
