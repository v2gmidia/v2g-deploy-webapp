# Ajustes aprovados do QA de interface — 19/10/2026

## 0. Depende do Victor

- Conferir o resultado no localhost e na sessão autenticada. O navegador usado neste lote não tinha sessão local: `/inicio` encaminhou ao login.
- Commit, push e publicação permanecem manuais. Este lote não comprova o resultado publicado nem dados reais de produção.

## Escopo aprovado

Victor autorizou aplicar os cinco pontos do QA: coerência de pendências, disponibilidade do envio de criativos, hierarquia do Início, período explícito em Anúncios e concisão na Conta. A identidade editorial foi preservada, com orientação do Impeccable para clareza e estados de falha; não houve redesenho das telas.

## Implementado

1. `lib/onboarding/pendencia-do-negocio.ts` centraliza a leitura usada por Início e Avisos. Confere sessão e propriedade do negócio antes de ler reunião com cliente administrativo. Falha da consulta não significa ausência de pendência.
2. Avisos inclui a pendência da jornada na lista e na contagem; oculta o sucesso vazio quando a leitura é incompleta. Início não exibe conclusão com uma ação pendente ou leitura desconhecida. A conclusão agora se refere à preparação da campanha.
3. No Início com resultados, a orientação fica recolhida numa faixa compacta com ação visível. Estado atual ocupa uma linha; etapas e conclusão ficam após o desempenho. O onboarding sem resultados preserva sua hierarquia.
4. Criativos recebe a disponibilidade real do envio: quando bloqueado, oferece contato com a equipe e explica a indisponibilidade. Nenhuma flag foi ligada e nenhuma peça foi enviada.
5. Anúncios aceita datas livres validadas e usa o mesmo intervalo no consolidado do negócio e das execuções. Links Início → Anúncios e Anúncios → Início mantêm as datas. O estado da operação continua atual. Identidades continuam vindo exclusivamente da sessão e da lista autorizada pelo backend, nunca dos parâmetros de data.
6. Conta usa títulos curtos (Conexões, Identidade visual, Verba e requisitos, Contrato, Atendimento), remove explicação genérica redundante e mantém ações e textos legais. O sumário não voltou.

## Verificação local

- `pnpm typecheck`: passou.
- `pnpm conferir:qa-interface`: 7/7, novo conferidor isolado com dependências externas simuladas; cobre propriedade, falha de leitura, reserva, intervalo e regressões de apresentação.
- `pnpm conferir:inicio`: 70/70.
- `pnpm conferir:campanha-da-sessao`: 17/17.
- `pnpm conferir:resultado`: 86/86.
- `pnpm conferir:criativos`: 30 conferências.
- `pnpm conferir:multiconta`: 28/28.
- `pnpm conferir:onboarding-preservacao`: 72/72.
- `pnpm conferir:portao`: 8/8.

Os testes estruturais do Início foram atualizados para o link com período. A trava de campanha admite somente a nova exceção de datas validadas em Anúncios; continua recusando identidade vinda da URL. O novo conferidor também injeta chaves extras no intervalo e verifica que não substituem negócio, perfil ou execução.

Conferência visual no navegador integrado, tema escuro: desktop 1265×712 e celular 390×844. Conferidos Início com pendência e falha, calendário de Anúncios, Criativos com envio indisponível e Conta sem sumário. O formulário de Anúncios aceitou 01/01/2026 a 31/03/2026 e preservou o intervalo no link de volta. Corrigida a largura herdada do botão da faixa compacta, detectada no desktop. A prévia informa que os números são fixos e ilustrativos.

## Limites e continuação

- Não executados neste lote: build de produção (dev no ar compartilha `.next`), suíte completa, ações autenticadas, upload, publicação e escrita real em banco.
- A coerência de Avisos foi verificada pelo código compartilhado e testes isolados; falta o ensaio autenticado com o mesmo negócio nas duas telas.
- A imagem local não prova recálculo real: somente o caminho do intervalo foi testado com dependências simuladas. Validar o retorno do backend autenticado após escolher o recorte.
- Nenhuma configuração, página legal ou segredo foi alterado; sem commit, push ou deploy.
- Evidência visual: `C:/Users/victo/.codex/visualizations/2026/10/19/v2g-ajustes-qa/inicio-desktop.png`.
- Prévia: `http://localhost:3000/exemplo/inicio?pendencia=marca`. Os parâmetros de demonstração existem apenas na bancada dev-only.
