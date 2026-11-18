# Identidade e contexto Nota/Brotherhood — preparação QA, 17/11/2026

## 0. O que depende de Victor/Matheus

E-mail do titular sob controle de Matheus ainda não confirmado. Pergunta enviada nesta conversa; nenhum e-mail foi deduzido a partir de nome, contato ou outra conta. Depois de confirmar o e-mail, consultar a identidade exata na QA e preparar a entrada legítima. Se o usuário não existir, a verificação do titular precisa ser resolvida sem simular pagamento, contrato, confirmação de e-mail ou sessão.

Faltam também os dados reais do contratante: nome completo, WhatsApp, razão social/documento, confirmação da qualificação comercial e do início/vencimento/ciclo ainda não pago. Documento e senha serão preenchidos privadamente. Não reenviar estas perguntas se Victor indicar uma fonte válida com os dados.

## 1. Escopo confirmado

Nota 360 é agência; Brotherhood Barbershop é o anunciante desta primeira unidade. Agência acessa carteira, anunciante não recebe login direto. Versan Logistic já pago e demais anunciantes não entram nesta preparação. A oferta candidata é uma unidade de R$ 500 mensais no cartão; isso não registra aceite, vencimento ou pagamento.

## 2. Conferência somente leitura

- Supabase QA `zskpijnqgkqwxksqmzmf`, nome `v2g-webapp-qa`, ACTIVE_HEALTHY.
- Busca em `businesses` por Nota/Brotherhood: zero resultados. Busca em `profiles` por Matheus/Mateus/Nota: zero resultados. Busca adicional limitada em `auth.users` por nome informado e padrões de e-mail Matheus/Mateus/nota360/nota.360: zero resultados. Isso não exclui cadastro sob outro nome/e-mail; não foi feita uma varredura de todas as identidades.
- Contextos/unidades comerciais por Brotherhood ou razão social contendo Nota: zero resultados.
- Contatos conectados: buscas Nota e Matheus sem resultados. Não há prova suficiente para selecionar um titular.
- Esquema das tabelas conferido antes das consultas. Nenhum token, hash de sessão/retomada, senha ou valor de credencial consultado.
- Vercel QA: `V2G_COMMERCIAL_QA_PILOT_MODE=closed`, política real ausente e sete controles financeiros/envio `false`, relidos sem descriptografar credenciais.

## 3. Dependência de entrada identificada

A composição publicada em `C:/Users/victo/.codex/private-backups/v2g/2026-11-17-trava-piloto-publicacao-qa/source/app/(public)/entrar/actions.ts:85` exige compra aprovada ou convite por contratação histórica antes de chamar `auth.signUp` (linhas 88–102). O guard do piloto exige usuário legítimo com e-mail confirmado antes da compra (`lib/contratacao/piloto-nota-qa-servidor.ts:16`). Portanto, orientar um novo titular apenas a usar Primeiro acesso não resolve esta preparação.

Não foi removida a regra geral nem criado contrato/pagamento fictício. Após confirmar o e-mail, verificar se há usuário exato existente ou preparar mecanismo assistido de identidade QA com confirmação real do titular. Qualquer envio de confirmação Auth necessário deve ser explicitado antes de executar; controles de envio comercial permanecem desligados.

## 4. Sequência concreta preparada

1. Victor confirma o e-mail sob controle de Matheus e indica ficha dos dados comerciais, se existir.
2. Central confere a identidade exata na QA; Matheus define/digita senha privadamente e comprova o e-mail pelo fluxo legítimo. Nenhum acesso é concedido apenas pela semelhança de nomes.
3. Central prepara Nota e Brotherhood como negócios distintos do mesmo titular, com relação explícita e ativa; preservar cadastros existentes. Não importar os seis clientes automaticamente.
4. Pelo fluxo normal de contratação QA, salvar e confirmar uma unidade com dados reais, sem iniciar pedido financeiro. Não preencher confirmação em nome de Matheus nem inventar origem LP.
5. Conferir IDs de identidade, agência, anunciante, contexto/unidade, snapshot estável e validade. Conta Meta permanece não selecionada até haver vínculo real verificável; não inventar UUID nem realizar OAuth por consequência.
6. Somente com dados completos, preparar a política restrita e a prova permitida com a sessão legítima. Manter financeiro, checkout, recorrência e envios desligados. Prova de autorização não equivale a cobrança ou acesso pago.

## 5. Entrega e limites

Ficha de preparação não executável: `C:/Users/victo/v2g-deploy/webapp-comercial-qa/docs/qa/nota-brotherhood-identidade-contexto-v1/preparacao.json`. Todos os IDs reais pendentes são nulos; este arquivo não é uma política para colar na Vercel. Conferência estrutural local da ficha, sem repetir testes do produto já encerrados.

Nenhuma escrita remota, criação de usuário, confirmação de e-mail, alteração de papel, pedido, cobrança, mensagem, migração, publicação ou produção neste bloco. A identidade e o contexto reais ainda não foram criados. Comercial segue Em andamento; próximo ato é confirmar o e-mail do titular, responsável Victor.
