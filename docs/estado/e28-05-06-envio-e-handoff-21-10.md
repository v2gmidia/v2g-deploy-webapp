# E28-05/06 — envio, SQL local e adaptador de leitura — 21/10/2026

## 0. Conclusão e portões

**Concluído neste bloco LOCAL:** ensaio da migration específica em PostgreSQL/PGlite descartável; pacote individual de QA; adaptador servidor-servidor do contrato e28-07-v1, com autenticação/carteira antes da chamada e 9 cenários canônicos cobertos. **60 testes direcionados passaram; typecheck global e recorte de tipos passaram na última execução.** Não há certificação ponta a ponta real.

**Ainda depende de Victor/QA:** autorização de aplicação individual no projeto confirmado, snapshot/ledger/schema revisados, publicação/configuração QA se necessária e ensaio com sessão, arquivo privado, galeria e fila reais. Nenhuma migration aplicada fora da base temporária. Não foram criados usuário, permissão, upload real, chamada paga, endpoint de publicação ou novo fluxo IA.

A entrega visual mais recente está preservada em `criativos-refino-visual-envio-21-10.md`, aguardando avaliação de Victor; este bloco não alterou TSX/CSS. E28-06-A/B e caminhos 2/3 não foram abertos. Nenhum commit/push/merge/deploy/build/restart/configuração/Meta/n8n foi executado. Central pode ler este checkpoint sem mensagem de retorno a outro chat.

## Estado por item E28

| Item | Feito localmente | O que NÃO está fechado |
| --- | --- | --- |
| E28-05-A | Actions existentes ensaiadas com portas em memória; identidade/arquivo/hash/intenção, replay, falha parcial e decisão do gestor; SQL agora ensaiado na base descartável | Auth, Storage, fila e persistência reais integrados; recebimento de aviso pelo gestor |
| E28-05-B | Adaptador preparado e testado com contrato canônico, acesso negado antes da rede e números com desconhecidos preservados | Consumidor de tela, autorização de agência delegada, integração HTTPS e QA com cliente comum |
| E28-06-C — recorte de envio pronto | Prévia/conferência, UUID + hash da versão, objetivo/validade/autor/horário e fila local existentes; reforço de SQL verificado | Aprovação formal de primeira publicação; aprovação/refações da imagem gerada; conclusão integral de 06-C |

## 1. Fontes e limites de leitura

- Lidos: `docs/handoffs/noite-21-10-central.md`, `docs/execucao-evento-28-10.md`, decisões/regras do repositório e código vigente. Git dirty conferido antes de editar; outras frentes preservadas.
- Handoff backend: `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g/docs/estado/e28-07-08-contrato-handoff-21-10.md`; modelos/produção do contrato consultados somente em arquivos locais.
- Fixture única: `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g/tests/fixtures/e28_07_contrato_handoff.json`, `e28-07-v1`, nove cenários. SHA-256 lido: `963F8A5716F5AEBC684E827EB9BF212DCB799059F82AB5DAFA5DA7EACFC3BC48`. Nenhuma cópia paralela ou edição no backend.
- Figma não relido neste bloco; limite informado pelo Central permanece explícito. Planilha também não foi relida diretamente por esta frente. Usado espelho local, sem alegar novo estado dos quadros.
- Supabase changelog HTML, documentação de RLS e API PGlite consultados para o ensaio; índice `.md` retornou content-type não suportado. Nenhum ajuste de SDK/configuração foi necessário.

## 2. PostgreSQL local e falha encontrada

`scripts/conferir-intencao-envio-sql.mjs` usa a dependência PGlite já disponível em Finance, cria sua própria base efêmera e executa as migrations reais de fila e upload_intent, com profiles/businesses/bucket/auth.uid mínimos simulados. Não lê `.env`, não abre conexão Supabase e fecha a base no final.

**Defeitos medidos e corrigidos no arquivo ainda NÃO aplicado:**

- O CHECK de `confirmedAt` só verificava regex e aceitava data impossível. O teste acusou a ausência de rejeição; o CHECK agora faz cast real e compara UTC canônico, recusando também normalização de hora 24.
- A validade usava `date::text`, dependente de DateStyle. Passou a `to_char(..., 'YYYY-MM-DD')`; o teste em `German, DMY` e `Pacific/Kiritimati` preservou a data ISO.

Evidência: `supabase/migrations/20261021032617_creative_review_upload_intent.sql:18` e `:22`. SHA-256 atual do arquivo: `D69E2FE4189FDC5B22C785F89F973347AC84B67A925EC776213740F3E40DBE4A`. Recalcular antes de qualquer aplicação aprovada.

**12/12 testes SQL:** legado SQL NULL preservado; JSON null/lista/objeto incompleto negados; versão/objetivo/chaves/tamanho; datas reais/bissexto/impossíveis; confirmação UTC canônica; DateStyle/fuso; ACL/RLS/policies inalteradas; SELECT sob dono simulado isola negócios e não concede carteira ao gestor; cliente não escreve e anon não lê; bucket privado/formato/tamanho; pré-checagem somente leitura; limpeza por alvo/hash com rollback padrão.

Datas passadas permanecem admissíveis no histórico SQL; vencimento no novo envio e aprovação é guarda da aplicação, já testada. A migration não agenda publicação nem pausa.

## 3. Adaptador E28-05-B

- Nova porta `lib/backend/metricas-da-carteira.ts:27`, exportada pelo barrel `lib/backend/index.ts:4`. `server-only`; sem rota nova, sem Server Action pública e sem consumidor visual nesta rodada.
- Confere UUID/período; `auth.getUser()` + papel servidor `operador`; atribuição exata em `manager_accounts`; dono obtido de `businesses.profile_id`. Falha/duplicidade/ausência nega antes do backend. Agência/cliente/user_metadata não autorizam acesso.
- Só então usa `lib/backend/cliente.ts` para GET `/negocios/{business_id}/consolidado` com `profile_id` do dono, não do navegador/operador. Não usa endpoint interno direto, POST, fallback V2G ou novas credenciais.
- `lib/gestor/contrato-metricas.ts:146` valida eco de negócio/período e lista `por_execucao`, sem IDs duplicados nem descarte silencioso de linha inválida. O validador antigo não preservava o novo contrato; foi criado adaptador separado, sem modificar as telas/leitores existentes.
- Números vêm do `contrato_de_leitura`; custo apenas da própria linha consistente. Totais do topo e nível/frase antigos não viram indicadores da mesa. Origem heterogênea, conflitos de identidade/fonte/moeda/total irmão e contagens contraditórias retiram todos os números com motivo.
- Diferencia `sem_dados`, zero observado, completude desconhecida, parcial, carimbo anterior ao fim e inconsistente. Null e motivos são preservados. Resultado atribuído não vira conversa/venda; clique total não vira clique no link. Decimais textuais mantêm precisão.
- Fuso ausente não vira São Paulo presumido: comparação de carimbo só é afirmada quando inequívoca até UTC±14; ambiguidade fica null. Nenhum selo verde, benchmark ou ação automática foi criado.
- O teste lê a fixture canônica diretamente. O envelope `business_id/desde/ate/por_execucao` é montado como fixture de transporte conforme o modelo Python local, não uma captura de HTTPS real.

**21/21 testes:** os nove cenários; negações de sessão/papel/carteira/negócio; usuário do banco prevalece sobre profileId injetado; falhas/duplicidade; UUID/datas; envelope divergente/duplicado/sem contrato; irmãos positivos em origem heterogênea; conflitos; precisão/null; ambiguidade de fuso; erro de rede normalizado; completude/identidade contraditórias. `vinculo_manual` é fixture de escrita: é recusada como resposta de leitura e nunca gera POST. Os três logs 401/404/409 e o log de rede do teste são controles negativos com IDs fictícios.

## 4. Pacote de homologação individual

Documento: `docs/qa-envio-criativo-e-leitura-carteira-21-10.md`.

- `scripts/sql/prechecar-qa-envio-criativo.sql`: leitura de identidade do banco, ledger pertinente, schema, constraints, ACL/RLS/policies, bucket e contagem. Não consulta conteúdo de cliente. Validado sintaticamente só na base descartável com metadados fictícios.
- Aplicação futura somente desta migration, após autorização, snapshot e reconciliação. As 20 ausências do conferidor anterior não foram reaplicadas nem “corrigidas” por lote. Não foi repetida a auditoria externa do banco nesta rodada.
- Matriz futura: conta fictícia → imagem privada/hash/request → replay → recarga/logout/login → recuperação com hash → gestor correto → decisão; negócio/gestor/agência errados negados; falha parcial e ambígua preservadas.
- `scripts/sql/limpeza-qa-envio-criativo-modelo.sql`: um único ID/negócio/ator/hash, nome E28-QA e negócio fictício; rollback padrão. Teste local cobriu rollback, hash errado, commit somente na memória e preservação do legado. Não é execução de limpeza real; Storage/tarefa/usuários não são removidos por esse SQL.
- Rollback preferido aditivo: preservar histórico/coluna, sem DROP. Alteração externa de flag/código/limpeza exige atos específicos.

## 5. Arquivos tocados nesta rodada

1. `supabase/migrations/20261021032617_creative_review_upload_intent.sql` — reforço do CHECK, ainda local.
2. `scripts/conferir-intencao-envio-sql.mjs` — novo ensaio PostgreSQL.
3. `lib/gestor/contrato-metricas.ts` — novo parser/adaptador puro.
4. `lib/backend/metricas-da-carteira.ts` — nova porta autenticada de leitura.
5. `lib/backend/index.ts` — somente export da porta/tipo.
6. `scripts/conferir-metricas-carteira.mjs` — contrato canônico + portas/HTTP em memória.
7. `scripts/qa/tsconfig.metricas-carteira.json` — recorte de tipos, sem alterar tsconfig raiz.
8. `scripts/sql/prechecar-qa-envio-criativo.sql`.
9. `scripts/sql/limpeza-qa-envio-criativo-modelo.sql`.
10. `docs/qa-envio-criativo-e-leitura-carteira-21-10.md` e este checkpoint.

Sem edição de package.json, documentos/quadros centrais, backend, UI ou arquivos de outra frente.

## 6. Testes finais e limites

| Verificação | Resultado |
| --- | --- |
| PostgreSQL temporário | 12/12 |
| Adaptador + fixture canônica | 21/21 |
| Actions de intenção/envio | 16/16 |
| Regressão da fila/revisão | 11/11 |
| Total direcionado | **60/60** |
| `pnpm exec tsc --project scripts/qa/tsconfig.metricas-carteira.json --pretty false` | Passou |
| Último `pnpm typecheck` global | Passou, zero diagnósticos |
| `git diff --check` | Passou; avisos de LF/CRLF existentes |

Durante trabalho concorrente, execuções intermediárias do typecheck apontaram erros em contratação/manifesto fora desta frente; esses arquivos não foram alterados aqui. A última execução global passou. Não foi rodado build nem a suíte global com rede.

SQL local usa identidade simulada, não valida JWT, serviço Auth/PostgREST, Storage remoto, assinatura/expiração real de URLs, concorrência entre processos ou HTTPS. Os testes de actions usam portas em memória. Não há prova de recarga autenticada real ou do backend publicado; nenhum teste local fecha essa lacuna.

## Próximo passo executável e dono

1. **Central/Victor:** revisar pacote/hash e autorizar, se desejado, QA individual com projeto/fixtures/janela definidos; não reenviar autorização genérica como aplicação em lote.
2. **05/06, após esse portão:** executar o roteiro autenticado e reunir evidência de DB/Storage/galeria/fila/isolamento; integrar a leitura a consumidor mínimo em bloco próprio. A porta está pronta para esse consumidor, não ligada por este lote.
3. **07/08:** nenhum bloqueio de incompatibilidade foi encontrado nos nove cenários. Fixture de escrita permanece só servidor e fora deste leitor. HTTPS/publicação/conta externa ainda requerem seus portões.

Rodada encerrada sem iniciar outro bloco ou aguardar resposta de outro chat.
