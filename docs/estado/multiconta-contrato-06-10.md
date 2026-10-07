# Multiconta — contrato de implementação, 06/10/2026

> **Estado local em 07/10:** o seletor `/escolher-negocio` está ligado à sessão. Um negócio único liberado abre direto; vários exigem escolha explícita. O cookie httpOnly persiste a preferência, mas cada requisição reconfere posse sob RLS e liberação comercial por negócio. Troca/revogação não cai silenciosamente na primeira empresa. O WebApp continua sem teste de interface autenticada com duas empresas reais; o conferidor puro prova as regras, não o banco ao vivo.

## Implementado nesta entrega local

- A seleção exige autenticação e compra aprovada para aquele negócio ou acesso legado. O servidor lê pedidos ligados somente aos IDs que a RLS já atribuiu ao perfil, incluindo pendentes ainda sem `buyer_profile_id`; um pedido pendente não libera o segundo negócio de quem já acessa o primeiro. Negócios antigos preservam o acesso legado. Um legado sem negócio anterior pode terminar seu primeiro cadastro próprio. A lista mostra CNPJ quando o pedido aprovado o fornece. Um ID forjado falha antes da gravação do cookie.
- `/inicio`, onboarding, contas, marca, conexão Meta, verba, pré-voo, `/conta`, identidade, `/meu-negocio`, análise de criativo e disparo do cadastro usam o negócio ativo. As ações dessas superfícies com formulário ou estado antigo comparam o ID da tela com a escolha atual antes de gravar; a volta do OAuth também recusa troca ocorrida durante o consentimento.
- O vínculo operacional usado nesta fase é `businesses.profile_id`. A tabela `business_memberships` da migration 0026 permanece preparada para delegação, sem permissão de leitura de negócios delegados e sem interface de convite. Não anunciar acesso de equipe ou franquia com delegação ainda.
- O comprovante Pix assistido vai para um pedido com `business_id` e unidades por conta de anúncio. O envio do comprovante não libera o acesso; o operador registra o recebimento e aprova em etapas separadas. Não houve compra real nesta verificação.

## Evidência e limites

`pnpm conferir`, `pnpm typecheck` e `pnpm build` passaram, com o servidor de desenvolvimento parado durante o build. O teste local cobre pedido pendente, aprovação, e-mail não verificado, pedido de outro comprador, legado, ausência de pedido e data legada inválida. Um segundo teste executa o resolvedor de sessão real com transporte substituído e verifica cookie inválido, aprovação, mudança do e-mail verificado, erro da consulta administrativa e ausência de sessão (12/12 no conjunto); a suíte completa passou depois da inclusão. `/escolher-negocio` sem sessão retornou 307 para `/entrar?next=%2Fescolher-negocio`. Não houve teste de navegador com usuário autenticado que possua dois CNPJs, duas contas de anúncio no mesmo CNPJ, troca simultânea em duas abas ou negócio revogado ao vivo; esses casos seguem como aceite antes de disponibilização de produção. A migração 0029 do Pix foi aplicada anteriormente nesta sessão, sem dados reais criados.

## Situação anterior à implementação

O banco já permitia várias linhas `businesses` para um `profile_id`, mas o produto escolhia silenciosamente a primeira por `created_at`. Exemplos anteriores: `app/(protected)/layout.tsx`, `app/(protected)/conta/page.tsx`, `app/(protected)/conta/identidade-actions.ts` e `lib/estado/cliente.ts`. A ação de identidade resolvia a primeira linha pelo usuário e depois usava cliente administrador para gravar; por isso o seletor exigiu a adaptação dos consumidores listados acima. Cobrança recorrente por conta de anúncios ainda não existe.

## Identidade e cobrança

- Um usuário autenticado pode administrar muitos negócios/CNPJs. Cada negócio pode ter mais de uma conta de anúncios, mas cada unidade cobrada representa **uma conta de anúncios** a R$ 500 mensais, com permanência mínima de seis meses conforme a oferta vigente. Negócio, conta de anúncio e unidade paga precisam de IDs próprios, sem inferir quantidade pela contagem de linhas de `businesses`.
- A compra registra e-mail convidado, comprador, CNPJ, quantidade de unidades, origem (assistida ou self-service), forma de pagamento, preço e versão da oferta. Uma unidade pode permanecer `conta_meta_pendente` até a reunião, sem perder vínculo com a cobrança.
- Um e-mail que compra outra empresa deve conservar os negócios anteriores e criar uma nova associação auditável. O vínculo de empresa a usuário deve respeitar delegação/revogação futura; `profile_id` sozinho só cobre o proprietário atual.

## Troca segura de negócio

1. Listar apenas negócios acessíveis ao usuário autenticado, com nome e CNPJ distinguíveis. Se houver um, selecioná-lo automaticamente. Se houver mais de um, pedir escolha explícita e persistir a seleção de forma que sobreviva a retomada.
2. Em toda requisição, resolver o negócio ativo **depois** de `auth.getUser()` e validar sua associação no banco sob RLS. Um ID de URL, formulário ou cookie é uma preferência, não autorização.
3. Todas as leituras e escritas de `/inicio`, onboarding, `/conta`, identidade, criativos, campanhas, conexão Meta e ficha do gestor devem receber o mesmo `business_id` resolvido. Ações que usam `service_role` devem validar associação antes de qualquer escrita.
4. Ao trocar, invalidar os dados em cache da empresa anterior e reconstruir as telas. Uma ação aberta em aba antiga deve falhar ou confirmar a empresa antes de gravar. Sessão expirada e negócio revogado não podem cair silenciosamente na primeira empresa.
5. O gestor precisa consultar ficha e procedência por negócio, mantendo histórico das respostas de cada um; não misturar dados de empresas do mesmo login.

## Critérios de aceite para habilitar

Dois CNPJs no mesmo e-mail; duas contas de anúncio em um CNPJ; troca em duas abas; URL/ID forjado; negócio revogado; sessão expirada; falha de gravação; respostas antigas e procedência preservadas; cobrança por unidade sem duplicidade; ficha do gestor isolada. O seletor local já usa o contexto único; a validação autenticada de ponta a ponta continua pendente. A migration `0026` criou a tabela de vínculos para delegação futura, ainda sem uso no fluxo atual. Não houve vinculação real de cliente nesta etapa.
