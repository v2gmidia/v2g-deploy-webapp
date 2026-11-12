# Comercial: configuração preparada, produção ainda fechada — 11/11/2026

> PREPARO SQL CONCLUÍDO em 11/11/2026: pacote mínimo montado e testado localmente, sem aplicação. Ver [resultado do banco mínimo](./n26-comercial-banco-minimo-local-11-11.md). O relato abaixo preserva o estado anterior.

## 0. Resultado e próxima frente

**Concluído o preparo solicitado por Victor para compra → pagamento confirmado → acesso.** Pacote: [preparo de produção](../comercial/preparo-producao-11-11/README.md), com manifesto de configuração fechado, consulta de catálogos reproduzível, resultado observado e conferidor offline. Não foram configurados painéis, criados segredos, ligados pagamentos ou aplicadas migrations.

**Próxima frente concreta:** Central montar e ensaiar localmente o delta mínimo do banco comercial a partir da base produtiva observada, preservando dados e objetos compartilhados. Não há pacote SQL de aplicação aprovado/pronto neste bloco. Aplicação e ativação financeira continuam atos posteriores específicos.

As dependências externas são habilitação Asaas/3DS/recorrência, escopo dos eventos da conta, remetente Resend, Turnstile e retornos Auth. Não foi pedido a Victor que enviasse chave, senha ou dado bancário no chat. Não há ensaio financeiro nominal autorizado; seus campos permanecem vazios.

## 1. Evidência nova e limites

- Projeto Supabase produtivo `ushccxpoxjikzqnwhgfd`, `V2G-SITE`, ACTIVE_HEALTHY, confirmado pela listagem do conector.
- Em 11/11/2026 às **10h49 BRT**, consulta em transação `READ ONLY` aos catálogos, sem linhas de negócio, Auth ou eventos. **42 migrations** na listagem atual.
- No recorte de oito tabelas do gate: quatro presentes e quatro ausentes. Ausentes `commercial_payment_events`, `commercial_payment_email_outbox`, `checkout_3ds_context` e `checkout_security_attempts`.
- As nove assinaturas necessárias ao registro, aprovação, eventos, 3DS/recorrência, segurança, documento e readiness estão ausentes. Inventário exato em `docs/comercial/preparo-producao-11-11/metadados-observados.json`.
- O conferidor calculou **13 colunas faltantes em `commercial_orders` existente + 17 nas tabelas ausentes**. Constraints produtivas ainda restringem CNPJ de 14 dígitos, mensal/anual e seus totais. Isso não corresponde sozinho ao checkout atual CPF/CNPJ e semestral.
- Na Vercel foram lidos somente nomes/tipos/destinos, `decrypt=false`, zero variáveis produtivas ocultas. Nomes Asaas/checkout/segurança/e-mail exigidos estão ausentes. Valores de site/banco/segredos existentes não foram lidos nem certificados.

A primeira consulta de múltiplos SELECTs retornou apenas o último resultado pelo conector; não foi tratada como inventário completo. A consulta registrada foi consolidada em um único objeto JSON e retornou todas as seções, inclusive `read_only=on`. Nenhuma consulta foi usada para executar função de negócio ou contornar autorização.

## 2. Preparo e conferência

`configuracao-preparada.json` cobre o guard real `lib/contratacao/ambiente-producao.ts:8`: origem/projeto/banco, cinco segredos com valor nulo, remetente e chave pública pendentes, Auth/3DS e webhook propostos. **13 controles permanecem false**; `applyNow=false`, webhook desabilitado e ensaio não autorizado. Nenhum arquivo `.env` foi criado/lido/editado.

`node docs/comercial/preparo-producao-11-11/conferir-preparo.mjs`: **exit 0, seis verificações aprovadas**. Confere cobertura do manifesto contra a fonte real, rejeita flag ligada por engano, usa segredos fictícios completos para provar preparo OFF, preserva separação de processamento/novas compras e rejeita preview/outro projeto/banco QA, confere SQL somente catálogo e portas Auth/webhook existentes.

O relatório distingue `validation=pass` de `productionReadiness=blocked`. Não é prova de pagamento, entrega de e-mail, login produtivo, RLS real entre compradores ou DDL ensaiado contra backup produtivo completo. Não se repetiram suíte geral/build nem compra QA já encerrada. Código do produto não mudou.

## 3. Ordem e dependência que impede ativar por consequência

Sequência registrada: delta mínimo local → evidências/configuração privada de provedores → backup/aplicação/release fechados autorizados → processamento e ensaio nominal autorizados → abertura pública/LP após aceite. Cada passo tem responsável, prova e limite no README do pacote.

`lib/contratacao/webhook-pagamento.ts:61` retorna 503 quando a cobrança não encontra pedido. A conta pode conter cobranças anteriores/fora do novo checkout; isso não foi consultado. Antes de ativar uma fila sequencial, conferir esse escopo e seu tratamento legítimo, preservando também a retentativa de evento que chega antes de salvar o vínculo. Não foi criada resposta fictícia, ignorado evento ou alterado código para antecipar esse resultado.

Asaas exige habilitação produtiva do 3DS; a documentação não prova a habilitação desta conta. Retornos Auth atuais/templates e remetente Resend também não foram certificados. `NEXT_PUBLIC_SITE_URL` tem outros consumidores: revisar seus efeitos antes de qualquer mudança autorizada. São dependências concretas, não motivos para repetir o piloto Piligrin/Dúú ou cobrar novamente no Sandbox.

## 4. Preservação e parada

Somente novos artefatos locais de preparo e registro/índice foram escritos. Alterações anteriores preservadas. Produção recebeu apenas leitura de catálogos/metadados neste bloco, sem dados de clientes, SQL de escrita, RPC financeira, pagamento, e-mail, conta/sessão, permissionamento, segredo, configuração, DNS, Auth, LP, páginas legais, Meta, n8n, commit, push, merge ou deploy.

Bloco encerrado com configuração revisável e bloqueios exatos. O domínio/HTTPS já comprovados não foram testados novamente sem falha nova. Abertura de vendas permanece pendente da base/configuração e do ensaio produtivo autorizado.
