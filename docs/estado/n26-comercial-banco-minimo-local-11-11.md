# Comercial: banco mínimo montado e testado localmente — 11/11/2026

> APLICADO em 11/11/2026 após nova autorização explícita: backup privado, execução nominal em produção e conferências concluídos, mantendo vendas/pagamentos OFF. Ver [resultado produtivo](./n26-comercial-banco-minimo-aplicado-producao-11-11.md). O registro abaixo preserva o preparo local anterior.

## 0. Resultado e próximo ato

**Pacote mínimo concluído para revisão, sem aplicação remota.** [Pacote e provas](../comercial/banco-minimo-local-11-11/README.md). **22/22 grupos passaram em PostgreSQL 17.5 embarcado**, com dados fictícios e clone do recorte comercial observado. Pré-checagem nominal em produção, somente leitura, confirmou base correspondente e pacote ainda ausente.

Próximo ato distinto: revisar o pacote selado, confirmar alvo/histórico atuais e capturar o backup privado apropriado antes de qualquer aplicação que Victor autorize especificamente. Não aplicar com esta autorização local. Provedores/3DS/webhook/remetente/Turnstile/Auth continuam separados e pagamentos desligados.

## 1. Escopo e evidência

Victor autorizou montar e testar localmente, preservando dados e sem aplicar. Nenhuma delegação nova ou modificação de código do produto foi necessária. Só foram acrescentados artefatos locais do pacote e registros documentais.

O catálogo produtivo nominal foi capturado em transação READ ONLY: quatro tabelas comerciais existentes, quatro funções de suporte/legado, políticas, índices, constraints e ACL; fingerprints de 40 tabelas e 23 funções públicas e 24 entradas de ACL padrão. Nenhuma linha de negócio/Auth/pedido/evento, valor de `.env`, token ou chave foi lido. Esse catálogo não é backup privado de recuperação.

Delta: quatro tabelas novas, 13 colunas em `commercial_orders`, quatro constraints antigas substituídas e checagens/unicidades novas, dez funções novas e um trigger documental. São as nove funções necessárias ao fluxo/gate mais o helper do trigger. Não altera corpos/ACL de Pix assistido ou de registro de contas, titularidades, base de agência/anunciantes, onboarding, contratos manuais, leads ou backend.

O pacote fica fora de `supabase/migrations`; não entra por consequência no comando automático de banco. A cadeia histórica de referência só é executada em memória para extrair as definições finais necessárias. O delta executado no clone é o SQL gerado, com pré/pós-condições exatas e transação única.

## 2. Ensaio e preservação

- Reconstituição de tabelas/funções observadas corresponde ao catálogo real no recorte. Clone recebe somente identidades, pedidos, negócios, eventos e sentinelas fictícios.
- Aplicação e reaplicação do arquivo SQL gerado: dados anteriores preservados e repetição sem alteração adicional. Retorno antes de uso recompõe o catálogo anterior; após uso/drift, recusa sem apagar registros.
- RLS A/B, ACL de funções/tabelas, 23 DML individuais e 36 variantes de grants por coluna/PUBLIC aprovados. Defaults permissivos tratados; grant inesperado a outro papel provoca rollback integral, sem instalação parcial.
- Referência idempotente, nova referência sem fusão por contato/documento, CPF/CNPJ, CNPJ legado preservado, preços/métodos/totais, conciliação de evento, replay divergente e estorno isolado aprovados.
- 3DS AUTHORIZED não aprova; RECEIVED aprova/reserva uma vez quando elegível; risco prévio impede. Outbox única, limite de segurança, vínculo da conta/unidade/negócio e negativas de pedido pendente aprovados, sem HTTP ou provedor real.

Comando final: `node docs/comercial/banco-minimo-local-11-11/testar-local.mjs`, **exit 0, 22 grupos, zero falhas**. Recibo inclui versão do motor e limites. Gerador também terminou com exit 0. Não foram executados build/suíte geral do produto, pois fonte do produto e `.next` não mudaram.

## 3. Correções e limite da prova

A primeira reconstrução revelou representação adicional de NOT NULL no catálogo do PostgreSQL 18 e ordem diferente das entradas de ACL. NOT NULL continuou sendo comparado por coluna; ACL foi ordenada sem remover privilégios da comparação. Uma tabela parcial sem constraints exigiu tratar JSON null na pré-condição, para produzir rejeição explícita de estado divergente. O gerador também recebeu o import faltante da consulta de catálogos antes da conclusão. As rodadas finais passaram após as correções.

O motor inicialmente disponível era PostgreSQL 18.3. Como produção usa 17, foi instalada isoladamente a dependência PGlite 0.3.14, versão fixa, registro npm oficial e scripts desabilitados, fora das dependências do produto. O pacote foi regenerado e testado em **PostgreSQL 17.5 embarcado**. Docker não estava em execução e não foi iniciado.

Não é PostgreSQL nativo hospedado, prova de patch idêntico, concorrência multissessão, HTTP/JWT/PostgREST, backup real de dados, aplicação remota, pagamento, assinatura externa, entrega de e-mail ou acesso produtivo de comprador. Readiness=1 local continua estrutural. A preservação de todos os objetos produtivos não clonados só poderá ser medida após ato autorizado; a verificação local não os marcou aprovados artificialmente.

`verificar-pre.sql` foi executado no projeto `ushccxpoxjikzqnwhgfd` em READ ONLY: `base_corresponde=true`, `pacote_ja_presente=false`. Nenhuma RPC financeira/readiness produtiva foi chamada. `verificar-pos.sql` não foi chamado remotamente, pois não houve aplicação.

## 4. Encerramento

Arquivo de aplicação, retorno conservador, pré/pós-verificação, catálogo, estado final esperado, fontes, gerador, ensaio/recibos e SHA-256 preparados. Aplicação e retorno não foram executados fora das bases locais descartáveis. Alterações de outros chats foram preservadas; sem Git, deploy, permissões/configuração remotas, migração QA/produção, envio financeiro, webhook, cobrança ou e-mail.

Bloco encerrado após montagem/teste local. Não há liberação de vendas, nem autorização implícita de aplicar pelo resultado verde.
