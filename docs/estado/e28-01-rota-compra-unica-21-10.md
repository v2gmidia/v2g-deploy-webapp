# Compra única e próximos passos da V1

Data: 21/10/2026. Decisão de Victor: compra direta e atendimento por WhatsApp terminam no mesmo checkout. O registro manual de venda assistida não é pré-requisito para fechar a V1.

## 0. Limites e decisões pendentes

Atualização após autorização de Victor para atacar os quatro pontos: contato/alerta da LP reconciliados localmente; 92 testes dirigidos e typecheck passaram. Compra HTTPS e entrega de e-mail continuam dependentes do ensaio financeiro específico, ainda não executado. Detalhes em `e28-01-compra-unica-progresso-21-10.md`. A liberação de clientes atuais foi discutida e explicitamente adiada por Victor; não solicitar nem criar acessos agora.

Este bloco registra a direção aprovada e o levantamento local. Não altera interface, LP, permissões, banco, configuração externa ou produção. O próximo bloco proposto é a reconciliação local do contato e alerta da LP e a validação dirigida do checkout existente. Publicação e qualquer ensaio financeiro/envio precisam de autorização própria.

O papel temporário de operador do ensaio anterior foi retirado no bloco seguinte, sob a autorização prévia de retirada ao encerrar esse ensaio. Preservados os demais metadados. O checkout foi aberto pela mesma sessão sem a opção de gestor; isso não substitui a prova de compra e isolamento entre negócios.

## Jornada aprovada

- Compra direta: LP → página de contratação → pagamento Asaas → confirmação verificada → orientação por e-mail e acesso ao negócio correto.
- Compra após conversa: formulário LP → alerta para Victor e opção de WhatsApp → atendimento → link para a mesma página de contratação → mesmo pagamento, confirmação e acesso.

A equipe não redigita o pedido. O sistema continua precisando de pedido e vínculo financeiro por trás do checkout. Preservar origem quando houver mecanismo confiável; não inferir identidade por contatos parecidos. Não transportar dados pessoais na URL. Um mecanismo de atribuição automática ao lead anterior exige desenho próprio, não foi implementado por esta decisão.

## Estado local conferido

- `app/contratar/page.tsx:14`: a página já existe, mas responde indisponível fora do guard QA/Sandbox. Isso não comprova checkout real disponível ao público.
- `app/contratar/actions.ts:49`: registra pedido self-service por RPC e segue para o pagamento; não depende do formulário do operador.
- `lib/contratacao/ambiente-checkout.ts:18`: exige Sandbox e banco isolado; preservar o bloqueio de produção.
- `../lp/api/pre-cadastro.js:24`: contato aponta para número diferente do pessoal aprovado por Victor. O handler atual não chama `alertarNovoLead`.
- `../lp/index.html:140`: LP atual oferece atendimento por formulário, não a entrada direta de compra aprovada agora. Não afirmar que alterar um link basta para abrir produção.
- `lib/contratacao/email-pagamento.ts:10`: preparação da mensagem verifica pedido aprovado e correspondência com pagamento; entrega de e-mail não foi comprovada neste bloco.

## Ordem dos blocos seguintes

| Ordem | Trabalho | Responsável | Critério de aceite |
|---|---|---|---|
| 1 | Reconciliar contato pessoal, alerta e resultado do formulário da LP sem sobrescrever trabalho alheio | Agente, implementação local após aprovação do bloco | Lead salvo; alerta tratado sem perder lead; botão abre WhatsApp correto; teste dirigido passa |
| 2 | Validar compra self-service existente no QA como comprador, sem depender de operador | Agente; Victor para autenticação ou autorização financeira | Pedido e pagamento correspondem; pendência não libera acesso; repetição não duplica cobrança; confirmação e negócio correto comprovados |
| 3 | Validar e-mail de confirmação e comprovante no destinatário de QA autorizado | Agente; autorização de envio quando necessária | Mensagem corresponde ao pagamento; aceite do provedor separado de recebimento na caixa |
| 4 | Preparar abertura real do checkout e botões distintos de comprar e conversar na LP | Agente apresenta plano; Victor autoriza configuração/publicação | Provedor, ambiente, segurança, comunicação e operação conciliados; nenhum Sandbox exposto como compra real |
| 5 | Resolver contrato e emissão fiscal | Victor, advogado e contabilidade; integração depois | Aprovação jurídica e parâmetros fiscais próprios; comprovante não é NFS-e |

Pedidos manuais ficam preservados como capacidade secundária, sem investimento visual neste momento. Não apagar migrations já aplicadas nem dados históricos por causa da mudança de rota.

## Verificação deste bloco

Executado `node --experimental-strip-types --test scripts/conferir-jornada-comercial-portas.mjs`, sem rede: 1 de 2 cenários passou. O cenário self-service de confirmação, mensagem preparada, propriedade e próximo onboarding passou com portas simuladas. O cenário que chama o handler real da LP falhou em `scripts/conferir-jornada-comercial-portas.mjs:90`: esperava uma chamada ao alerta, observou zero. Não foi alterado o teste para ficar verde.

Esse resultado não é ensaio HTTPS, banco, Asaas ou entrega de e-mail. Não houve cobrança, mensagem, deploy, commit ou push neste bloco.
