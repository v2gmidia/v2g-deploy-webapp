# Relatório do preparador 01/02 — U5

Escopo autorizado: preparação local dos grupos 13/16/17/18. Nenhuma aplicação ou backup U5 de ato foi executado. Trabalho limitado a esta pasta; pacotes históricos e consumers preservados.

## Dependências medidas

- Baseline do PÓS U4 privado aprovado: 48 pares version/name, metadados de pais/helpers/U1–U4.
- Consulta principal de catálogo QA: fiscal_documents, agenda, carteira, eventos financeiros, auth.users (somente estrutura), funções existentes e handler Auth, além do contexto protegido anterior.
- Complementação estrita de catálogo permitida pela Central: commercial_events, dependência de duas RPCs; não foi presumida da fixture mínima.
- commercial_order_units reproduz estrutura real porque as RPCs o escrevem. O Auth local reproduz estrutura, owner/ACL, uid e trigger/handler medidos; todos os registros/claims usados nos ensaios são fictícios.

## Decisões técnicas dentro do contrato

- Aplicação futura usa delta explícito, guardas de estado inteiro, sem marker/IF EXISTS como aceite e sem substituição cega de função desconhecida.
- Mudanças de CPF/CNPJ derivadas dos corpos medidos; fonte histórica do Auth só restringe auto-claim quando o marcador do fluxo é historical_contract. Vínculo do trigger preservado.
- ACL fiscal nova estreitada conforme revisão: authenticated SELECT por comprador e serviço SELECT+INSERT, sem grants de manutenção/repassagem/escrita pública.
- Sequência nova identity fechada a clientes/serviço e atributos bigint serializados como texto. A comparação SQL numérica original foi recusada corretamente; não houve aceite pela igualdade arredondada do JavaScript.
- Defaults dos argumentos das funções protegidas são efetivamente comparados, incluindo teste que muda apenas o default antigo, sem alterar corpo/identity/ACL.
- Retorno recompõe corpos antigos medidos e recusa CPF, dados usados, duplicatas ou DDL posterior; não é restauração de dados.

## Evidência

resultado-ensaio.json contém **30 grupos aprovados** do ensaio completo do pacote atual e os hashes de quatro consumers relevantes conferidos antes/depois. O comando está no README. Cobertura inclui positivos/negativos de competência, evidência, CPF/CNPJ, carteira, concessão, aceite, revogação, trigger Auth, RLS/ACL, atomicidade, histórico adulterado, defaults, bigint exato e retorno condicionado. Não se usa a ausência de dados para alegar que nenhuma função pode ter sido usada.

A Central confirmou a execução independente da mesma suíte final com exit code 0, ok=true, passed=30, remoteDDL=false. Essa é a mesma contagem, não 60 testes. Seu ensaio independente dos SQLs completos e a revisão 07/08 das correções de bigint/defaults também foram relatados como aprovados, sem novo impeditivo nesse recorte. Provas complementares/baseline da Central não foram somadas à contagem deste pacote. O core permaneceu congelado durante a rodada final; depois dela foram finalizados somente os documentos e os selos.

A Central relatou ensaio independente completo dos SQLs e uma execução de u5-conferir-pre.sql no QA somente em leitura: hash informado fc63cfaf2b48723f23a416621d59eab316a35a995033f64eda26e1ec07bea380, 09/11/2026 01:12:18 UTC (08/11 22:12:18 BRT). É prova da guarda/metadata, não aplicação/homologação funcional; não foi repetida por este preparador. Ao fechar, conferir hash final do arquivo antes de associar a esse relato. Logs/checkpoints da Central são controlados por ela.

## Limites e próxima prova

Não houve HTTP/JWT real, envio, Auth remoto, cobrança, emissão fiscal, fila, provedor ou concorrência multissessão. A flag histórica não revoga RPC SQL e seu valor remoto é desconhecido nesta preparação. O defeito anterior de sessão na página, relatado por 05/06, permanece pendência de correção/ensaio de UI; a action de aceite confere erro, sem acesso concedido por aquela prova. CPF/CNPJ não é prova cadastral; LP não foi migrada para CPF; evidência não altera pagamento/acesso. Retorno não apaga/restaura vínculos de dados.

Próxima etapa: revisão independente dos arquivos selados pela Central. Aplicação/backup real exigem autorização nominal própria; U6 e alterações de consumers não fazem parte deste pacote.
