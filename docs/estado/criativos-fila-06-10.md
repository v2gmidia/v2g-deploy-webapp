# Envio de criativos para o gestor — 06/10/2026

## O que o código faz hoje

- `/criativos` envia uma imagem a `POST /execucoes/{id}/criativo-pronto` para **análise**. A action obtém a execução da sessão, sem aceitar ID do formulário (`app/(protected)/criativos/actions.ts`). A resposta mostra veredito, mas não cria uma pendência atribuída ao gestor.
- O backend devolve caminho no Storage para arquivos aceitos, mas a resposta usada pelo WebApp não tem um `submissao_id` durável (`lib/backend/criativos-do-cliente.ts`). O `GET /execucoes/{id}/criativos` lista outro tipo de peça; não recupera as imagens enviadas à análise, conforme a medição em `docs/criativos-casa-do-criativo.md` §2.
- `creatives.status` descreve revisão da **Meta** (`draft`, `pending_review`, etc.), não revisão humana. `creatives.uso` aceita `logo`, `identidade`, `campanha`, `referencia`. Usar qualquer um desses valores como “aguardando gestor” misturaria ciclos diferentes. A tabela de campanhas local permanece sem linhas na medição documentada.

## Ajuste desta passagem

A página e o resultado da análise agora dizem explicitamente que a peça não foi encaminhada ao gestor nem incluída em campanha. O link para WhatsApp oferece um caminho manual para pedir inclusão; clicar nele depende do cliente e **não cria uma tarefa no WebApp**. Nenhuma publicação automática foi ligada.

## Contrato para a fila de outubro

1. Um envio deve gerar `submissao_id` único e idempotente, com `business_id` verificado pela sessão, perfil que enviou, caminho privado do arquivo, metadados validados, carimbo de criação e estado `aguardando_gestor`. A resposta só confirma “recebido” após arquivo e registro persistirem; falha parcial precisa de reconciliação ou limpeza.
2. A fila do gestor lê submissões pendentes por negócio, exibe o arquivo por URL temporária, registra responsável, avaliação, decisão e carimbos. Reenvio e duplo clique não geram duas tarefas. A notificação ao gestor precisa ter entrega/repetição próprias; gravação da peça não prova que ele foi avisado.
3. Aprovação humana é diferente de aprovação da Meta. A publicação continua ação manual do gestor, na conta vinculada e com pré-voo. O cliente só vê “publicado” ou “no ar” após evidência da plataforma, nunca após upload ou aprovação interna.
4. Para multiconta, toda leitura e escrita devem conferir `business_id` no servidor; o seletor de empresa ainda não está liberado. O contrato precisa contemplar exclusão/retenção do arquivo e acesso ao Storage antes da migration e da integração.

Nenhuma migration ou chamada de escrita à Meta foi feita nesta entrega. `pnpm typecheck`, `pnpm conferir:envio`, `pnpm build` e a ficha do gestor (14/14) passaram. Interface autenticada, upload real e fila do gestor não foram verificados.
