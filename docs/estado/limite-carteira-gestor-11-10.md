# Limite da carteira do gestor — 11/10/2026

## 0. Pendência de prova

- Verificar a apresentação com operador autenticado e volume acima de 1.000 atribuições ou tarefas. O Supabase de QA está pausado; não foi acessado nesta sessão.

## Correção local

A carteira limita a 1.000 linhas as consultas de responsáveis e tarefas. A página já avisava sobre consulta parcial, mas cada negócio ainda exibia “não atribuído” e “0 tarefas” quando suas linhas podiam estar fora desse recorte. Isso podia orientar o gestor a assumir uma conta ou deixar uma pendência sem atenção pelo motivo errado.

Quando o limite é atingido, um responsável presente nas linhas retornadas continua identificado; ausência passa a “não confirmado nesta consulta parcial”. Tarefas retornadas são exibidas como mínimo conhecido, e zero vira “quantidade não confirmada”. O link da fila da equipe também usa “ao menos 1.000”. A fila pessoal continua indisponível quando a consulta está parcial.

Não houve alteração de banco nem de permissões. O limite não foi removido: a tela direciona para as filas específicas para uma decisão operacional.

## Verificação

- `node --test scripts/conferir-gestor.mjs`: 22/22, incluindo ausência e presença em consultas completas e parciais.
- `pnpm typecheck` e `pnpm build`, com o servidor de desenvolvimento parado: passaram.
- O teste usa dados locais; não comprova consulta real nem interface autenticada.
