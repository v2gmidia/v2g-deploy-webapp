# Multiconta — contrato de implementação, 06/10/2026

> **Avanço local posterior:** `lib/multiconta/escolha.ts` agora decide entre seleção automática de um único negócio, escolha obrigatória com vários e preferência inválida/revogada. `lib/multiconta/ativo.ts` consulta os negócios da sessão sob RLS e valida uma preferência de cookie. O resolvedor ainda não substituiu os `limit(1)` das telas; não há seletor nem persistência da escolha na interface. O teste puro `scripts/conferir-multiconta.mjs` cobre os casos de acesso forjado e revogado, sem provar o banco real.

## Fato encontrado

O banco já permite várias linhas `businesses` para um `profile_id`, mas o produto costuma escolher silenciosamente a primeira por `created_at`. Exemplos: `app/(protected)/layout.tsx`, `app/(protected)/conta/page.tsx`, `app/(protected)/conta/identidade-actions.ts` e `lib/estado/cliente.ts`. A ação de identidade resolve a primeira linha pelo usuário e depois usa cliente administrador para gravar, portanto um seletor visual isolado não bastaria. O fluxo de cobrança por conta de anúncios ainda não existe. Assim, multiconta **não está pronta**, mesmo que um login alcance dois CNPJs no banco.

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

Dois CNPJs no mesmo e-mail; duas contas de anúncio em um CNPJ; troca em duas abas; URL/ID forjado; negócio revogado; sessão expirada; falha de gravação; respostas antigas e procedência preservadas; cobrança por unidade sem duplicidade; ficha do gestor isolada. O seletor só deve ir à interface depois que os consumidores e ações estiverem resolvidos pelo mesmo contexto. A migration `0026` criou a tabela de vínculos, ainda sem linhas e sem seletor ativo. Não houve vinculação real de cliente nesta etapa.
