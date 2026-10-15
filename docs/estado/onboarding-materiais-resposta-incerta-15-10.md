# Etapa 04 — resposta incerta ao registrar materiais de marca, 15/10/2026

## 0. Aberto

- Testar no QA autenticado o envio de PDF e de várias imagens, recarregando a página para conferir arquivos e prévias.
- O ensaio local não injeta perda de resposta após gravação no banco. Storage e banco não têm transação conjunta, e envios simultâneos ainda podem exigir revisão manual.

## Achado e ajuste local

As ações de PDF e imagens adicionais apagavam o objeto do Storage sempre que a resposta da inserção em `creatives` viesse como erro. Se a linha tivesse sido gravada antes da perda da resposta, um registro ativo apontaria para um arquivo excluído.

Cada ação agora atribui um UUID à linha antes da inserção. Quando a resposta é incerta, consulta esse ID e o caminho do arquivo. Só remove o objeto se a ausência da linha foi confirmada. Se a leitura também falhar, mantém o arquivo, não afirma que o envio foi revertido e pede conferência após atualizar. No lote de imagens, as linhas anteriores seguem o desfazer já existente, com confirmação individual antes de remover seus objetos.

## Conferência

- `pnpm typecheck`: passou.
- `git diff --check` nos arquivos alterados: sem erros.
- Não houve upload real, escrita no banco, migration aplicada, commit, push ou deploy.
