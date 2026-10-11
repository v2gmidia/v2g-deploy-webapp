# Pendências antigas na fila de contratações — 11/10/2026

## 0. Dependência humana

- Conferir a fila autenticada com pedidos reais após o QA voltar a ficar disponível. Nenhuma consulta ao QA foi feita neste lote.

## Defeito e correção local

A tela `/gestor/compras` buscava somente os 200 pedidos mais recentes e depois ordenava comprovantes e tentativas ambíguas dentro desse recorte. Um comprovante antigo, ainda sem aprovação, podia ficar invisível apesar da promessa da fila de atenção.

A tela agora consulta separadamente comprovantes recebidos, compras aprovadas ainda sem perfil e, quando as colunas do checkout por API estão disponíveis, tentativas de criação ambígua. Junta esses resultados aos recentes sem duplicar pedidos, ordena pela prioridade e só então limita a 200 registros. O filtro por negócio é aplicado no banco em todas as consultas. Limite atingido ou falha de uma consulta adicional aparece como aviso de resultado parcial; a tela não conclui que não há pendências antigas.

## Verificação e limite

- `node --test scripts/conferir-gestor.mjs`: 25/25. A fixture inclui 200 pedidos recentes e comprovante antigo, aprovado antigo sem perfil e duplicação entre consultas.
- `pnpm typecheck` e `pnpm build`: passaram com o servidor local parado.
- Não foram verificados interface autenticada, volumes reais ou integração com banco. A fila ainda tem recorte máximo de 200 registros e avisa quando esse limite pode ocultar outros pedidos.
