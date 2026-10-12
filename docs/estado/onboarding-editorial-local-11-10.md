# Onboarding editorial local — 11/10/2026

## Resultado desta rodada

`/onboarding` mostra uma pergunta por tela, com progresso, marca editorial da V2G, revisão das respostas anteriores e entrada por voz **somente** na descrição aberta. A fala preenche o campo por reconhecimento do navegador; a pessoa revisa e clica para salvar. O WebApp não guarda áudio. Em navegador sem reconhecimento, o teclado continua disponível e a limitação é informada. A gravação segue pela ação autenticada já existente, por negócio, sem trocar o contrato do banco. `/onboarding/contas` e `/onboarding/marca` receberam o mesmo cabeçalho e fundo editorial; contas já mostra uma pergunta numérica por vez. A lógica de confirmação, “não sei” e retomada dessas etapas foi preservada.

O bloco inicial passou de quatro para seis respostas: nome do negócio, praça, descrição, Instagram, site e ramo. Site e Instagram usam a validação já existente da etapa da marca e gravam nas colunas desse mesmo negócio, com a resposta original no JSON. “Não tenho” limpa um endereço antigo quando existir; falha de limpeza não marca a pergunta como respondida. A etapa da marca já abre com “Não tenho site” marcado quando a declaração veio deste bloco. A abertura antiga `inicio` não cria mais um clique obrigatório. Respostas antigas permanecem legíveis e editáveis. O envio incerto exige recarregar antes de repetir; um clique durante a gravação fica desativado.

Se a pessoa corrigir o site depois de concluir a etapa da marca, a conclusão deixa de valer até revisar e salvar a marca novamente. A tela da marca usa a coluna atual para não exibir simultaneamente um endereço preenchido e “Não tenho site” marcado. As quatro respostas básicas anteriores continuam como critério de retomada legada; as duas perguntas novas são exigidas na progressão desta interface, sem invalidar cadastros que já estavam concluídos.

## Evidência

- `pnpm typecheck` e `pnpm build` passaram após os ajustes. O detector visual do repositório retornou `[]` para os três arquivos novos da tela.
- `pnpm conferir:onboarding-preservacao`: 60 cenários passam após a ampliação, incluindo validação de site/Instagram/CEP, “não tenho”, falha de limpeza, troca de negócio, falhas parciais, retomada e bloqueio do pipeline na jornada de reunião.
- No navegador local autenticado com a **Empresa 1 fictícia de QA**, a tela exibiu as três respostas existentes, bloqueou escolha de raio sem cidade e salvou `São Paulo · Só aqui perto (até 5 km)`. Depois aceitou “Não tenho Instagram” e “Não tenho site”. Recarregar mostrou as seis respostas. Nenhum envio final ao backend foi acionado no navegador. A empresa de QA é fictícia; isso não prova o percurso de uma compra real.
- No mesmo navegador local, `/onboarding/contas` exibiu a pergunta de ticket sob a nova identidade, sem enviar valor fictício; `/onboarding/marca` exibiu o resumo das respostas e a trava correta para contas ainda não concluídas. O campo de aparência da marca não ficou disponível nessa fixture, portanto seu visual e a revisão de uma marca já concluída ainda não tiveram prova visual.
- Na correção da praça, a interface mostrou cidade e CEP opcional. Um CEP com letra foi recusado com mensagem específica e não mudou a resposta; a correção foi cancelada. `/onboarding/concluido` permaneceu em “ainda não terminou” quando as contas estavam pendentes. O CEP válido foi coberto pelos testes locais, sem registrar CEP de teste na conta pelo navegador.
- Inspeção visual em largura normal e 375 px: título, formulário, revisão e marca editorial visíveis sem corte horizontal. A pergunta de ramo e a de descrição foram inspecionadas em modo de correção, sem modificar seus valores.

## Diferença entre a V4 e a jornada atual

A bancada V4 (`app/exemplo/_onboarding`) contém onze perguntas: pessoa, empresa, alcance/CEP, descrição, Instagram, site, ramo, WhatsApp do anúncio, verba, material e conexão. Não está ligada à persistência autenticada. Desde 05/10, a decisão vigente coloca acessos e primeiro criativo na reunião; `/onboarding/contas` calcula ticket/custo/lucro e `/onboarding/marca` guarda site, Instagram e aparência. Copiar a bancada inteira apagaria essas regras e poderia aparentar que material, conta de anúncios ou reunião foram confirmados.

Victor confirmou a adaptação da V4 às decisões atuais. Mapeamento aplicado:

| Pergunta V4 | Destino real | Situação |
| --- | --- | --- |
| Nome da pessoa | cadastro autenticado em `profiles.full_name` | Já coletado no primeiro acesso; não pedir de novo |
| Nome da empresa | primeira pergunta de `/onboarding` → `businesses.name` | Local, testado |
| Alcance e CEP | pergunta de praça → `city`, `radius_km`, `cep` quando informado | Local; CEP opcional validado antes de salvar; texto livre não inventa raio |
| O que vende | pergunta de descrição → `description` | Local; voz opcional com revisão do texto, microfone ainda sem teste falado |
| Instagram | pergunta do bloco inicial → `instagram_handle` | Local; pode declarar ausência |
| Site | pergunta do bloco inicial → `site_url` | Local; pode declarar ausência |
| Tipo de negócio | seletor com lista viva → `niche` | Local; queda da lista permite texto explícito |
| WhatsApp que recebe clientes | negócio, distinto do WhatsApp pessoal | Não aparece como dado confirmado: a migration `0022_whatsapp_do_anuncio.sql` e lista branca ainda exigem reconciliação; confirmação prevista na reunião |
| Verba mensal dos anúncios | `/verba`, com vínculo ao negócio | Tela existente; link incluído na conclusão, sem confundir com mensalidade V2G |
| Logo, fotos e primeiro criativo | reunião com gestor | Não se afirma envio nem validação no questionário |
| Conexão e acesso à conta de anúncio | reunião com gestor | Não se afirma autorização nem publicação no questionário |

As três contas de ticket, custo e lucro permanecem em `/onboarding/contas`, pois a decisão posterior preservou perguntas com confirmação de cálculo e opção “não sei”; removê-las exigiria alterar o contrato de cadastro. A conclusão continua registrando `agendamento_pendente`, jamais reserva efetiva.

Próximo bloco: conciliar o WhatsApp do anúncio com o schema e a lista branca antes de abrir a pergunta real; validar a tela da marca com contas concluídas. A transcrição por serviço externo ainda exige contrato de dados e limite de uso; não faz parte da implementação atual. O reconhecimento de voz pelo microfone ainda precisa de teste falado no navegador com permissão concedida. A interface de QA publicada **continua V1** até Victor commitar e publicar a alteração local.
