# Conexões oficiais configuradas e fechadas em 17/11/2026

## 0. Estado final e próximo ato

Os três campos privados foram salvos por Victor. A Central confirmou somente nome, tipo Secret/sensitive e ambiente Production. Victor confirmou ter colado o mesmo segredo nas duas pontas. Valores não lidos nem comparados pela Central.

A retirada da permissão de saques foi concluída no Asaas: uma consulta nova, sem modo de edição, mostrou a chave V2G WebApp Produção habilitada e a permissão de saques/transferências desligada. A tela anterior em edição estava desatualizada; não solicitar outro SMS para repetir a alteração.

Cobranças, processamento, recorrência e envios comerciais permanecem OFF. Não há nova ação de cópia de chave ou SMS pendente para Victor neste bloco.

Próximo ato: revisar o plano de abertura, a rotina financeira e o acompanhamento da primeira contratação válida. Abertura, processamento e envio real exigem etapa separada; não criar cobrança artificial. O recebimento em caixa e o acesso de um novo comprador após pagamento ainda não foram comprovados.

## Resultado verificado

| Parte | Resultado |
|---|---|
| Chave de banco da LP | SUPABASE_SERVICE_ROLE_KEY, Secret/sensitive e somente Production em v2-g-lp. Entrada privada concluída pelo titular. |
| Assinatura da ligação | V2G_COMMERCIAL_LP_HANDOFF_SECRET nas duas pontas oficiais, Secret/sensitive e somente Production; mesmo valor confirmado por Victor. |
| Asaas | Chave existente habilitada; saques/transferências via API desligados no estado salvo. Nenhuma nova chave gerada, expiração alterada ou movimentação realizada. |
| 3DS/tokenização | Aprovações escritas do Asaas localizadas em 22 e 23/10, respectivamente. Tickets 1835325 e 1892329. Sem novo pedido de liberação. |
| Webhook | URL oficial exata e 17 eventos conferidos no Asaas; webhook e fila desligados. POST vazio no aplicativo responde 503/indisponivel. |
| Proteção | Turnstile de produção restrito a app.v2gmidia.com.br, Managed e sem pre-clearance. Chaves não reveladas. |
| E-mail | Domínio send.v2gmidia.com.br, DKIM e SPF verificados; chave de pagamentos com Sending access restrito ao domínio, sem uso registrado na consulta. Nenhum envio disparado. |
| Acesso | Site URL e callback oficiais; confirmação de e-mail ligada, cadastro anônimo desligado, SMTP existente smtp.resend.com:465 preservado. |
| Compra pública | /contratar renderiza 404 sem campos de pagamento; transporte RSC responde HTTP 200. LP sem compra online; API de configuração responde 404 e o link Entrar é oficial. |
| Gerador privado | Executado por clique humano, sem exibir ou receber o segredo. Servidor local encerrado e aba do gerador fechada após os dois salvamentos. |

## Reimplantações observadas

Após os salvamentos, foram encontradas estas reimplantações em Production, ambas READY e com aliases oficiais:

- WebApp: `dpl_GXAYGCNRdAmcptRNz7m4qCydeAzw`, https://app.v2gmidia.com.br.
- LP: `dpl_35LuEFqrqJ29rMWxxkvabfR6x5XD`, https://www.v2gmidia.com.br.

As duas declaram source=redeploy e têm criação posterior ao salvamento dos respectivos segredos. Não foram disparadas pela Central neste bloco. Nenhum novo pacote de código foi publicado pela Central por consequência da entrada privada.

A árvore remota da LP contém os 55 arquivos de fonte esperados, todos com o SHA-1 do manifesto publicado. A árvore do WebApp veio parcial: 353 dos 663 arquivos de fonte ficaram visíveis e todos os 353 coincidem com o manifesto; 314 entradas da árvore total foram omitidas pelo conector. As entradas compiladas adicionais não foram tratadas como fonte desconhecida. Não declarar uma conferência integral dos 663 arquivos remotos com base nessa resposta parcial.

Os controles antigos e novos de compra, processamento, recorrência, cobertura nominal e envios permaneceram false; as duas opções comerciais da LP permaneceram 0. Não foi feito novo teste de compra, cadastro, webhook autenticado ou e-mail para validar credenciais.

## Limites da prova

Configuração salva e publicação pronta não comprovam que os valores privados estão corretos nem substituem o handshake com provedores. A igualdade do segredo foi confirmada pelo titular durante a cópia; não houve teste criptográfico da ponte em produção, pois ela continua desligada.

Não houve desafio 3DS real, pagamento, nova assinatura, teste de entrega em caixa ou sessão de novo comprador pago. Não houve migração, escrita em dados comerciais, anúncio, alteração de verba, commit, push ou merge neste bloco. A consulta anterior de pedidos, eventos financeiros, filas, assinaturas nominais e vínculos retornou zero; nenhum evento financeiro foi simulado em produção.

O SMTP existente de identidade permaneceu ligado; as guardas de envio comercial permaneceram desligadas. Não confundir a disponibilidade de recuperação de contas existentes com a abertura do envio comercial.

## Evidência e continuidade

- [Resultado e metadados](../qa/conexoes-oficiais-off-17-11/resultado-final-off.json).
- [Bloqueios HTTP após os salvamentos](../qa/conexoes-oficiais-off-17-11/http-apos-campos-privados.json).
- [Chave Asaas salva sem saques](../qa/conexoes-oficiais-off-17-11/asaas-chave-restrita-salva.json).
- [Rotina financeira para revisão](../qa/conexoes-oficiais-off-17-11/rotina-financeira-proposta.md).
- [Conferência anterior e origem das aprovações](./n26-conexoes-oficiais-conferidas-17-11.md).
- [Publicação oficial fechada e recuperação do escopo](./n26-comercial-oficial-publicado-fechado-17-11.md).

Evidências privadas sem valores das novas credenciais: C:/Users/victo/.codex/private-backups/v2g/2026-11-17-conexoes-oficiais. Planilha existente atualizada para retirar os campos e o SMS da lista de pendências; comercial continua Em andamento até a abertura e a prova comercial válida.
