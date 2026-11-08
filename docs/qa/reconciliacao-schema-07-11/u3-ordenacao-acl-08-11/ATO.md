# Ato futuro U3 — não executado

Revisão local de 08/11/2026: usar exclusivamente esta pasta `u3-ordenacao-acl-08-11`, após revisão e nova guarda QA somente leitura pela Central. O pacote original `../u3/` permanece selado e intacto. A primeira guarda recusou apenas a ordem equivalente da ACL de um helper, sem tentativa de aplicação. Esta revisão torna a ordem textual explícita (`COLLATE "C"`), sem alterar grants/DDL de negócio ou nomes nominais. Não houve nova consulta QA nem DDL remoto pelo preparador. O ato remoto continua exclusivo da Central, dentro da autorização humana já recebida por ela; esta preparação local não o executa.

Alvo único: Supabase QA `zskpijnqgkqwxksqmzmf` (`v2g-webapp-qa`). Canal DDL futuro: `apply_migration`. Nome aplicação `qa_reconciliacao_u3_perfil_procedencia_20261108`; retorno `qa_reconciliacao_u3_perfil_procedencia_retorno_20261108`. Não usar db push nem replay de migrations históricas. Não executar delta.sql isoladamente fora da bancada.

## Antes de qualquer escrita

1. Obter autorização humana nominal para backup e aplicação somente U3 no QA. Este documento não é autorização. Confirmar projeto conectado; nunca inferir pelo nome de uma variável.
2. Verificar SHA256SUMS desta revisão e os 51 selos anteriores (U1/U2/U3 original); qualquer diferença interrompe o ato. Conferir resultado dos 23 grupos e revisão independente. Não regenerar arquivos durante o ato.
3. Executar exclusivamente `u3-preflight.sql` em leitura. Deve retornar uma linha/receipt, delta igual a modelo.before e 46 entradas version/name. Confirmar U1/U2 e ausência de U3; comparar histórico com o PÓS U2 privado aprovado. Nenhuma consulta a linhas de aplicação/Auth/Vault.
4. Criar diretório novo fora do repositório em `C:/Users/victo/.codex/private-backups/v2g/qa-schema/U3-<UTC>`. Retirar herança e conceder acesso somente ao usuário Victor e SYSTEM; conferir ACL pelos SIDs antes de salvar. Não copiar segredos ou dados pessoais.
5. Salvar `pre.json`, autorização/projeto/horário, SQLs exatos e hashes aprovados. Reler conteúdo integral e calcular SHA256; registrar conferência antes da aplicação. Esse backup é de **metadados**, não de linhas de negócio. Não reaproveitar recibo fictício/local como backup do QA.

## Aplicação única e aceite

6. Registrar tentativa única antes de chamar o canal. Enviar exclusivamente `u3-aplicar.sql` com o nome nominal acima. O corpo tem um único DO; o canal administra a transação e o histórico. Nenhum BEGIN/COMMIT externo, retry, reparo manual de ledger ou chamada de RPC de negócio.
7. Se houver timeout/erro ambíguo, parar e consultar somente metadados/histórico antes de decidir qualquer próximo ato. Não repetir cegamente.
8. Após sucesso confirmado, executar `u3-verificar.sql` e `u3-pos.sql`, somente leitura. Salvar PÓS no diretório privado, reler e conferir hash.
9. Passar os recibos reais a `conferirRecibos(pre,post,'apply')`: 46→47 entradas, exatamente um novo par nominal, todos os anteriores preservados; delta.after exato; metadados fora do delta iguais. O histórico comparado é version/name, não statements. Falha impede encerramento como sucesso.
10. Salvar auditoria privada com resultados, projeto, horários, contagens, hashes e limites. Confirmar que backup anterior e 30 selos permaneceram iguais. Reportar resultado e parar antes de U4, ativação ou homologação funcional.

## Retorno condicionado — nova autorização

Retorno é ato separado, nunca automático. Antes de pedir a autorização, obter PÓS atual em leitura e compará-lo ao PÓS U3 original. Avaliar uso das RPCs e mudanças nas tabelas legadas; cinco tabelas novas vazias **não** provam ausência de uso. Escrita gravado pode mudar perfil/procedência sem log em tabela nova. Não prometer restauração de dados pelo retorno DDL.

Com autorização nominal própria: criar backup privado novo do estado atual, conferir hashes, mandar somente `u3-retornar.sql` pelo canal com nome nominal de retorno. O DO exige delta exato, contexto protegido, 47 entradas (ou entrada própria já registrada pelo canal), cinco tabelas vazias e pessoa_id sem conteúdo. Índices/CHECKs posteriores são recusados pela comparação; views/FKs dependentes impedem DROP RESTRICT. Não usar CASCADE, apagar dados, soltar dependências ou adaptar SQL para forçar o retorno.

Após sucesso, capturar novo recibo e executar `conferirRecibos(preRetorno,posRetorno,'return')`: 47→48 entradas, delta.before, todos os metadados fora do delta preservados. O retorno mantém linhas legadas e **não restaura valores/procedência alterados por RPCs**. Qualquer correção de dados é outro ato.
