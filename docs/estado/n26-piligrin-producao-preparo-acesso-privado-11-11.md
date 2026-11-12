# Piligrin em produção — preparação e cadastro privado pendente

## 0. Próxima ação

> ATUALIZADO em 11/11/2026: Victor escolheu o usuário existente, recuperou o acesso privadamente e confirmou o login. A criação de outro usuário deixou de ser necessária. A entrada produtiva ainda abriu onboarding de anunciante. A decisão nova exige agência e Dúú separados; o preparo misto foi bloqueado antes da aplicação. Estado e pacote proposto em `n26-piligrin-agencia-sem-onboarding-proprio-11-11.md`. O restante deste documento preserva o diagnóstico anterior.

11/11/2026. Victor autorizou preparar a Piligrin em produção com seu e-mail e os dados do Dúú, preservando tudo, sem cobrança ou publicação de anúncios. Pediu para preencher pessoalmente e-mail, senha e CPF/CNPJ quando necessário.

**Etapa privada preparada:** Supabase, projeto **V2G-SITE / main PRODUCTION**, `ushccxpoxjikzqnwhgfd`, Authentication → Users → Create new user. Formulário vazio de e-mail e senha deixado aberto para Victor. Nenhum campo privado foi preenchido pelo agente; botão Create user não foi acionado pelo agente.

Pergunta assíncrona enviada com o e-mail já confirmado nesta conversa e instrução de criar a senha privadamente. A opção padrão visível Auto confirm user está marcada; a interface informa que esse cadastro administrativo não envia confirmação por e-mail. Victor foi informado desse comportamento. Esse formulário não tem CPF/CNPJ; não pedir esse dado no chat nem preencher por inferência.

**Dependência atual: Victor concluir o cadastro e avisar.** Depois, conferir apenas metadados do novo usuário/perfil e preparar vínculo nominal com os dados autorizados. Criar o login não prova que o negócio ou sua carteira já estejam liberados.

## 1. Diagnóstico e preservação já concluídos

Consultas `READ ONLY`, sem DML, identificaram em produção:

- seis negócios anteriores, dez perfis anteriores, zero pedidos/eventos comerciais;
- ausência de `agency_advertisers`, `manager_accounts` e `historical_contract_access` entre as tabelas consultadas;
- `webapp_legacy_access` existente, com marcos históricos de 07/10/2026;
- acesso normal exige elegibilidade comercial, concessão válida ou legado aplicável. Não criar pedido pago fictício, recuar datas de criação ou promover Victor a operador para contornar a ausência de acesso;
- o caminho de carteira de agência atual no código está limitado ao projeto QA. Não declarar paridade das quatro telas em produção apenas por criar usuário/negócio.

O caminho produtivo de acesso e apresentação exige revisão específica dessas dependências. Nenhuma tabela/migration, concessão, papel ou flag foi alterada neste preparo. As credenciais e conexões Meta da QA não foram lidas/copiedas para produção.

## 2. Dados do Dúú preparados para mapeamento

Fonte nominal QA preservada: negócio `9cb85308-02cc-4ce7-bacf-15be77f9ba5e`, hoje com contexto histórico Piligrin/Dúú. Selecionadas somente respostas operacionais e metadados necessários; não exportado Auth, documentos, pagamentos ou tokens.

- anunciante Dúú Gomes; contratante Piligrin; indústria de chope de vinho;
- público principal: empresas, bares e pontos de venda;
- atendimento: todo o estado do Rio de Janeiro;
- destino WhatsApp e campanha existente declarada;
- teto de investimento: R$ 3.000/mês;
- referência aproximada de R$ 69–70 por fardo, com origem/data preservadas; não é preço da mensalidade V2G nem venda medida;
- cores `#2B1B3F`, `#E9B7F9`, `#BACC9E`; ausência de site confirmada.

Não foram inventados custo, margem, métrica, identificação Meta, data de campanha, agendamento ou estado de execução. Os campos canônicos ausentes na fonte continuam ausentes neste mapeamento. Nenhum criativo/arquivo foi reatribuído ou reavaliado como se fosse uma decisão produtiva nova.

Metadados/fingerprints anteriores e fonte operacional selecionada foram gravados em `C:/Users/victo/.codex/private-backups/v2g/piligrin-producao-20261111/`. São prova de preservação e preparo, não backup integral de recuperação de toda a base. Nenhuma escrita produtiva do agente ocorreu.

## 3. Resposta do Cauã e limite do encerramento

A dependência **receber a resposta do gestor sobre a data da arte** foi atendida. Consulta no grupo correto e dois áudios transcritos constam de `n26-recebimento-dia15-caua-analise-11-11.md`.

Cauã respondeu “Na campanha atual é 22 de junho mesmo” à pergunta citada sobre a versão da arte no AD 01 `52570262604075`. Isso é declaração do gestor; não transforma data de criação em primeira impressão confirmada, nem substitui um registro legítimo feito no fluxo de publicação do gestor.

Ainda não foi comprovado o encerramento integral de M3/M4, com rodada operacional, revisão e aceite/retorno final à Piligrin. Os áudios acrescentaram os pedidos de CTR, CPM, resultado/custo por resultado e abertura dos números em visualização mais organizada. Não confundir essa evolução com pendência de resposta do Cauã ainda não recebida, nem usá-la para bloquear a preparação de conta solicitada por Victor.

Sem envio no WhatsApp, nova cobrança, anúncio, Meta write, n8n, alteração de credenciais, permissão, banco, commit, push, merge ou publicação. O cadastro privado do próprio usuário é a ação humana pendente, não um resultado já observado.
