import type { NichoDaTela } from "./perguntas";
import { normalizar } from "@/lib/nichos/busca";

/**
 * ACHAR O NICHO PELO QUE A PESSOA ESCREVEU — a parte de graça.
 *
 * ============================================================
 * DUAS CAMADAS, E ESTA É A PRIMEIRA.
 *
 * 1. AQUI: casamento contra os `termos_de_busca` que o `GET /nichos` já
 *    devolve. Custa nada, responde na hora, e resolve o caso que o
 *    briefing cita — "designer de interiores" está entre os 12 termos de
 *    `arquitetura`.
 * 2. O BACKEND: `POST /agentes/classificar-nicho`, quando esta não achar.
 *    Ela roda um LLM e custa; por isso vem depois, e não antes.
 *
 * Inverter a ordem seria pagar por um modelo para descobrir que "dentista"
 * é `clinica-odontologica`, que está escrito numa lista que a gente já
 * tem na mão.
 * ============================================================
 *
 * ============================================================
 * OS `sub_tipos` NÃO SERVEM: medido em 22/09/2026, eles vêm VAZIOS nos
 * oito nichos. Quem carrega o vocabulário é `termos_de_busca`.
 * ============================================================
 *
 * ============================================================
 * A LISTA CHEGA COMO ARGUMENTO, NÃO COMO IMPORT.
 *
 * Até 22/09 este arquivo importava `NICHOS_DA_BANCADA`, uma cópia
 * congelada dos oito nichos com os 113 termos. Cópia de lista viva
 * envelhece: a mesma constante já tinha apodrecido uma vez antes de ser
 * recongelada. Agora quem chama passa a lista que veio do `GET /nichos`,
 * e a classificação trabalha sempre sobre o vocabulário de hoje.
 *
 * Lista vazia devolve `null` — que é o certo: sem vocabulário não há
 * como achar nada, e o chamador cai no caminho de gente.
 * ============================================================
 */

/** O que a busca local devolve. `null` = não achei, e aí é com o backend. */
export interface Palpite {
  nicho: string;
  rotulo: string;
  /** o termo que casou — é o que deixa a proposta explicável */
  termo: string;
  /** de onde veio: aqui ou do backend */
  origem: "termos" | "backend";
  /** 0 a 1. A busca local usa degraus fixos; o backend manda o dele. */
  confianca: number;
}

/**
 * Sem acento, caixa baixa, e sem pontuação — o texto pronto para comparar.
 *
 * ============================================================
 * A BASE É A DE PRODUÇÃO, NÃO UMA SEGUNDA.
 *
 * `normalizar()` de `lib/nichos/busca.ts` já é a definição de "sem acento
 * e em caixa baixa" deste repositório, e é ela que a busca de nicho da
 * tela de cadastro usa nos DOIS lados (navegador e servidor). Eu tinha
 * escrito um normalizador meu aqui; eram duas definições da mesma coisa,
 * e o dia em que uma ganhasse um acento que a outra não tem seria um dia
 * de caçar fantasma.
 *
 * O que sobra de meu é UMA linha: trocar pontuação por espaço. A busca de
 * produção não precisa disso porque casa por substring sobre o que foi
 * digitado; aqui eu quebro a frase em PALAVRAS, e "interiores," com
 * vírgula colada não é a palavra "interiores".
 * ============================================================
 */
function achatar(bruto: string): string {
  return normalizar(bruto)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "interiores" → "interior", "projetos" → "projeto". Só o plural fácil. */
function semPlural(palavra: string): string {
  if (palavra.length > 4 && palavra.endsWith("es")) return palavra.slice(0, -2);
  if (palavra.length > 3 && palavra.endsWith("s")) return palavra.slice(0, -1);
  return palavra;
}

function palavras(texto: string): string[] {
  return achatar(texto).split(" ").filter(Boolean).map(semPlural);
}

/**
 * Duas palavras são a mesma coisa? Com tolerância de RADICAL.
 *
 * ============================================================
 * "designer" contra "design" era o buraco. O termo do backend é "design
 * de interiores"; quem escreve diz "sou designer de interiores". Sem
 * tolerância, o caso que o briefing cita pelo nome não casava — e o
 * conferidor pegou isso antes de virar tela.
 *
 * A regra é curta de propósito: uma palavra conta como a outra quando
 * uma COMEÇA com a outra e a menor tem pelo menos 5 letras. Cinco é o
 * que separa "design/designer" e "arquitet-" de "casa/casamento".
 * ============================================================
 */
const RADICAL_MINIMO = 5;

function mesmaPalavra(a: string, b: string): boolean {
  if (a === b) return true;
  const [curta, longa] = a.length <= b.length ? [a, b] : [b, a];
  return curta.length >= RADICAL_MINIMO && longa.startsWith(curta);
}

/** Palavras curtas demais não distinguem nada. */
const CURTAS = new Set([
  "de", "do", "da", "dos", "das", "e", "o", "a", "os", "as", "em", "no", "na",
  "com", "para", "por", "um", "uma", "que", "eu", "meu", "minha", "sou", "faco",
  "trabalho", "negocio", "empresa", "loja", "servico", "cliente",
]);

/**
 * O melhor palpite pelos termos. `null` quando nada casa o bastante.
 *
 * ============================================================
 * O CRITÉRIO É TERMO INTEIRO, E DEPOIS PALAVRA RARA.
 *
 * Um termo inteiro dentro do texto ("design de interiores") é evidência
 * forte e vale 0,9. Palavras soltas valem menos, e só contam as que não
 * estão em `CURTAS` — senão "eu faço" casaria com tudo que tem "faço" nos
 * termos.
 *
 * Abaixo de `PISO` a função devolve `null` em vez de um palpite fraco. Um
 * palpite fraco na tela é pior do que nenhum: ele convida a pessoa a
 * dizer "confere" sobre uma coisa que a gente chutou.
 * ============================================================
 */
const PISO = 0.5;

/**
 * O teto de quem casou por PALAVRA — abaixo do termo inteiro, sempre.
 *
 * ============================================================
 * Sem este teto, "sou designer de interiores" saía com confiança 1,0:
 * duas palavras de duas, nota cheia. Mais alta do que o 0,9 de quem casa
 * o termo INTEIRO — e casar o termo inteiro é evidência melhor.
 *
 * Um número que ordena errado é pior do que nenhum número: ele vai
 * decidir qual palpite ganha quando dois nichos casarem, e vai decidir a
 * favor do mais fraco.
 * ============================================================
 */
const TETO_POR_PALAVRA = 0.8;

export function acharPorTermos(texto: string, nichos: NichoDaTela[]): Palpite | null {
  const alvo = achatar(texto);
  if (alvo.length < 3) return null;
  const doTexto = new Set(palavras(texto).filter((p) => !CURTAS.has(p)));

  let melhor: Palpite | null = null;

  for (const n of nichos) {
    for (const termo of n.termos) {
      const termoAchatado = achatar(termo);
      if (!termoAchatado) continue;

      // 1. o termo inteiro aparece no que ela escreveu
      if (termoAchatado.length >= 5 && alvo.includes(termoAchatado)) {
        return { nicho: n.nicho, rotulo: n.rotulo, termo, origem: "termos", confianca: 0.9 };
      }

      // 2. quantas palavras raras do termo estão no texto
      const doTermo = palavras(termo).filter((p) => !CURTAS.has(p));
      if (doTermo.length === 0) continue;
      const casaram = doTermo.filter((p) => [...doTexto].some((q) => mesmaPalavra(p, q))).length;
      const nota = (casaram / doTermo.length) * TETO_POR_PALAVRA;
      // Uma palavra só de um termo de uma palavra ainda é fraco: exige
      // que a palavra tenha corpo.
      const forte = casaram >= 2 || (casaram === 1 && doTermo.length === 1 && doTermo[0]!.length >= 6);
      if (forte && nota >= PISO && (melhor === null || nota > melhor.confianca)) {
        melhor = { nicho: n.nicho, rotulo: n.rotulo, termo, origem: "termos", confianca: nota };
      }
    }
  }

  return melhor;
}

/** O rótulo de um nicho, para a tela escrever a proposta. */
export function rotuloDoNicho(nicho: string, nichos: NichoDaTela[]): string | null {
  return nichos.find((n) => n.nicho === nicho)?.rotulo ?? null;
}

/**
 * O rótulo em tamanho de FRASE — porque ele vai virar frase.
 *
 * ============================================================
 * TRÊS DOS OITO RÓTULOS NÃO SÃO RÓTULOS. São verbetes.
 *
 * `lib/nichos/tipos.ts` promete: "Voz de dono, não de catálogo:
 * `clinica-odontologica` → Dentista. É isto que vai no chip e é isto que
 * é gravado em `businesses.niche`." Medido no `GET /nichos` de
 * 22/09/2026, três dos oito chegam assim:
 *
 *   "Análise de coloração pessoal / consultoria de imagem (Austrália)"
 *   "Gestão de tráfego pago / anúncios no Google e no Instagram para
 *    pequeno negócio"
 *   "Rastreamento veicular / rastreador para carro, moto e frota"
 *
 * Inteiros, dentro da proposta, viram isto:
 *
 *   "Pelo que você contou, o seu caso é Gestão de tráfego pago /
 *    anúncios no Google e no Instagram para pequeno negócio. Confere?"
 *
 * Ninguém responde "confere" para uma frase assim. Ela não parece um
 * entendimento do negócio da pessoa; parece uma consulta a um banco.
 *
 * O CONSERTO DE VERDADE NÃO É AQUI — é no `knowledge/` do backend, que é
 * de onde esses rótulos vêm. Enquanto ele não vem, corto na primeira
 * barra: o que está antes dela é o rótulo, o que vem depois são os
 * sinônimos que o catálogo carrega junto. Está em DUVIDAS.md.
 *
 * Um "(Austrália)" num produto para PME brasileira também está lá — esse
 * eu não tapo, porque tapar esconderia que ele existe.
 * ============================================================
 */
export function rotuloParaFrase(nicho: string, nichos: NichoDaTela[]): string | null {
  const inteiro = rotuloDoNicho(nicho, nichos);
  if (!inteiro) return null;
  const antesDaBarra = inteiro.split("/")[0]!.trim();
  return antesDaBarra || inteiro;
}
