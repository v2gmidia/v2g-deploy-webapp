# E28-06 — primeira fatia executável LOCAL/SIMULADA — 22/10/2026

## §0 — resultado, autorização e próximo portão

Direção humana retransmitida pela Central em 22/10: **geração real voltou a ser prioridade**, começando por um bloco local sem gasto. Isso substitui o limite anterior “somente desenho” para este trabalho; não autoriza piloto pago, publicação ou escrita remota. A arquitetura de 21/10 continua insumo/histórico, não descrição de um gerador já implantado.

**Entregue:** código executa pedido existente → contexto validado/congelado → execução única → PNG simulado válido → armazenamento instrumentado → biblioteca existente → recarga. O ensaio também fecha/restaura o PostgreSQL descartável em nova instância e recupera bytes pendentes sem nova geração. Não é geração por IA, UI demonstrada ou homologação em QA/produção.

**Primeiro ato executado:** git status inicial limpo, instruções/contratos existentes conferidos; não houve impedimento para começar. Sem reconstruir o envio ou a mesa. Aprovação/refações completas, publicação/aviso e página de métricas não foram iniciados.

**Próximo passo único recomendado:** Central/07/08 revisar o contrato abaixo e definir um bloco de integração do worker/portas reais, ainda sem gasto. O piloto real só depois dessas portas, materiais e teto aprovados. Não basta trocar o fake por um SDK e ligar uma flag.

## O que foi implementado

| Arquivo | Entrega |
| --- | --- |
| `lib/criativos/geracao/contexto.ts` | Reutiliza `prepararPrevooDeGeracao` e `hashDoPedido`; confere correspondência com o pedido, marca e escopo dos documentos. Snapshot v1 canônico/hash: negócio/autor/pedido, briefing, documentos completos/versionados/hash/revisor, materiais e referências admissíveis com hashes. Escopo global explícito null é distinto de documento privado de outro negócio. Custo simulado vinculado ao pedido. |
| `lib/criativos/geracao/repositorio-local.ts` | SQL parametrizado de laboratório. Lê o pedido **existente** em `creative_generation_requests`, confere dono, reivindica execução com UNIQUE(request_id), salva resultado antes do Storage, faz vínculo atômico com **creatives existente** e lê biblioteca por negócio/dono. Não cria um segundo cadastro de pedido/acervo. |
| `lib/criativos/geracao/servico-local.ts` | Coordena autenticação por porta, validação, reserva/execução, retomada e biblioteca. Somente `NODE_ENV=development`, habilitação explícita e provedor `fake-local-v1` simulado. Produção, ausência da habilitação e adaptador real negam antes da sessão/SQL. Nenhuma rota, botão ou flag comercial conectados. |
| `lib/criativos/geracao/provedor.ts` | Interface do provedor por snapshot/tentativa/idempotencyKey; fake sem rede; falha classificada antes de envio versus resultado incerto. Esta implementação não aceita saída faturada/real como se fosse simulada. |
| `lib/criativos/geracao/png-local.ts` | Fixture técnica PNG RGBA8 64×64 quadriculada com metadado “SIMULACAO LOCAL - NAO E CRIATIVO REAL”. Confere assinatura, chunks/CRC, dimensões e descompressão limitada. Não é decoder genérico nem imagem publicitária. |
| `scripts/sql/proposta-geracao-local-22-10.sql` | Proposta SQL aditiva individual para **execução**, não pedido paralelo. Guarda snapshot/tentativa, lease, custo simulado, bytes intermediários e vínculo do arquivo. RLS, grants restritos, imutabilidade e transições condicionais; serviço não ganha DELETE. Restrita por CHECK a simulação/fake/limites locais. |
| `scripts/conferir-geracao-local.mjs` | Exercita action, loader, validadores, serviço, repositório e SQL reais com fronteiras substituídas; rede proibida no processo. |

A proposal SQL está em `scripts/sql`, **não no ledger/pasta de migrations**. `supabase` CLI não foi encontrado na máquina nesta conferência. Não inventei timestamp de migration nem instalei CLI. Gerar migration revisada para ambiente autorizado é portão futuro, não aplicar esse laboratório remotamente. Nenhuma tabela/coluna externa foi criada.

### Execução, concorrência e custo

- Somente o INSERT vencedor, arbitrado pelo índice UNIQUE no banco, chama o gerador. Existe uma tentativa inicial por pedido neste recorte. Nova tentativa/refação exige outro recorte; não é retry implícito.
- Estados persistidos: `running`, `storage_pending`, `artifact_available`, `failed`, `reconciliation_required`. Ausência/incompatibilidade de contexto é recusa antes da criação da execução/reserva, sem afirmar que existe job bloqueado persistido.
- Lease de dois minutos vencida **não** autoriza roubar execução e gerar novamente; marca reconciliação. Um resultado tardio da mesma tentativa pode ser recebido antes de entrega, mas nunca substituir resultado/arquivo já fixado ou ressuscitar conclusão.
- Bytes válidos são persistidos no SQL antes do envio ao Storage instrumentado. Se esse staging não for comprovado, exige reconciliação. Não diz que bytes só em memória estão preservados.
- Falha do Storage ou do vínculo da biblioteca retoma os mesmos bytes/caminho/hash. Resposta de Storage/SQL perdida não dispara nova geração. Inserção em `creatives` e confirmação de estado ocorrem em um statement atômico.
- Snapshot, tentativa, limites e resultado fixados são protegidos por trigger. Conteúdo de documento novo não reescreve a versão usada; a autorização atual dos materiais é consultada novamente antes da entrega/leitura.
- Reserva e estimativa são valores inteiros **simulados**, em USD explicitado. A reserva é por sequência/pedido, não carteira financeira global nem cota mensal por cliente. Cobrança e uso reais permanecem NULL, inclusive ao concluir o fake; zero não é usado para simular fatura conciliada. Resultado incerto mantém reserva retida.
- Biblioteca retorna versão/hash/snapshot/tentativa e `simulated:true`, com aprovação null/publicado false. Nome do arquivo contém `SIMULADO-LOCAL`. Nada foi inserido no banco do cliente ou em UI real.

## Provas novas — executadas em 22/10

`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-geracao-local.mjs`: **27 passaram, 0 falhas, 0 ignorados**. Última execução antes deste checkpoint: 3,43 s no processo de testes, não estimativa de latência do produto.

1. Action real `guardarPedidoAction` e loader existente gravam/releem o pedido sob identidade simulada, com RLS do SQL. Serviço → PNG → `creatives` → nova leitura da biblioteca recupera mesmo hash/versão/negócio; pedido original continua `awaiting_configuration`, sem falsear seu contrato como job.
2. Produção, habilitação ausente/false e provedor real não abrem sessão/SQL da geração.
3. Contexto ausente/cross-business, documento de outro negócio/nicho, regra central faltante e logo de outro negócio: recusados antes de reservar/gerar.
4. Referência não admissível, hash de material ausente, oferta diferente do pedido e teto insuficiente: recusados sem execução.
5. Sessão/negócio/dono cruzados não acessam pedido/arquivo; biblioteca do outro dono não expõe a peça.
6. Replay/duplo clique mantém uma execução/tentativa/reserva/objeto/peça.
7. Duas leituras iniciais ausentes, alinhadas por barreira, disputam INSERT real: um gerador vencedor.
8. Segundo clique enquanto o provedor aguarda: estado running, sem segundo gerador.
9. Storage falhou: bytes em SQL retomados por nova instância do serviço.
10. Storage guardou, resposta se perdeu: mesmo caminho/hash e uma peça ao retomar.
11. Staging SQL confirmou, resposta se perdeu: estado relido, sem regerar.
12. Falha antes de staging com resultado só em memória: reconciliação, sem retry.
13. Timeout ambíguo: reserva retida, fatura desconhecida, nenhuma nova chamada.
14. Falha comprovada antes do envio: encerra tentativa, sem retry automático.
15. Execução abandonada com lease vencida: reconciliação, não outro gerador.
16. Documento mudou após snapshot: versão antiga preservada; autorização revogada bloqueia nova entrega/leitura.
17. SQL recusa alteração de snapshot/tentativa, cobrança zero fabricada e retorno de estado concluído para running.
18. SQL/RLS/ACL: só dono lê metadados permitidos; cliente não grava execução nem lê snapshot/bytes/custo interno; anon negado, mesmo com defaults adversos. Biblioteca SQL isola donos.
19. PNG inválido não vira entrega.
20. Bytes adulterados no Storage são recusados na recarga, sem geração de reposição.
21. Fake que declara billedMinor=0 como fato é recusado; cobrança permanece null.
22. Falha no vínculo da biblioteca retoma só persistência.
23. Autorização revogada enquanto o provedor respondia impede entrega na biblioteca/Storage.
24. Término atrasado não troca bytes/hash da saída concluída.
25. Metadados adulterados da peça não ganham entrada no acervo gerado do ensaio.
26. Caminho NULL não passa como arquivo recuperável pelo CHECK SQL (sem aceitar NULL como verdadeiro).
27. Dump do PostgreSQL descartável, fechamento e restauração em **nova instância**: bytes pendentes e snapshot recuperados sem contexto em memória nem nova chamada ao gerador.

`pnpm typecheck`: passou após implementar os módulos e guardas. Apenas testes dirigidos novos foram executados; 17 provas HTTPS/6 casos UI/16 cenários de métricas não foram repetidos.

### O que foi substituído / NÃO medido

- PostgreSQL via PGlite descartável (biblioteca já instalada em `v2g-finance`), não projeto Supabase remoto. `creatives` usa DDL extraída de 0001 e ALTERs reais pertinentes de 0008/0010/0014; dependências perfis/negócios/campanhas/análises/pessoas são stubs mínimos. Não é réplica integral de schema ou Auth gerenciados.
- Auth e negócio ativo são portas instrumentadas; SQL usa identidade simulada para exercitar RLS. Isso não mede JWT humano, claims revogados ou PostgREST gerenciado.
- Storage é porta instrumentada com bytes/caminho/hash em tabela **exclusiva do teste**, não bucket Supabase, URL assinada ou upload remoto. Essa tabela não entra na proposta SQL de execução nem cria um acervo alternativo no produto.
- Geração retorna fixture técnica, não usa marca/foto para compor uma imagem comercial. Contexto/hashes/permissões são sintéticos; qualidade visual, fidelidade de logo/texto, formatos Meta e custo-benefício real não foram medidos.
- Restauração é do banco descartável no mesmo processo JS; não prova reinício de máquina/worker distribuído, crash no filesystem, réplica, disputa entre dois servidores ou reconciliação com provedor real. A barreira concorrente testa o índice/SQL real sobre uma instância, não dois serviços remotos.
- Não existe loader de catálogo/permissões real conectado à geração. `carregarContexto` e `autorizarSnapshot` são portas obrigatórias do futuro adaptador confiável, nunca dados a aceitar do formulário.
- Não foi criada resposta HTTP pública, chamada backend, n8n, UI navegável de criação, botão comercial ou mecanismo de aprovação. O acervo consultado é real **no SQL do laboratório**, não na tela publicada do cliente.

## Contrato mínimo para a Central passar ao backend — sem endpoint inventado

O backend já possui `ClientImagem.gerar(PedidoCriativo)`; não alterar runtime/configuração do dono 07/08 neste bloco. Há compatibilidade de finalidade, mas faltam identidade de job/tentativa, snapshot, direitos, idempotência e evidência de uso/cobrança no contrato do client atual.

Proposta de operação interna **a implementar e revisar**, não nome de rota existente:

- Entrada confiável: `{contractVersion, jobId, attemptId, requestId, businessId, requestedBy, snapshotHash, snapshotVersion, formatos:["feed"], materialIds, authorizationVersion, budget:{currency,reservedCap,pricingRuleVersion}}`. IDs vinculados no servidor; texto/regra/materiais resolvidos e hashes conferidos pelo backend. Não enviar URLs assinadas/chaves no corpo nem usar browser como autoridade de dono/nicho/custo.
- Saída de tentativa: `{jobId, attemptId, snapshotHash, simulated:false, providerRequestId, outcome, artifact:{bytesOuIdentificadorDuravel,mime,width,height,sha256}, usageReportedOuNull, billedOuNull}`. `outcome` distingue resultado, falha comprovadamente anterior ao envio e resultado incerto. Estimativa não substitui usage/fatura; não usar `custo_usd` legado por tabela como cobrança confirmada.
- Exigir reserva única e claim transacional antes de chamar o provedor; definir **um** dono durável do job/estado/custo (recomendação: backend), não dois workers WebApp/Python competindo pelo mesmo pedido. A proposta SQL local precisa ser reconciliada com esse dono, não aplicada em paralelo como segunda fonte.
- Provedor deve permitir chave de correlação e mecanismo de reconciliação por tentativa quando disponível. Sem certeza após timeout, não repetir. Retries internos atuais do client precisam ser classificados/revistos antes de qualquer piloto pago; este serviço local não prova que repetir aquela chamada real é seguro.
- Sucesso só depois de bytes válidos, hash/caminho privado e vínculo de biblioteca persistidos. Falha ao guardar retoma resultado durável, não outra imagem. Formatos explicitamente escolhidos: o padrão legado feed+stories não pode dobrar chamadas/custo silenciosamente.
- O serviço backend QA de leitura mantém whitelist só GET. Geração exige outro recorte/ambiente autorizado, **não desligar sua cerca para o teste passar**. n8n futuro apenas entrega IDs de trabalho; não concede autorização financeira nem remonta snapshot.

Passagem para aprovação futura: usar `{creativeId, version, artifactHash, snapshotHash, attemptId, businessId}` como alvo imutável; aprovação explícita no app precisa conferir essa versão/autor/horário. O fake entrega `aprovacao:null`, não finge aprovação. Refações completas, publicação e aviso continuam fora deste bloco.

## Proposta concreta do próximo piloto real — NÃO executada/autorizada

1. **Uma única imagem feed**, sem stories, refação automática, campanha ou publicação. Barbearia é o primeiro nicho pretendido; usar marca/briefing inteiramente fictícios e uma referência própria/licenciada confirmada. Não escolher imagem de concorrente só porque estava ativa. Sem fachada; se a composição exigir fachada, precisa de foto real do negócio e autorização correspondente.
2. **Provedor candidato: OpenAI `gpt-image-2`**, pois já há client no backend; escolha por reaproveitamento técnico, **não** vencedor comprovado de preço/qualidade. Confirmar acesso da conta/modelo e configuração exata antes do piloto. Não trocar para modelo mais novo por inferência. Dimensão feed e qualidade precisam ser explicitadas/revisadas, sem herdar dois formatos ou configuração oculta.
3. **Teto total proposto para revisão: US$ 2**, uma tentativa. Não é cotação por imagem, autorização recebida ou garantia técnica do SDK. Antes de executar, conferir entradas/saída/qualidade/resolução e margem contra esse teto; se não houver limite justificável, não executar. Zero retry pago automático. Orçamento local de 100/20/10 unidades menores no teste é fictício e não configura esse piloto.
4. Medir duração, bytes/dimensões, fidelidade de texto/logo, identificador do provedor e uso retornado. Distinguir custo calculado a partir de uso de cobrança efetivamente conciliada; guardar lacuna se a fatura ainda não existir.
5. Aceite do piloto: imagem real recuperada após novo login no ambiente autorizado, mesmo hash/negócio/versão e trilha de custo; contexto ausente/cruzado e repetição recusados. Comparação de outros provedores e lote amplo vêm depois de medir essa primeira passagem, não neste bloco.

Pesquisa somente documental em 22/10: [modelo GPT-Image-2](https://developers.openai.com/api/docs/models/gpt-image-2) e [precificação oficial](https://developers.openai.com/api/docs/pricing). A tabela oficial trata entradas de texto/imagem e saída; nenhum preço fixo por imagem foi assumido aqui. Pesquisa de documentação não comprova acesso/configuração da conta nem autoriza chamada.

## Coordenação, segurança e encerramento

Skills de arquitetura de agentes e Supabase aplicadas: stack existente preservada, sem framework novo; RLS/ACL por dono, sem SECURITY DEFINER ou grants globais. Changelog e [RLS oficial](https://supabase.com/docs/guides/database/postgres/row-level-security) consultados; URLs markdown recusadas pelo leitor foram abertas como HTML. Sem mudança de SDK ou infraestrutura.

Figma **NÃO RELIDO neste bloco** (limite/timeout já medidos no levantamento desta manhã, sem mudança que justificasse repetir). Planilha **NÃO RELIDA neste bloco**; leitura original das duas abas e IDs feita nesta manhã permanece identificada no levantamento. A direção humana posterior retransmitida pela Central prevalece sobre o antigo “IA só desenho”. Central cuida da atualização dos artefatos.

Arquivos de outras frentes começaram a mudar durante o trabalho (financeiro/3DS/eventos, `supabase/objetos.ts`, migration financeira e passagem operacional de clientes). Foram preservados e não fazem parte desta entrega. Não houve edição de AGENTS/decisões/índice/package/plano, UI/env, backend de 07/08, Meta/n8n, escrita remota, fixtures externas, upload/limpeza externa, pagamento, mensagem, build/restart, commit/push/merge/deploy ou automação.

**Bloco encerrado para revisão.** O cliente ainda não dispõe de criação real por IA no app publicado. Próxima implementação ou piloto depende do recorte/autorizações acima; página QA de métricas não foi iniciada por arrasto.
