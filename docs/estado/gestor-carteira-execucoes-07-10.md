# Carteira do gestor: execuções e filtros — 07/10/2026

## 0. Dependências de Victor e limites

- A interface local autenticada ainda precisa ser vista com uma conta de operador. Sem credenciais locais, `/gestor` redirecionou para `/entrar`; nenhuma sessão foi forçada.
- Dois CNPJs no mesmo login seguem necessários para provar a troca multiconta em navegador. Os testes puros verificam o isolamento, mas não substituem essa prova.
- Resultado, gasto, saldo, criativos e agenda sincronizada exigem dados e contratos de fonte próprios. Esta entrega não estima nem simula essas medidas.

## Implementado

- `/gestor` consulta `execucoes` pelo `business_id` dos negócios reais retornados, após conferir o papel `operador`, e mostra o estado da última execução e a última campanha criada. A campanha anterior permanece visível quando uma execução mais nova ainda não criou campanha.
- O estado da plataforma é explicitamente a última leitura registrada, com horário quando disponível. Não significa estado ao vivo.
- Busca por nome/ID e filtros para pedidos, onboarding, cadastro, contas para conferir e campanha criada ajudam o operador a reduzir a lista. Há links diretos para a ficha e para a campanha existente.
- O operador vê entrada para a carteira no casco do WebApp. Os cinco itens da navegação do cliente não mudaram.
- Cada negócio pode abrir a lista de contas de anúncios com nome, identificador e estado cadastral. A carteira distingue unidade de pedido aprovado vinculada, unidade aprovada ainda livre e conta sem unidade aprovada vinculada. Esta última pode ser legada e não prova inadimplência.
- O contrato mais recente por pedido prevalece sobre documentos antigos na carteira.

## Verificações

- 11 testes do portfólio passaram, cobrindo isolamento por negócio, pedido sem vínculo, contrato antigo, execução posterior, busca/filtros, unidades livres e vínculo correto da conta ao negócio.
- `conferir:multiconta` passou em 12/12 cenários; `conferir:acesso` em 4/4; `conferir:resultado` em 86/86; `conferir:campanha-da-sessao` em 17/17 após retirar a rota insegura. Typecheck e build final passaram com o servidor de desenvolvimento parado; ele foi restaurado na porta 3000.
- A suíte completa avançou até `conferir:migrations` e parou porque a migration RevOps `20261007160925_revops_v0.sql` está no repositório, mas seus objetos não aparecem no banco consultado. Nenhuma migration foi aplicada nesta entrega.
- O navegador confirmou o redirecionamento de `/gestor` para login sem sessão. A tela autenticada e seus filtros não foram verificados visualmente.

## Próximo bloco

Com conta operadora local, conferir visualmente a carteira e filtros. Uma tentativa de reutilizar `resultadoDoNegocio` numa rota interna foi retirada: `conferir:campanha-da-sessao` mostrou que a camada atual aceita somente o negócio e perfil da própria sessão para chegar às rotas de execução sem autorização individual. O backend precisa oferecer leitura específica para operadores, com autorização própria por negócio; então validar a associação entre execução, conta de anúncios e intervalo de coleta, incluindo carimbo de atualização e estado de coleta, antes de mostrar investimento, conversas ou criativos no agregado do gestor.
