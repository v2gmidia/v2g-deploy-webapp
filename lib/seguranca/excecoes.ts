/**
 * Onde um id vindo da REQUISIÇÃO endereça dado — e por que é permitido.
 *
 * Conferido por `pnpm conferir:identidade`. Desenho e medição em
 * `docs/superficie-do-token.md`.
 *
 * ============================================================
 * A REGRA, EM UMA FRASE.
 *
 * **Nenhum valor lido de `searchParams`, `params`, `formData` ou cookie
 * pode virar filtro de linha ou argumento de função que consulta — salvo
 * nos arquivos declarados aqui, e cada declaração diz qual das três
 * autorizações se aplica e por quê.**
 *
 * Sem a lista branca a regra NÃO cabe em uma frase, e isso foi medido:
 * três formulações foram testadas contra o repositório real e as três
 * quebraram, porque existem três formas legítimas de autorizar e elas são
 * semânticas, não sintáticas — nenhum lint distingue as três lendo a
 * forma do código.
 * ============================================================
 *
 * ============================================================
 * AS TRÊS AUTORIZAÇÕES. É a única taxonomia que este arquivo aceita.
 *
 *   posse   o id sai de um `select` sob RLS filtrado por `auth.getUser()`,
 *           ou é reconferido contra ele antes de endereçar dado
 *   papel   `app_metadata.papel === "operador"` — quem pode ver todos
 *   prova   uma assinatura criptográfica, quando não há sessão nenhuma
 *
 * Um caso novo que não caiba em nenhuma das três não é uma quarta
 * categoria: é um caso que precisa de decisão humana antes de existir.
 * ============================================================
 *
 * ============================================================
 * O VALOR DISTO NÃO É PEGAR O CÓDIGO DE HOJE — ele está certo. É OBRIGAR
 * O QUARTO CASO A SE DECLARAR, em vez de entrar calado.
 *
 * Foi o que o `docs/superficie-do-token.md` mediu: a separação entre
 * clientes é disciplina de código, não invariante do sistema. Um handler
 * novo que aceitasse `?business_id=` e chamasse o backend funcionaria,
 * passaria no build e passaria no `pnpm conferir` — e leria o negócio de
 * qualquer cliente. Este arquivo é o que faz ele parar e explicar.
 * ============================================================
 *
 * ESTA LISTA NÃO É ESCONDERIJO — as mesmas duas garantias da lista de
 * inertes do `conferir:cascata`: cada entrada é IMPRESSA a cada execução,
 * e entrada que deixa de ocorrer vira FALHA. Ela não envelhece sozinha.
 */

export type Autorizacao = "posse" | "papel" | "prova";

export interface ExcecaoDeIdentidade {
  /** caminho relativo à raiz, com `/` */
  arquivo: string;
  autorizacao: Autorizacao;
  /** o que entra pela requisição */
  oQueEntra: string;
  /** o que autoriza, em uma frase que aponte para o código */
  porque: string;
}

export const EXCECOES: ExcecaoDeIdentidade[] = [
  {
    arquivo: "app/(protected)/revisar-perfil/[proposta]/page.tsx",
    autorizacao: "papel",
    oQueEntra: "`params.proposta` — o id da proposta, na URL",
    porque:
      "Tela de OPERADOR, e operador vê todos: `carregarProposta` aceita qualquer " +
      "proposta de propósito. O portão é `papel !== 'operador' → notFound()`, e ele " +
      "vem TRÊS vezes — `proxy.ts` guarda o prefixo inteiro por OPERADOR_PREFIXES, a " +
      "página checa, e cada action chama `operadorOuErro()`. É a única rota do app " +
      "cuja autorização é por papel e não por posse.",
  },
  {
    arquivo: "app/(protected)/revisar-perfil/[proposta]/actions.ts",
    autorizacao: "papel",
    oQueEntra: "`propostaId` e `itemId`, do `formData`",
    porque:
      "As três actions do diretório chamam `operadorOuErro()` na PRIMEIRA linha do " +
      "corpo, antes de ler o `formData` — medido em 03/09: 3 de 3, nenhuma sem. E o " +
      "`proxy.ts` guarda `/revisar-perfil` por baixo, então uma action nova que " +
      "esquecesse a checagem ainda precisaria ser importada de fora do prefixo para " +
      "escapar. Duas omissões, não uma.",
  },
  {
    arquivo: "app/(protected)/conta/identidade-actions.ts",
    autorizacao: "posse",
    oQueEntra: "`id` da imagem, do `formData`",
    porque:
      "É o ARQUÉTIPO da disciplina que o `docs/superficie-do-token.md` descreve: " +
      "`arquivarImagem` usa o cliente ADMIN, que ignora RLS, e o que separa a imagem " +
      "de um cliente da de outro é `.eq('business_id', businessId)` escrito à mão — " +
      "com `businessId` vindo de `negocioDaSessao()`. Apagar aquela linha não quebra " +
      "teste, typecheck nem build. É por casos assim que este conferidor existe.",
  },
  {
    arquivo: "app/auth/meta/callback/route.ts",
    autorizacao: "posse",
    oQueEntra: "`businessId`, de dentro de um cookie que nós assinamos",
    porque:
      "O cookie é nosso e mesmo assim não é acreditado: o id é reconferido com " +
      "`.eq('id', guardado.businessId)` usando o cliente da SESSÃO, então a RLS " +
      "decide. Negócio de outro dono volta vazio e a rota recusa. É o modelo do que " +
      "fazer quando um id precisa atravessar um redirect.",
  },
  {
    arquivo: "app/auth/meta/desautorizar/route.ts",
    autorizacao: "prova",
    oQueEntra: "`user_id`, de dentro do `signed_request` da Meta",
    porque:
      "Não há sessão para conferir — quem chama é a Meta, de fora, e tem que ser " +
      "assim. O que autoriza é o HMAC-SHA256 contra o `META_APP_SECRET`, em " +
      "`lib/meta/signed-request.ts`, que falha FECHADA em todos os casos, inclusive " +
      "quando a env falta. Conferido por `pnpm conferir:signed-request`.",
  },
  {
    arquivo: "app/auth/meta/exclusao-de-dados/route.ts",
    autorizacao: "prova",
    oQueEntra: "`user_id`, de dentro do `signed_request` da Meta",
    porque:
      "Mesma porta da desautorização, e a mesma verificação. Esta apaga, então a " +
      "assinatura é a única coisa entre o endpoint e o dado de qualquer cliente — " +
      "ver `docs/exclusao-de-dados-meta.md`.",
  },
];
