# V2G — guia de execução de outubro de 2026

Retrato de 08/10/2026. Este guia recorta o quadro FigJam [V2G — fluxo do app v2 | 01 Entrada e conversão](https://www.figma.com/board/HENfICJLQ8SToXzDU1LB9N/) e o plano de outubro–dezembro. O quadro original mostra a jornada pretendida, variantes antigas, cobrança recorrente e escala operacional; **não é uma lista de entregas concluídas nem um recorte exclusivo de outubro**. Este arquivo acompanha apenas o que precisa ser decidido, construído ou provado em outubro. O marco de 28/10 (G4) e a continuidade de 29–31/10 vêm do plano; confirmar agenda e responsáveis antes de tratá-los como compromisso público.

Quadro visual deste recorte: [V2G | Outubro 2026 | Jornada do cliente](https://www.figma.com/board/sQrIlGhDDaqHUtV2WacWSg/), com um segundo fluxo de validação, integrações e operação até 31/10 no mesmo arquivo.

## Como ler o estado

- **Código local:** a função existe no checkout consultado. Pode ainda não estar publicada ou exercitada com sessão e dados reais.
- **Validar:** há implementação ou serviço externo, mas falta prova ponta a ponta no ambiente pertinente.
- **Construir:** não há fluxo operacional completo no produto.
- **Dependência:** precisa de decisão, acesso, minuta, integração externa ou responsabilidade humana identificada.

Nenhuma linha abaixo autoriza cobrança, emissão de nota, assinatura, reserva ou publicação de anúncio. “Concluído” exige evidência da fonte que efetivamente executa a etapa.

## Caminho crítico do cliente

| Passagem | Estado em 08/10 | O que fecha a entrega de outubro |
|---|---|---|
| LP → pré-cadastro → contato comercial | **Código local; validar publicação.** A LP e o WebApp têm links de ida e volta e caminho de contato assistido. A LP é outro repositório; a gravação real do lead e a versão pública dessa alteração não foram comprovadas nesta revisão. | Testar lead único, consentimento, origem, qualificação e contato na versão publicada. Sem CNPJ ou venda por WhatsApp declarados, impedir a compra. Instagram fraco orienta, não veta. |
| Compra assistida por Pix | **Código local; validar.** `/pedidos` registra pedido, comprovante e aprovação humana separados. Envio do comprovante sozinho não libera acesso. | Percorrer com dados de QA: pedido, comprovante, aprovação por operador identificado, repetição e contestação; conferir o comprador e a unidade contratada. |
| Compra direta e cartão | **Construir.** Não há checkout self-service nem confirmação por webhook Asaas testada. Link de cartão é assistido manualmente. | Definir/implementar cobrança e eventos idempotentes em sandbox; conferir pagamento antes de liberar acesso. |
| Acesso e multiconta | **Código local; validar interface.** Pedido aprovado e e-mail verificado controlam entrada nova; há seleção explícita e isolamento por negócio, com testes simulados. | Testar no navegador dois CNPJs no mesmo e-mail, uma compra aprovada e outra pendente, troca em duas abas, acesso revogado e ações antigas. Negócios legados precisam de reconciliação com novas unidades. |
| Onboarding | **Código local; validar interface.** Os blocos preservam respostas e procedência, retomam após interrupção e concluem como `agendamento_pendente`. “Não sei” fica distinto de campo vazio. | Completar e retomar com sessão real de QA; conferir campos mínimos, falha de gravação, correção e ausência de envio duplicado ao backend. |
| Agenda | **Link externo ativo; validar integração.** O botão final abre a página Google de 25 minutos de Victor. O WebApp não sabe se houve reserva, remarcação ou cancelamento. | Vincular evento confirmado a negócio e pedido, registrar estado idempotente e testar confirmação, remarcação, cancelamento e falta de vaga. A página está com antecedência mínima de 1 hora, acima dos 30 minutos desejados, e sua janela de 7 dias corridos não garante 5 dias úteis. |
| Contrato | **Preparado; dependência.** Há modelo parametrizado e estado de assinatura pendente, sem minuta jurídica aprovada nem envio automático. | Revisar/versionar minuta, coletar poderes do signatário, configurar provedor com API em sandbox, provar assinatura de Victor e do representante, arquivar e entregar cópia final. A campanha fica bloqueada até assinatura comprovada também no serviço publicador. |
| NFS-e | **Contrato técnico; dependência.** Regime Simples Nacional, item 17.06 e código municipal 170601000 foram informados; não houve emissão. | Validar configuração fiscal e campos do tomador com contador/Asaas; testar solicitação, autorização, rejeição, idempotência e entrega em sandbox. Só exibir “emitida” após autorização do emissor. |

## Trabalho do gestor e dado confiável

| Frente | Estado em 08/10 | O que fecha a entrega de outubro |
|---|---|---|
| Carteira e ficha | **Código local; validar interface.** `/gestor` reúne negócios, pedidos, onboarding, contas e última execução/campanha; `/revisar-perfil` mostra respostas e procedência. A tela nova ainda não foi vista autenticada. | Entrar como operador, verificar filtros e cada ficha; definir responsável por conta, fila de tarefas, prioridade, prazo e estados com fonte real. Medir tempo antes de afirmar capacidade de 50 contas. |
| Resultado para o gestor | **Construir contrato de leitura.** A camada de resultado atual está autorizada para o negócio da sessão do cliente; uma rota interna que tentou reutilizá-la foi retirada por falhar o portão de identidade. | Backend oferecer leitura autorizada por operador e por negócio, com conta, período, horário da coleta e estado; só então mostrar gasto, contatos e criativos na carteira. Conversa não equivale a venda. |
| Acessos e primeira peça | **Processo manual; construir registro.** A reunião deve levantar permissões e escolher o primeiro criativo. | Checklist por negócio e gestor com pendências, responsável, prazo e evidência. Resolver lacunas sem afirmar campanha pronta. |
| Novos criativos | **Análise parcial; construir fila.** `/criativos` analisa imagem quando há execução, mas não registra submissão durável nem tarefa do gestor. | Submissão idempotente ligada ao negócio, arquivo privado, fila, decisão humana e aviso ao cliente; publicação manual e estado da Meta separados. |
| Primeira campanha e pós-veiculação | **Publicação manual decidida; validação operacional pendente.** O WebApp tem pré-voo e fila de ativação, mas isso não prova criação/publicação da primeira campanha, nem autorização final no backend. | Conferir pagamento, assinatura, conta vinculada, acessos e criativo; gestor publica manualmente. Mostrar “no ar” apenas após leitura da plataforma, registrar falha e rotina de acompanhamento. Nenhuma capacidade de 50 contas está medida. |
| RevOps e dados 1P | **Código local incompleto para uso real.** `/revops` e migration existem, mas os objetos não constavam no banco na última verificação; não houve importação nem autorização de usuário. | Reconciliar ledger e revisar migration antes de aplicar; definir retenção, IDs canônicos, fontes e vínculo com Finance. Testar fatos, relatos e inferências separados. |

## Preparação para 28–31/10 fora do código

1. **Demonstração de 28/10:** percorrer cliente e gestor com dados de QA e registrar evidência por transição. Mostrar etapas manuais e pendentes como tais.
2. **Equipe:** confirmar gestor inicial, disponibilidade e acesso; escolher e treinar SDR para o pós-evento conforme o marco proposto no plano. Atribuir dono a suporte e acompanhamento de cada cliente.
3. **Comercial e canais:** verificar pitch, proposta, LP publicada, WhatsApp Business, Instagram, LinkedIn e captura de origem; não prometer resultado ou prazo sem fonte.
4. **29–31/10:** registrar leads e aprendizados do G4 com origem, consentimento, responsável e próxima ação; iniciar acompanhamento sem contar contato como venda.
5. **Imagem/Media Intelligence:** fechar escopo demonstrável e revisão humana antes de anunciar geração de imagem até o G4 ou um documento de inteligência como produto pronto. São frentes propostas no plano, ainda sem critério de aceite aprovado neste repositório.

## Ordem de fechamento

1. Validar sessão real do cliente e operador: Pix assistido, dois CNPJs, onboarding, agenda e ficha.
2. Fechar as dependências jurídicas e fiscais e testar provedores em sandbox; manter assinatura e nota como pendentes até prova externa.
3. Entregar ao gestor fila de trabalho, checklist e leitura autorizada de resultados; testar criativo e primeira publicação manual em ambiente apropriado.
4. Fazer a demonstração completa de outubro, registrar falhas e só então declarar cada etapa concluída/publicada.

## Fontes e limites deste retrato

`docs/decisoes.md`, `docs/mapa-execucao-outubro-dezembro-2026.md`, `docs/estado/handoff-outubro-07-10.md`, `docs/estado/gestor-carteira-execucoes-07-10.md`, `docs/estado/gestor-agenda-verificacao-07-10.md`, `docs/estado/revops-v0-local-07-10.md`, `docs/estado/assinatura-provedor-07-10.md` e leitura do quadro FigJam em 08/10. Git em `main` limpo no início da leitura. Este mapeamento não consultou produção, Asaas, Meta, agenda privada ou banco em 08/10 e não reexecutou testes; os resultados registrados nos handoffs são evidência anterior, não prova nova.
