# E28-01/02 — prontidao local e checkpoint de continuidade

Data: 21/10/2026, America/Sao_Paulo. Bloco de preparo local concluido; **etapas comerciais nao declaradas concluidas/publicadas**.

## Escopo e fontes

Direcao recente de Victor: formulario + alerta no email confirmado + WhatsApp pessoal, ambas as vendas pelo Asaas; comprovante/confirmacao por enquanto, automacao fiscal aguardando Contabilizei. Pedido Central: diagnostico/conciliacao, pacote QA individual, ensaio de portas e desenho de evidencia manual. Nenhum envio de volta a outro chat, automacao ou escrita externa realizado.

Regras locais e espelho `docs/execucao-evento-28-10.md` consultados, em especial E28-01-A/B/C e E28-02-A. **Figma e planilha nao foram relidos neste bloco**; nao alego leitura do quadro v4 nem sincronizacao. Limite informado pelo Central nao impede estes artefatos independentes. Git dirty compartilhado conferido; preservados arquivos das outras frentes, documentos centrais, package.json, localhost e .next.

## Concluido localmente — E28-01-A/B

1. Revisao da outbox: reserva queued→sending atomica; replay accepted nao envia novamente; sending/review nao retornam automaticamente a queued. Timeout ou falha no registro do aceite exigem conciliacao. Payload e preservado pelo aplicativo; nao existe trigger de imutabilidade absoluta contra service_role. Fontes: `lib/contratacao/email-pagamento.ts:43`, `lib/contratacao/processar-email-pagamento.ts:43`.
2. Reforco concreto na migration local: revogar grants herdados tambem de service_role antes de conceder SELECT/INSERT/UPDATE. Evita DELETE/TRUNCATE herdados de configuracoes antigas. Fonte: `supabase/migrations/20261021033313_commercial_payment_email_outbox.sql:15`. SHA-256 atual: **D2D202C725A72F900E53FADF3F8F75C010AEB32C3CF148745C45C9FFD0B810D5**. Nao aplicada.
3. Diagnostico em `scripts/sql/diagnosticar-email-pagamento.sql`: lista pendencias, idade, IDs, estado financeiro e ocorrencia adversa sem payload, email, IP ou chave. Preparado para janela autorizada, nao executado remotamente.
4. Recuperacao controlada em `scripts/sql/conciliar-email-aceito-modelo.sql`: somente reconhecer aceite ja comprovado no provedor; pedido/cobranca/estado/timestamp exatos; CAS, evento operator com autor e referencia unica da evidencia privada; rollback por padrao. **Nao envia email, nao e botao/rota de produto e nao reabre fila.** Papel/permissao do operador devem ser validados fora do modelo SQL, que verifica existencia do perfil. Resultado desconhecido permanece retido, sem busca negativa tratada como prova.
5. Pacote individual QA completo em `e28-01-02-pacote-qa-21-10.md`, com pre-checagem, dependencias, backup, aplicacao isolada, verificacoes e rollback operacional sem apagar evidencias. Inclui a diferenca historica de versao 3DS local/remota; nao reaplicar cegamente. Nao mistura migrations de criativos.

## Ensaio novo — fato e limite

`scripts/conferir-jornada-comercial-portas.mjs`, 2 testes novos, usa handler LP e webhook reais com portas de rede/persistencia/email simuladas, alem das funcoes reais de validacao, vinculo, acesso e proximo onboarding:

- LP aceita captura ficticia com CNPJ; RPC simulada recebe dados; falha de alerta preserva sucesso e WhatsApp pessoal. ID 73 e fixture atribuida pela porta de armazenamento, **nao devolvido ao visitante pelo handler**. Atendimento ainda precisa localizar o ID internamente.
- Formulario assistido preserva explicitamente esse ID; nao presume correspondencia por contato parecido.
- Comprovante/retorno de navegador e valor divergente nao aprovam o webhook. Fixture self-service valida percorre confirmacao→preparo de email→email proprio confirmado→reivindicacao e releitura do negocio correto→acesso→`/onboarding`; outro negocio com mesmo claim_email mas dono distinto permanece intacto.
- Nao e ensaio de navegador/HTTP real, Postgres completo, Supabase Auth real, entrega de mensagem ou pedido criado automaticamente a partir da LP. RPC de aprovacao e uma porta simulada; testes anteriores de SQL/QA nao foram repetidos para fingir prova nova.

### Lacuna comprovada: venda assistida pelo Asaas ainda nao fecha

**FATO:** `20261018130000_ligar_lead_lp_pedido.sql:126` cria `origin='assisted', payment_method='direct_pix'`; webhook em `app/api/webhooks/asaas-payment/route.ts:68` rejeita origem diferente de self_service. O teste novo executa essa rejeicao (422), sem gravar evento, preparar email ou liberar acesso.

**INTERPRETACAO:** a decisao de ambos cobrarem pelo Asaas ainda precisa de implementacao da ponte assistida. Nao basta trocar o link ou fingir self_service, o que apagaria a origem. Este bloco nao alterou RPCs/politica financeira. Proximo bloco local recomendado: contrato do pedido assistido Asaas + reserva idempotente + correlacao de webhook preservando origem/lead, sem cobranca externa. Dono: frente 01/02, coordenacao Central. Nao requer nova decisao fiscal, mas precisa de recorte de implementacao proprio.

Outro limite: no ramo inicial 3DS, falha/conciliacao da criacao de assinatura retorna antes do processamento de email (`route.ts:62`). Pode atrasar a confirmacao por email mesmo com primeiro pagamento registrado. Separar notificacao da prontidao da recorrencia e candidato ao mesmo proximo bloco; nao declarar envio garantido. LP tem apenas duas tentativas imediatas de alerta, sem fila duravel.

## E28-02-A — evidencia manual: existente e desenho minimo (nao implementado)

**Existente:** `0026_contratacao_multiconta.sql:68` tem commercial_events com pedido, origem, external_event_id unico, tipo, autor e ocorrido_em; `:80` contract_documents tem versao, ID externo, signatario, status e signed_at; `:97` fiscal_documents tem provedor, ID, status e authorized_at. Migration `20261013060000_competencia_documento_fiscal.sql:5` prepara obrigacao por competencia/valor, vinculo composto pedido-obrigacao e uma autorizada por competencia. Presenca em arquivo nao confirma aplicacao remota.

**UI atual:** `/pedidos` consulta contrato e nota (`app/(protected)/pedidos/page.tsx:59` e `:62`), sem action de registrar evidencias juridico-fiscais em `actions.ts`. Nao ha comprovacao de assinatura/emissao automatica. O estado da ultima nota nao certifica todas as competencias. Procedimento manual anterior permanece em `e28-01-02-procedimento-assistido-20-10.md`.

**Desenho proposto, sem nova tabela/assinatura/fiscal neste bloco:**

1. Caso privado unico por pedido, com `order_id`, `business_id`, `document_id` (contract/fiscal existente), `obligation_id` quando aplicavel, `evidence_id` UUID, autor, data da conferencia, referencia privada do arquivo e SHA-256. Nao por dados pessoais na URL, email ou evento publico.
2. Registro controlado futuro autentica operador real, confere pedido/negocio, versao/instrumento e poderes aprovados; documento final de todos os signatarios para signed; autenticidade, competencia e valor aprovados para authorized. Nao converter minuta, comprovante, RPS ou agendamento em fato concluido.
3. Transacao futura altera o documento e insere commercial_events com `source='operator'`, `external_event_id='manual-evidence:<evidence_id>'`, tipo especifico e actor_profile_id. Manifesto privado e evidencias preservados, vinculados por essa referencia. Schema atual de eventos nao tem JSON/evidence_uri/hash: nao sobrecarregar IDs do provedor para guardar arquivo; se precisar guardar manifesto no produto, aprovar extensao separada do evento/documento com ACL, validacao e retencao.
4. Reenvio do mesmo evidence_id nao duplica; versao divergente, documento de outro pedido, autor nao autorizado, prova incompleta ou nota sem competencia falham fechados. Correcoes/cancelamentos sao novos eventos, nao apagar historico. Contrato assinado/nota autorizada nunca aprovam cobranca por si.

Nao implementado registro juridico/fiscal novo por falta do instrumento/orientacao, conforme limite do bloco. Pagamento, acesso, assinatura, primeira campanha e NFS-e continuam portoes separados.

## Testes executados neste bloco

- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-email-pagamento.mjs scripts/conferir-jornada-comercial-portas.mjs`: **9 passaram** (7 de regressao dirigida de email + 2 de integracao de portas). Suite antiga de 41 nao repetida integralmente.
- `scripts/conferir-email-pagamento-sql.mjs` com PGlite 0.5.8 disponivel em `C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js`: passou unicidade, reserva, grants herdados, RLS, diagnostico, rollback do modelo, conciliacao auditada e replay bloqueado. Base efemera; nenhuma conexao QA.
- `pnpm typecheck`: passou. Diff check dirigido sem erros. Sem build/reinicio de dev e sem instalacao/dependencia adicionada.

## Arquivos tocados neste bloco

- Ajustados: migration de outbox e `scripts/conferir-email-pagamento-sql.mjs`.
- Novos: `scripts/conferir-jornada-comercial-portas.mjs`; `scripts/sql/diagnosticar-email-pagamento.sql`; `scripts/sql/conciliar-email-aceito-modelo.sql`; `scripts/sql/prechecar-qa-comercial.sql`; `docs/estado/e28-01-02-pacote-qa-21-10.md`; este checkpoint.
- Preservados: LP/WhatsApp/alerta ja preparados, codigo runtime do email/webhook, demais frentes, Obsidian e documentos centrais. Sem commit/push/deploy, configuracao remota, migration aplicada, mensagem, cobranca/estorno ou emissao.

## Lista unica para a volta do Victor — nao e pedido repetido neste bloco

1. **Ativacao QA:** autorizar janela/backup e aplicacao individual da nova outbox; publicacao/configuracao e teste de email ao proprio Victor sao autorizacoes distintas. Nenhuma foi concedida pelo recorte Central.
2. **Email:** confirmar remetente/dominio verificados e fornecer acesso/credencial pelo canal privado; depois confirmar chegada de teste. Dono Victor/provedor; implementacao local 01/02.
3. **Checkout real:** resposta/habilitacao Asaas pertinente, 2FA/desafio pessoal quando necessario; futura liberacao e testes reais apenas com autorizacao especifica. QA historico nao substitui isso.
4. **Juridico/fiscal:** instrumento final e aprovacao juridica, poderes/evidencia de assinatura; orientacao Contabilizei e canal de emissao com competencia/valores. Comprovante nao dispensa obrigacao fiscal.
5. **Publicacao:** Victor faz commit/push e autoriza ambiente. Antes, Central deve coordenar o recorte local da ponte assistida Asaas e separacao email/recorrencia identificados acima; este e o proximo trabalho executavel da frente, nao motivo para repetir auditoria ou cobrar autorizacao QA agora.
