# Banco mínimo comercial — pacote local revisável, não aplicado

Preparado em **11/11/2026** para o projeto produtivo nominal `ushccxpoxjikzqnwhgfd` (`V2G-SITE`). Autorização deste bloco: montar e testar localmente, preservando dados; **sem aplicação remota**. Compras, processamento, e-mail e serviços externos não são configurados por este pacote.

## Resultado

**22/22 grupos de teste aprovados em PostgreSQL 17.5 embarcado (PGlite 0.3.14)**, com zero escritas remotas e zero pagamentos. O SQL final gerado foi executado em bases descartáveis reconstruídas dos catálogos comerciais reais e preenchidas exclusivamente com dados fictícios.

O motor anterior disponível era PostgreSQL 18.3. A diferença foi identificada; o pacote foi gerado novamente e toda a rodada final foi executada no motor 17.5, da mesma versão principal de produção (17). PGlite 0.3.14 foi instalado isoladamente da aplicação, com versão fixa e scripts de instalação desabilitados. Nenhum `package.json`/lockfile do produto ou serviço existente foi alterado. Docker não estava em execução; não foi iniciado.

Isto é prova local de SQL e regras estruturais, **não** aplicação, teste de PostgreSQL nativo hospedado, PostgREST/JWT/HTTP, concorrência real multissessão, pagamento Asaas, e-mail entregue ou acesso de um comprador real. A versão de patch de produção difere da embarcada; continua necessária conferência após qualquer aplicação futura autorizada.

## Delta exato

| Objeto | Alteração |
| --- | --- |
| `commercial_orders` | Acrescenta 13 colunas necessárias ao checkout, pagamento API, 3DS/recorrência e tipo de documento gerado. Preserva todas as 26 colunas anteriores e seus dados. |
| Constraints de pedido | Substitui quatro restrições legadas de documento/período/desconto/total; permite CPF/CNPJ e semestral conforme código vigente. Acrescenta checagens de tentativas/cartão/3DS e unicidades dos identificadores externos. |
| Quatro tabelas novas | `commercial_payment_events`, `commercial_payment_email_outbox`, `checkout_3ds_context`, `checkout_security_attempts`. RLS ligada, ACL explícita; sem abertura a anon/authenticated/PUBLIC. |
| Dez funções novas | As nove necessárias ao fluxo/gate, mais o helper do trigger documental. Invoker, configuração de `search_path` e execução somente para service_role/owner. O helper valida novos documentos e permite atualização não documental de CNPJ legado. |
| Um trigger novo | Valida CPF/CNPJ ao inserir ou alterar o documento de um pedido; não reescreve números legados. |

**Preservados:** `businesses`, `commercial_order_units`, `commercial_events`, suas políticas e ACL; corpos/ACL das quatro funções comerciais preexistentes capturadas, inclusive Pix assistido e `registrar_conta_contratada`; índice de Pix assistido aberto; titularidade e vínculos existentes. O catálogo completo capturado registra ainda fingerprints das 40 tabelas e 23 funções públicas anteriores e 24 entradas de privilégios padrão, para conferência posterior.

Não são incluídos: estrutura agência/anunciante, onboarding de reuniões, evidência manual de contratos, gestor/tarefas, leads, alterações de Auth/Storage, migrações de backend ou o conjunto inteiro U1–U6/QA. A cadeia histórica é usada somente como referência em memória para extrair as definições finais necessárias. Não é executada contra o clone de produção nem incluída como instrução de aplicação.

O pacote vive **fora de `supabase/migrations`**. Não entra por consequência em `pnpm db:migrate`. Não cria/apaga/reescreve o histórico remoto de migrations.

## Arquivos e conferência

| Arquivo | Finalidade |
| --- | --- |
| `capturar-metadados.sql`, `base-catalogo.json` | Catálogos observados em transação READ ONLY. Nenhuma linha de cliente, pedido, Auth, evento ou segredo foi copiada. **Não substituem backup privado de recuperação.** |
| `aplicar-local-revisavel.sql` | Delta transacional, lock com limite, pré-condição exata, repetição sem efeito quando estado final já corresponde e verificação posterior antes do commit. Não executado remotamente. |
| `retornar-se-nao-usado.sql` | Retorno restrito a estado final exato e objetos novos sem uso; não apaga linhas, não usa CASCADE e recusa CPF/dados novos em uso. Não executado remotamente. |
| `verificar-pre.sql` | Apenas catálogos, em READ ONLY: distingue base correspondente de pacote já presente. O recibo `resultado-preflight-producao.json` registrou base correspondente e pacote ausente, sem aplicação. |
| `verificar-pos.sql` | Apenas catálogos: exige estado final, demais objetos/funções anteriores e privilégios padrão preservados. Não chamado remotamente, pois o pacote não foi aplicado. |
| `modelo.mjs`, `montar-local.mjs` | Reconstrução do recorte observado e geração local de aplicação/retorno. Não têm conexão remota nem carregam `.env`. |
| `testar-local.mjs`, `resultado-ensaio.json` | Executam o SQL gerado e registram os 22 grupos, versão do motor e limites. |
| `estado-pos-esperado.json`, `fontes.json` | Estado final previsto, lista de objetos e referência da cadeia histórica. |
| `SHA256SUMS.json` | Identifica os arquivos do pacote e as fontes SQL usadas; conferir antes de revisão/aplicação. |

Da raiz do WebApp:

```text
node docs/comercial/banco-minimo-local-11-11/montar-local.mjs
node docs/comercial/banco-minimo-local-11-11/testar-local.mjs
node docs/comercial/banco-minimo-local-11-11/selar.mjs --verificar
```

Motor local padrão: `C:/Users/victo/.codex/tmp/v2g-pg17-local-20261111/node_modules/@electric-sql/pglite/dist/index.js`. Outra instalação equivalente pode ser passada com `--pglite-module <caminho-absoluto>`. A versão deve ser conferida no recibo. Não regenerar o pacote já revisado para incorporar silenciosamente mudanças das fontes; isso exige nova revisão e selo.

## O que foi testado

- Base comercial reconstruída corresponde às quatro tabelas e quatro definições/ACL de funções capturadas. Ordem textual de entradas ACL é normalizada; diferenças reais de privilégios continuam sendo comparadas. NOT NULL é verificado por coluna; a representação extra de `pg_constraint` no PostgreSQL 18 não foi confundida com divergência de dados.
- Aplicação preserva todos os campos anteriores, IDs, vínculos, pedidos pendentes/aprovados, eventos e unidades fictícios. Inclui CNPJ legado sem dígitos verificadores válidos. Sentinelas locais de execuções/criativos e demais tabelas auxiliares permanecem idênticas.
- Reaplicação não altera schema nem dados; retorno antes de uso restaura o estado anterior, também de forma repetível. Depois de uso ou drift, retorno recusa e preserva tudo.
- As 23 permissões DML são exigidas individualmente. Mais 36 variantes de grant por coluna, inclusive PUBLIC, fecham readiness. Defaults públicos permissivos são neutralizados; um grant inesperado a papel extra faz a verificação posterior falhar e a transação inteira voltar.
- RLS separa compradores A/B; novos eventos/outbox/contexto/limites não permitem leitura direta anônima/autenticada. Funções novas não são executáveis por esses papéis.
- Referência idêntica preserva pedido; referência divergente recusa. Nova referência com mesmo e-mail/CPF cria outro negócio. Preços semestral/anual são calculados corretamente; mensal Pix e total adulterado recusam.
- IDs/valor/ciclo de pagamento são conciliados; evento repetido divergente não sobrescreve histórico de outro pedido. Estorno A fica em A.
- Autorização 3DS não aprova. RECEIVED pode aprovar e reservar apenas uma recorrência; reprovação de risco prévia impede aprovação/reserva. Nenhuma API bancária foi chamada.
- Unicidade da outbox e limite de segurança funcionam; registro legado de conta continua exigindo pedido aprovado/unidade e vínculo correto da conexão.
- Pré-condição rejeita drift e instalação parcial antes de criar objetos. Falha posterior reverte toda a transação. Verificação local não declara preservados os demais objetos produtivos que não foram copiados para o clone restrito.

## Preservação e retorno

O SQL não contém UPDATE/DELETE de migração em pedidos/negócios existentes. Os comandos de DML presentes nos corpos das funções serão usados futuramente pelo aplicativo, não na instalação. A coluna gerada acrescenta o tipo derivado sem trocar o número legado. Há funções de limpeza de contexto/limite já previstas pelo produto; elas não são chamadas na instalação.

O retorno recusa qualquer linha nas quatro tabelas novas, qualquer uso dos novos campos de pagamento/comprador, ou CPF em pedidos. Exige também o estado final exato. Não é solução para desfazer cobranças, pagamentos, e-mails, assinaturas, concessões ou publicação. Após uso, preservar os dados e preparar correção aditiva; não apagar registros para forçar o retorno.

## Próximo ato e parada

**Montagem e teste local concluídos.** Responsável pela revisão: Central/Victor. Antes de qualquer aplicação remota: confirmar alvo/histórico atuais, comparar os hashes, capturar backup privado apropriado, rever preservação e dependências e obter autorização específica para este pacote e ambiente. Se outro chat mudar a base, reconciliar novamente; não substituir suas alterações para fazer o gate passar.

O backup privado do ato, sua aplicação e a conferência pós-aplicação **não foram executados**. Tampouco houve commit/push, deploy, configuração de provedor, webhook, segredos, permissões remotas, migração QA/produção, cobrança ou envio de e-mail. Nenhuma ativação financeira está autorizada pelo fato de o SQL local ter passado. As dependências Asaas/3DS, escopo do webhook, remetente, Turnstile e Auth permanecem no [preparo de configuração](../preparo-producao-11-11/README.md).
