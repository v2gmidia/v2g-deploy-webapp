# Ativação Nota/Brotherhood preparada — 17/11/2026

## 0. Resultado e decisões necessárias

Pacote de revisão pronto em [README e matriz](../qa/ativacao-nota-brotherhood-17-11/README.md), **não aplicado**. Contratante Nota 360, anunciante Brotherhood Barbershop, uma conta de anúncios por R$ 500/mês. Agência acessa a carteira; anunciante sem login. A preparação retoma esse recorte nominal a pedido de Victor; não autoriza cobrança, envio ou concessão.

Victor/Matheus: confirmar representante/e-mail titular, dados privados no aplicativo, mensal no cartão, início/vencimento e ausência de pagamento prévio do ciclo; fechar condições e versão contratual utilizável/procedimento fiscal. A Central confere IDs e evita duplicar agência/anunciante existentes. Versan e demais anunciantes ficam fora da emissão.

**Limite novo explicitado:** os controles publicados são globais ao ambiente; LP sem botão não restringe a compra à Nota. Para exclusividade efetiva, recomenda-se um próximo bloco de implementação e testes QA de restrição no servidor ao contexto/identidade/unidade/valor do piloto, antes de qualquer criação Asaas. A restrição ainda não existe. Alternativa: Victor aceitar expressamente contratação acompanhada com esse limite global. Não apresentar o pacote como pronto para execução exclusiva enquanto faltar essa decisão/implementação.

## 1. Pacote concreto

- Matriz com **17 controles WebApp `false→true`** propostos, fases e estado atual. Não aplicar automaticamente.
- Webhook/fila Asaas propostos ON em etapa futura, preservando URL/token/17 eventos e saques OFF; auditar backlog antes.
- Mensal inicial com 3DS; assinatura do mês seguinte pode ser criada pelo fluxo após confirmação canônica. A futura autorização precisa incluir esse efeito, além dos dois e-mails reais.
- LP mantém controles `0/0` para esta contratação acompanhada pelo checkout oficial limpo. Sem lead autorizado, origem compra_direta. Ponte LP e abertura pública são uma etapa separada antes das vendas gerais.
- Conferência e retorno preservam pagamentos em trânsito e direitos pagos; fechar novas compras não significa desligar indiscriminadamente o webhook ou revogar acesso.

## 2. Prova e limite

Leitura atual de metadados Vercel: 17 controles propostos OFF; LP OFF; implantações oficiais WebApp `dpl_GXAYGCNRdAmcptRNz7m4qCydeAzw` e LP `dpl_35LuEFqrqJ29rMWxxkvabfR6x5XD` continuam READY com aliases oficiais. Segredos não lidos.

**42 verificações locais** da matriz aprovadas contra funções puras da cópia publicada, usando valores sintéticos. Nenhuma chamada externa, `.env`, configuração real ou execução de checkout. O teste confirma dependências da configuração; não prova chaves reais, pagamento, recebimento em caixa, sessão nova ou exclusividade.

Nenhum banco, usuário/papel, Meta, anúncio, verba, chave, painel, código de produto ou publicação alterado. Sem cobrança, assinatura, envio, commit/push/merge/deploy.

Próximo responsável: Victor confirma condições/titular e recorte de exclusividade; Central implementa/testa a restrição somente em bloco autorizado ou prepara execução com o limite global expressamente aceito. Parada antes de ativar.
