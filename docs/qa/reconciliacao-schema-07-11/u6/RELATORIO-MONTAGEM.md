# U6 — relatório próprio 01/02

Preparação local dos grupos 15/19: corpo real de sete RPCs financeiras, novo helper impeditivo, CHECK de eventos e novo gate estrutural. Dependências medidas em catálogo QA, sem linhas de aplicação/Auth/Vault/segredos: eventos financeiros/comerciais, pedidos/unidades/negócios, elegibilidade, outbox, contexto 3DS e limitador. Baseline U5 aprovado com 49 pares version/name. Não houve aplicação, backup de ato, provedores, dados reais, flags/config/produção ou Git.

## Correção necessária autorizada

Foi reproduzido o falso positivo da fonte: INSERT de commercial_orders efetivamente negado ao serviço, readiness ainda 1. A Central autorizou alterar apenas a migration de readiness e o teste SQL correspondente no repositório. O gate agora verifica cada uma das 23 permissões individualmente e grants efetivos por coluna para clientes/anon (PUBLIC herdado). Não concede direitos além da lista e não limpa privilégios antigos por conveniência. Fonte revisada e delta vêm do mesmo conteúdo; hashes das duas fontes constam do resultado.

Sete alterações financeiras foram derivadas das definições atuais capturadas, com correspondência estrita das transformações da fonte. Guardas comparam corpos/atributos/ACL/defaults completos, CHECK/índices e todo metadata fora do delta, sem confiar em marcador/nome. Os sete corpos antigos medidos são a fonte de retorno, não uma versão aproximada de migration.

## Provas locais

Suíte do pacote: 28 grupos aprovados em resultado-ensaio.json. Fonte corrigida do repositório: node --test scripts/conferir-checkout-producao-sql.mjs, 8 testes aprovados. São provas distintas, sem somar/inflar um total único ou apresentá-las como QA funcional. Não foram executados runners U1–U5 que reescreveriam relatórios selados. A fixture usa contratos medidos, exceto nove tabelas backend não usadas por estas funções, preservadas semanticamente e nos recibos antes/depois.

O ensaio cobre serviço efetivo, revogação individual de cada DML necessário, grants de coluna/PUBLIC/grant option, quatro vias financeiras, intermediários vs pago, adversos, replay/identidade, reserva e renovação, direito A/B usando contrato real, outbox/contexto/limites, drift/atomicidade, defaults, histórico íntegro e retorno condicionado. Auth/claims e registros são simulados localmente. O bigint de auditoria U5 continua texto exato. Nenhum PGlite/mock é chamado de pagamento, entrega, 3DS bancário ou operação remota.

A Central confirmou sua execução independente dos 8 testes da fonte corrigida. Também relatou u6-conferir-pre.sql em BEGIN READ ONLY e recibo u6-preflight.sql no projeto QA PostgreSQL 17.11: guarda aprovada e 49 pares completos, sem DDL/RPC de negócio. O preparador não repetiu essa consulta; é uma medição externa relatada pela Central, não aplicação ou homologação funcional. A guarda final permanece SHA-256 240c52f81b4ac3890c7b488e39dfb797e047830b2d3f78aeacab5e5a92ccc702. Parecer 07/08 e suíte final consolidada da Central ainda são acompanhados por ela; não foram presumidos como concluídos.

## Limites e entrega

O gate é estrutural e não credencial/conta externa/dinheiro, e flags remotas não foram medidas ou alteradas. A política impeditiva da fonte e a ausência de suspensão automática por renovação foram preservadas. Status bruto não substitui fatos financeiros; accepted na outbox não prova entrega. Rate limit não certifica segredo HMAC ou transporte; não há prova multissessão.

Grants de readiness são no-op nos alvos existentes medidos: preservar isso também preserva privilégios legados amplos do serviço em contexto/security_attempts. Nenhum privilégio público foi aberto, nenhum MAINTAIN/grant option ampliado. O retorno é deliberadamente conservador e pode recusar inclusive histórico financeiro legado; não houve contagem/leitura real desses registros. Não apagar dados para executá-lo. DDL não restaura pagamento, acesso, assinatura ou efeitos externos.

Próxima prova: revisão/ensaio independente da Central sobre os arquivos finais, seguida de eventual ato exclusivamente QA com autorização/backup/conferência próprios. A preparação não equivale a aplicação nem homologação do percurso do cliente ou produção. ATO detalha a sequência futura. Core deve permanecer congelado após validação para não associar provas a hashes diferentes.
