# Etapa 04 — resposta incerta ao registrar o logo, 15/10/2026

## 0. Aberto

- Depois da publicação pelo Victor, testar no QA autenticado a troca do logo e a persistência após recarregar.
- Storage e banco continuam separados. Falha de rede ou dois envios simultâneos podem exigir conferência manual; este ajuste não torna a troca transacional.

## Achado e ajuste local

O índice `creatives_um_logo_por_negocio` permite um único logo ativo por negócio. Por isso, a versão anterior precisa ser arquivada antes de inserir a nova linha, mas somente após o arquivo novo estar no Storage. Se a resposta do banco ao inserir a nova linha se perdesse após a gravação, a ação apagava o arquivo novo e restaurava o antigo. A linha nova podia continuar ativa apontando para um objeto removido.

A ação agora identifica previamente a nova linha por UUID. Se a inserção falhar ou vier sem resposta, consulta esse UUID antes de remover o objeto. Só remove quando a ausência da linha foi confirmada. Se houver linha, conclui a troca sem apagar seu arquivo; se a leitura falhar, preserva o arquivo e pede para atualizar a página. Quando a ausência for confirmada, tenta restaurar o logo anterior pelo ID e instante do arquivamento e confere o resultado.

## Conferência

- `pnpm typecheck`: passou.
- `git diff --check`: sem erro de whitespace; avisos de fim de linha.
- O índice parcial foi conferido em `supabase/migrations/0014_identidade_do_negocio.sql`. Não houve falha real de banco ou Storage injetada neste bloco.

Sem commit, push, deploy, migração ou escrita na Meta.
