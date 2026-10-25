# Recebimento de cliente na Meta

**Estado:** procedimento operacional reconciliado e passagem dos primeiros dez clientes preparada para começar por um cliente-piloto autorizado

**Atualizado em:** 22/10/2026

**Escopo:** cliente já pagou, concluiu o onboarding e precisa entregar os acessos mínimos para a V2G operar e medir anúncios.

**Mapa visual:** [V2G | Recebimento de cliente | Meta](https://www.figma.com/board/DGGCCnjlOlmy5vzsa11yoW)

## 1. Decisão executiva

O cliente **não entra no Meta for Developers da V2G**. Função no app (administrador, desenvolvedor ou testador) é acesso ao software da V2G, não aos ativos comerciais do cliente.

O caminho operacional imediato é:

1. o cliente mantém uma pessoa responsável com controle total do próprio portfólio empresarial;
2. essa pessoa ativa autenticação de dois fatores;
3. o cliente adiciona o portfólio empresarial da V2G como **parceiro**;
4. compartilha somente a conta de anúncios, Página, Instagram e, quando necessário, conjunto de dados/pixel;
5. a V2G atribui internamente esses ativos apenas às pessoas que vão operá-los;
6. a V2G confere os IDs no contexto do negócio correto antes de ler, publicar ou medir.

Isso permite a operação humana pelo Gerenciador de Anúncios, desde que a Meta tenha concedido os acessos nos ativos. **Não prova que a API está liberada.** Operação por API, System User e App Review são camadas diferentes.

### O que o App Review muda

- **Sem App Review aprovado:** a V2G pode receber o cliente por parceria e operar manualmente, mas não deve prometer automação de API para usuários externos ao app.
- **Com App Review e nível de acesso adequados:** o produto pode oferecer conexão OAuth e automações para clientes que não possuem função no app, respeitando os ativos que o usuário ou System User realmente alcança.
- **System User não contorna App Review.** Ele ainda precisa pertencer ao portfólio correto, receber os ativos corretos e usar um app/permissões habilitados para o caso de uso.

## 2. Três camadas que não podem ser confundidas

| Camada | Serve para | Quem entra | Evidência mínima |
|---|---|---|---|
| Meta for Developers | administrar, testar e revisar o app da V2G | somente equipe técnica e usuários de teste controlados | função do app + cenário de teste |
| Portfólio empresarial e ativos | permitir trabalho na conta, Página, Instagram e dados | V2G como parceira e pessoas internas designadas | ativo compartilhado + tarefa concedida |
| Credencial de API | autenticar cada chamada da Graph API | token de usuário ou de System User, conforme arquitetura aprovada | token válido + ativo atribuído + permissão aprovada |

Adicionar a V2G como parceira não concede automaticamente permissão à API. Adicionar o cliente como desenvolvedor seria um atalho inseguro e não representa o fluxo real que a Meta precisa analisar.

## 3. Como está hoje (AS-IS)

### WebApp

- O OAuth pede `ads_read`, `ads_management`, `business_management`, `pages_show_list`, `pages_read_engagement` e `pages_manage_ads` (`lib/meta/oauth.ts:75-99`).
- A WebApp usa Graph API `v25.0` (`lib/meta/oauth.ts:15`).
- Na escolha, conta e Página são revalidadas contra a conexão atual antes da gravação (`app/(fluxo)/conectar/escolher/actions.ts:65-95`).
- A conexão guarda uma credencial de usuário protegida e os ativos selecionados para o negócio.
- Existe um publicador Meta direto em `lib/meta/publicar.ts`, usando o token da conexão, mas a busca de consumidores em 21/10 não encontrou rota ou action que chame `publicarCampanha`; o próprio repositório registra esse caminho como não ligado (`lib/campanha/ativacao.ts:16-17`). Ele não deve ser tratado como runtime atual.

### Backend

- O cliente Meta do backend está em Graph API `v23.0` (`backend_v2g/src/meta/graph.py:67`).
- Existe suporte interno a token por pedido, isolado por contexto concorrente (`backend_v2g/src/meta/graph.py:112-162`).
- O caminho atual de `POST /campanhas` monta `PedidoDeSubida` sem preencher `token_de_acesso` (`backend_v2g/src/api/rotas.py:3410` e bloco seguinte, inspecionado pós-push). Na prática, o runtime cai na credencial de System User configurada no backend; o comentário do próprio cliente confirma que a escolha de quem preencherá o token do pedido ainda não foi tomada (`backend_v2g/src/meta/graph.py:128-162`).

### n8n

- O export versionado ainda pede manualmente “Conta de anúncio” e “ID da Página” no passo “Subir na Meta?”.
- Esses valores são enviados a `/campanhas` junto de `id_execucao` (`backend_v2g/n8n/V2G - BACKEND.json:2259`).
- O workflow ao vivo aparece ativo, mas seu conteúdo não pôde ser lido pelo conector disponível. Portanto, **não está comprovado** que o export local é idêntico à versão ativa.

### Inconsistências que precisam ser fechadas antes da automação total

1. WebApp e backend usam versões diferentes da Graph API (`v25.0` e `v23.0`). Isso é dívida de alinhamento, não a causa comprovada da rejeição.
2. A WebApp captura token de usuário, mas a publicação atual do backend usa System User por padrão.
3. O n8n ainda aceita IDs digitados pelo operador, o que cria risco de cruzar clientes.
4. A narrativa anterior de App Review misturou conexão do usuário com publicação por System User.

### Dependências vizinhas já provadas, sem ampliar o aceite Meta

- O envio/revisão de imagem tem uma rodada anterior de **17 verificações HTTPS** com Auth, banco e Storage (`docs/estado/e28-qa-publicado-e-ensaio-https-21-10.md:31-55`). Isso prova o recorte da peça, não acesso a ativos Meta, leitura de métricas ou publicação.
- Compra e e-mail têm provas próprias de Sandbox/QA e testes direcionados. Elas não substituem confirmação de contrato, acesso Meta ou entrega de uma mensagem específica do piloto.
- O serviço `ia / backend-qa` existe no painel e o HTTPS do painel foi visto, mas o backend continua não implantado/sem funcionamento comprovado. Schema e segredos exclusivos de QA têm portões próprios (`backend_v2g/docs/estado/e28-backend-qa-https-schema-preparado-21-10.md`).
- Permanecem três aceites independentes: **acesso manual aos ativos**, **API de leitura** e **API de publicação**. Um verde não fecha os outros dois.

## 4. Modelo-alvo (TO-BE)

### Trilha imediata: atendimento assistido

O cliente compartilha os ativos com a V2G. O operador confere os IDs, registra evidências e executa pelo Gerenciador de Anúncios. A publicação via API fica condicionada a uma verificação explícita de credencial, ativo e negócio.

### Trilha futura: produto automatizado

1. a sessão autenticada define o `business_id` interno da V2G;
2. o usuário conecta a Meta e escolhe apenas ativos que a conexão alcança;
3. a WebApp grava vínculo imutável entre negócio, conta, Página e Instagram;
4. backend/n8n recebem esse vínculo, nunca IDs livres sem contexto;
5. a credencial de execução é escolhida por uma regra única e auditável;
6. toda operação nega a execução se negócio, ativo e credencial não coincidirem;
7. não existe fallback para ativo da V2G nem troca silenciosa de anunciante.

## 5. Playbook de recebimento em 10 etapas

| # | Etapa | Cliente faz | V2G faz | Evidência para encerrar | Saída manual / negar |
|---|---|---|---|---|---|
| 1 | Confirmar responsável | indica uma pessoa com controle total | registra nome, canal e negócio | responsável confirmado | sem responsável: não iniciar |
| 2 | Exigir 2FA | ativa 2FA na conta responsável | orienta e aguarda confirmação | tela da Meta confirma 2FA | sem 2FA: pausar convite |
| 3 | Inventariar ativos | informa portfólio, conta, Página, Instagram e pixel | confere propriedade e IDs | inventário com proprietário de cada ativo | propriedade incerta: reunião de acesso |
| 4 | Criar parceria | adiciona o portfólio V2G pelo ID oficial | envia ID por canal autenticado | parceiro aparece no portfólio do cliente | nunca pedir senha/perfil pessoal |
| 5 | Compartilhar o mínimo | seleciona somente os ativos necessários | confere tarefas concedidas | conta, Página e Instagram visíveis | sem cobrança, finanças ou controle total |
| 6 | Atribuir internamente | nenhuma ação | designa operadores mínimos na V2G | pessoas e tarefas registradas | remover quem não participa |
| 7 | Testar leitura | mantém sessão disponível se necessário | abre conta, Página e relatórios | leitura humana comprovada em cada ativo | se API falhar, registrar separado da UI |
| 8 | Vincular sem ambiguidade | confirma os ativos exibidos | relaciona negócio, conta, Página e Instagram | um único conjunto de IDs por negócio/conta | divergência: bloquear publicação |
| 9 | Validar reunião e escopo | participa da passagem final | confirma objetivo, verba, identidade e canal | ata com ativos e responsável | pendência crítica: atendimento assistido |
| 10 | Liberar operação | aprova o plano dentro do fluxo vigente | publica manualmente ou por API validada | primeira entrega + captura + log | API sem prova: usar fluxo manual |

## 6. Matriz de acesso mínimo

| Objeto | Acesso mínimo solicitado | Por quê | Não solicitar por padrão |
|---|---|---|---|
| Portfólio empresarial | parceria entre empresas | receber ativos sem tomar posse | controle total do portfólio |
| Conta de anúncios | gerenciar campanhas e ver desempenho | criar, ajustar e medir campanhas | finanças e forma de pagamento |
| Página do Facebook | criar anúncios e ver desempenho | identidade do anúncio e leitura necessária | controle total, conteúdo orgânico e mensagens |
| Instagram | criar anúncios e ver desempenho | identidade e posicionamentos do anúncio | mensagens e publicação orgânica |
| Dataset/pixel | ver eventos e, se necessário, gerenciar | medição e otimização quando contratado | acesso se o produto não usa o ativo |
| WhatsApp | nenhum no fluxo atual | não faz parte do recebimento padrão | mensagens e administração |
| Meta for Developers | nenhum para cliente | app é infraestrutura da V2G | administrador, desenvolvedor ou testador |

## 6.1 Checklist copiável para Victor e cliente

Preencher antes da conversa de acesso. **Não enviar senha, token, código de 2FA, chave ou captura que exponha segredo.**

```text
RECEBIMENTO META — DADOS DO CLIENTE

Negócio na V2G
[ ] Nome do negócio:
[ ] CNPJ usado na compra/onboarding:
[ ] Responsável autorizado a adicionar parceiro e compartilhar ativos:
[ ] E-mail/canal seguro desse responsável:
[ ] 2FA ativa na conta do responsável: sim / não

Ativos Meta
[ ] ID do portfólio empresarial do cliente:
[ ] Nome + ID da conta de anúncios (act_...):
[ ] Nome + ID da Página:
[ ] @ + ID do Instagram, se usado:
[ ] Nome + ID do dataset/pixel, somente se usado:
[ ] Proprietário atual de cada ativo confirmado: sim / não
[ ] Restrição, dívida, limite ou bloqueio conhecido na conta:

Operação
[ ] Operador V2G responsável:
[ ] Objetivo da primeira campanha:
[ ] Destino aprovado (site, formulário, WhatsApp ou outro):
[ ] Verba e período aprovados:
[ ] Peça/versão aprovada identificada:
[ ] Acesso financeiro NÃO solicitado à V2G:
[ ] Papel no Meta for Developers NÃO solicitado ao cliente:
```

O responsável do cliente precisa ter autoridade suficiente **no portfólio do próprio cliente** para adicionar a V2G e compartilhar os ativos. Isso não significa conceder controle total à V2G. A V2G recebe apenas as tarefas da matriz acima.

### Evidência que fica em cada passagem

1. **Responsável/2FA:** nome, função, horário da confirmação e estado “2FA confirmada”, sem registrar código.
2. **Inventário:** tabela com nome, ID, proprietário e uso de cada ativo.
3. **Parceria:** captura/registro de que o portfólio V2G aparece como parceiro, sem dados sensíveis.
4. **Tarefas mínimas:** lista de tarefas efetivamente concedidas por ativo.
5. **Atribuição interna:** operador V2G, negócio atendido e data; nenhuma pessoa fora da operação.
6. **Leitura manual:** ativo aberto no Gerenciador, nome/ID e horário; não vale como prova de API.
7. **API de leitura:** requisição autorizada, identidade do negócio/conta, período, fonte, status e resultado; desconhecido não vira zero.
8. **Vínculo:** `business_id`, execução, conta, Página, Instagram/campanha e fonte dos IDs.
9. **Publicação:** aprovação da versão, operador, IDs retornados e estado lido na Meta; pedido enviado não significa “no ar”.
10. **Fechamento:** pendências, saída manual usada e responsável pelo próximo ato.

## 7. Exceções operacionais

- **Cliente sem portfólio:** criar/organizar o portfólio antes da parceria; não migrar posse no improviso.
- **Ninguém com controle total:** localizar o proprietário atual; a V2G não tenta contornar a governança.
- **2FA ausente:** não concluir o recebimento.
- **Ativo pertence a terceiro:** o proprietário deve compartilhar ou transferir formalmente; captura de tela do cliente não substitui acesso.
- **Conta restrita, sem limite ou sem pagamento:** registrar como bloqueio do cliente e manter campanha sem publicação.
- **Página/Instagram não vinculados:** operar apenas nos posicionamentos válidos e corrigir vínculo antes de prometer Instagram.
- **Parceiro vê o ativo, mas System User não:** atribuir o ativo ao System User e retestar; parceria sozinha não resolve API.
- **Operador vê na interface, API nega:** classificar como problema de credencial/permissão, sem remover o acesso humano já comprovado.
- **IDs divergem entre WebApp, n8n e backend:** negar execução. Nunca usar ativo padrão da V2G como fallback.

## 8. Contrato de handoff WebApp → backend/n8n

Este contrato é documental. Nenhum código, token ou workflow foi alterado.

| Campo | Fonte autoritativa | Regra |
|---|---|---|
| `business_id` | negócio ativo da sessão V2G | obrigatório e validado no servidor |
| `id_execucao` | execução pertencente ao negócio ativo | obrigatório; não aceitar execução de outro tenant |
| `id_conta_anuncio` | conta contratada e selecionada na WebApp | deve pertencer ao mesmo negócio e estar alcançável pela credencial |
| `id_pagina` | conexão Meta confirmada para o negócio | não aceitar Página livre digitada fora do vínculo |
| `id_instagram` | identidade vinculada à Página/conta, quando houver | opcional; ausência deve degradar de forma explícita |
| credencial | estratégia única aprovada: usuário ou System User | precisa alcançar exatamente os ativos do vínculo |
| versão Graph | versão única suportada | alinhar WebApp/backend antes da certificação |

Critério de negação: campo ausente, ativo não pertencente ao negócio, credencial sem acesso, proprietário incerto ou divergência de ID. O operador recebe uma pendência tratável; o sistema não tenta outra conta, Página ou credencial silenciosamente.

## 9. App Review em 10 etapas

O feedback atual rejeitou todas as permissões pedidas. O Marketing API Access Tier falhou por volume insuficiente de chamadas nos 15 dias anteriores; as permissões falharam porque o vídeo não demonstrou login, consentimento e uso ponta a ponta alinhados ao caso declarado.

| # | Etapa | Situação em 21/10 | Evidência que falta | Próxima ação |
|---|---|---|---|---|
| 1 | Fixar uma narrativa de autenticação | **pendente** | decisão usuário OAuth versus System User por operação | adotar uma história única e refletir no produto |
| 2 | Limpar funções do app | **parcial** | lista atual de administradores, desenvolvedores e testadores | manter só equipe e contas de teste justificadas |
| 3 | Verificar configurações básicas e URLs | **não reverificado** | domínio, privacidade, exclusão de dados e redirect atuais | auditoria read-only no painel |
| 4 | Preparar empresa e ativos de teste | **parcial** | conta, Página, anúncio e usuário reprodutíveis | montar ambiente do revisor sem dados reais |
| 5 | Reduzir e justificar permissões | **pendente** | chamada real e tela correspondente por permissão | remover o que não tem uso demonstrável |
| 6 | Cumprir o volume do Access Tier | **rejeitado** | chamadas válidas na janela exigida pela Meta | gerar uso legítimo no ambiente previsto e medir |
| 7 | Preparar acesso do revisor | **pendente** | credencial/test user, URL e instruções em inglês | roteiro reproduzível do zero |
| 8 | Gravar vídeos ponta a ponta | **rejeitado** | login, consentimento, seleção e resultado por caso | refazer vídeos sem cortes de contexto |
| 9 | Escrever notas por permissão | **pendente** | justificativa que distingue usuário e servidor | explicar quem autoriza, quem chama e qual dado retorna |
| 10 | Conferir e reenviar | **não autorizado** | pacote completo e verificação final | submeter somente após aprovação humana explícita |

Prioridade recomendada: **P2**. Não deve parar o recebimento manual de clientes nem a validação comercial. Deve avançar em paralelo, porque é bloqueio real para a automação escalável e a nova submissão depende de evidências acumuladas ao longo de dias.

## 10. Cenário fictício executável para as etapas 7 e 8

Todos os identificadores abaixo são fictícios e servem apenas como contrato de teste:

- negócio V2G: `biz_demo_001`;
- execução: `00000000-0000-4000-8000-000000000001`;
- conta de anúncios: `act_123456789012345`;
- Página: `123456789012345`;
- Instagram: `17841400000000000`;
- dataset opcional: `987654321098765`.

### Mesa local com dois negócios na mesma conversa

Este roteiro só organiza o ensaio; não cria fixture externa e não duplica a ponte integrada de 16 cenários do 07/08.

| Campo | Negócio A | Negócio B |
|---|---|---|
| negócio V2G | `biz_demo_001` | `biz_demo_002` |
| execução | `00000000-0000-4000-8000-000000000001` | `00000000-0000-4000-8000-000000000002` |
| conta | `act_123456789012345` | `act_223456789012345` |
| Página | `123456789012345` | `223456789012345` |
| Instagram | `17841400000000000` | `17841400000000001` |
| canal de destino | `canal_demo_compartilhado` | `canal_demo_compartilhado` |

Sequência da mesa:

1. registrar em uma única conversa os pedidos de A e B, sempre prefixados pelo negócio e pela conta;
2. selecionar A e conferir que somente IDs, leitura e evidências de A aparecem;
3. selecionar B e repetir a conferência com os IDs de B;
4. demonstrar que o mesmo canal de destino não une negócio, conta, campanha, peça ou métrica;
5. tentar enviar a execução de A com a conta/Página de B; o contrato deve negar antes de qualquer escrita externa;
6. mostrar que uma leitura da conta própria da V2G não comprova leitura de uma conta externa compartilhada;
7. registrar os três aceites separadamente: manual, leitura API e publicação API.

Cobertura reaproveitada do 07/08: os 16 cenários locais já verificam dono/negócio/carteira divergentes, ausência de sessão/contrato e conflito de associação preservado (`backend_v2g/docs/estado/e28-conexao-leitura-local-executada-21-10.md:18-42`). Esta mesa não os reimplementa. O que falta é a prova HTTPS com conta externa autorizada e backend-qa implantado.

### Roteiro do revisor

1. acessar a URL de teste e entrar com o usuário fornecido;
2. clicar em “Conectar com a Meta”;
3. aceitar somente as permissões apresentadas;
4. selecionar a conta e a Página fictícias disponibilizadas ao usuário;
5. voltar à V2G e confirmar que os mesmos nomes/IDs aparecem;
6. abrir a tela que consome cada permissão solicitada;
7. executar uma leitura autorizada e mostrar o resultado dentro do produto;
8. quando houver escrita, mostrar a ação, a confirmação e o resultado no ativo de teste;
9. encerrar sem expor token, segredo ou dado de cliente real.

### Critérios de negação

- usuário não alcança o ativo;
- ativo retornado não pertence ao `biz_demo_001`;
- ID digitado não coincide com o vínculo salvo;
- permissão concedida não cobre a chamada;
- credencial do backend não alcança o mesmo ativo;
- tela só mostra dado estático ou mock sem declarar que é teste;
- vídeo pula login, consentimento ou resultado final.

### Handoff mínimo para os responsáveis por 07/08

Entregar: URL de teste, usuário de teste, pré-condições, conjunto de IDs fictícios, permissão demonstrada, clique inicial, chamada esperada, resultado visível, evidência final e caminho de recuperação. Cada vídeo deve provar uma única história ponta a ponta; não misturar OAuth do cliente com publicação por System User sem explicar a transição.

## 11. Donos e ordem recomendada

1. **Operações V2G:** pilotar as dez etapas de recebimento com um ativo de teste.
2. **Produto/WebApp:** transformar o vínculo negócio-ativos no único contrato aceito.
3. **Backend/n8n:** eliminar IDs livres e definir a credencial por pedido sem fallback cruzado.
4. **App Review:** preparar evidências, vídeos e notas; não reenviar ainda.
5. **Victor:** aprovar qualquer mudança de código, workflow, Meta, credencial ou submissão.

### Próximo ato humano único

Victor deve escolher **uma conta-piloto externa autorizada** e informar, pelo canal seguro combinado, somente: responsável autorizado, ID do portfólio, ID/nome da conta de anúncios, ID/nome da Página, Instagram/dataset se realmente usados e qual operador V2G acompanhará a sessão. Depois disso, a primeira atividade é uma conversa assistida de inventário e compartilhamento, sem publicação.

Continuam exigindo autorização específica: criar conta/usuário/fixture externa; enviar convite ou conceder permissão; compartilhar ativos; aplicar schema/migration; inserir ou trocar segredo/configuração; implantar backend-qa; executar chamada Meta de escrita; publicar campanha; usar verba; alterar n8n; e reenviar o App Review.

## 12. Fontes e limites

- Código local da WebApp e do `backend_v2g`, inspecionado em 21/10/2026.
- Export versionado do n8n, não certificado como cópia do workflow ao vivo.
- Feedback da Meta fornecido pelo Victor para a submissão rejeitada.
- Documentação oficial: [níveis de acesso da Graph API](https://developers.facebook.com/docs/graph-api/overview/access-levels/), [acesso a Páginas](https://www.facebook.com/help/289207354498410/) e [adicionar parceiro ao portfólio empresarial](https://www.facebook.com/business/help/1717412048538897).

Este documento não comprova publicação real, acesso atual de um cliente nem aprovação da Meta. Esses estados só fecham com evidência executada no ambiente correspondente.

## 13. Passagem dos primeiros dez clientes para a plataforma

Esta seção organiza a passagem operacional dos dez clientes relatados pelo Victor. `C01` a `C10` são **lugares de controle**, não nomes de clientes, pagamentos confirmados, contas criadas ou acessos concedidos. Cada lugar começa sem estado operacional até que uma fonte verificável seja ligada a ele.

### Regras da passagem

1. Começar por **um** cliente-piloto autorizado. Os outros nove permanecem aguardando; não são processados em lote antes do aceite do piloto.
2. Não criar nova compra para cliente que já contratou. A contratação histórica precisa ser localizada e reconciliada com pessoa, negócio e acesso pela frente `E28-01-A`; se faltar o vínculo técnico LP → pedido → acesso, a pendência pertence a `E28-01-B`.
3. Não unir duas empresas porque usam o mesmo grupo, e-mail, telefone, responsável ou canal de WhatsApp. O vínculo é pelo negócio da V2G e seus IDs verificáveis.
4. Cliente não recebe papel no Meta for Developers. Acesso comercial é concedido por parceria/portfólio e limitado aos ativos necessários.
5. Acesso manual, leitura pela API e publicação pela API continuam com aceites independentes.
6. Nenhuma senha, token, código de 2FA, chave, cartão ou segredo entra nesta matriz.
7. “Pedido enviado”, “parceiro adicionado” e “campanha criada” não significam, respectivamente, pagamento confirmado, API autorizada ou anúncio em veiculação.

### Ficha copiável por negócio

Criar uma ficha desta para cada lugar `C01` a `C10`. Um campo sem fonte permanece `não verificado`; não completar por inferência.

```text
PASSAGEM PARA A PLATAFORMA — C__

Identidade e responsabilidade
[ ] Cliente/negócio identificado:
[ ] Fonte da identificação:
[ ] Responsável autorizado do cliente:
[ ] O que essa pessoa pode autorizar:
[ ] Gestor V2G responsável:

Contratação e conta V2G
[ ] Conta WebApp:
[ ] business_id:
[ ] Pedido/contratação histórica:
[ ] Estado da prova de pagamento/contratação:
[ ] Se falta reconciliação: E28-01-A / E28-01-B
[ ] Não foi criada nova compra para substituir contratação histórica:

Ativos Meta — preencher somente os usados
[ ] Portfólio empresarial — nome/ID/proprietário:
[ ] Conta de anúncios — nome/ID/proprietário:
[ ] Página — nome/ID/proprietário:
[ ] Instagram — @/ID/proprietário ou não usado:
[ ] Dataset/pixel — nome/ID/proprietário ou não usado:
[ ] Tarefas efetivamente concedidas em cada ativo:
[ ] Acesso manual comprovado em sessão do gestor:
[ ] Leitura pela API comprovada separadamente:
[ ] Publicação pela API comprovada separadamente:

Onboarding e primeira operação
[ ] Onboarding/marca:
[ ] Materiais recebidos e fonte:
[ ] Hipótese inicial registrada como hipótese:
[ ] Peça e versão exatas aprovadas:
[ ] Forma da aprovação registrada:
[ ] Orçamento, período e conta autorizados:

Campanha e dados
[ ] Campaign ID:
[ ] Ad set ID:
[ ] Ad ID:
[ ] Creative ID + versão da peça:
[ ] Fonte das métricas:
[ ] Período/fuso/atribuição da leitura:
[ ] Data/hora da coleta:
[ ] Vínculo negócio → conta → campanha → anúncio → criativo confirmado:

Controle da passagem
[ ] Etapa atual:
[ ] Evidência disponível:
[ ] Impedimento:
[ ] Responsável pelo impedimento:
[ ] Próximo ato único:
```

### Matriz dos dez lugares

As células vazias são intencionais. O estado só muda quando houver evidência ligada à ficha daquele lugar.

| Lugar | Cliente / `business_id` / conta WebApp | Contratação histórica e prova | Responsável cliente / gestor V2G | Ativos e proprietários | Onboarding, materiais, hipótese, peça e orçamento | IDs de campanha e contrato de métricas | Etapa / evidência / impedimento / dono / próximo ato |
|---|---|---|---|---|---|---|---|
| C01 | — | — | — | — | — | — | — |
| C02 | — | — | — | — | — | — | — |
| C03 | — | — | — | — | — | — | — |
| C04 | — | — | — | — | — | — | — |
| C05 | — | — | — | — | — | — | — |
| C06 | — | — | — | — | — | — | — |
| C07 | — | — | — | — | — | — | — |
| C08 | — | — | — | — | — | — | — |
| C09 | — | — | — | — | — | — | — |
| C10 | — | — | — | — | — | — | — |

## 14. Roteiro do gestor — um piloto antes dos outros nove

| Ordem | Ação real | Evidência mínima | Caminho manual válido / bloqueio |
|---|---|---|---|
| 1 | Selecionar um cliente-piloto autorizado; conferir identidade, contratação histórica, conta WebApp e negócio. | fonte da contratação, pessoa correta, `business_id` e ficha C__ aberta | se a prova histórica não fecha, encaminhar a `E28-01-A`; se o vínculo LP/pedido/acesso falta, `E28-01-B`. Não gerar nova compra. |
| 2 | O responsável do cliente adiciona a V2G como parceira e compartilha apenas os ativos necessários. O gestor testa o acesso manual. | portfólio, ativo, proprietário, tarefa concedida e sessão do gestor | reunião assistida de acesso. Não pedir senha/2FA, papel Developers, finanças ou controle total desnecessário. |
| 3 | Conferir nomes, IDs, proprietários e permissões contra as telas/fontes da Meta. | inventário datado e proprietário de cada ativo | acesso manual verde não torna API verde. Registrar leitura e publicação por API como aceites separados. |
| 4 | Entregar os contratos mínimos às frentes responsáveis. | handoff identificado pelo lugar C__, negócio e fonte dos IDs | para `07/08`: `business_id`, conta, owners, fonte, período e autorização de leitura; para `05/06`: negócio, materiais, hipótese e peça/versão aprovada. Nunca incluir token. |
| 5 | Depois da aprovação formal da peça exata, conta/orçamento corretos e autorização específica, o gestor publica manualmente. | aprovação, operador, horário e IDs retornados pela Meta | publicação manual é o caminho atual. Pedido enviado não é “no ar”; registrar estado lido na Meta. Publicação por API permanece capacidade separada. |
| 6 | Conferir os dados no app usando sessão comum do cliente, sem papel Meta Developers. | cliente vê somente o próprio negócio, conta e período; fonte e atualização visíveis | o operador ver a tela não substitui o cliente. Métricas seguem `E28-07-A/B/C`; ensaio externo com sessão comum é `E28-07-D`. |
| 7 | Fazer a conferência final com o cliente, registrar pendências e passar para a rotina. | aceite da passagem, impedimentos, dono e próximo ato | só replicar o processo para C02–C10 depois que o piloto cumprir o aceite abaixo. |

### Aceite do piloto

O piloto termina quando:

- pessoa, contratação, conta WebApp e `business_id` pertencem ao mesmo negócio;
- ativos necessários têm ID, proprietário, tarefa concedida e acesso manual comprovados;
- peça/versão, conta, orçamento e autorização da operação são inequívocos;
- publicação manual, quando autorizada, tem IDs e estado lido na Meta;
- dados exibidos ao cliente têm conta, fonte, período, fuso, atribuição e horário de coleta;
- dado ausente continua ausente/desconhecido, nunca vira zero inventado;
- outro negócio é negado e nenhum canal compartilhado une empresas;
- toda pendência tem dono e próximo ato.

### Método disponível, ação humana e capacidade futura

| Tema | Método já disponível | Ação humana necessária | Ainda não declarar pronto |
|---|---|---|---|
| Conta V2G | multiconta e onboarding preservados no recorte 03/04 | identificar o negócio correto e reconciliar contratação histórica | importação automática dos dez clientes |
| Acesso Meta | parceria e tarefas mínimas nos ativos | cliente concede; gestor confere manualmente | Developers para cliente, acesso implícito ou API liberada pela parceria |
| Peça | materiais e aprovação da versão pelo procedimento vigente | cliente aprova versão exata; gestor registra | geração/publicação automática por arrasto |
| Publicação | operação manual pelo Gerenciador quando autorizada | gestor confere conta, orçamento e autorização | publicação API sem aceite próprio |
| Métricas | contrato de leitura preparado pela frente 07/08 | entregar IDs/owner/fonte/período e comparar a mesma janela | números externos confiáveis antes de `E28-07-A/B/C/D` |
| Reunião | agenda externa do Google e confirmação por e-mail | conferir reserva, remarcar/cancelar pelo Google e guardar evidência humana | agenda própria, sincronização automática ou reserva única certificada |

### Handoffs sem segredo

- **Para 01/02:** lugar C__, pessoa/negócio, fonte da contratação histórica, pedido encontrado ou ausente e divergência objetiva. `E28-01-A` reconcilia pagamento, pessoa, negócio e próximo acesso; `E28-01-B` trata a continuidade do vínculo LP → pedido → acesso. Contrato/nota seguem o procedimento de `E28-02-A`, sem declarar assinatura ou emissão sem prova.
- **Para 05/06:** lugar C__, `business_id`, marca/materiais com fonte, hipótese identificada como hipótese, peça/versão exata, aprovação e autorização de orçamento. Não enviar token nem tratar peça aprovada como anúncio no ar.
- **Para 07/08:** lugar C__, `business_id`, conta de anúncios, campanha/conjunto/anúncio/creative quando existirem, proprietário/autorização, fonte, período, fuso, atribuição e horário de coleta. `E28-07-A` prova acesso/origem; `E28-07-B` liga campanha ao negócio; `E28-07-C` confere os números; `E28-07-D` ensaia cliente externo em sessão comum.

### Próximo ato humano único para iniciar

Victor escolhe **um** lugar para ser o piloto e fornece, por canal seguro: nome do cliente, fonte da contratação histórica, conta/e-mail WebApp, responsável autorizado do cliente, gestor V2G, ID do portfólio, nome/ID da conta de anúncios e da Página, mais Instagram/dataset somente se usados. O primeiro encontro apenas preenche a ficha, reconcilia a contratação e testa acesso manual; não cria nova compra, campanha, convite ou publicação por este documento.

## 15. Delta do piloto de agência com dois negócios

O cenário informado pelo Victor é uma agência/responsável que atende dois negócios clientes. Isso define o formato do ensaio, mas **não identifica** a empresa, os anunciantes, o contratante, o pagador, os proprietários dos ativos ou as permissões atuais.

### Papéis que permanecem separados

- **Agência/responsável:** pessoa ou empresa que coordena a operação e pode representar os negócios somente até o limite comprovado da sua autorização.
- **Negócio anunciante:** empresa cuja marca, oferta, materiais, conta de anúncios, Página, Instagram, campanha e métricas estão sendo operados.
- **Pagador/contratante:** pessoa ou empresa ligada à contratação da V2G e à prova financeira correspondente. Pode coincidir com a agência ou com um anunciante, mas isso não é presumido.
- **Operador V2G:** pessoa autorizada internamente a executar a passagem. A intenção de Cauã operar não comprova contratação, convite, atribuição ou permissão.

Uma mesma conta WebApp pode exigir seleção entre negócios autorizados, mas os dados continuam separados por `business_id`. Usar o mesmo responsável, e-mail, grupo de WhatsApp, agência ou pagador não autoriza unir onboarding, respostas, materiais, reunião, conta de anúncios ou métricas.

Uma conta de anúncios também **não vira automaticamente dois negócios** porque a agência atende ambos. Se a mesma conta aparecer nos dois inventários, a associação fica bloqueada para decisão humana até existir prova de proprietário, anunciante, contratação e regra comercial. Este documento não escolhe o desenho jurídico/comercial.

### Ensaio local reutilizado

A regressão local dirigida de 22/10 confirmou no código existente:

1. dois negócios autorizados exigem escolha explícita;
2. preferência/cookie não autoriza ID forjado, revogado ou pendente;
3. um terceiro usuário ou perfil sem pedido aprovado não recebe o negócio;
4. pedidos mistos não vazam liberação entre negócios;
5. abas antigas de onboarding/contas/marca não gravam após a troca de negócio;
6. retomada preserva respostas, contas, procedência e blocos do negócio correto;
7. onboarding concluído mantém reunião pendente até confirmação externa;
8. e-mail, calendário, CNPJ ou vínculo ambíguo de outro negócio não confirmam a reunião.

Isso fecha o cenário **LOCAL fictício** de 03/04. Não comprova a agência real, os dois clientes, o terceiro usuário real, QA, produção, acesso Meta ou API.

### Ficha mínima ainda ausente para autorizar o primeiro negócio real

Preencher somente para o primeiro negócio do piloto. O segundo aguarda o aceite do primeiro.

```text
PILOTO DE AGÊNCIA — PRIMEIRO NEGÓCIO

[ ] Nome cadastral da agência/responsável:
[ ] Pessoa autorizada e fonte do poder para representar o anunciante:
[ ] Nome cadastral e CNPJ do primeiro negócio anunciante:
[ ] Quem é o contratante da V2G e fonte da contratação histórica:
[ ] Quem é o pagador e relação comprovada com o anunciante:
[ ] Conta/e-mail WebApp que fará a seleção dos negócios:
[ ] business_id existente ou confirmação de que ainda precisa ser reconciliado:
[ ] Gestor V2G responsável; se for Cauã, estado verificável da autorização interna:
[ ] Nome/ID/proprietário do portfólio empresarial do anunciante:
[ ] Nome/ID/proprietário da conta de anúncios:
[ ] Nome/ID/proprietário da Página:
[ ] Instagram e dataset somente se usados, com ID e proprietário:
[ ] Confirmação de que nenhum desses ativos será associado ao segundo negócio por inferência:
```

Não incluir senha, token, código de 2FA, chave, cartão ou captura que exponha segredo. Com essa ficha conferida, o próximo ato é uma sessão assistida para testar **somente acesso manual** ao primeiro negócio. Leitura API e publicação API continuam aceites posteriores e separados.
