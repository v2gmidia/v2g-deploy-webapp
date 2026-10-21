# Mesa do gestor — caminho privado da peça em revisão (20/10/2026)

## §0. Depende de Victor e da integração

- Gestores de agência ainda não têm acesso à mesa; vínculo persistente, RLS e QA entre duas agências continuam pendentes. O papel global `operador` não deve ser concedido a eles.
- Confirmar em sessão autenticada que as peças existentes seguem o caminho canônico e que o estado de arquivo inconsistente aparece corretamente. Não corrigir registros reais sem autorização específica.

## Fato observado

- A migration local da fila declara `file_path = business_id/id`, e o upload atual grava esse caminho. A página do gestor, porém, criava URL assinada para o `file_path` da linha sem reconferir a relação, e a action baixava esse caminho pelo cliente administrativo antes da decisão.
- Uma migration no repositório ou uma restrição esperada não prova que o banco do ambiente esteja na mesma versão. A aplicação que usa `service_role` deve recusar um registro inconsistente antes de abrir arquivo privado.

## Feito neste bloco

- Criada `caminhoConfereComRevisao()` em `lib/criativos/revisao.ts`: exige UUIDs canônicos e igualdade exata entre o caminho privado e `business_id/id`.
- A página `/gestor/criativos` não assina link de registro inconsistente. Uma peça pendente sem link não oferece decisão e mostra imagem indisponível.
- `revisarPecaAction()` recusa caminho inconsistente antes de baixar a imagem e condiciona a atualização ao mesmo negócio e caminho lidos, além do ID e status.
- Isso reforça o vínculo da peça, mas não substitui autorização por negócio nem confirma publicação na Meta.

## Testes e limites

- `scripts/conferir-revisao-criativos.mjs`: 10/10 casos locais passaram, inclusive caminho de outro negócio e verificação da ordem antes de assinatura/download.
- `pnpm typecheck`, `scripts/conferir-portas-gestor-interno.mjs` e `pnpm conferir:criativos` (30 conferências) passaram.
- Nenhuma sessão real, arquivo privado, chamada à Meta, migração, escrita externa ou deploy foi usado nesta rodada.

## Próximo recorte possível

Ensaiar a página e a action autenticadas em ambiente controlado, incluindo peça inconsistente, e seguir o desenho da autorização por negócio para agências antes de abrir qualquer acesso externo.
