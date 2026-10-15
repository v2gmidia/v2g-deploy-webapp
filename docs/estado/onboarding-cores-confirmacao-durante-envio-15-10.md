# Cores: confirmação após a última análise

## 0. Pendente de decisão ou ação humana

- Ensaiar no QA com arquivos reais: duas análises em paralelo, confirmação anterior preservada quando a leitura falhar e nova confirmação exigida quando surgirem cores propostas.
- A etapa 04 ainda depende da agenda própria ativa, do desligamento do link público antigo e do teste autenticado da jornada completa.

## Ajuste local

Após o bloqueio de conclusão durante envios, ainda era possível clicar em “Confirmar estas cores” enquanto uma imagem ou PDF estava sendo lido. Uma análise posterior podia acrescentar cores sem exigir nova revisão. A leitura de imagem também apagava a confirmação anterior antes de saber se encontraria alguma cor.

O botão de confirmação agora aguarda todos os envios e análises. Uma leitura de imagem só desfaz a confirmação quando propõe cores; falha ou ausência de cores mantém a paleta já confirmada. O cliente continua tendo de confirmar explicitamente qualquer nova proposta antes de concluir.

## Verificação

- `pnpm typecheck`: passou.
- `pnpm conferir:onboarding-preservacao`: 72 de 72 passaram. Esses testes cobrem as regras de persistência; não comprovam o clique durante uploads reais.
- Nenhuma publicação, migração, commit ou escrita externa.
