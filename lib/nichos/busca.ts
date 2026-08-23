import type { Nicho } from "./tipos";

/**
 * A busca de nicho — normalização e filtro.
 *
 * SEM `server-only`: o filtro roda no navegador (handoff §2) e a
 * validação do `ramo` roda no servidor (handoff §6). É o MESMO código nos
 * dois lados de propósito. Se o cliente casasse por uma regra e o
 * servidor por outra, existiria escolha que a tela oferece e a ação
 * recusa — e o cliente veria "essa opção não existe" depois de tocar num
 * chip que estava ali.
 */

/**
 * Caixa baixa + diacríticos fora.
 *
 * ============================================================
 * NORMALIZE OS DOIS LADOS. SEMPRE.
 *
 * Isto já mordeu numa verificação de produção: `rodizio` não casou com o
 * termo gravado `rodízio`, porque só um lado foi normalizado. A leitura
 * errada daquele resultado seria "o termo está errado", e o conserto
 * errado seria tirar o acento do `knowledge/restaurante.md` — mexer no
 * dado para um teste ruim passar, e quebrar a grafia que o cliente lê na
 * tela.
 *
 * Termos com acento hoje: rodízio, japonês, ração, veterinário, cílios,
 * degradê, óleo, castração, musculação, estética.
 * ============================================================
 *
 * `NFD` separa a letra do acento e a classe `\p{Diacritic}` remove o
 * acento solto. O `toLowerCase` vem ANTES por causa do "İ" turco, que só
 * decompõe direito depois de rebaixado — não acontece em português, mas
 * custa nada e evita um bug que ninguém procuraria aqui.
 */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Os nichos que casam com o que foi digitado.
 *
 * Casa por SUBSTRING no rótulo, no identificador e nos termos de busca.
 * Substring e não igualdade: quem digita "dent" tem que achar "Dentista"
 * antes de terminar a palavra.
 *
 * ============================================================
 * O CORTE PARA MOVER ISTO AO SERVIDOR NÃO É A CONTAGEM DE NICHOS.
 *
 * São dez hoje, e a lista inteira cabe em 3,8 KB — mandar uma vez custa
 * menos que uma ida ao servidor por tecla. Por volume puro isto aguenta
 * 150–200 nichos.
 *
 * O dia de mover é o dia em que casar termo virar mais que substring:
 * sinônimo, erro de digitação, radical. Aí a regra deixa de caber num
 * `includes` e passa a precisar de índice. Não mova antes por causa do
 * número de itens.
 * ============================================================
 *
 * Consulta vazia devolve a lista inteira: o campo de busca começa vazio e
 * os dez chips têm que estar visíveis (handoff §2 — não obriga a digitar
 * e não esconde a lista).
 *
 * `padaria`, `doceria`, `mercearia` e `lavanderia` não acham nada, e ISSO
 * É A DECISÃO FUNCIONANDO, não falha da busca: esses nichos não existem
 * em `knowledge/`, e sugerir o vizinho mais próximo foi recusado — seria
 * interface pedindo desculpa por não ter o que a pessoa precisa. Quem não
 * acha cai no texto livre, que é um caminho digno.
 */
export function filtrarNichos(nichos: Nicho[], consulta: string): Nicho[] {
  const alvo = normalizar(consulta);
  if (!alvo) return nichos;

  return nichos.filter((n) => {
    if (normalizar(n.rotulo).includes(alvo)) return true;
    if (normalizar(n.nicho).includes(alvo)) return true;
    return n.termosDeBusca.some((t) => normalizar(t).includes(alvo));
  });
}

/**
 * O nicho cujo RÓTULO é exatamente este, ou `undefined`.
 *
 * Igualdade normalizada, não substring: aqui a pergunta é "este valor é um
 * nicho da lista viva?", e substring responderia sim para "Dent", que
 * ninguém escolheu. É esta função que a validação do servidor usa
 * (handoff §6), sobre o que o CLIENTE mandou.
 *
 * Quem decide se um `niche` já GRAVADO ainda é reconhecido é a
 * `nichoPeloIdentificador` logo abaixo — desde 23/08 a coluna guarda o
 * identificador, e conferi-la pelo rótulo passaria a reprovar tudo.
 */
export function nichoPeloRotulo(nichos: Nicho[], rotulo: string): Nicho | undefined {
  const alvo = normalizar(rotulo);
  if (!alvo) return undefined;
  return nichos.find((n) => normalizar(n.rotulo) === alvo);
}

/**
 * O nicho cujo IDENTIFICADOR é exatamente este, ou `undefined`.
 *
 * ============================================================
 * É ELA QUE LÊ O QUE ESTÁ GRAVADO EM `businesses.niche`.
 *
 * Desde 23/08 a coluna guarda o identificador (`clinica-odontologica`), e
 * não o rótulo — ver `lib/nichos/gravado.ts` para o porquê e para o que
 * acontece com o valor que não casa com nenhum.
 *
 * Igualdade normalizada, como a irmã acima. O identificador já vem em
 * caixa baixa e sem acento do backend, então a normalização aqui não muda
 * nada hoje; ela existe para o valor que veio da coluna, que pode ter
 * sido escrito por outro caminho.
 * ============================================================
 */
export function nichoPeloIdentificador(
  nichos: Nicho[],
  identificador: string,
): Nicho | undefined {
  const alvo = normalizar(identificador);
  if (!alvo) return undefined;
  return nichos.find((n) => normalizar(n.nicho) === alvo);
}

/**
 * O que o Enter faz com o que está escrito no campo.
 *
 * Função pura e fora do componente porque a regra ficou sutil — e regra
 * sutil dentro de JSX é regra que ninguém confere. Os quatro desfechos
 * estão em `conferir:nichos` §9.
 */
export type ResolucaoDaConsulta =
  /** sobrou um, ou o rótulo foi digitado inteiro: Enter escolhe */
  | { tipo: "nicho"; nicho: Nicho }
  /** não achou nada: Enter manda o texto como resposta livre */
  | { tipo: "livre"; texto: string }
  /** dois ou mais na tela: Enter não age, a pessoa toca no chip */
  | { tipo: "escolha" }
  /** campo vazio */
  | { tipo: "vazia" };

/**
 * ============================================================
 * ENTER ESCOLHE QUANDO SOBROU UM SÓ — decisão do Victor, 22/08.
 *
 * O desenho anterior exigia o rótulo inteiro digitado, e o furo era o
 * caminho comum: a pessoa digita "pizzaria", vê UM resultado, aperta
 * Enter e nada acontece. Ficar preso é pior que o risco que a regra
 * antiga evitava — e o risco quase não existe, porque o chip único está
 * visível logo acima do campo. Ela vê o que o Enter vai escolher.
 *
 * Com dois ou mais, Enter não age: não há como escolher sem adivinhar, e
 * adivinhar por alguém é o que esta função existe para não fazer.
 *
 * O rótulo exato tem PRECEDÊNCIA sobre o "sobrou um". Hoje os dois nunca
 * discordam, mas discordariam no dia em que um rótulo casasse com os
 * termos de busca de outro nicho — e aí quem digitou "Petshop" inteiro
 * ainda quer Petshop, não a lista de dois.
 * ============================================================
 */
export function resolverConsulta(nichos: Nicho[], consulta: string): ResolucaoDaConsulta {
  const texto = consulta.trim();
  if (!texto) return { tipo: "vazia" };

  const exato = nichoPeloRotulo(nichos, texto);
  if (exato) return { tipo: "nicho", nicho: exato };

  const visiveis = filtrarNichos(nichos, texto);
  if (visiveis.length === 1) return { tipo: "nicho", nicho: visiveis[0]! };
  if (visiveis.length === 0) return { tipo: "livre", texto };
  return { tipo: "escolha" };
}
