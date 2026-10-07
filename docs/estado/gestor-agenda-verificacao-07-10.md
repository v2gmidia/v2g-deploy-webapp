# Gestor e agenda — verificação de 07/10/2026

## Entregue localmente

- `/gestor` é uma carteira interna de leitura, exclusiva do papel operador. Reúne negócios reais, pedidos Pix, contrato, andamento do onboarding, campos de cadastro e quantidade de contas vinculadas. Ordena comprovantes recebidos para conferência, sem convertê-los em pagamento confirmado. Negócios anteriores ao fluxo de compra são identificados como legados. Abre a ficha já existente em `/revisar-perfil`.
- A tela não apresenta gasto, saldo, compras, ROAS ou reunião marcada: essas informações ainda não têm fonte conciliada nesta rota. Tampouco há atribuição de um negócio a um gestor específico. A próxima etapa do “supergestor” é ligar responsáveis, fila de tarefas e alertas com fonte e horário da medição. Os painéis de resultado, ritmo de verba e criativos das referências dependem primeiro de dados de mídia confiáveis por conta e período; métricas de venda exigem atribuição própria.
- `/onboarding/concluido` deixa explícito o próximo passo e abre a agenda pública, sem registrar reserva no WebApp. A primeira campanha permanece sob publicação manual do gestor.

## Interface e agenda vistas

- Na sessão autenticada de Victor em produção, `/revisar-perfil` mostrou cinco negócios reais e fichas consultáveis. `/escolher-negocio` listou um negócio; “Abrir negócio” levou a `/inicio` com esse negócio. Não apareceu segundo CNPJ na sessão, portanto troca e isolamento entre dois negócios não foram comprovados na interface.
- A sessão local de desenvolvimento não tinha autenticação válida: `/gestor` redirecionou para `/entrar`. A rota compilou no build, mas a carteira nova não foi vista autenticada nem publicada. A tela de conclusão real mostrou onboarding incompleto, e a marca continha respostas salvas; nenhuma resposta real foi alterada para forçar a conclusão.
- Uma fixture apenas de desenvolvimento apresentou conclusão completa. O botão “Escolher horário da reunião” abriu a página real “Reunião inicial V2G”, de 25 minutos, com horários e formulário de nome, e-mail e CNPJ. Um horário foi aberto e cancelado antes do envio; nenhuma reunião foi criada. O Google informa que o Meet entra após a reserva.
- Na agenda autorizada de Victor, 12/10/2026 foi bloqueado por feriado. Após salvar e recarregar a página pública, esse dia apareceu sem horários; 13/10 continuou com vagas. A agenda segue com segunda a sexta, 10h–18h, intervalo de 15 minutos e antecedência mínima de uma hora, divergente dos 30 minutos desejados. A janela de sete dias corridos pode não garantir cinco dias úteis, sobretudo após sexta-feira ou feriado.

## Testes e limites

- `pnpm typecheck`, build com servidor de desenvolvimento parado, 5 testes do portfólio, 12 de multiconta, 31 de preservação do onboarding, 4 de contratação e 4 de acesso: passaram.
- `pnpm conferir` parou em `conferir:migrations`: a migration RevOps `20261007160925_revops_v0.sql` existe localmente e seus objetos ainda não constam no Supabase. Não foi aplicada nem alterada nesta verificação. Os conferidores após esse ponto foram executados apenas quando pertinentes, individualmente.
- Sem reserva real não foram testados e-mail de confirmação, remarcação, cancelamento, Meet efetivo ou conciliação com o WebApp. Sem dois CNPJs no mesmo login não há prova de navegação multiconta entre empresas. Sem autenticação local do operador, não há prova visual da carteira nova.

## Próximo contrato técnico

Para chamar uma reunião de “marcada” no WebApp, associar `business_id` e `order_id` a um evento do calendário com e-mail/CNPJ conferidos, guardar `calendar_id`, `event_id`, versão, horários, fuso e estado; processar remarcação/cancelamento de forma idempotente. Até isso existir, o convite do Google é a fonte para cliente e gestor. Avisos por WhatsApp precisam de provedor e consentimento separados.
