# Etapas 03 e 04 — seletor e perguntas iniciais, 14/10/2026

## 0. Aberto

- Publicar pelo fluxo manual do Victor e testar no QA autenticado com **um e-mail e dois CNPJs aprovados**: menu no desktop e celular, troca em um clique, duas abas, ação antiga e revogação de acesso. O navegador local usou a bancada com dados fictícios; não prova essa sessão.
- O checkout público ainda não está liberado. Em produção, “Adicionar negócio” leva ao pré-cadastro da LP; não transforma interesse em compra ou acesso.
- No onboarding, faltam as demais correções aprovadas por Victor: perguntas guiadas por nicho, revisão das contas, materiais de marca menos restritivos, contexto entregue ao gestor, agenda autenticada com reserva única e retorno visível. Não marcar a etapa 04 como concluída.
- O conferidor geral para em `conferir:migrations` com 20 ausências no schema comparado. Nenhuma migration foi editada ou aplicada neste bloco; a suíte posterior não executou.

## Trabalho local

- O menu do negócio ativo agora usa nome, logo quando existir e seta; lista negócios liberados com troca em um clique. O acesso ainda é conferido pela action existente sob sessão e `profile_id`. A tela de escolha de recuperação também abre o negócio num clique.
- Logos são consultados apenas para IDs já liberados, com URL temporária do bucket privado. Falha na imagem deixa o nome disponível.
- A pergunta que obrigava o cliente a escolher a primeira oferta saiu da ordem. Respostas antigas continuam no histórico. O gestor decide o primeiro anúncio na reunião.
- Respostas curtas úteis para público, motivo, entrega e diferencial passam. A pergunta de necessidade foi simplificada. Cidade com dígitos é recusada; área de até 5 km exige CEP válido; cidade/região não pede CEP; “Brasil inteiro” remove localização derivada da escolha local anterior.

## Conferências

- `pnpm typecheck`: passou.
- `node --test scripts/conferir-multiconta.mjs`: 21/21 passaram.
- `node --test scripts/conferir-onboarding-preservacao.mjs`: 67/67 passaram após adequar os casos de praça ao novo contrato.
- `pnpm build`: passou após todas as mudanças deste bloco, inclusive o ajuste visual móvel.
- Bancada `/exemplo/inicio`: menu inspecionado visualmente no desktop e em 390 × 844. A primeira versão móvel posicionava o painel fora da tela; CSS corrigido e painel visível após nova captura.

Nenhum commit, push, deploy, migração, cobrança ou escrita na Meta foi feito neste bloco.
