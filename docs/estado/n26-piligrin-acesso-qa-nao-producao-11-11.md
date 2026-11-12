# Piligrin — acesso existente é QA; produção ainda pendente

## 0. Resultado e correção da orientação

11/11/2026. Victor pediu abrir a Piligrin em produção e esclareceu que o acesso havia sido preparado pela Central, não criado por ele.

**A conta da Piligrin preparada e validada está na QA.** O e-mail proprietário é `victor.cabral@v2gmidia.com.br`. Produção abriu a página de login, mas esse e-mail não tem usuário Auth cadastrado no projeto produtivo consultado. Pedir que Victor entrasse em produção com esse acesso antes de verificar sua existência foi uma orientação inadequada; corrigida nesta sessão.

Próxima frente: mapear e preparar a implantação produtiva legítima da Piligrin, incluindo identidade/acesso, agência/anunciantes e dados. Não transportar senha, tokens ou sessão da QA; não criar confirmação de pagamento ou conceder papel global como atalho. O pedido de abrir a conta não é prova de que a implantação já exista.

Nota 360 continua no radar de Victor, sem implantação executada.

## 1. Prova atual, somente leitura

Projetos relidos por `list_projects`:

- QA: `v2g-webapp-qa`, `zskpijnqgkqwxksqmzmf`, ACTIVE_HEALTHY.
- Produção: `V2G-SITE`, `ushccxpoxjikzqnwhgfd`, ACTIVE_HEALTHY.

Consultas em transações `READ ONLY`, com rollback, sem RPC ou escrita:

- QA: negócio **Piligrin**, ID `9cb85308-02cc-4ce7-bacf-15be77f9ba5e`, proprietário confirmado por `profile_id → auth.users.id`; e-mail `victor.cabral@v2gmidia.com.br`, confirmado.
- Produção: zero usuário Auth com esse e-mail; zero negócio com nome exato Piligrin/Piligrim, sem diferenciar maiúsculas. A busca não demonstra ausência de registros com outros nomes ou outro proprietário; comprova que o acesso conhecido da QA não está cadastrado nesse ambiente.

Selecionados somente IDs, nomes, vínculo, e-mail de acesso e booleano de confirmação. Nenhuma senha, hash, token, credencial, metadata de papel, sessão ou cookie foi consultado. Nenhum envio de recuperação/convite, criação de usuário, grant, alteração de senha, migração, cobrança ou publicação foi executado.

## 2. Fonte histórica conciliada

`piloto-piligrin-caua-05-11.md:74` registra o e-mail QA e a criação do negócio QA; `qa-primeiro-acesso-09-10.md:58` registra o usuário de teste confirmado. Esses atos não eram criação de conta produtiva. As consultas atuais acima confirmam o ambiente e o vínculo sem depender de senha histórica.
