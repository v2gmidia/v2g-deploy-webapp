import type { Nicho, SubTipoDeNicho } from "./tipos";

/**
 * Ler um `GET /nichos` sem confiar no formato.
 *
 * SEM `server-only`, e não é descuido: aqui não há segredo nenhum — é
 * transformação pura de dados. Quem guarda o `X-V2G-Token` é
 * `lib/backend/nichos.ts`, que chama isto depois de receber o corpo.
 *
 * Ficar deste lado é o que deixa o `conferir:nichos` alimentar o
 * validador com os corpos tortos que um dia ruim do backend produziria.
 * Um validador de fronteira que ninguém consegue exercitar é um validador
 * em que ninguém confia — e testar uma CÓPIA dele seria pior: cópia
 * concorda consigo mesma para sempre.
 *
 * Por que validar em vez de só declarar o tipo: `as Nicho[]` é promessa
 * que o TypeScript acredita e o runtime não cumpre. Mesma regra do
 * `pre-requisitos.ts`.
 */

function textoNaoVazio(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function validarSubTipos(bruto: unknown): SubTipoDeNicho[] | null {
  // Ausente vira lista vazia: nove dos dez nichos não têm sub-tipo, e o
  // backend pode omitir em vez de mandar `[]`. Outro tipo qualquer é
  // mudança de contrato, e aí recusa.
  if (bruto === undefined || bruto === null) return [];
  if (!Array.isArray(bruto)) return null;

  const saida: SubTipoDeNicho[] = [];
  for (const item of bruto) {
    if (typeof item !== "object" || item === null) return null;
    const o = item as Record<string, unknown>;
    const id = textoNaoVazio(o.id);
    const rotulo = textoNaoVazio(o.rotulo);
    const nomeExibicao = textoNaoVazio(o.nome_exibicao);
    if (!id || !rotulo || !nomeExibicao) return null;
    saida.push({ id, rotulo, nomeExibicao });
  }
  return saida;
}

/**
 * Valida o que chegou, sem confiar no formato — a mesma regra do
 * `pre-requisitos.ts`: `as Nicho[]` é promessa que o TypeScript acredita
 * e o runtime não cumpre.
 *
 * ============================================================
 * TUDO OU NADA, E É DECISÃO.
 *
 * Um item malformado reprova a lista inteira em vez de ser descartado em
 * silêncio. Descartar seria pior do que parece: o nicho sumido não vira
 * erro em lugar nenhum — vira um dono de petshop que digita "petshop",
 * não acha, e cai no texto livre achando que o produto não atende o ramo
 * dele. Reprovar a lista mostra os chips de reserva, que é um estado
 * degradado VISÍVEL.
 *
 * Lista vazia também reprova: zero chip na tela é pior que cinco chips
 * imprecisos, e um `[]` do backend é muito mais provável como defeito do
 * que como verdade.
 * ============================================================
 *
 * O CONFERIDOR exercita esta função direto, com corpos tortos.
 * Ver `scripts/conferir-nichos.ts` §1.
 */
export function validarListaDeNichos(bruto: unknown): Nicho[] | null {
  if (!Array.isArray(bruto) || bruto.length === 0) return null;

  const saida: Nicho[] = [];
  for (const item of bruto) {
    if (typeof item !== "object" || item === null) return null;
    const o = item as Record<string, unknown>;

    const nicho = textoNaoVazio(o.nicho);
    const rotulo = textoNaoVazio(o.rotulo);
    if (!nicho || !rotulo) return null;

    // Sem termos de busca o nicho ainda funciona como chip, então a
    // ausência não reprova — só empobrece a busca. Tipo errado reprova.
    const brutosTermos = o.termos_de_busca;
    let termosDeBusca: string[] = [];
    if (brutosTermos !== undefined && brutosTermos !== null) {
      if (!Array.isArray(brutosTermos)) return null;
      if (!brutosTermos.every((t) => typeof t === "string")) return null;
      termosDeBusca = brutosTermos as string[];
    }

    const subTipos = validarSubTipos(o.sub_tipos);
    if (subTipos === null) return null;

    saida.push({ nicho, rotulo, termosDeBusca, subTipos });
  }
  return saida;
}
