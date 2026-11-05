# N26-05 — primeiro acesso por contratação histórica — 04/11/2026

## 0. Próximo ato, dono e portão

**LOCAL implementado/testado. QA e produção NÃO homologados para este caminho.**
Recurso desligado por padrão: nome de variável `V2G_HISTORICAL_ACCESS_ENABLED`.
Nenhum valor de segredo/configuração externa foi lido ou alterado.

Victor/Cauã precisam nomear UM piloto e confirmar responsável autorizado,
e-mail, CPF/CNPJ do contratante, fonte/data da contratação e gestor V2G.
01/02 apresenta os IDs exatos de negócio, evidência e perfil (se existir),
com divergências e operação proposta, antes da autorização de escrita.
Sem negócio existente adequado, preparar cadastro explícito e obter autorização;
não reutilizar negócio fictício nem transferir propriedade por semelhança.

O próximo portão técnico é revisar dependências/backup, aplicar individualmente
no QA as migrations ainda ausentes, publicar o código e habilitar a flag apenas
nesse ambiente, cada ação com autorização específica. Não usar `db push` para
aplicar toda a pasta por consequência desta entrega.

## 1. Fonte e escopo

- Direção de Victor distribuída pelo Central em 04/11: implementação local
  N26-05, sem criar pedido/cobrança ou liberar pessoa real.
- Plano novo lido: [planilha novembro](https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o),
  linha N26-05, alvo 09/11 e dependência do piloto N26-03.
- [FigJam novembro](https://www.figma.com/board/Ofzj9dZqeSbqN5Uq0jZLVI),
  seção `1:20`, texto `1:22`: primeiro cliente deve entrar no negócio correto;
  01/02 confere contratação/acesso e 03/04 confere negócio/agenda.
- Referências técnicas anteriores: `e28-01-02-senha-retorno-acesso-25-10.md`,
  `e28-03-04-piloto-agencia-local-22-10.md` e
  `e28-03-04-recebimento-meta-21-10.md`. Arquivos de 03/04 não foram editados.
- Outubro é histórico. A quantidade de clientes ativos continua dependente de
  inventário; não se presumiu que oito estejam aptos.

## 2. Caminho implementado

1. Evidência `historical_contract`, conferida e sem pedido associado, aponta
   para um `business_id` explícito. CPF/CNPJ válido é identidade documental,
   nunca critério de busca/fusão de negócios ou prova de poderes.
2. `/pedidos/acesso-contratado` autentica o operador. A emissão SQL repete a
   conferência do papel em `auth.users.raw_app_meta_data`, da carteira, da
   evidência e da identidade proposta. Registra emissor, motivo, data e evento.
3. O registro de liberação tem ID próprio e prazo de sete dias para primeiro
   aceite. Não é pedido, aprovação de pagamento, recibo ou permissão Meta.
   Nenhuma mensagem ao cliente é enviada pela emissão.
4. O link `/acesso-contratado/<id>` permite primeiro cadastro pelo e-mail e
   documento já conferidos. Conhecer o ID não concede acesso: ainda exige
   confirmação do próprio e-mail e aceite autenticado da liberação exata.
   Antes do aceite, o destinatário vê negócio, documento e código do negócio.
   Outra conta não recebe esse resumo.
5. A RPC de aceite usa `auth.uid()` e e-mail confirmado de `auth.users`;
   não aceita `profile_id`/`business_id` enviados pelo cliente. Em transação,
   liga apenas aquele negócio e registra quem aceitou/quando. Reenvio não
   duplica a liberação ou o evento. Divergência/expiração falham fechadas.
6. Proxy/layout via `temAcessoWebApp`, resolvedor multiconta, seletor e
   identificação documental reconhecem a permissão aceita e não revogada,
   mantendo a exigência de propriedade do negócio. Cookie é preferência.
7. Revogação exige operador responsável e motivo. Remove só essa permissão;
   desfaz a propriedade criada por ela apenas quando não havia proprietário
   anterior nem outra liberação/pedido sustentando aquele vínculo. Não apaga
   negócio, conteúdo, histórico ou outros negócios da pessoa.

### Associação antiga por e-mail encontrada e contida

O trigger `private.handle_new_user()` antigo reivindica órfãos por e-mail.
A migration prepara um guard exato dessa definição: neste novo cadastro,
o marcador `access_flow=historical_contract` suprime tal associação. O marcador
é editável pelo usuário, mas só pode negar a rotina automática; nunca concede
permissão. A wrapper de vínculo de compras também não faz associação automática
para essa conta marcada. O caminho tradicional permanece inalterado.

**Limite de produto:** para contas criadas por este percurso, futuras compras
que dependam de reivindicação automática por e-mail exigem conciliação explícita;
este bloco não remove o marcador nem reativa a rotina após o primeiro aceite.
Não apresentar essa conta como homologada para futuros checkouts automáticos.

### Proteções e limites deliberados

- Emissão/aceite recusam negócio com pedido comercial, inclusive histórico:
  a liberação não serve para contornar estorno ou pedido pendente.
- A falha antiga de acesso por pedido estornado continua separada e não foi
  corrigida nem mascarada. Outras fontes válidas de acesso são independentes.
- Convite expirado não é renovado por replay. Tratamento operacional de
  renovação requer outro bloco; não fabricar nova referência documental.
- Aceite de convite já aceito permanece idempotente depois do prazo; revogação
  impede esse replay. Sete dias é prazo do convite, não cobrança/renovação.
- Concessões/evidências não têm escrita direta por cliente. RPCs de emissão e
  revogação são service-only; aceite é authenticated-only com verificação interna.
  `SECURITY DEFINER` é necessário para gravar somente o vínculo autorizado;
  `search_path` vazio, ACL explícita e proprietário instalado exigem revisão QA.
- Falha de tabela/leitura nega esta fonte de acesso. Flag ausente não consulta
  a estrutura nova; caminhos de compra/legado mantêm suas próprias verificações.

## 3. Arquivos do bloco

Novos:

- `lib/contratacao/acesso-contratado.ts`, `cadastro-contratado.ts`;
- `app/(public)/acesso-contratado/[id]/{page.tsx,Formulario.tsx,actions.ts}`;
- `app/(protected)/pedidos/acesso-contratado/{page.tsx,Formulario.tsx,actions.ts,acesso.module.css}`;
- `supabase/migrations/20261104040711_historical_contract_access.sql`;
- `scripts/conferir-acesso-contratado.mjs`, `conferir-acesso-contratado-sql.mjs`;
- este checkpoint.

Integrações mínimas em arquivos existentes:

- `lib/contratacao/acesso.ts`, `vincular.ts`;
- `lib/multiconta/ativo.ts`, `elegibilidade.ts`, `cnpjs.ts`;
- `app/(public)/entrar/actions.ts`, `TelaEntrada.tsx`;
- `scripts/conferir-multiconta-sessao.mjs`: permite carregar o novo módulo real
  no teste offline, mantendo o bloqueio de rede;
- `supabase/objetos.ts`: manifesto da migration;
- `package.json`: comando `conferir:acesso-contratado`.

Os arquivos abertos de anúncios/backend/mesa/onboarding por outras frentes
foram preservados. O índice compartilhado já estava alterado; não foi editado
por este bloco. Nenhum commit, push, build compartilhado ou restart foi feito.

## 4. Testes e prova

- `pnpm conferir:acesso-contratado`: **19/19** (8 testes TS reais e 11 registros
  do teste SQL, incluindo o teste pai). SQL executado em PGlite descartável local,
  com a migration/RPCs reais, trigger real e esquema de dependências focado.
  Usa o checksum real da migration CPF/CNPJ; não equivale a aplicar toda a
  cadeia real de migrations ou a testar concorrência de múltiplas conexões.
- `pnpm conferir:acesso`: **6/6**.
- `pnpm conferir:multiconta`: **28/28**.
- `pnpm conferir:documento-contratante`: **15/15**.
- `pnpm conferir:recuperacao`: **24/24**.
- Total dos comandos acima: **92/92**; `pnpm typecheck --pretty false` passou.
- Detector Impeccable nos novos componentes/formulário/CSS conferidos: `[]`.
  Isto não substitui inspeção visual em navegador; desktop/mobile não medidos.
- `git diff --check`: sem erros; somente avisos de normalização LF/CRLF.

Cobertura: concessão correta/negada; conta não confirmada; e-mail/perfil/negócio
divergentes; CPF e CNPJ; dois negócios com o mesmo destinatário; emissão e aceite
idempotentes; revogação de um preservando o outro; convite expirado; conflito
com pedido; ACL/RLS; resumo sem vazamento; action usando apenas o ID e sessão.

## 5. Operação humana exata após nomear o piloto

1. Victor identifica o piloto e autoriza a conferência dos dados/fontes mínimas.
   01/02 compara registros existentes e devolve os IDs e qualquer conflito.
2. Preparar backup e revisão de dependências no ambiente nomeado: carteira,
   evidência manual, CPF/CNPJ e trigger Auth privado. Autorizar e aplicar cada
   migration necessária individualmente, confirmar objetos/ACL, depois publicar
   o código e habilitar a flag. Nada disso foi executado neste bloco.
3. Com autorização de escrita específica, assegurar negócio explícito e gestor
   atribuído. `claim_email` precisa estar nulo; perfil nulo ou o perfil confirmado
   da pessoa indicada, sem tomar negócio de terceiro. Havendo conflito, parar.
4. Em `/pedidos?negocio=<business_id>`, registrar a fonte histórica verdadeira,
   sem pedido; conferir identidade/autoridade e fonte, com motivo. Manter a
   referência localizável em local restrito, sem publicar contrato/documentos.
5. Em `/pedidos/acesso-contratado`, emitir pelo ID da evidência conferida.
   Registrar o ID da liberação e conferir destinatário/negócio. Compartilhar o
   link somente com a autorização de comunicação correspondente, nunca em lote.
6. Cliente cria a própria senha e confirma seu e-mail. **Volta ao link original**
   e, já conectado com o e-mail correto, confere e aceita o negócio indicado.
   O retorno do e-mail não foi alterado; não presumir que preserve o convite.
   Se já tiver conta, usa o mesmo link e a opção de entrar.
7. Conferir `/conta` e seleção do negócio com a conta comum; tentar ID/negócio
   alheio e registrar recusa. Confirmar que outro negócio não foi unido e que
   replay não criou outra concessão. Só então entregar a 03/04 para onboarding.

QA: **não executado neste bloco**; a leitura de 28/10 que encontrou dependências
ausentes é histórica, não estado remoto atualizado de novembro.
Produção: **não consultada/alterada/homologada**.
Etapa 02: contrato, poderes, jurídico, assinatura e fiscal seguem procedimento
manual separado; liberação técnica não constitui aprovação jurídica ou NFS-e.

Rollback: em falha de aplicação, reverter a transação. Após aceite, preservar
auditoria e dados; não derrubar tabelas/colunas. Revogação dirigida exige motivo
e responsável; desligar a flag não desfaz por si só propriedade já atribuída.
