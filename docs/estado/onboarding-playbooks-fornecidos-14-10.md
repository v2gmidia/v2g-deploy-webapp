# Onboarding V2G — aproveitamento dos playbooks enviados em 14/10/2026

## 0. Estado e decisões pendentes

Victor pediu que os três playbooks de sua outra operação fossem analisados como referência, com um recorte único: **obter dados para preparar o primeiro anúncio do negócio comprado**. O código abaixo é local e não está no QA publicado. A migration de reserva única foi aplicada apenas ao Supabase de QA, mas a agenda própria permanece desligada até haver autorização Google Calendar, configuração do QA, publicação e teste real.

Em 14/10 Victor refinou as perguntas. O código local agora separa nome comercial, nicho, alcance, catálogo de produtos/serviços, oferta inicial, comprador, motivo da procura, entrega, diferencial e prova disponível. O ticket médio já vive no bloco de contas. Instagram e site continuam na etapa da marca e saíram da ordem do primeiro bloco para evitar repetição; respostas antigas permanecem guardadas. Oferta, motivo, diferencial e prova são lidos na carteira do gestor como declarações, sem disparar segmentação ou IA. O primeiro bloco continua gravando uma resposta por vez, com retorno do banco; o tempo de cada gravação no QA ainda precisa ser medido após publicação.

**Dados da LP:** a LP coleta nome do negócio, nicho, Instagram, CNPJ e consentimento, mas o pré-cadastro do V2G-SITE ainda não tem ligação identificada com o pedido do QA. Portanto, a nova tela não reaproveita esses campos automaticamente. A compra fornece CNPJ e razão social; razão social não é necessariamente o nome da marca. A ponte LP → pedido → negócio precisa de identificador explícito e prova de vínculo, preservando origem e consentimento, antes de qualquer preenchimento sugerido.

## O que aproveitamos

| Fonte enviada | Elemento útil para a V2G | Aplicação no produto |
| --- | --- | --- |
| Protocolo 01 | Separar o que o cliente vende, para quem e qual resultado real entrega; registrar lacunas em vez de inferir | A descrição pergunta qual oferta vai para o primeiro anúncio; duas perguntas novas capturam comprador e resultado. “Ainda não sei” exige segunda confirmação e chega como pendência, sem virar público ou promessa inventada. |
| Protocolo 01 | Resposta com origem e handoff estável | As respostas continuam sob chaves nomeadas em `businesses.onboarding.respostas`; a carteira do gestor mostra os dois campos como **declarações do cliente**, distinguindo ausente, informado e não soube explicar. |
| Protocolo 02 | Respeitar a identidade visual já existente | Logo principal, até seis imagens adicionais e PDF de referência sustentam uma paleta proposta. A cor só vira dado confirmado depois do aceite do cliente. O gestor continua responsável por conferir as referências completas. |
| Protocolo 03 | Adequar a preparação à realidade de quem atende as mensagens | A reunião continua conferindo o WhatsApp que receberá interessados. O questionário não presume equipe comercial, CRM ou capacidade de vendas. |

## O que ficou fora

Não transplantamos diagnóstico de posicionamento, índices próprios dos playbooks, 20 roteiros de conteúdo, reformulação de site, automação de scripts comerciais, porcentagens de canais, promessa de performance, público inferido ou funil de vendas completo. Isso aumentaria o tempo do cliente e criaria dados que a V2G não usa para preparar o primeiro anúncio. Nenhum prompt dos playbooks foi conectado ao n8n ou executado com dados reais nesta rodada.

## Como os dados seguem

1. Pedido aprovado identifica o CNPJ e o negócio; o onboarding não pede outro CNPJ.
2. Nome, atividade, praça e descrição continuam alimentando os campos existentes. As perguntas novas guardam o relato bruto no JSON do mesmo negócio, sem substituir a descrição ou mexer em contas.
3. Resposta curta às perguntas novas é recusada. “Ainda não sei” só é salvo após uma segunda confirmação e aparece como lacuna para a reunião.
4. A carteira do gestor exibe o público e o resultado **como fala do cliente**. Isso não é validação da segmentação, autorização de promessa publicitária ou ordem de publicar anúncio.
5. O gestor confirma oferta, destino da conversa, materiais, acessos e restrições na reunião antes da primeira campanha manual.

## Verificação

`node --test scripts/conferir-onboarding-preservacao.mjs` passou com 67 casos, incluindo gravação do público, recusa de resposta rasa, lacuna explícita e preservação das contas. A agenda do QA ainda não fez reserva pelo WebApp; a tabela nova estava vazia após a aplicação.
