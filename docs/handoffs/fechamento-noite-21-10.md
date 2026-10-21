# Fechamento da coordenação noturna — 21/10/2026

## Estado para revisão

Encerramento antecipado às **03:49 (America/Sao_Paulo)**, conforme a regra autorizada: duas rodadas consecutivas sem progresso novo e sem próximo recorte local útil dentro do escopo. Os quatro chats estão parados, com seus blocos locais entregues. A automação `central-v2g-coordena-o-noturna-21-10` foi alterada e conferida como **PAUSED**.

**Este fechamento é do bloco noturno, não do aplicativo nem das etapas publicadas.** Não houve commit, push, merge, deploy, migration externa, ativação de flags, cobrança, envio real de mensagem/contrato, emissão fiscal ou escrita na Meta/n8n.

## Entregas por chat

| Chat | Entrega confirmada nos arquivos/relatórios | Prova relatada e limite |
|---|---|---|
| 01 e 02 | Alertas/outbox, diagnóstico e conciliação controlada; pacote individual de QA; ponte da venda assistida para Asaas preservando origem/lead/legado; confirmação de pagamento separada da criação da recorrência | Bloco final: 62 testes dirigidos, PostgreSQL efêmero e tipos. Portas de serviços simuladas; sem Asaas/caixa de email/Auth reais nesta noite |
| 03 e 04 | Documento e novo FigJam de recebimento de acessos Meta; matriz de permissões, exceções, contrato documental de IDs/credencial e checklist App Review; multiconta/onboarding preservados | Entrega documental. Não concede ativos, não homologa API de terceiro e não submete App Review |
| 05 e 06 | Envio de imagem refinado; validação SQL e correções de data; adaptador servidor-servidor por carteira; consumidor mínimo “Ver números” na ficha interna | Visual: 27 testes + bancada. Técnico: 60 testes. Consumidor: 13 testes + tipos e prévia DEV desktop/celular. Grupos não devem ser somados como testes únicos. Sem login/Storage/backend/HTTPS reais |
| 07 e 08 | Contrato e28-07-v1, nove fixtures e runbook; ausência/zero/inconsistência separados; origem heterogênea retira totais | 70 focados; suíte final 2790 passaram/9 ignorados, Ruff/mypy. Sem nova chamada externa nesta rodada. A prova própria anterior não prova conta de cliente externo |

O Central leu retornos/checkpoints, conferiu arquivos e trechos de integração e coordenou a retomada do consumidor que havia ficado parcial. Não repetiu suítes completas sem novo risco nem alterou código de produto.

## Documentos canônicos

### Comercial — 01/02

- `docs/estado/e28-01-ponte-assistida-asaas-21-10.md` — implementação final, RPCs, guards, arquivos, provas e limites.
- `docs/estado/e28-01-02-prontidao-local-21-10.md` — diagnóstico/outbox e desenho da evidência manual.
- `docs/estado/e28-01-02-pacote-qa-21-10.md` — roteiro individual de QA; ler também as dependências novas da ponte.
- `docs/estado/e28-01-02-alertas-e-confirmacao-21-10.md` — preparo dos alertas e email.

### Acessos Meta — 03/04

- `docs/recebimento-cliente-meta.md`.
- `docs/estado/e28-03-04-recebimento-meta-21-10.md`.
- [FigJam operacional de recebimento](https://www.figma.com/board/DGGCCnjlOlmy5vzsa11yoW).

### Envio, fila e leitura — 05/06

- `docs/estado/criativos-refino-visual-envio-21-10.md`.
- `docs/estado/e28-05-06-envio-e-handoff-21-10.md`.
- `docs/estado/e28-05-consumidor-leitura-local-21-10.md`.
- `docs/qa-envio-criativo-e-leitura-carteira-21-10.md`.
- Prévia local fictícia da leitura: `http://localhost:3000/exemplo/mesa-gestor?leitura=contrato`.
- Prévia local do envio: `http://localhost:3000/exemplo/criativos#subir-criativo`.

### Backend — 07/08

No repositório `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g`:

- `docs/estado/e28-07-08-contrato-handoff-21-10.md`.
- `tests/fixtures/e28_07_contrato_handoff.json` — fixture canônica, sem cópia concorrente.
- `docs/estado/e28-08-runbook-evento-20-10.md`.
- E28-08-B = captura; E28-08-C = ensaio integrado de 26/10, ainda não executado.

## O que permanece sem prova real

1. Aplicação individual e compatibilidade do schema QA com os patches novos. Arquivo de migration não significa migration aplicada.
2. Pagamento assistido pelo Asaas no ambiente real de teste, concorrência entre conexões, callbacks, propriedade e acesso ao negócio certo. Pix semestral, cartão anual e primeira mensalidade **já tinham provas anteriores no Sandbox**; não reclassificá-los como nunca testados.
3. Envio e chegada dos novos emails; timeout/aceite do provedor não provam entrega em caixa. O SMTP/Auth publicado não foi recertificado nesta noite.
4. Upload autenticado, arquivo privado recuperável, fila do gestor e decisão no mesmo negócio/carteira em QA real.
5. Consumo autenticado do contrato por backend publicado e HTTPS, incluindo conta externa autorizada. A prévia é fictícia e não prova esses itens.
6. Contrato final identificado, evidência de assinatura e orientação/emissão fiscal. Comprovante não substitui NFS-e quando exigível. A minuta de teste não deve ser enviada.
7. Geração de imagem por IA (caminhos 2/3), publicação Meta e ensaio completo: não foram abertos neste recorte. Pedido/arte enviada/aprovada/publicada/no ar são estados diferentes.

## Próxima sequência concreta

### 1. Revisar o pacote local

Victor/Central revisam os checkpoints acima e o diff preservado no Git. Não houve commit. Os relatórios de cada frente listam seus arquivos; não descartar alterações simultâneas.

### 2. Autorizar QA individual

Com projeto/fixtures/janela confirmados e snapshot consistente, autorizar separadamente:

- conferência do ledger/schema e dependências;
- aplicação individual das migrations pertinentes;
- publicação de backend/WebApp e configuração de QA;
- testes financeiros/emails de Sandbox com destinatários autorizados, quando necessários.

Migrations locais pertinentes:

- `20261021032617_creative_review_upload_intent.sql`;
- `20261021033313_commercial_payment_email_outbox.sql`;
- `20261021042254_assisted_asaas_orders.sql`.

Não executar `db push` em lote. Recalcular hashes antes de aplicar. Há outras migrations pendentes e diferença histórica de timestamp 3DS local/remoto; comparar definições/ledger antes de repetir. A migration de geração de imagem é de outro recorte, não autorização desta noite.

### 3. Homologar uma jornada integrada

Operador e cliente fictícios autorizados, negócio/conta atribuídos, pagamento conferido, acesso correto, upload privado/fila e leitura do mesmo negócio. Provar negação para outro cliente/gestor. Só então marcar o recorte correspondente como QA aprovado.

As novas guardas de recurso têm default desligado no código; **não foi lida nem alterada a configuração real das flags**. Remetente e caixa dos novos emails devem ser disponibilizados/configurados em canal privado e conferidos. Não enviar segredos pelo chat.

### 4. Dependências humanas/externas separadas

- Nomear cliente/conta/ativos para um piloto externo Meta e comprovar atribuição autorizada.
- Avaliar o refino visual do upload.
- Identificar instrumento final e orientação da contabilidade para contrato/nota.
- Escolher e autorizar o próximo recorte da geração de imagem; não deduzir autorização de gasto a partir desta coordenação.

## Estado dos quadros

- [Planilha original](https://docs.google.com/spreadsheets/d/1xPtwgyMkgwNKVDB8L61jEmf0UDaofKhwPfT1JU4Dpk8): retornos de 21/10 incorporados e relidos nas abas Resumo 01-08 e Plano diário 20-31. E28-05-B está Preparado localmente, não homologado.
- [Figma principal](https://www.figma.com/board/sQrIlGhDDaqHUtV2WacWSg): **atualização noturna pendente**. O conector atingiu limite Starter e a tentativa Chrome falhou por timeout CDP. Não alegar sincronização/releitura nesta noite.
- `docs/execucao-evento-28-10.md`: espelho com atualizações noturnas sobre o histórico v4.
- `docs/handoffs/noite-21-10-central.md`: instruções, despachos, rodadas e cursores finais.

Nenhuma automação adicional foi criada e nenhum chat foi arquivado. O acompanhamento noturno está pausado; a retomada deve partir desta revisão e de um próximo bloco concreto.

