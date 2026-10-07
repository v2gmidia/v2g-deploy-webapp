# Migrations comerciais — arquivo local e ledger remoto em 07/10/2026

Projeto consultado: V2G-SITE (`ushccxpoxjikzqnwhgfd`). Os objetos foram conferidos no schema vivo, mas os nomes e as versões da tabela de migrations do Supabase não são os nomes dos arquivos locais. Esta tabela registra a correspondência observada; não executa nenhuma mudança no banco.

| Arquivo local | Versão e nome no ledger remoto |
|---|---|
| `0026_contratacao_multiconta.sql` | `20261007002600` · `contratacao_multiconta_20261006` |
| `0027_acesso_legado.sql` | `20261007002707` · `acesso_legado_20261006` |
| `0028_pedido_pago_exige_negocio.sql` | `20261007003448` · `pedido_pago_exige_negocio_20261006` |
| `0029_pix_assistido.sql` | `20261007005708` · `pix_assistido_20261006` |
| `0030_vincular_conta_comprada.sql` | `20261007030152` · `vincular_conta_comprada_20261007` |
| `0031_mesclar_blocos_onboarding.sql` | `20261007031520` · `mesclar_blocos_onboarding_20261007` |
| `0032_mesclar_respostas_por_chave.sql` | `20261007031705` · `mesclar_respostas_por_chave_20261007` |
| `0033_unidade_aprovada_com_pedido_pendente.sql` | `20261007040009` · `unidade_aprovada_com_pedido_pendente_20261007` |

**Conferência:** a listagem remota retornou essas oito entradas. `pnpm conferir:migrations` verificou 33 arquivos declarados no manifesto e 107 objetos contra o PostgREST, inclusive as RPCs deste lote. Esse conferidor não verifica corpo de função, grants ou se a versão local é reconhecida pelo CLI. Os testes SQL transacionais com rollback cobriram os comportamentos das funções novas; as alterações foram aplicadas e seus dados fictícios removidos.

**Próximo passo antes de `pnpm db:migrate`:** reconciliar o histórico local e o ledger com uma estratégia que mantenha tanto as versões antigas quanto as oito entradas acima sem reaplicar DDL. Comparar novamente os objetos e as versões no momento de conectar o CLI. Não renomear arquivos já aplicados nem executar `db push` apenas para tentar obter um ledger verde: ele pode tentar repetir colunas, índices e funções no banco compartilhado com o backend.
