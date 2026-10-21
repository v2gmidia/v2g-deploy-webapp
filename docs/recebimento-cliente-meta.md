# Recebimento de cliente na Meta

**Estado:** procedimento operacional proposto, pronto para validação com um cliente-piloto  
**Atualizado em:** 21/10/2026  
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

### Backend

- O cliente Meta do backend está em Graph API `v23.0` (`backend_v2g/src/meta/graph.py:67`).
- Existe suporte interno a token por pedido, isolado por contexto concorrente (`backend_v2g/src/meta/graph.py:112-162`).
- O caminho atual de `POST /campanhas` monta `PedidoDeSubida` sem preencher `token_de_acesso` (`backend_v2g/src/api/rotas.py:3398-3409`). Na prática, o runtime cai na credencial de System User configurada no backend.

### n8n

- O export versionado ainda pede manualmente “Conta de anúncio” e “ID da Página” no passo “Subir na Meta?”.
- Esses valores são enviados a `/campanhas` junto de `id_execucao` (`backend_v2g/n8n/V2G - BACKEND.json:2259`).
- O workflow ao vivo aparece ativo, mas seu conteúdo não pôde ser lido pelo conector disponível. Portanto, **não está comprovado** que o export local é idêntico à versão ativa.

### Inconsistências que precisam ser fechadas antes da automação total

1. WebApp e backend usam versões diferentes da Graph API (`v25.0` e `v23.0`). Isso é dívida de alinhamento, não a causa comprovada da rejeição.
2. A WebApp captura token de usuário, mas a publicação atual do backend usa System User por padrão.
3. O n8n ainda aceita IDs digitados pelo operador, o que cria risco de cruzar clientes.
4. A narrativa anterior de App Review misturou conexão do usuário com publicação por System User.

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

## 12. Fontes e limites

- Código local da WebApp e do `backend_v2g`, inspecionado em 21/10/2026.
- Export versionado do n8n, não certificado como cópia do workflow ao vivo.
- Feedback da Meta fornecido pelo Victor para a submissão rejeitada.
- Documentação oficial: [níveis de acesso da Graph API](https://developers.facebook.com/docs/graph-api/overview/access-levels/), [acesso a Páginas](https://www.facebook.com/help/289207354498410/) e [adicionar parceiro ao portfólio empresarial](https://www.facebook.com/business/help/1717412048538897).

Este documento não comprova publicação real, acesso atual de um cliente nem aprovação da Meta. Esses estados só fecham com evidência executada no ambiente correspondente.
