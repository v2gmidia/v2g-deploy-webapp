# Uma peça própria V2G — revisão e caminho para o evento de 28/10/2026

> **Direção atualizada:** arte e copy desta V1 foram substituídas pela [proposta V2](DIRECAO-V2.md). Victor já decidiu WhatsApp, conversas, operação nacional, teto total de R$ 500 e publicação junto com ele. A V2 ainda é briefing visual, sem arte final. As leituras QA e os bloqueios técnicos abaixo permanecem evidência histórica, não foram reexecutados por esta atualização.

**Estado: candidata, sem aprovação de anúncio e sem publicação.** Este pacote não é uma ordem executável nem autoriza verba, upload ou escrita em qualquer ambiente.

## 1. Peça exata para Victor revisar

![Peça candidata V2G](../../../public/criativos/v2g-clareza-feed-v1.png)

- Arquivo: `public/criativos/v2g-clareza-feed-v1.png`.
- SHA-256: `c89622c2035efdc2251fd42a277e1242bee2c9c0a1c3a61495d98eab6186615a`.
- PNG RGB de 8 bits, **1254 × 1254 px**, proporção **1:1**, **1.388.613 bytes**. Decodificada e inspecionada nesta rodada; cabe no limite real de 9 MB do envio da WebApp e o tipo foi aceito pela action no ensaio offline. Não foi alterada, redimensionada ou gerada imagem nova.
- Texto da arte: **“Seu investimento em anúncios. Mais clareza para decidir.”** Chamada: **“Conheça a V2G”**.
- Origem declarada pelo pedido: arquivo próprio da V2G. Registro Git localizado: `e5a8655`. Não foi localizado projeto editável/licenciamento independente da origem do bitmap. A inspeção mostra marca e elementos gráficos; não foi usada mídia concorrente neste bloco. Isso não substitui aprovação de Victor para o anúncio.
- A mesma imagem já existe numa fixture do QA, **com o mesmo hash**, em `changes_requested`. Esse registro não vale como aprovação nem como biblioteca do negócio V2G. Preservar a fixture.

### Copy proposta — ainda para aprovação

**Texto principal**

Seu negócio investe em anúncios. Você precisa de clareza para decidir.

Conheça a proposta da V2G para cuidar da operação dos seus anúncios, com acompanhamento e conversa direta.

Fale com a gente pelo WhatsApp.

**Título:** Mais clareza para seus anúncios

**Descrição:** Conheça a V2G pelo WhatsApp.

**Botão proposto:** Enviar mensagem

**Objetivo no envio da WebApp:** Receber mensagens no WhatsApp (`whatsapp_messages`); sem promoção e sem prazo promocional inventado.

**Destino atualizado em 28/10:** WhatsApp da Página V2G, número confirmado por Victor com final **2928**. Contato anterior removido desta proposta. Não fabricar URL completa a partir dos quatro últimos dígitos. A revisão no Gerenciador e a publicação serão feitas com Victor. Este documento mantém o histórico V1; a nova arte local e as decisões atuais estão em `arte-local-v3/manifesto.json`.

O texto não promete vendas, geração automática de imagens, números comprovados ou resultado garantido. Público/região, conta/Página/Instagram, verba diária/teto total e início/término ainda precisam ser definidos/aprovados. Recomenda-se revisar no posicionamento de Feed quadrado; a prévia e a elegibilidade final na Meta ainda não foram conferidas. Não esticar esta peça para Stories como se fosse uma versão 9:16 pronta.

## 2. O que foi medido no QA, somente leitura

Projeto confirmado pelo conector: `v2g-webapp-qa`, `zskpijnqgkqwxksqmzmf`, saudável na leitura. Nenhum ambiente foi alterado.

| Registro | Fato consultado | Consequência |
|---|---|---|
| Negócio candidato `4406fcdb-9737-48d9-8cef-8aabb4eaf3ad`, nome V2G | Proprietário presente; `dados_ficticios=false`; **0 gestores atribuídos, 0 execuções, 0 pedidos de revisão** | Nome ajuda a localizar, mas Victor/Central precisam confirmar este ID como o negócio do piloto. Não foi selecionado/alterado por este chat. |
| Fixture `0542c574-7c15-41ff-a269-22ce56ca25f2` | `dados_ficticios=true`; pedido `b58d11e5-8d7d-4ef6-9f7f-8c8d5c1df095`; mesmo nome e SHA; `changes_requested`; revisão de 26/10; objeto privado registrado no catálogo do Storage | É ensaio de outro negócio. Não mover o arquivo, alterar o business_id ou aproveitar a revisão para simular aprovação V2G. Existência no catálogo não é download autenticado novo do objeto. |

O arquivo em `public/` é um recurso estático: **não cria sozinho uma linha na biblioteca**, solicitação de revisão, execução ou campanha. Não foi lida senha, token, documento, e-mail pessoal ou conteúdo do onboarding para este diagnóstico.

## 3. Caminho mínimo cliente → gestor → publicação manual

1. **Victor revisa este pacote**: arte pelo hash, copy, destino, público/região, verba/teto e período. Aprovar uma proposta não substitui a confirmação do arquivo/plano dentro do aplicativo principal. Não clicar para publicar sem a autorização nominal final da campanha e da verba.
2. **Central confirma o negócio exato e o gestor**: novo login do proprietário no QA, negócio V2G selecionado e operador responsável existente. Atribuir operador, conceder papel ou criar execução são escritas com autorização própria; não promover todo usuário nem converter V2G em fixture para caber na homologação.
3. **Com upload QA especificamente autorizado**, usar `/criativos` → “Já tenho um criativo” → este PNG → WhatsApp → sem promoção → conferir e enviar. Antes do ato, confirmar que a análise automática não disparará serviço pago neste recorte. Não ligar/desligar flags por conta nem usar `/fotos` ou um gerador para reenviar uma peça pronta.
4. Conferir uma solicitação nova **do negócio V2G**, hash exato, intenção e arquivo privado `creative-review/{business_id}/{submissaoId}`. Recarregar e reentrar para conferir persistência/isolamento. IDs reais só entram no manifesto após o ato autorizado; não usar os IDs fictícios dos testes locais.
5. Gestor atribuído abre `/gestor/criativos?negocio={business_id}`, confere a imagem e registra a decisão. `approved_for_manual_publish` significa **publicação manual pendente**. Essa decisão não cria campanha, não comprova entrega e não promove automaticamente a peça para `creatives` com IDs Meta.
6. Depois da aprovação formal do plano/primeira publicação no app e autorização específica de verba/campanha, gestor publica manualmente no Gerenciador da **conta/Página/Instagram confirmados**. Registrar os IDs retornados e a prévia real. Este chat não abriu nem publicou na Meta.
7. Não reescrever a aprovação da peça como estado ativo. A situação atual vem de `estado.veiculacao`/backend e das frases canônicas. Revisão, publicação passada e exibição presente são fatos distintos.

A confirmação de dados ao enviar o arquivo e a decisão do gestor não comprovam, sozinhas, aprovação do cliente para a verba/primeira publicação. O pacote não comprovou esse aceite específico no app para o negócio V2G. Antes do ato externo, Central deve localizar o fluxo aplicável após existir execução ou registrar essa lacuna e preparar o aceite próprio; e-mail pode complementar, mas não substituir o app.

**Primeiro aceite visível possível:** imagem própria no QA e decisão do gestor reaparecendo na sessão cliente. Pode ser demonstrado antes de existirem números, com o estado correto. Nenhuma promessa de geração por IA nesse percurso.

## 4. Contrato e bloqueios para 07/08 — sem editar seu repositório

Fonte atual lida: `backend_v2g/docs/estado/e28-07-diagnostico-negocio-piloto-metricas-27-10.md`, `src/api/qa_leitura.py` e `src/metricas/contrato_de_leitura.py`. O diagnóstico antigo de outro negócio não substitui os IDs e contagens V2G medidos acima.

### Identificadores que precisam acompanhar o mesmo experimento

- `business_id` V2G confirmado, proprietário e operador responsável;
- `review_request_id` da nova revisão V2G + hash deste arquivo;
- `creative_id` WebApp, **se houver registro explícito**, sem confundir revisão com tabela `creatives`;
- `id_execucao` pertencente ao mesmo business_id;
- conta `act_...`, Página/Instagram, campanha, conjunto, anúncio e criativo Meta, copiados da plataforma e conferidos entre si;
- fonte do vínculo `gerenciador_meta`, quem confirmou, motivo/data e aprovação correspondente.

O manifesto JSON ao lado contém lacunas `null`, não IDs fabricados nem um POST pronto. O backend já possui `POST /negocios/{business_id}/campanhas-manuais/meta` com `id_execucao`, `id_conta_anuncio`, `id_campanha`, `id_conjunto`, `ids_anuncios`, `ids_criativos`, `fonte`, `por`, `motivo`, `confirmo`. **Exige execução anterior do mesmo negócio**; não cria execução, não comprova propriedade Meta e o modo QA de leitura bloqueia esse POST. O negócio V2G está sem execução. 07/08 devem mapear a menor criação legítima/auditável antes de qualquer escrita; não chamar `/cadastro` ou webhook n8n que dispare pipeline, nem reutilizar execução de fixture.

### Leitura e números

1. Validar campanha/conta reais por leitura nominal autorizada. Publicação manual e acesso de leitura por API têm aceites diferentes.
2. Preparar coleta restrita, sem agentes/otimização/publicação, com persistência QA especificamente autorizada. O modo atual exige mocks ligados; não desligá-los para forçar coleta real. Não rodar o backfill legado com IDs fixos.
3. Preservar fonte Meta, conta/campanha/execução/negócio, período desde/até, moeda, fuso real da conta, horário da coleta e estado da medição. Não presumir fuso, custo zero, cliques no link ou conversões quando não fornecidos.
4. Contrato básico medido no repo: custo em centavos/moeda, impressões, cliques totais e conversões quando contáveis. Cliques totais não viram cliques no link; conversas não viram vendas atribuídas. Metadados de anúncio/IDs não bastam para afirmar desempenho por criativo.
5. Confirmar exatamente o que o consumidor cliente pede. `resultadoDoNegocio` consulta consolidado do negócio primeiro e depois ficha + consolidado por execução; `estadoDoCliente` também depende de execução. O diagnóstico HTTPS de 27/10 e o middleware local lido limitam a cerca QA ao consolidado por negócio além de saúde/docs; a configuração remota não foi reconferida neste bloco. **Um 200 desse consolidado ou da mesa do gestor não fecha `/inicio` e `/anuncios` do cliente.** Qualquer ampliação nominal precisa de plano/aceite específico; não remover a cerca.
6. Reconciliar WebApp e backend no mesmo negócio/conta/campanha/período/moeda/fuso, com nova sessão. Se o fuso ainda não for persistido, mostrar a lacuna, sem anunciar comparação equivalente com o Gerenciador.

### Limite de ligação imagem ↔ anúncio

Hoje a revisão privada é independente da execução de métricas. Aprovar a revisão não cria automaticamente o vínculo `creatives.external_ad_id`; o mapeamento cliente de Anúncios também entrega `criativos: []`. Para o evento, o aceite mínimo honesto é **a imagem e sua revisão em Criativos + os números reais da campanha em Anúncios, no mesmo negócio**, com os IDs rastreados no registro operacional. Ranking ou números atribuídos àquela imagem precisam de dados/consumidor por anúncio e ligação explícita, ainda sem prova. Não gravar IDs em nota livre como se isso fosse contrato de associação pronto.

## 5. Prova local feita agora

Novo cenário em `scripts/conferir-intencao-envio.mjs` usa os **bytes reais desta peça** com a action real de upload e a action real do gestor, Auth/banco/Storage simulados e rede proibida. Confere dimensões/hash/tamanho do manifesto; guarda exatamente um arquivo privado; registra `awaiting_review`; recusa reaproveitar o mesmo pedido em outro negócio; permite decisão **exclusivamente fictícia** `approved_for_manual_publish`; não publica, não chama gerador e não altera o manifesto pendente de Victor.

Comando executado: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-intencao-envio.mjs` → **24/24 passaram** (um novo cenário e 23 preservados). Não é upload QA, login real, estado da biblioteca V2G ou anúncio Meta. A imagem original não foi alterada. Não houve código de produto, schema ou configuração externa modificado neste bloco.

## 6. Próximos atos, responsáveis e aceites

| Prioridade | Ato | Responsável | Prova de conclusão |
|---|---|---|---|
| 1 | Revisar arte/copy/destino e definir verba/público/período; confirmar negócio exato | Victor | Aprovação nominal e campos do manifesto preenchidos, sem transformar isso em publicação automática |
| 2 | Autorizar atribuição/upload/revisão QA no negócio confirmado | Victor/Central | Mesmo hash/pedido privado visto por cliente e gestor correto após recarga/nova sessão |
| 3 | Publicação manual autorizada | Gestor/Victor | IDs e prévia da campanha na conta correta; estado atual ainda separado da revisão |
| 4 | Preparar execução legítima, vínculo e coleta isolada | 07/08 com Central | Manifesto revisado e autorização de cada escrita; nenhum uso de execução/conta de terceiro |
| 5 | Fechar leitura cliente + número real no recorte | 07/08 e WebApp, publicação autorizada | `/inicio` e `/anuncios` autenticados com fonte/período corretos, erro honesto se não houver dado |

O pacote reduz o caminho, mas **não garante concluir a integração no dia 28**: aprovação/verba, execução/vínculo e leitura cliente continuam bloqueios concretos. Se métricas reais não chegarem a tempo, mostrar apenas o que foi comprovado e identificar a parte fictícia. Nunca trocar os números de ensaio por “resultado da V2G”.
