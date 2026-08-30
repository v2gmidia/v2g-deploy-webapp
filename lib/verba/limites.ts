/**
 * OS LIMITES DA VERBA — a fonte única.
 *
 * Três lugares escrevem ou julgam `businesses.monthly_budget`: a `/verba`
 * (onde o cliente define), a `/meu-negocio` (onde ele corrige, pelo
 * catálogo) e a publicação (`lib/meta/orcamento.ts`, que é quem tem a
 * última palavra). Antes do lote QA-3 as três discordavam: a `/verba`
 * aceitava qualquer coisa acima de zero e respondia "Pronto", a
 * `/meu-negocio` também, e só a publicação recusava — depois de o
 * pipeline inteiro já ter sido disparado.
 *
 * Duas telas gravando a mesma coluna com regras diferentes é o defeito
 * que o lote QA-2 acabou de consertar noutro campo. Por isso os números
 * moram aqui, e não em cada tela.
 *
 * ESTE MÓDULO NÃO PODE IMPORTAR NADA DE SERVIDOR. O rodapé do formulário
 * da `/verba` é componente de cliente e mostra o piso; um `server-only`
 * na cadeia quebraria o bundle. Ele é só número e aritmética, de
 * propósito.
 *
 * O que NÃO mora aqui: o piso do Meta. Aquele varia por conta, moeda e
 * objetivo, só é consultável com token, e continua sem valor fixo neste
 * repositório — quando é conhecido, vive em
 * `ad_accounts.min_daily_budget_cents`.
 */

/** Dias usados para partir o teto mensal. Mês comercial, fixo. */
export const DIAS = 30;

/**
 * O PISO DA CASA: R$ 750,00/mês, que dá R$ 25,00/dia.
 *
 * **Não é o mínimo do Facebook**, e toda tela que mostra este número
 * precisa dizer isso com todas as letras — o do Facebook pode ser maior.
 *
 * ============================================================
 * ELE MUDOU DE 150 PARA 750 EM 25/08/2026, E MUDOU DE PERGUNTA JUNTO.
 *
 * Não foi um número corrigido; foi outra pergunta sendo respondida.
 *
 * Em 20/08 a pergunta era **quem a gente consegue atender**, e R$ 300 foi
 * descartado por "excluir quem quer testar com pouco". R$ 150 ganhou como
 * freio contra o impossível e contra o erro de digitação — antes dele,
 * R$ 5,00/mês (R$ 0,17 por dia) era aceito e respondido com "Pronto".
 *
 * Em 25/08 a pergunta virou **quem consegue ter resultado**. Com verba de
 * R$ 150 e assinatura de R$ 490, a ferramenta é 76% do gasto total: o
 * cliente veicula R$ 300 em dois meses tendo pago R$ 1.280, não vê
 * resultado, e cancela. Com R$ 750 a assinatura cai para 40% do gasto.
 *
 * Quem entra abaixo disso não é um cliente que a gente perdeu — é um
 * cliente que ia cancelar em dois meses achando que o produto não
 * funciona. Ver `docs/decisoes.md`, 2026-08-25.
 * ============================================================
 */
export const PISO_MENSAL_DA_CASA = 750;

/**
 * O teto que a gente publica sem falar com o cliente: R$ 1.000,00 por
 * dia, em centavos.
 *
 * Último freio contra dado corrompido no banco. Não é regra de negócio —
 * é a pergunta "isso pode ser um erro de digitação ou um bug?". Um
 * cliente que realmente queira gastar mais que isso por dia vai falar com
 * a gente, e aí a gente sobe o número sabendo o que está fazendo.
 *
 * Mora aqui, e não em `lib/meta/orcamento.ts` onde nasceu, porque agora
 * as telas também precisam dele: se cada uma escrevesse o próprio 1.000,
 * a primeira mudança deixaria uma delas para trás em silêncio.
 */
export const TETO_DIARIO_ABSOLUTO_CENTAVOS = 100_000;

/** O mesmo teto, dito em mês e em reais — que é como as telas falam. */
export const TETO_MENSAL_DA_CASA = (TETO_DIARIO_ABSOLUTO_CENTAVOS * DIAS) / 100;
