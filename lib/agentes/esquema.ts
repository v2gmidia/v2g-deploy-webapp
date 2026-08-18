import { CHAVES } from "./campos";

/**
 * O `json_schema` que restringe a saída do modelo, montado do catálogo.
 *
 * É aqui que mora o mecanismo (b) do desenho: `estado` é um `enum` de dois
 * valores, e as duas formas possíveis do item são `anyOf` — a de
 * `encontrado`, que EXIGE valor, confiança e trecho, e a de `ausente`, que
 * não ACEITA nenhum dos três (`additionalProperties: false`).
 *
 * A diferença em relação a pedir isso em prosa: não é validação depois do
 * fato, é a forma imposta na geração. O modelo não consegue devolver um
 * valor sem estado compatível, nem um `ausente` com um palpite junto.
 *
 * Saídas estruturadas não aceitam restrição numérica nem de tamanho de
 * string (`minimum`, `minLength`), então piso, teto e trecho vazio são
 * conferidos em `verificar.ts`. O schema garante FORMA; o código garante
 * CONTEÚDO.
 */
export function esquemaDaExtracao() {
  return {
    type: "object",
    properties: {
      campos: {
        type: "array",
        items: {
          anyOf: [
            {
              type: "object",
              properties: {
                campo: { type: "string", enum: [...CHAVES] },
                estado: { type: "string", enum: ["encontrado"] },
                valor: {
                  anyOf: [
                    { type: "string" },
                    { type: "number" },
                    { type: "boolean" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                confianca: { type: "string", enum: ["explicito", "inferido"] },
                trecho: {
                  type: "string",
                  description:
                    "Copiado literalmente da transcricao, palavra por palavra.",
                },
              },
              required: ["campo", "estado", "valor", "confianca", "trecho"],
              additionalProperties: false,
            },
            {
              type: "object",
              properties: {
                campo: { type: "string", enum: [...CHAVES] },
                estado: { type: "string", enum: ["ausente"] },
              },
              required: ["campo", "estado"],
              additionalProperties: false,
            },
          ],
        },
      },
    },
    required: ["campos"],
    additionalProperties: false,
  } as const;
}

/** O que uma resposta bem formada traz por campo. */
export type CampoExtraido =
  | {
      campo: string;
      estado: "encontrado";
      valor: unknown;
      confianca: "explicito" | "inferido";
      trecho: string;
    }
  | {
      campo: string;
      estado: "ausente";
      valor?: undefined;
      confianca?: undefined;
      trecho?: undefined;
    };

export interface RespostaDaExtracao {
  campos: CampoExtraido[];
}

/**
 * Confere a forma do que voltou antes de qualquer uso.
 *
 * O `output_config.format` já garante isso do lado do servidor. Conferir de
 * novo aqui custa quase nada e cobre o caso em que a resposta chega
 * truncada — `max_tokens` estourado devolve JSON pela metade, e aí a
 * garantia do schema não valeu.
 */
export function respostaTemForma(x: unknown): x is RespostaDaExtracao {
  if (typeof x !== "object" || x === null) return false;
  const campos = (x as { campos?: unknown }).campos;
  if (!Array.isArray(campos)) return false;
  return campos.every(
    (c) =>
      typeof c === "object" &&
      c !== null &&
      typeof (c as { campo?: unknown }).campo === "string" &&
      ((c as { estado?: unknown }).estado === "encontrado" ||
        (c as { estado?: unknown }).estado === "ausente"),
  );
}
