# Vídeos enviados e método de Dericson Calari

Pesquisa em 12/11/2026. Escopo: distinguir a mecânica demonstrada nos dois vídeos enviados da proposta de rastreamento próprio de Dericson e do objetivo da V2G de ligar lead à venda confirmada.

## Quem produziu os dois vídeos enviados?

### Takeaway
Nenhum dos dois é de Dericson Calari. São referências independentes, com objetivos diferentes.

### Cited Findings
- A transcrição `Transcript - CONTINGÊNCIA de Pixels no Facebook Ads com GTM _ Passo a Passo Rápido (2025).txt` abre com a apresentadora dizendo “eu sou a Dani” (arquivo local, linha 1). O [vídeo original](https://www.youtube.com/watch?v=68fRnmn_vMA) divulga os canais de Daniela Tiemi na descrição.
- A transcrição `Transcript - Meta Ads 2025 com Inteligência Artificial!!_ Curso Completo de Anúncios no Instagram e Facebook Ads.txt` se refere ao apresentador como Bernardo (arquivo local, linha 6). O [vídeo original](https://www.youtube.com/watch?v=Rs--F7s4bFE) indica o canal de Bernardo Petty na descrição.
- O material [oficial de Dericson](https://dericsoncalari.com.br/) apresenta seus próprios cursos de rastreamento para WhatsApp, Direct, CRM, páginas e checkout.

### Inferences
- Não atribuir a Dericson as afirmações dos dois vídeos, ainda que discutam temas próximos.

### Gaps
- Não foi feita uma varredura exaustiva de todo o canal de Dericson no YouTube; os materiais públicos de seu site e blog são suficientes para comparar o método declarado.

## O que os vídeos de fato demonstram?

### Takeaway
O primeiro demonstra disparo para dois pixels; o segundo, captura e qualificação de leads e retorno de sinais à Meta. Nenhum prova, por si, conciliação de compra real ponta a ponta.

### Cited Findings
- Daniela mostra adicionar outro pixel ID e token às tags web/server do GTM, testar os dois disparos e depois publicar os contêineres ([vídeo](https://www.youtube.com/watch?v=68fRnmn_vMA); transcrição local, linhas 4–11). Isso é duplicação de destino de eventos, não um banco de jornada e vendas.
- Bernardo mostra formulário Meta ou privado, coleta de nome/telefone/perguntas, qualificação, envio a Google Sheets e possibilidade de público semelhante ([vídeo](https://www.youtube.com/watch?v=Rs--F7s4bFE); transcrição local, linhas 7–17, 31–34, 47–49). Ele descreve classificar manualmente na planilha quem fechou (linha 49).
- A fala de que WhatsApp “não mensura” é uma simplificação do segundo vídeo (transcrição, linha 9). Dericson publica um método voltado precisamente a [rastrear campanhas para WhatsApp](https://dericsoncalari.com.br/) com base e automações próprias.
- O exemplo de 100 leads e 10/12 fechamentos do segundo vídeo é ilustrativo no próprio discurso (transcrição, linha 3); não apresenta estudo controlado nem garante melhora para a V2G.

### Inferences
- Dois disparos de pixel podem ajudar em contingência, mas não estabelecem identidade persistente, deduplicação browser/server, vínculo com pedido/CRM ou prova de venda. Replicá-los indiscriminadamente entre clientes da V2G poderia misturar dados entre anunciantes.
- Uma planilha de leads permite acompanhamento inicial, mas a compra só vira dado confiável quando o negócio registra o fechamento, valor, cancelamento/estorno e reconcilia com o lead original.

### Gaps
- Não há nos vídeos evidência de taxa de acerto da atribuição nem de uma arquitetura multicliente isolada; não assumir tais resultados.

## O que Dericson propõe de diferente?

### Takeaway
Seu material público separa base de jornada própria de envio de conversões às plataformas, uma distinção alinhada ao que a V2G busca.

### Cited Findings
- A [página principal](https://dericsoncalari.com.br/) define *rastreamento* como coletar/guardar dados na base própria e *trackeamento* como informar dados às plataformas para orientar otimização. A mesma página lista treinamentos por canal (WhatsApp, Direct, CRM, sites/checkout) — descrição do fornecedor, sem auditoria externa.
- A [página Rastracking100](https://rastracking.dericsoncalari.com.br/main) lista ID único, UTMs iniciais e atuais, click IDs (`fbclid`, `gclid`), URL, primeiro/último acesso, contato, status do lead e valor da venda. Trata-se de capacidade anunciada, não de teste independente.
- O [Script 4.0](https://dericsoncalari.com.br/script-4-0/) informa que carrega UTMs ao checkout e tenta identificar a origem. Seu FAQ explicita que **o script não envia eventos à Meta**; para isso há outra camada, a API de Conversões.
- O [artigo técnico de UTMs de Dericson](https://blog.dericsoncalari.com.br/blog/utms-e-parametrizacao-guia-rastreamento-campanhas-vendas) recomenda verificar a passagem até formulário, CRM e oportunidade. Isto descreve o teste de ponta a ponta que o produto de marketing, isoladamente, não comprova.

### Inferences
- A V2G pode aprender a arquitetura: capturar origem e identificadores permitidos, guardar um registro por anunciante, associar contato/negócio e desfecho comercial, auditar divergências e, só depois, enviar conversões autorizadas à Meta/Google. Não basta colocar um script universal na LP da V2G, porque as jornadas de venda dos clientes ocorrem em sites, WhatsApp, formulários e CRMs distintos.
- Comparações entre clientes devem usar padrões agregados e contexto de nicho, sem presumir que contatos individuais de um anunciante pertencem à base de outro. A fonte consultada não demonstra autorização de compartilhamento de dados brutos entre anunciantes.

### Gaps
- A documentação pública de Dericson não prova cobertura universal, atribuição causal, venda recuperada em todos os canais, conformidade de cada implantação nem melhoria de resultado para a V2G. Números de marketing como “origem real de todas as vendas”, “instala em 5 minutos” e “CPA/ROAS real” são promessas da [página de venda](https://dericsoncalari.com.br/script-4-0/), a validar por piloto.

## Aplicação à V2G

### Takeaway
Piloto por cliente e por jornada; provar um lead até uma venda confirmada antes de pensar em inteligência cruzada.

### Cited Findings
- O [blog de Dericson](https://blog.dericsoncalari.com.br/blog/variaveis-dinamicas-do-meta-ads-para-utms) descreve UTMs como ponto de entrada e distingue guardar origem de informar conversões à plataforma.
- A [página oficial](https://dericsoncalari.com.br/) oferece estruturas diferentes para WhatsApp, Direct, CRM e checkout, o que reforça que a integração depende do caminho do cliente.

### Inferences
- Melhor prova inicial: uma conta piloto com anúncio conhecido → lead identificado por ID interno e origem preservada → interação/qualificação → resultado registrado pelo gestor → compra/valor confirmado no sistema de origem → painel de auditoria com eventos recebidos, ausentes e duplicados. Confrontar com Meta/Google, marcando divergência e limitações; não chamar atribuição de causalidade.
- O valor imediato para a V2G é localizar perdas e provar a trilha de atendimento; usar padrões agregados de público para outros clientes é etapa posterior e requer volume, qualidade de dados e revisão de permissões.

### Gaps
- Definir primeiro a fonte verificável de venda para cada piloto (checkout, CRM ou registro humano), consentimentos/avisos, retenção e controle de acesso. Sem essa fonte, dá para medir leads, não afirmar vendas.
