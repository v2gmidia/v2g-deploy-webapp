# Etapas 03 e 04 — roteiro de aceite no QA, 14/10/2026

## 0. Aberto

- As mudanças deste lote estão somente no checkout local. O QA hospedado ainda não comprova as telas novas; Victor publica pelo fluxo habitual do GitHub Desktop quando decidir.
- A etapa 04 não pode ser declarada 100% pronta enquanto a agenda pública do Google permitir várias reservas por pessoa/CNPJ e não devolver a reserva ao WebApp. A agenda própria está preparada no código, mas desativada por falta de configuração e ensaio autenticado.
- A voz por transcrição de provedor também está preparada, mas desativada até configurar e testar áudio real. O navegador não deve ser apresentado como prova dessa transcrição.
- Várias contas de anúncios sob o mesmo CNPJ compartilham hoje uma única Página Meta. O código local recusa uma segunda Página diferente em sequência; a proteção transacional contra duas escolhas simultâneas e o ensaio no QA ainda faltam.

## Roteiro 03 — multiconta

1. Entrar com um e-mail confirmado que tenha dois CNPJs aprovados. O menu deve mostrar negócio ativo, logo quando existir, nome, CNPJ e seta; a lista deve conter somente os negócios liberados.
2. Tocar o segundo negócio uma vez. A navegação deve abrir o negócio escolhido sem botão posterior de confirmação. Conferir que nome, CNPJ, respostas e materiais mudaram juntos.
3. Abrir os dois negócios em abas separadas. Depois de trocar a seleção em uma aba, tentar salvar uma resposta antiga na outra. A ação deve recusar e pedir atualização, sem gravar no negócio novo.
4. Retirar acesso a um negócio de teste pelo processo autorizado do QA e tentar uma ação antiga. A seleção deve perder validade; nenhum dado ou ação daquele negócio deve permanecer acessível.
5. Em Adicionar negócio, conferir os dois caminhos: contratar outro CNPJ com o e-mail atual pelo checkout de QA, ou sair e reutilizar a entrada existente com outro e-mail. O checkout público permanece fechado.
6. Para um CNPJ com duas contas de anúncios, conferir a mesma Página nas duas. A escolha de Página diferente deve ser recusada antes de gravar; não criar nem alterar campanha na Meta nesse ensaio.

## Roteiro 04 — onboarding

1. Em negócio novo de QA, confirmar que o CNPJ da compra aparece como “CNPJ da conta”, sem pedir nova digitação. O nome comercial permanece editável e distinto da razão social.
2. No celular, buscar “barbe”, escolher Barbearia por toque; voltar e escolher Outros com texto próprio. Conferir que a opção não desaparece antes do toque.
3. Testar cidade sem números, CEP com oito dígitos só para área próxima e Brasil inteiro sem cidade/CEP. Corrigir uma resposta local para Brasil inteiro e verificar que os campos anteriores foram limpos.
4. Responder serviços, comprador, necessidade e entrega com frases curtas úteis. A interface deve aceitar respostas informativas, não pedir ao cliente que decida o primeiro anúncio, e guardar “não sei” para a ficha do gestor.
5. Na etapa de contas, usar ticket em faixa e conferir que não aparece custo preciso derivado do ponto médio. Testar valor digitado em reais, confirmação e “não sei”.
6. Enviar logo, várias imagens adicionais e PDF. Conferir que os arquivos aparecem após recarregar, que as cores sugeridas exigem confirmação e que o gestor consegue abrir os materiais do mesmo negócio. Validar um formato de conversão comum no navegador usado pelo cliente.
7. Concluir o fluxo e conferir o encaminhamento à agenda. A página pública atual permite duplicação; só aceitar como concluída quando a reserva única estiver ativa, registrada por CNPJ e visível para o cliente depois de atualizar.

## Provas locais já obtidas

- `pnpm typecheck` e build passaram em blocos anteriores; 28 testes offline de multiconta, 69 de preservação do onboarding e 6 conferências de identidade passaram em suas respectivas execuções.
- A suíte completa `pnpm conferir` parou em `conferir:migrations` por divergências anteriores de manifesto/schema e falta de vínculo para o ledger. Os testes offline não substituem o roteiro autenticado acima.

Este documento não registra publicação, migração, reserva, pagamento ou escrita na Meta.
