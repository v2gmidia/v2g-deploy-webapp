# Dias sem veiculação e atualização de hoje — revisão local

Autorização: corrigir a série diária e apresentar no localhost antes de publicar.

## Resultado

- A extensão `metricas.cobertura_diaria` do backend confirma dias fechados sem veiculação após a consulta paginada completa à Meta, com fuso/moeda/escopo conhecidos.
- O WebApp valida essa confirmação antes de preencher zeros. Linhas com campos inválidos, falhas de consulta e payloads antigos continuam desconhecidos.
- O gráfico conserva a linha, os totais e as interações. O detalhe mostra `Sem veiculação` nos dias confirmados. Somente o dia aberto recebe `Em atualização`; sem linha, seu investimento continua aguardando atualização.
- Períodos longos preservam confirmação e erros de cada parcela. Campanhas sem registros não apagam conversas observadas em outra campanha.
- Não houve mudança na mesa do gestor, migração, escrita na Meta, commit, push ou deploy.

## Prévia

- `/exemplo/inicio?serie=sem-veiculacao`: dados ilustrativos passando pelo parser real.
- Acrescentar `desde=2026-11-01&ate=2026-11-15`: período encerrado, sem aviso de atualização.
- `/exemplo/inicio?serie=falha`: controle negativo, medição ausente permanece desconhecida e parcial.

## Integração e publicação futura

A implementação da confirmação está em
`C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-conversas-producao/src/meta/leitura_anuncios.py`.
Ela é aditiva: consumidores anteriores continuam recebendo os campos brutos sem alteração.
O site em produção só utilizará a confirmação quando **backend e WebApp** forem publicados.
Até lá, respostas do backend antigo conservam o comportamento anterior, sem inventar zeros.

## Verificação

- WebApp: typecheck, build de produção, `pnpm conferir` e 55 testes direcionados de Início/contrato/gráfico passaram.
- Backend: ruff e mypy passaram; suíte unitária: 3176 passaram, 9 ignorados, 9 avisos de depreciação.
- Ponte: resposta da rota ASGI com fonte em memória percorreu parser, resumo, gráfico e anúncios reais do WebApp, incluindo lacuna confirmada e período inteiro sem entrega.
- Chrome: detalhe de zero, detalhe de hoje, período encerrado sem aviso e falha preservada. Largura de 390 px sem transbordamento da página; gráfico conserva sua rolagem interna.
- A prévia usa dados ilustrativos; não é uma nova coleta de métricas reais nem uma publicação.
