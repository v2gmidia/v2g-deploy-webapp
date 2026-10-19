# Período livre e Conta sem sumário — 18/10/2026

## 0. Pendências humanas

Conferência e publicação manual pelo Victor. Localhost permanece na porta 3000. Não houve commit, push, deploy ou escrita no banco.

## Aplicado

- Calendário com data inicial/final, Aplicar período, validação no cliente e servidor, URL compartilhável e suporte a Escape. Sem escolha, mês atual; links antigos continuam legíveis.
- A rota encaminha `desde` e `ate` ao consolidado separadamente do estado operacional. Histórico não altera jornada, perguntas de ontem ou atrasadas. Limite mensal permanece no mês atual; falha da consulta gera aviso, não zero.
- Conta: removidos índice desktop, seletor móvel, componente e estilos exclusivos do sumário; ficha ocupa a largura disponível, com ações preservadas.
- Criativos, Anúncios e Avisos não foram editados neste lote.

## Verificação

- `pnpm typecheck`: passou.
- `pnpm conferir:inicio`: 70/70, incluindo 18 novas verificações.
- `pnpm conferir:resultado`: 86/86, com fixture histórica, não medição nova em produção.
- Navegador: aplicado 01/01/2026 a 31/03/2026; URL e seletor refletiram as datas. Ordem invertida mostrou erro sem alterar a seleção aplicada. Calendário e Conta conferidos em desktop e celular.
- Detector estático apontou sombra literal fora da paleta; substituída por cor derivada do token existente.
- A prévia local explicita que suas métricas são fixas. Consulta real conferida no código e testes; sem ensaio autenticado no localhost. Não foram executados build ou suíte completa.

Impeccable orientou responsividade e continuidade visual; revisão React orientou leitura das datas do próprio formulário e separação de estado histórico e operacional.
