# Criativos — vínculo do arquivo de revisão na galeria do cliente (20/10/2026)

## §0. Depende de Victor e da integração

- A mudança local ainda não foi ensaiada com sessão e registros reais. Conferir em QA uma revisão normal e um registro inconsistente sem usar material privado de cliente; não alterar dados reais sem autorização específica.
- O fluxo de geração de imagem permanece separado: consentimento por imagem/finalidade, piloto, referências, custo, provedor, versões e aprovação no app ainda faltam. Esta rodada protege o envio de peça pronta já existente.

## Fato observado

- A galeria do cliente lia solicitações de revisão sob RLS e filtro de `business_id`, mas assinava em lote todos os `file_path` devolvidos sem conferir o vínculo exato entre negócio, solicitação e caminho. A mesa do gestor já havia recebido essa checagem na rodada anterior.
- Se uma linha inconsistente compartilhasse o caminho de outra, filtrar só a lista de URLs não bastaria: a associação da URL ao card também precisava ser validada.

## Feito neste bloco

- A consulta da galeria inclui explicitamente `business_id`. Linhas que não correspondem ao negócio ativo são excluídas antes de montar os cards.
- A galeria só solicita URL para revisões cujo caminho é exatamente `business_id/id`, e o card só recebe uma URL se o mesmo vínculo for válido. Uma inconsistência mostra aviso e a prévia permanece indisponível.
- Não foram alteradas as ações de envio, a aprovação do gestor, o estado de publicação ou arquivos do Storage.

## Testes e limites

- `scripts/conferir-revisao-criativos.mjs`: 11/11 testes locais passaram; `pnpm typecheck` e `pnpm conferir:identidade` passaram.
- `pnpm conferir:criativos` imprimiu 30 conferências aprovadas, mas o processo Node falhou após a saída na primeira execução; repetido uma vez, terminou com código 0 e as mesmas 30 conferências. A primeira falha não foi tratada como aprovação.
- Sem sessão real, arquivo privado aberto, migração, chamada paga, Meta ou deploy. O teste estático não prova RLS ou galeria autenticada.

## Próximo recorte possível

QA autenticado de isolamento entre negócios na galeria e continuidade do pedido de geração com marca, nicho, referências e autorizações persistidas. Não declarar etapa 06 concluída com este ajuste.
