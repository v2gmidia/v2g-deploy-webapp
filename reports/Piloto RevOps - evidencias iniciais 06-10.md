# Piloto RevOps — evidências iniciais

Leitura de 06/10/2026. Este arquivo é um mapa de fontes e hipóteses para revisão dos fundadores. Não importa conversas para o banco, não comprova pagamentos e não transforma o resumo do Gemini em decisão vigente. Não contém telefones, e-mails ou transcrições.

## O que chegou

- Três arquivos locais de notas do Google Meet: reunião comercial de 10/09 com duas empresas, reunião comercial de 17/09 com uma prospect e reunião interna de produto/finanças de 18/09. Os arquivos contêm resumo automático **e** transcrição. O arquivo de 17/09 começa com assunto de outra empresa; importar a transcrição inteira como conversa comercial da V2G contaminaria a análise.
- Três áudios `.ogg` de uma conversa de WhatsApp de 14/09, associados por Victor ao caso que aguardaria outubro. Durações aproximadas: 1m06s, 2m50s e 1m36s. **Conteúdo não transcrito nesta revisão.**
- Trechos de WhatsApp e Instagram colados por Victor nesta conversa, incluindo prospecção, interesse, recusas, relacionamento com dois clientes e um relatório operacional enviado em grupo. Não há exportação completa nem garantia de que todos os eventos estejam presentes.

As abordagens coladas usam versões diferentes da promessa (redução de custo em 3x ou 5x), da oferta e da disponibilidade de vagas. Isso é dado histórico sobre **o que foi dito em cada contato**, não prova de economia nem autorização para repetir essas alegações. Para comparar respostas comerciais no futuro, registrar a versão da mensagem/oferta com data.

O material está em uma conta pessoal de WhatsApp e em documentos de outra empresa do Victor. Por enquanto, acesso comercial fica restrito a Victor e Gabriel, conforme orientação direta do Victor nesta conversa.

## Casos que a amostra permite separar

| Caso | O que a fonte sustenta | Estado que ainda exige confirmação |
|---|---|---|
| A — duas empresas, reunião 10/09 | Origem pelo Instagram, grupo de WhatsApp, Meet com duas pessoas/negócios e próximos passos comerciais. Victor relata que vendeu para ambos. Em 05/10 há relatório de campanha para um deles e marcação de conversa de acompanhamento. | Dois contratos/pagamentos independentes ou uma contratação? Datas de pagamento, assinatura e ativação não aparecem na amostra. O relatório de anúncios é uma mensagem humana, não uma consulta verificada à Meta; 10 conversas não comprovam 10 vendas. |
| B — prospect do trecho de WhatsApp com interesse | A pessoa respondeu que tinha interesse. Victor relata reunião, boa aceitação e ausência de venda naquele momento por falta de preparo digital. | Data e arquivo da reunião não identificados. Não associar automaticamente à reunião de 17/09, que traz outro nome. Registrar motivo como **relato de Victor**, não como fala comprovada da prospect. |
| C — reunião comercial 17/09 | A transcrição registra objeções sobre privacidade/exclusividade e satisfação com fornecedor atual. O próximo passo na nota automática era enviar materiais. | Identidade em relação ao caso B, envio efetivo e desfecho posterior não comprovados. O início do arquivo contém assunto alheio à V2G e deve ser excluído de uma eventual extração comercial. |
| D — conversa para outubro, com 3 áudios | O texto indica interesse condicionado à abertura futura; Victor identifica os áudios como parte dessa conversa. | Sem transcrição dos áudios, não afirmar objeção, aceite ou promessa contida neles. Não há compra comprovada. |
| E — outros contatos de prospecção | Há respostas de pessoa com gestor atual, de projeto pausado/sem orçamento, de interessada em agendar e de contato em viagem. | Esses são motivos e próximos passos diferentes. Falta histórico completo para afirmar reunião realizada, perda definitiva ou ausência de resposta. |
| F — reunião 18/09 | Planejamento interno sobre produto, canais, custos e operação. | Não entra no funil de vendas como lead. Valores e decisões de setembro são históricos; `docs/decisoes.md` prevalece sobre a síntese do Gemini. |

O caso B expõe uma mudança de política: Victor relata que falta de preparo digital impediu aquela venda. A decisão mais recente em `docs/decisoes.md:96-97` permite compra com Instagram fraco, com diagnóstico e orientação. O histórico deve guardar **o motivo real alegado na época** e a **regra atual** separadamente; não reclassificar retroativamente como cliente inelegível.

## Contrato de dados recomendado para o piloto

Usar o Supabase compartilhado do produto como registro de eventos e vínculos, conforme `Centralização dos dados da V2G.md`. Não criar uma tabela gigante de “cliente”. As entidades mínimas são:

1. **Pessoa e negócio:** IDs distintos. Duas pessoas num grupo podem representar dois negócios; uma pessoa pode representar mais de um CNPJ. Telefone/e-mail ajudam a conciliar, mas não são chave primária nem prova suficiente de identidade.
2. **Oportunidade:** negócio, origem/campanha quando conhecida, versão da abordagem/oferta, responsável, critério de elegibilidade, estágio atual e próximo passo. `não informado` é diferente de `não qualificado`.
3. **Evento e evidência:** mensagem, reunião, proposta, retorno, pagamento confirmado, assinatura, onboarding, campanha ativada, feedback e cobrança. Cada evento guarda hora, fonte, identificador externo, trecho ou local privado do original, autor da anotação e confiança. O estado atual é derivado dos eventos; o original não é sobrescrito por resumo de IA.
4. **Desfecho comercial:** ganhou/perdeu/adiou/sem decisão e motivos estruturados, com campo para fala literal e campo para interpretação do vendedor. Compra relatada, contrato assinado e dinheiro liquidado são eventos diferentes.
5. **Resultado do cliente:** investimento, impressão, clique e conversa vindos da plataforma; qualidade, venda e receita com fonte própria e confirmação do cliente. Nunca transformar “conversa iniciada” em “venda”.

Jev entra **depois** de existir texto autorizado e vínculo confiável: pode sugerir tipo de interação, objeção, urgência e próximo responsável. Guardar pergunta/versão, rótulo, confiança, fonte e correção humana; não usar para provar pagamento, identificar duas pessoas como uma ou transcrever áudio.

## Primeira visão útil para Victor e Gabriel

Em vez de escolher uma meta comercial arbitrária agora, mostrar uma **linha do tempo por negócio** e um painel de qualidade dos dados:

- interessados com origem e próximo passo conhecidos versus desconhecidos;
- tempo entre entrada, primeira resposta, reunião, decisão, pagamento, onboarding e primeira campanha — apenas nos trechos com datas verificáveis;
- razões de adiamento/perda com fonte e data, sem transformar menção isolada em taxa estatística;
- cliente em operação com gasto, conversas geradas e retorno de qualidade/vendas, cada número com sua fonte;
- divergências: “ganhou” sem pagamento confirmado, reunião dita agendada sem evento, campanha citada sem ID da plataforma, receita alegada sem comprovante.

Isso cria a espinha do RevOps de marketing a financeiro sem inventar conversão ou ROI a partir de uma amostra pequena. O Finance pode continuar como sistema financeiro separado; o produto precisa de IDs e estados confirmados para conciliar pagamentos e recebíveis quando houver contrato de integração.

## Próximo bloco revisável

Antes de importar dados reais: fechar o esquema pessoa–negócio–oportunidade–evento; mapear os IDs existentes de `leads_lp`, pedido/pagamento, `businesses` e `execucoes`; desenhar acesso somente a Victor e Gabriel para conversas comerciais; testar com casos fictícios e uma fonte duplicada. Depois, fazer importação manual **de uma conversa e uma reunião selecionadas** em área privada, conferir a linha do tempo com Victor e Gabriel e só então ampliar a captura. A migração e a importação dependem de autorização em bloco próprio. Nenhum dado real foi gravado nesta leitura.

## Perguntas ainda abertas

- A pessoa identificada no arquivo de 17/09 é a mesma do trecho de WhatsApp do caso B?
- As duas empresas da reunião de 10/09 têm contratos/pagamentos próprios?
- Onde estão, quando existirem, as provas de pagamento, assinatura e o ID da primeira campanha de cada cliente?
- Qual parte das notas e gravações na conta da outra empresa pode ser copiada para o ambiente da V2G, e por quanto tempo?
