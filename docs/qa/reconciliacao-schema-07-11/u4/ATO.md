# Ato futuro U4 — preparação local, não executado

Alvo único: QA `zskpijnqgkqwxksqmzmf`. Canal futuro `apply_migration`, nomes nominais `qa_reconciliacao_u4_revops_pedido_criativo_20261108` e `qa_reconciliacao_u4_revops_pedido_criativo_retorno_20261108`. Não usar db push/replay; não executar delta.sql isolado remotamente. Não ativar RevOps, criação, flag, worker ou serviço.

Usar os hashes finais após a correção local do alias `item` na ordenação do histórico. A revisão anterior não foi aplicada por este preparador. O ensaio final prova a expressão SQL com histórico embaralhado e ausência de COLLATE dentro das chaves JSON version/name; a correção não muda delta.sql nem o pacote U3 selado.

1. Obter autorização humana nominal de backup/aplicação da U4. A autorização atual do preparador é **somente local**. Confirmar projeto conectado, revisão independente e selos: manifesto desta unidade mais os 73 anteriores. Não regenerar fontes/modelo durante o ato.
2. Executar u4-conferir-pre.sql e u4-preflight.sql em leitura: guarda anterior ao ato e uma linha receipt, delta.before, 47 pares version/name **inteiramente iguais ao baseline U3 privado aprovado**, pais/helpers protegidos exatos, backend SELECT-only. A guarda é derivada da mesma lógica do DO, sem locks/advisory; qualquer divergência exige diagnóstico, nunca remendo para fazer passar.
3. Criar diretório novo fora do repo `C:/Users/victo/.codex/private-backups/v2g/qa-schema/U4-<UTC>`, retirar herança e permitir só Victor/SYSTEM. Conferir SIDs da pasta/arquivos. Salvar pre.json, autorização/alvo/horário, fontes/SQL exatos e hashes aceitos. Reler integralmente e confirmar SHA antes de qualquer DDL. Backup é de metadados; não contém dados de cliente/Auth/Vault/segredos. Recibo fictício não é backup real.
4. Registrar tentativa única previamente e mandar somente u4-aplicar.sql ao canal com nome nominal. Um DO, sem BEGIN/COMMIT externos; sem chamar RPCs, jobs, cadastro, exclusão ou provedores. O canal escreve histórico na sua transação; o SQL não faz manutenção de ledger. Em timeout/erro ambíguo, parar e medir metadados/histórico antes de decidir qualquer próximo ato; não retry cego.
5. Confirmado sucesso, executar u4-verificar.sql e u4-pos.sql em leitura. Salvar PÓS privado, reler, conferir hash e passar recibos reais a conferirRecibos(pre,post,'apply'). Deve provar 47→48, exatamente uma entrada nominal, os 47 pares anteriores inalterados, delta.after exato, todos os metadados fora dele preservados. Não usar somente success/HTTP200/contagem como aceite.
6. Salvar auditoria privada com resultado, horários, projeto, limites, hashes e cópias do pacote. Conferir backup prévio e os selos antes/depois. Reportar e parar antes de próxima unidade/homologação/ativação. Não publicar, commitar, push, mexer em produção ou dados de negócio.

## Retorno separado

Exige autorização humana própria e novo backup privado do estado atual. Comparar metadados atuais com PÓS original antes de propor o ato; avaliar uso real/efeitos externos, não concluir ausência de uso apenas por tabelas vazias. Não apagar registros para caber na guarda.

O SQL u4-retornar.sql exige contexto protegido, histórico base U3 integral, exatamente a entrada U4 adicional (e entrada nominal de retorno eventualmente registrada pelo canal), delta exato e **todas as oito tabelas vazias**. Índice/CHECK posterior é recusado; view/FK dependente impede DROP RESTRICT. Nenhum CASCADE, correção de dado, supressão de dependência ou adaptação de retorno automática.

Se autorizado e as condições estiverem atendidas, enviar somente esse SQL no nome nominal de retorno. Capturar PÓS e comparar conferirRecibos(preRetorno,posRetorno,'return'): 48→49, pares anteriores preservados e delta.before. O retorno remove somente estruturas U4; não reverte efeitos em sistemas externos nem substitui restauração de dados. Não foi executado nesta preparação.
