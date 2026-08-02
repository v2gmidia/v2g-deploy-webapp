import "server-only";
import { lerMarketing } from "./marketing";

/**
 * Onde o anúncio é entregue.
 *
 * `businesses.city` é texto livre ("São Paulo, SP", "Rio de janeiro"). A
 * Marketing API precisa de coordenada ou de uma chave de cidade do
 * próprio Meta. Este módulo faz a ponte, uma vez por negócio, e o
 * resultado fica no banco — resolver a cada publicação seria lento,
 * frágil e queimaria requisição para um dado que muda quando o cliente
 * muda de endereço, ou seja, quase nunca.
 *
 * ------------------------------------------------------------------
 * OS LIMITES ABAIXO FORAM MEDIDOS, NÃO LIDOS NA DOCUMENTAÇÃO.
 *
 * Cada raio foi submetido a `validate_only` contra a conta real, numa
 * campanha OUTCOME_ENGAGEMENT. O resultado, com o erro 1487110
 * ("o raio geográfico não está dentro dos limites especificados"):
 *
 *   geo_locations.cities            1, 5, 10, 15 km → RECUSA
 *                                   16 … 80 km      → aceita
 *                                   100 km          → RECUSA
 *   geo_locations.custom_locations  1, 5, 15, 30 km → aceita
 *
 * Ou seja: **`cities` não consegue fazer raio pequeno.** O piso é 16 km,
 * que numa cidade como o Rio cobre metade da zona sul e boa parte da
 * norte. Para os 5 km que a interface oferece, só `custom_locations`
 * serve — e ele exige latitude e longitude.
 * ------------------------------------------------------------------
 */

export interface Coordenada {
  lat: number;
  lng: number;
  /** o que a interface mostra ao cliente para ele confirmar */
  label: string;
}

export interface CidadeInteira {
  key: string;
  label: string;
}

export type Local =
  | ({ tipo: "ponto" } & Coordenada)
  | ({ tipo: "cidade" } & CidadeInteira);

/**
 * Os raios que a interface oferece. Fechado em 5/15/30 km.
 *
 * Não é lista aberta porque raio é a decisão que mais silenciosamente
 * queima verba: 50 km numa cidade grande entrega para quem nunca vai
 * atravessar a cidade por uma pizzaria.
 */
export const RAIOS_KM = [5, 15, 30] as const;
export type RaioKm = (typeof RAIOS_KM)[number];

export const RAIO_PADRAO: RaioKm = 15;

/**
 * Encaixa o raio guardado no negócio num dos três valores oferecidos.
 *
 * `businesses.radius_km` é `int` livre desde a 0001 e pode ter qualquer
 * coisa — inclusive valores de antes desta regra existir. Arredondar para
 * o mais próximo é melhor que recusar: o cliente não escolheu um número
 * inválido, ele escolheu antes da regra existir.
 */
export function raioValido(bruto: unknown): RaioKm {
  const n = Number(bruto);
  if (!Number.isFinite(n) || n <= 0) return RAIO_PADRAO;
  return RAIOS_KM.reduce((melhor, r) =>
    Math.abs(r - n) < Math.abs(melhor - n) ? r : melhor,
  );
}

/**
 * A coordenada do negócio, tirada do endereço da Página do Facebook.
 *
 * ESTA É A DEPENDÊNCIA CONCRETA DE `pages_read_engagement`. Quando o
 * escopo foi mantido (ver `lib/meta/oauth.ts`), a justificativa era
 * "provavelmente vai precisar". Precisou: `/search?type=adgeolocation`
 * devolve `key`, `name` e `region`, mas **não devolve coordenada**, e sem
 * coordenada não existe raio de 5 km. A Página devolve:
 *
 *   GET /{page_id}?fields=location
 *   → { latitude: -22.96037, longitude: -43.17866,
 *       street: "Ladeira do leme 156", city: "Rio de Janeiro", ... }
 *
 * E é um dado melhor que o centro da cidade: é onde o negócio fica de
 * verdade. Um raio de 5 km em volta da loja não é o mesmo círculo que um
 * raio de 5 km em volta do centro do município.
 */
export async function coordenadaDaPagina(
  pageId: string,
  token: string,
): Promise<Coordenada | null> {
  try {
    const dados = await lerMarketing<{
      location?: { latitude?: number; longitude?: number; city?: string; street?: string };
    }>(`/${pageId}?fields=location`, token);

    const loc = dados.location;
    if (typeof loc?.latitude !== "number" || typeof loc?.longitude !== "number") return null;

    const partes = [loc.street, loc.city].filter(Boolean);
    return {
      lat: loc.latitude,
      lng: loc.longitude,
      label: partes.length > 0 ? partes.join(", ") : "endereço da sua página",
    };
  } catch {
    // Página sem endereço cadastrado é comum e não é erro. Quem chama cai
    // para a cidade inteira.
    return null;
  }
}

/**
 * A cidade, quando não há endereço na Página.
 *
 * Devolve `null` quando não achou — e `null` **aborta a publicação**.
 * Anunciar no lugar errado é pior que não anunciar, e um fallback do tipo
 * "usa o país inteiro" gastaria a verba do cliente em outro estado.
 */
export async function resolverCidade(
  cidade: string,
  token: string,
): Promise<CidadeInteira | null> {
  const termo = cidade.trim();
  if (!termo) return null;

  const params = new URLSearchParams({
    type: "adgeolocation",
    location_types: JSON.stringify(["city"]),
    q: termo,
    // O cliente é brasileiro e "Santa Cruz" existe em uma dúzia de
    // países. Sem este filtro, a primeira resposta pode ser da Bolívia.
    country_code: "BR",
    limit: "10",
  });

  const dados = await lerMarketing<{
    data?: Array<{ key?: string; name?: string; type?: string; region?: string }>;
  }>(`/search?${params}`, token);

  // `location_types: ["city"]` NÃO garante que só venha cidade: a busca
  // por "Rio de Janeiro" devolve os bairros Centro e Copacabana junto,
  // com `type: "neighborhood"`. Filtrar aqui evita anunciar num bairro
  // achando que é a cidade.
  const achado = dados.data?.find((c) => c.key && c.type === "city");
  if (!achado) return null;

  return {
    key: achado.key as string,
    label: achado.region ? `${achado.name}, ${achado.region}` : (achado.name ?? termo),
  };
}

/**
 * O bloco `targeting` do conjunto.
 *
 * Segmentação **ampla**: 18-65+, sem interesses, sem comportamentos. A
 * decisão está em `docs/publicar-campanha.md` §9.2 — o algoritmo do Meta
 * acha o público melhor que uma lista de interesses escolhida a dedo, e
 * interesse errado num orçamento pequeno é o jeito mais rápido de não
 * aprender nada.
 *
 * O único recorte é geográfico, porque esse não é estatístico: uma
 * pizzaria não entrega em outra cidade.
 */
export function montarSegmentacao(local: Local, raioKm: RaioKm) {
  const geo =
    local.tipo === "ponto"
      ? {
          custom_locations: [
            {
              latitude: local.lat,
              longitude: local.lng,
              radius: raioKm,
              distance_unit: "kilometer",
            },
          ],
        }
      : // Cidade inteira, SEM raio. O piso de 16 km do `cities` faria um
        // "5 km" virar 16 km sem avisar ninguém — e o cliente pagaria por
        // três vezes a área que ele escolheu. Cidade inteira ao menos é
        // uma coisa que dá para dizer em voz alta na interface.
        { cities: [{ key: local.key }] };

  return {
    geo_locations: geo,
    age_min: 18,
    age_max: 65,
    // Público Advantage+: o Meta pode expandir para fora do que a gente
    // definiu, EXCETO o geográfico. `1` liga.
    targeting_automation: { advantage_audience: 1 },
  };
}
