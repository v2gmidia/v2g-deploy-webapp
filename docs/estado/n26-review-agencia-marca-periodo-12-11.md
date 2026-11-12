# Revisão de Victor — papéis, marca e período

> RESOLVIDO LOCALMENTE em 12/11/2026 após autorização: marca e período corrigidos e testados na branch QA; candidata e pacote produtivo atualizados para revisão 2, sem publicação ou aplicação. Conferência no alias QA depende do próximo commit/push de Victor. Evidências em `n26-qa-marca-periodo-corrigidos-12-11.md`.

12/11/2026. Feedback visual sobre a QA e critérios adicionais à revisão do pacote produtivo. Nenhum código, cadastro, imagem, migração ou deployment foi alterado neste bloco. O pacote selado de produção permanece intacto; este registro não autoriza aplicação.

## Três áreas confirmadas por Victor

| Área | Finalidade |
|---|---|
| Agência | Carteira e pendências dos anunciantes; acompanha números e criativos e entra no aplicativo de cada cliente. Combina visão operacional com acompanhamento do cliente, limitada à própria carteira. Não recebe automaticamente papéis ou permissões da mesa interna. |
| Gestor V2G | Mesa de trabalho, clientes atribuídos, revisão, tarefas e rotina operacional. |
| Cliente final | Aplicativo do próprio anunciante, com cadastro, acompanhamento, resultados e criativos. A agência abre essa experiência no contexto do cliente; isso não cria um login direto para ele. |

## Marca no cabeçalho — defeito identificado

A captura de Victor mostra a marca do Dúú junto ao nome Piligrin. O cabeçalho deve apresentar a marca da entidade nomeada: Piligrin com a marca própria ou inicial P enquanto ela não estiver cadastrada; Dúú com a marca do Dúú. Nenhuma logo foi inventada nem arquivo reatribuído.

Fato de código: `app/(protected)/layout.tsx:108` entrega o logo associado ao ID do negócio, enquanto `components/ui/Casco.tsx:76` renderiza esse logo junto ao rótulo da conta. O contexto histórico QA ainda usa o negócio Piligrin para os dados do Dúú; a identificação visual precisa distinguir os papéis, além de validar isolamento.

Critério de aceite adicional antes de liberar produção: conferir cabeçalho, seletor de conta, carteira e detalhe. Nome e logo devem sempre pertencer à mesma entidade. A proposta produtiva já separa raiz administrativa e anunciante; a identidade não deve voltar a ser misturada na importação dos arquivos.

## Origem e datas do resumo

Na captura enviada: **01/11/2026 a 07/11/2026**, gasto **R$ 281,80**, 466 cliques e 26.129 impressões. Fonte é Meta Marketing API via backend, usando a mesma consulta autorizada de Anúncios. O recorte validado corresponde à conta `act_1165478988908157`; contém observação de uma das dez campanhas retornadas, com limite de cobertura explícito.

Vínculo com calendário já existe: `app/(protected)/inicio/page.tsx:98` resolve o intervalo escolhido; `app/(protected)/inicio/page.tsx:169` passa suas datas ao leitor; `app/(protected)/inicio/page.tsx:234` inclui essas mesmas datas no escopo do resumo. `lib/inicio/resumo-meta.ts:5` agrega campanhas do inventário recebido; `lib/inicio/resumo-meta.ts:16` monta os pontos do mesmo período. A chave da memória inclui perfil, negócio, período e conta (`lib/inicio/resumo-meta.ts:32`), impedindo aproveitar números de outro recorte como se fossem atuais.

A conferência autenticada anterior está em `n26-piligrin-duu-validacao-autenticada-qa-12-11.md:39`. Este feedback não justificou repetir a consulta Meta ou os testes já encerrados sem mudança. Valores da imagem são o recorte exibido, não uma nova coleta feita neste bloco.

Critérios de clareza: resumo e gráfico devem acompanhar a data no seletor; deixar o intervalo visível junto do resumo/valor, com rótulo como “Investido no período”. A data da saudação é o dia atual da interface e deve permanecer distinguível do intervalo de resultados. O teto de mídia de R$ 3.000/mês continua separado do gasto observado.

## Próxima ação

Central: incorporar esses critérios na próxima correção local/revisão da candidata, conferir o caso legado de logo na QA e a separação produtiva, testar a mudança que vier a ser feita e selar nova revisão se houver alteração do pacote. Victor: continuar o aceite visual. Não aplicar a revisão anterior como se este feedback de marca já tivesse sido corrigido ou validado em produção.
