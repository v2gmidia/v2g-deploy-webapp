# Verificação após o commit de 07/10/2026

Leitura feita sem criar pedido, reserva, cobrança, assinatura ou anúncio.

## Confirmado

- Git local limpo em `b426961` (`Trabalho noturno do dia 6/10 -> 7/10`). O painel Vercel mostrou o deployment de produção `Ready` com esse mesmo commit. Isso confirma a versão publicada, não um fluxo autenticado completo.
- No painel Asaas da V2G, `Minha conta → Situação cadastral` mostrou dados comerciais, documentos e aprovação geral como `Aprovado`. Não foi criada cobrança nem verificada integração de API, sandbox, configuração fiscal ou assinatura eletrônica.
- O link público `https://calendar.app.google/fVuTY4UKo7wYepys9` abriu a página `Reunião inicial V2G` de Victor: 25 minutos, horários disponíveis, formulário com nome, sobrenome, e-mail e CNPJ. A prévia de um horário foi aberta e fechada antes de `Reservar`. Nenhuma reunião foi marcada. A disponibilidade vista na página não comprova que o WebApp recebe, reconhece ou cancela a reserva.
- Consulta somente leitura ao banco V2G-SITE retornou 5 negócios reais, 0 pedidos, 0 perfis com dois ou mais negócios reais e 4 contas de anúncio. Há 1 usuário com papel `operador` entre 10 usuários autenticados. Portanto existe um perfil previsto para a ficha, mas não há amostra real para validar a troca entre CNPJs ou o fluxo de aprovação Pix.
- Conferidores específicos: ficha do operador 15/15, multiconta 12/12 e acesso 4/4. Esses testes simulam estado e regras; não são prova visual autenticada.
- A ficha `/revisar-perfil` é uma tela de operador autorizada por `app_metadata.papel = operador`. Ela lista negócios reais incompletos e permite abrir os campos e a procedência também dos completos, até 1.000 linhas por consulta; o recorte é anunciado. Histórico das respostas de praça, marca e três contas aparece separado dos valores atuais. Pedidos Pix ficam em `/pedidos`; reserva, contrato, nota, criativos e atividade de campanha ainda não formam uma visão única por cliente nessa ficha.

## Limites e próximos testes

- O navegador disponível abriu `/entrar` sem sessão; a ficha do gestor, a troca entre negócios, a aprovação Pix e a retomada de um cliente ainda precisam de teste autenticado com contas de QA e dados descartáveis.
- A documentação oficial do Asaas informa que a tela `Novo Contrato` do Base automatiza cobrança e nota fiscal, mas **não redige cláusulas legais nem oferece assinatura eletrônica de documentos**: https://central.ajuda.asaas.com/hc/pt-br/articles/41135582136987-Para-que-serve-a-tela-Novo-Contrato-no-Base. A conta Asaas aprovada não resolve, sozinha, a escolha de um provedor de assinatura.
- A ajuda do Google descreve o cancelamento de reunião reservada pela página de confirmação e por e-mail, mas o fluxo de cancelamento/remarcação do cliente da V2G e a sincronização com o WebApp não foram testados: https://support.google.com/calendar/answer/10737245.

Próxima rodada guiada: entrar como operador e como cliente de QA; criar duas compras fictícias para dois CNPJs sob o mesmo e-mail, registrar comprovante e aprovar somente uma; conferir a lista permitida, troca, ficha e retomada; limpar fixtures de QA somente com identificação e autorização específicas. Não usar cliente real nem cobrar.
