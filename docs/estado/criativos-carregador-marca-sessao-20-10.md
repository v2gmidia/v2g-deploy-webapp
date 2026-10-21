# Criativos — carregador de metadados da marca por sessão (20/10/2026)

## §0. Depende de Victor e da integração

- Escolher negócio/material piloto e definir o aceite explícito de uso de cada imagem para geração por IA. A declaração atual de upload não é esse aceite. Sem registro persistido e revogável, `selecionarMarcaParaGeracao` deve continuar bloqueado.
- Ainda faltam entrada e versões persistidas, documentos de nicho, referências verificadas, provedor/teto, aprovação formal no app e QA com sessão real. Não houve leitura de dados reais, chamada paga, migração ou envio de arquivo.

## Fato observado

- `negocioAtivoDaSessao()` já resolve o negócio selecionado sob usuário autenticado, RLS e regras de acesso a compra. A preferência no cookie não é permissão.
- A tabela `creatives` tem policy de leitura por posse (`owns_business`) em `supabase/migrations/0001_init.sql`; a identidade ativa fica em `uso = logo|identidade`. O leitor atual `listarIdentidade()` usa cliente administrativo e assina URLs para a tela. Isso não deve ser reutilizado como um carregador de geração sem separar escopo e consentimento.
- `selecionarMarcaParaGeracao()` era só função pura: exigia linhas e autorizações conferidas, mas não buscava as linhas da sessão.

## Feito neste bloco

- Criado `lib/criativos/carregar-marca-da-sessao.ts`: confere se o negócio pedido coincide com o negócio ativo **antes** da consulta; lê apenas metadados da `creatives` pelo cliente autenticado e por RLS, com filtro adicional por `business_id`, uso e não arquivamento.
- O `select` lista explicitamente todas as colunas que o seletor consome. Resultado truncado, coluna ausente, caminho de outro negócio, linha arquivada ou erro de consulta fecham o acesso. O carregador não assina URL, lê bytes nem declara autorização de uso por IA.
- A função não foi ligada à interface nem ao gerador. O `storage_path` privado permanece somente na saída server-only para uma futura validação, não é uma URL pública.

## Testes e limites

- Teste offline `scripts/conferir-carregar-marca-da-sessao.mjs`: 4/4 casos passaram, incluindo ID de outro negócio sem consulta, falha, truncamento e linha inconsistente. Rede foi proibida no teste.
- `pnpm typecheck` passou; `pnpm conferir:identidade` passou; `pnpm conferir:multiconta` passou 28/28 testes.
- Isso não prova o RLS nem a sessão em banco real. O banco compartilhado não foi consultado e nenhum arquivo privado foi aberto. A documentação oficial de SSR e RLS foi conferida antes da implementação: https://supabase.com/docs/guides/auth/server-side/creating-a-client e https://supabase.com/docs/guides/database/postgres/row-level-security.

## Próximo recorte possível

Definir e persistir a autorização específica por imagem/finalidade (com revogação) antes de conectar o carregador ao seletor de marca. Não substituir isso por um booleano enviado pelo navegador.
