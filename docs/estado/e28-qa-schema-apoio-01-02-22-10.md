# E28 Apoio de schema QA ao backend

Leitura do catálogo QA e das fontes locais na noite de 21 para 22/10/2026.
Alvo exclusivo consultado: `zskpijnqgkqwxksqmzmf`. Produção não consultada nem
alterada. Este apoio não autoriza aplicar baseline, SQL, fixtures ou configuração.

## Objetos e nomes

O catálogo confirma presentes `profiles`, `businesses`, `creatives`,
`commercial_orders` e `commercial_payment_events`. Confirma ausentes `clientes`,
`execucoes`, `criativos`, `campanhas_meta`, `metricas_diarias`,
`respostas_do_dono`, `execucoes_de_rotina`, `perguntas_apresentadas`,
`campanhas_criacao` e `schema_migracoes`.

Não há colisão nominal medida entre o baseline de quatro tabelas do backend e
esses objetos existentes. `creatives` não é `criativos`, `businesses` não é
`clientes`. Não renomear, substituir ou juntar os objetos por semelhança de nome.

Tipos medidos no QA: businesses.id e profiles.id UUID não nulos;
businesses.profile_id UUID nullable; businesses.claim_email TEXT nullable;
creatives.id e creatives.business_id UUID não nulos. O baseline backend declara
IDs UUID e cliente_id nullable nas cadeias próprias. A ligação
execucoes.business_id UUID nullable vem de
`backend_v2g/src/db/migracoes/0018_business_id_da_execucao.sql:35`, sem FK entre
as cadeias por decisão registrada ali. Não acrescentar FK ou NOT NULL por conta
deste apoio. Baseline sozinho não entrega o contrato completo da rota.

## ACL e RLS

Catálogo: businesses, profiles e creatives têm RLS ativa, mas grants amplos a
anon/authenticated/service_role. businesses tem policies explícitas por operação
e profile_id=auth.uid(); UPDATE usa USING e WITH CHECK. Isso preserva a separação
de linhas, mas não justifica copiar ACL ampla para tabelas novas.

Defaults de public para objetos criados por postgres e supabase_admin concedem:

- tabelas: privilégios amplos a anon, authenticated e service_role;
- funções: EXECUTE a anon, authenticated e service_role;
- sequências: privilégios amplos aos mesmos papéis.

RLS não substitui ACL para operações como TRUNCATE. O risco dos defaults foi
confirmado por catálogo, não foi ensaiado com operação destrutiva. Não mudar os
defaults globais ou os objetos existentes neste apoio. A unidade nova precisa
criar e restringir seus próprios objetos na mesma transação, conforme a proposta
`backend_v2g/docs/qa/backend-qa-baseline-guardas.sql`: RLS, zero policies e
service_role somente SELECT nas quatro tabelas novas. As futuras funções e
sequências exigem sua própria revisão de privilégios; a guarda atual é de tabela.

O ledger financeiro é referência de isolamento mais restrito: RLS ativa,
commercial_payment_events acessível somente a postgres/service_role e sem
policies de cliente; commercial_orders concede SELECT a authenticated, com
policy buyer_profile_id=auth.uid(). Não ampliar essas permissões para acomodar
o backend. Não mover seus fatos para o ledger de migrations.

## Ledgers e precisão

`schema_migracoes` backend não existe no QA. É diferente de
supabase_migrations.schema_migrations e de commercial_payment_events. A criação
do ledger backend em `src/db/migrar.py:83` ocorre antes da condição dry_run em
`:94`; não executar o dry-run remoto como leitura. Não fabricar histórico de
migrations nem executar lote pendente.

commercial_payment_events tem provider_event_id TEXT, order_id UUID,
event_type TEXT, amount_cents INTEGER e due_date DATE não nulos. Valores
financeiros são centavos inteiros, não o NUMERIC de métricas. O backend histórico
declara metricas_diarias.conversoes NUMERIC(12,2) em `0014_metricas_diarias.sql:43`;
não declarar preservação de 2.125 sem ensaio/correção de precisão apropriada.

## Passagem ao 07 e 08

O plano local `backend_v2g/docs/qa/backend-qa-schema-plano-21-10.md` já contempla
revogar ACL no baseline, preservar WebApp, ledger separado e precisão. Este apoio
confirma as premissas atuais por leitura, não substitui nem reaplica o trabalho
dos dez testes locais daquela frente. Sem arquivo backend alterado, migration,
DDL, DML, usuário/fixture ou concessão de acesso. O Central encaminha este
checkpoint; nenhuma mensagem foi enviada a outro chat.
