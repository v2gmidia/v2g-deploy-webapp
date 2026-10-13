# Etapa 02 — respostas necessárias para ativação, 13/10/2026

Este roteiro reúne somente decisões e provas ainda ausentes. A implementação local e seus limites estão em `etapa-02-competencias-fiscais-13-10.md`. Não autoriza envio de contrato, emissão de NFS-e ou aplicação da migration.

## Já informado; não perguntar de novo como se faltasse

- V2G em Curitiba/PR, inscrição municipal `13448418`, Simples Nacional. A Contabilizei informou serviço `17.06` e código municipal `170601000` para os CNAEs `7311-4/00` e `7319-0/04`.
- Uma NFS-e por mês de **serviço prestado**, mesmo quando seis ou doze meses são pagos à vista. A verba de mídia paga ao veículo não compõe a nota da gestão. A Contabilizei disse que notas do Asaas devem ser conferidas na plataforma até o dia 05 do mês seguinte.
- Decisão vigente: acesso ao WebApp após pagamento confirmado; contrato eletrônico em seguida; primeira publicação somente após assinatura comprovada. Victor assina pela V2G e ao menos um sócio/dono com poderes assina pelo cliente, conforme `docs/decisoes.md`. Se essa decisão mudar, registrar nova decisão antes de implementar.
- Oferta atual: R$ 500/mês por conta, semestral à vista R$ 2.850 por conta, anual à vista R$ 5.280 por conta.

## Victor e jurídico — contrato e representação

1. Identificar o **arquivo final exato**, versão/data e evidência da aprovação pelo advogado. Victor relatou a aprovação em 09/10, mas `qa-resend-assinatura-09-10.md` não identifica qual arquivo foi aprovado; `minuta-interna-2026-10-09-v1` continua marcada como interna.
2. Confirmar na versão final as cláusulas ainda marcadas: início e prazo da prestação, seis meses mínimos, saída antes do prazo, pagamento antecipado e eventual restituição, inadimplência, renovação/reajuste, escopo, dados, suporte, relatórios e foro. O código não deve inferir a solução jurídica.
3. Confirmar se Victor permanece signatário da V2G; se mudar, registrar nome completo, papel e poderes do substituto. Definir quais dados e comprovantes demonstram os poderes do sócio/dono cliente, quem os verifica e como tratar procuração/representante sem poderes.
4. Confirmar o **marco de início da prestação** por pedido e como tratar entrada no meio do mês, pausa, cancelamento e reembolso. O planejador local só aceita o primeiro mês integral informado por um operador; pagamento não fixa competência por si só.

## Provedor de assinatura — escolha e prova

1. Escolher e contratar provedor com API e ambiente de teste. Clicksign é uma proposta documentada, não um fornecedor escolhido ou integrado. Confirmar preço e volume esperado antes de contratar.
2. No sandbox do provedor escolhido, obter documentação e acesso com o menor escopo possível para: criar documento/envelope, incluir signatários, enviar, consultar, receber eventos autenticados, cancelar e baixar versão final mais trilha de auditoria.
3. Provar com dados fictícios: envio único por `(pedido, versão)`, repetição sem envelope duplicado, assinatura de todos os exigidos, recusa/expiração, entrega da cópia concluída ao cliente e arquivamento. Um evento de envio não é assinatura.

## Contabilizei e configuração fiscal — pergunta complementar

1. Para o item `17.06`, explicar com fundamento e exemplo concreto a divergência da resposta de 12/10: tomador fora de Curitiba, “ISS 0% devido no município do tomador” e alíquota total 3,05%. Separar **alíquota do DAS**, **ISS destacado na NFS-e** e **retenção**; informar o que muda conforme município e mês. Não codificar os percentuais de outubro como regra fixa.
2. Confirmar município e data do fato gerador para a gestão digital, mês parcial, desconto antecipado, cancelamento e estorno após uma ou mais competências prestadas. Informar quais campos do tomador são obrigatórios para o Portal Nacional e quem confere seus dados.
3. Conferir no cadastro fiscal da **conta V2G** no Asaas: habilitação real de NFS-e, emissor, serviço retornado por `GET /v3/fiscalInfo/services` (ID interno versus código municipal), série, alíquotas/retenções e webhook fiscal. Fazer uma emissão **somente em ambiente apropriado e após autorizações específicas**; registrar `INVOICE_AUTHORIZED`, PDF/XML, eventual rejeição/cancelamento e conferência na Contabilizei.

## Alterações que requerem autorização específica depois da revisão

- `supabase/migrations/20261013060000_competencia_documento_fiscal.sql`: acrescenta obrigação por `(pedido, competência, tipo)` e vínculo opcional de notas, sem preencher históricos. Revisar diff e alvo (QA ou produção) antes de autorizar e aplicar; o banco é compartilhado com o backend.
- Publicar código local e ativar n8n só após contrato final, provedor e fiscal definidos, testes em ambiente apropriado e decisão de abertura. O rascunho n8n atual tem apenas uma nota; nenhum nó executável ou gatilho.
