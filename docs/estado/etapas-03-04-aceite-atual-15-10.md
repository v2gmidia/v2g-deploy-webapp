# Etapas 03 e 04 — critérios de aceite atualizados em 15/10/2026

## 0. Ações pendentes

1. Victor revisar as mudanças locais e publicar o QA pelo fluxo habitual. Este lote permanece sem commit ou deploy feito pelo agente.
2. Obter autorização específica para aplicar **somente no QA** `20261015011547_proteger_pagina_compartilhada_multiconta.sql`; conferir versão e schema do banco compartilhado antes da aplicação.
3. Testar com sessão real e dois CNPJs aprovados. Nenhum conferidor local substitui a prova de que o menu, a troca, a perda de acesso e o isolamento funcionam no QA.
4. Para a agenda própria, configurar o acesso autorizado ao Google Calendar e a flag de QA, publicar, desativar a página pública anterior no momento da ativação e comprovar reserva única, convite, consulta, cancelamento e remarcação. A página antiga permite contornar a regra por CNPJ.
5. Para voz, configurar o provedor no QA e validar áudio real em português. A transcrição do navegador não comprova essa integração.

## Estado verificável

| área | preparado localmente | ainda sem prova |
|---|---|---|
| 03 · menu multiconta | Logo/nome/CNPJ, lista de negócios e troca em um clique; Adicionar negócio usa entrada e compra existentes; sair encerra a sessão local. | Navegação autenticada com dois CNPJs, abas simultâneas, perda de acesso e checkout público. |
| 03 · contas de anúncios | Código e migration local recusam mudança da Página compartilhada quando há duas contas ativas. | Migration não aplicada; concorrência real no QA; modelo de Páginas diferentes por conta não existe. |
| 04 · perguntas | CNPJ do pedido, autocomplete com Outros, praça validada, serviços/público/necessidade/entrega e lacunas do gestor. | Percurso visual no QA, toque no celular e ligação do pré-cadastro da LP ao pedido. |
| 04 · contas | Faixas sem ponto médio inventado, valor em reais e confirmação antes de gravar. | Retomada com respostas reais e correção na sessão autenticada. |
| 04 · marca | Logo, várias imagens, PDF, propostas de cores e confirmação; conclusão aguarda todos os envios e leituras. | Upload real, recarga, formatos do navegador, falhas e consulta pelo gestor no QA. |
| 04 · agenda e voz | Código da agenda autenticada e transcrição por provedor preparados atrás de configuração. | Ambos desativados; nenhuma reserva ou transcrição real comprovada. |

## Testes já executados

- `pnpm build`: passou após os últimos ajustes, com 42 páginas estáticas geradas.
- Multiconta: 28/28 testes locais. Preservação do onboarding: 72/72. Conciliação de agenda: 13/13 simulações.
- Cadastro, identidade, envio, contratação e acesso passaram separadamente. A suíte completa segue vermelha em `conferir:migrations`: 21 falhas no instrumento que consulta schema remoto, incluindo objetos de migrations antigas e a RPC da migration local ainda não aplicada. O ledger não está vinculado neste checkout.

**Critério de conclusão:** marcar 03 ou 04 como feitos somente após as provas autenticadas correspondentes. Build e testes simulados comprovam preparação local, não funcionamento publicado.
