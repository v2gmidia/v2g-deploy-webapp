# Criação de criativos — dados, documentos e n8n

Desenho técnico iniciado em 21/10/2026, complementado na noite de 21 para 22/10. **Planejamento, não implementação do gerador.** A prioridade executável desta rodada é o envio da imagem pronta. Refação/aprovação, operação do gestor e publicação ficam para blocos posteriores, conforme Victor. Nenhum modelo ou workflow foi ativado por este desenho.

## 1. Dois caminhos, sem misturar responsabilidades

**Imagem pronta, já existente:** app → validação no servidor → arquivo no Storage privado + registro em `creative_review_requests` → biblioteca do próprio negócio. Não passa por n8n, documentos de nicho, Jev ou geração. Os metadados de objetivo e promoção acompanham o arquivo; enviar não publica.

**Criar imagem, futuro:** pedido → contexto conferido e congelado → execução controlada → gerador → arquivo privado recuperável. A interface coleta informações e mostra o andamento; não decide sozinha consentimento, nicho, referências nem limite financeiro.

O início da jornada futura deve pedir produto/serviço, objetivo/destino, oferta e condições, promoção e prazo quando houver, conteúdo obrigatório e restrições. Reutiliza marca já confirmada; só pergunta o que falta. Não transportar essas perguntas extras ao formulário de imagem pronta.

## 2. Onde cada informação vive

| Informação | Fonte atual | Desenho de evolução |
| --- | --- | --- |
| Negócio e declarações | `businesses` e onboarding | Reutilizar. Cada campo do contexto preserva origem, data e estado de confirmação; não duplicar um segundo cadastro no n8n. |
| Marca e fotos próprias | `creatives`, usos logo/identidade, arquivos privados; cores em `onboarding.marca` | Reutilizar IDs e caminhos validados do negócio. Permissão de armazenar não implica permissão de enviar ao provedor de IA. Fachada precisa ser foto real identificada, não imagem inventada. |
| Pedido de criação | `creative_generation_requests`, migration local preparada | Pedido imutável por ID/hash. O status atual `awaiting_configuration` não dispara geração e não é uma tabela de jobs pronta. Aplicação dessa migration não foi verificada neste desenho. |
| Regra central e regra de nicho | MDs em `docs/`; catálogo/loader de nichos no backend | Versionar conteúdo revisado, responsável, data e hash. Para a primeira integração, manifesto de arquivos aprovados + hash resolve a seleção; banco vetorial não é requisito. |
| Referências visuais | Piloto inativo do n8n lê uma Data Table | Tratar Data Table como entrada de curadoria, não como autorização de uso. Catálogo canônico proposto no Supabase guarda fonte/data, direitos, nicho, revisão e arquivo permitido. IDs estáveis ligam a curadoria ao catálogo. Não copiar tudo automaticamente. |
| Snapshot de contexto | Ainda não integrado | Novo registro imutável proposto: pedido/negócio, briefing, versões/hashes dos documentos, IDs/hashes da marca e referências, autorizações e versão do montador. Nunca gravar URLs assinadas como identidade permanente. |
| Execução e custo | Não há job durável integrado ao pedido | Registros propostos de job, tentativa e reserva de orçamento; chave única por pedido/versão, estado e eventos. Consumir o gerador já existente no backend. |
| Saída | Storage/tabelas já usados pelas camadas de imagem e biblioteca | Reutilizar após conferir seus contratos. Caminho privado por negócio/pedido/versão, SHA-256, MIME, dimensões e identificador da tentativa. Não declarar imagem entregue antes de arquivo e vínculo persistidos. |

As linhas “proposto” exigem outro bloco de implementação/schema. Não há DDL ou nova tabela criada por este documento. O catálogo de referências globais deve separar materiais públicos admissíveis de material privado de cliente, que nunca entra na biblioteca global.

## 3. Quando os dois documentos entram

1. O servidor autentica e resolve o negócio ativo. O ID que veio do navegador não concede acesso.
2. Confere o nicho no catálogo técnico e a oferta/identidade necessárias.
3. Carrega **regra central + documento do nicho confirmado** e confere revisão, versão e hash. A central governa o processo; o nicho traduz essas regras para aquele contexto.
4. Seleciona poucas referências pertinentes, admissíveis e revisadas. Pinterest e Biblioteca são fontes de composição, não comprovação de conversões. Sem condição de uso suficiente, não enviar a imagem ao provedor.
5. Monta briefing e restrições com as respostas do cliente e os materiais autorizados; grava o snapshot utilizado.

No envio de imagem pronta, os dois documentos não são acionados. Na geração, documento faltando ou nicho desconhecido bloqueia o preparo: nunca substituir silenciosamente por genérico. Regras com origem externa, textos de anúncios e imagens são insumos não confiáveis, não instruções para executar ferramentas, divulgar dados ou alterar permissões.

**Nicho/subnicho:** seleção exata pelo ID do catálogo. Barbearia é o primeiro recorte pretendido. Salão/cabeleireiro/manicure/produto para barbeiro não entram por semelhança. Só acrescentar subnicho quando alterar oferta, mensagem ou restrições e houver validação do time; não inventar taxonomia em produção. O conteúdo de mercado fica a cargo de Victor/time; o software aplica e registra versões, sem fabricar benchmarks.

## 4. Divisão entre app, backend e n8n

| Camada | Responsabilidade |
| --- | --- |
| App | Perguntas, confirmação, identificação do pedido, andamento e mensagens de recuperação. Nunca guarda chave de provedor. |
| Servidor WebApp | Sessão/negócio, validação da declaração e criação/consulta do pedido permitido. Não faz geração paga dentro do clique. |
| Backend | Autoridade de contexto, permissões de material, reserva atômica, execução única, chamada ao gerador, validação dos bytes e persistência. Continua sendo a única camada de integração Meta. |
| Supabase | Registro canônico, isolamento por negócio, estado recuperável, arquivos privados e trilha de execução. |
| n8n | Orquestra/agenda trabalho e coordena diagnóstico. Transporta IDs e correlação, não chaves em payload nem material privado em logs. Reiniciar workflow não autoriza outra cobrança. |

Não é necessário colocar o texto completo dos MDs em vários nós Set. O n8n referencia as versões e o backend resolve o conteúdo aprovado. Isso evita regras diferentes para o mesmo pedido.

## 5. Caminho conceitual no n8n

**Pedido pendente → reivindicar trabalho → conferir contexto → gerar ou aguardar → persistir resultado → atualizar andamento.** Estas são caixas de responsabilidade, não um workflow publicado nem nomes de endpoints existentes.

- Criar pedido e disponibilidade de processamento na mesma transação, por outbox ou varredura controlada de jobs pendentes, para não perder pedido se o aviso ao n8n falhar.
- O backend reivindica o job com exclusão concorrente e chave idempotente. Duas execuções n8n para o mesmo pedido não abrem duas chamadas pagas.
- Se faltar documento/material/consentimento/limite: registrar bloqueio com motivo e dono da pendência, sem chamar provedor.
- Carregar insumos autorizados no backend, não abrir URL privada arbitrária fornecida por cliente. URLs assinadas não devem ficar no histórico n8n; limitar/sanitizar os dados de execução antes de usar material privado.
- Reservar teto da tentativa, na moeda definida, antes da chamada. Salvar provedor/modelo/configuração e autorização usada.
- Timeout com resultado desconhecido vira **reconciliação**, não retry automático da geração. Falha ao guardar bytes já recebidos retoma armazenamento, não pede outra imagem.
- Eventos de término repetidos são idempotentes. O status consultado pelo app vem do registro canônico, não de um nó n8n pintado de verde.

Estados propostos: pendente, bloqueado, reservado, executando, aguardando reconciliação, falhou e arquivo disponível. Não reutilizar o status único atual do pedido como se esses estados já existissem. Aprovação e publicação não fazem parte dessa máquina nesta rodada.

## 6. Custo e qualidade antes de liberar

Guardar estimativa, teto reservado, uso retornado pelo provedor e cobrança conciliada como campos separados, com moeda e data da regra de preço. Custo desconhecido não é zero; moedas diferentes não são somadas diretamente. A taxa do plano e o limite de refações não substituem uma reserva atômica implementada.

Antes de entregar os bytes: conferir formato/dimensões, presença de saída válida e aderência factual do texto, logo, oferta e prazo. Parte da fidelidade visual ainda exige critério de qualidade a definir no piloto. Não prometer “imagem perfeita” nem vendas por causa da geração.

Jev é uma possível classificação posterior de referências autorizadas; não é coletor da Meta, gerador de imagens ou preditor de vendas. Não colocá-lo como dependência do primeiro gerador. O piloto real precisa de material, finalidade e limite de gasto aprovados separadamente; o desenho não escolhe provedor por custo presumido.

## 7. O que já existe no n8n

Inventário em leitura em 21/10: `3kfUlXxPnKRDMB60`, “V2G | 06 | Jev e contexto - piloto seguro”, **inativo**. Caminho observado: iniciar manual → ler Data Table → filtrar serviço de barbearia → remover IDs repetidos → registrar referência/autorização → porta de amostra/direitos → pronto para integração ou aguardar. Não há chamada paga a Jev/gerador nesse trecho conferido.

Esse fluxo pode orientar a curadoria, mas não é o futuro job de criação. Os fluxos ativos WEBHOOK/BACKEND não foram alterados ou executados. Nenhum fluxo de geração foi criado/ativado por este planejamento.

## 8. Próximos blocos e aceite

1. **Agora:** fechar evidências de envio pronto e seus limites; sem redesenhar a tela.
2. **Após aprovação de implementação:** contexto/snapshot e job simulados; mesmos documentos e marca corretos; falhas explícitas; duplicidade sem segunda geração. Depois, esquema e integração com n8n em escopo individual autorizado.
3. **Após autorização do piloto:** uma primeira geração medida, arquivo privado recuperável, custo observado e reconciliação. Não assumir aprovação pelo depósito de saldo em outro provedor.
4. Aprovação/refações, gestor e publicação continuam adiados pelo pedido atual de Victor.

Fontes locais: [base central](./criativos-base-central.md), [modelo de nicho](./criativos-modelo-nicho.md), [integração mínima existente](./criativos-integracao-gerador-evento.md), `lib/criativos/briefing-geracao.ts`, `documentos-geracao.ts`, `carregar-marca-da-sessao.ts`, `porta-geracao.ts` e migration `20261021001651_creative_generation_requests.sql`. Modelo de arquivo privado: [documentação Supabase](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## 9. Confronto com o backend e o n8n existentes

Leitura de código e do workflow, sem executar geração. Raiz do backend nesta máquina: `C:\Users\victo\OneDrive\Documentos\GitHub\backend_v2g`. Os nomes abaixo são contratos internos atuais, não garantia de que uma rota pública já os ofereça ao WebApp.

| Evidência atual | Consequência para a futura integração |
| --- | --- |
| `src/imagem/base.py`, `PedidoCriativo`: `id_cliente`, briefing, texto, instrução, imagens em bytes e lista de formatos; o padrão inclui feed **e** stories | O adaptador precisa resolver o vínculo negócio/cliente no servidor, sem confiar em ID do navegador. Escolher explicitamente formatos e reservar custo para a quantidade real; um clique não significa uma única imagem no contrato atual. |
| `ImagemGerada`: formato, largura/altura, base64, URL, `custo_usd` e `mock`; sem job, snapshot, reserva ou identificador de cobrança | Não basta devolver esse objeto para provar entrega/custo. Job/tentativa, origem da saída, hashes, medição dos bytes e estado da cobrança são complementos ainda não implementados. Saída mock nunca conta como entrega real. |
| `src/agentes/gerar_criativo_visual/agente.py:75` procura ângulo no documento de nicho; `:84` trata substituição; `:102` chama o client | Reutilizar capacidade, não acionar cegamente a operação antiga. Substituir criativo está fora deste bloco; a futura primeira criação não pode descartar um anterior como efeito colateral. |
| `src/imagem/openai_client.py:261` possui tentativas internas; `:343` calcula custo por tabela/tamanho, com fallback zero | A reserva deve contemplar a política real de tentativas. Antes de liberar uso pago, classificar quais falhas podem repetir sem cobrança duplicada e como conciliar resultado desconhecido. Esse custo legado é estimativa, não fatura observada; fallback zero não comprova gratuidade. Nenhuma política foi alterada aqui. |
| Workflow `3kfUlXxPnKRDMB60` novamente consultado: inativo; Data Table, filtros/deduplicação, portas de amostra/direitos e saída de integração | Curadoria preparatória, não job de geração. Não foi executado/alterado. O desenho não acrescentou nós, credenciais ou webhook. |

As regras de dimensões declaradas no código são configuração; o futuro aceite também deve medir o arquivo efetivo. As informações do provedor/modelo no código não foram usadas como cotação ou recomendação atual. O piloto comparativo de custo continua pendente.

## 10. Contrato mínimo proposto entre as camadas

**Versão de desenho: `creative-generation.v1-proposal`.** Sem endpoints novos, payload aceito por produção ou migration nesta rodada. Exemplos são fictícios; IDs simbólicos não devem ser copiados para registros reais.

### 10.1 App → servidor: declaração, não permissão

Entrada conceitual do pedido de criação:

```json
{
  "requestKey": "fixture-pedido-01",
  "objective": "whatsapp_messages",
  "briefing": {
    "productOrService": "Corte e barba",
    "offer": "Combo promocional fictício",
    "mandatoryText": "Consulte os horários pelo WhatsApp",
    "promotionEndsOn": null,
    "restrictions": ["Não inventar fachada, preço ou depoimento"]
  },
  "requestedFormats": ["feed"],
  "selectedBrandAssetIds": ["fixture-logo-01"]
}
```

O servidor valida tamanho/conteúdo, sessão, negócio ativo e propriedade dos materiais. Objetivo/destino reutiliza a enumeração existente, sem ampliar o formulário de upload. A declaração não escolhe nicho por texto livre, não concede uso de imagem, não escolhe custo nem prova consentimento. A autorização de material enviado à IA precisa ter finalidade, provedor/destino e versão registráveis, além de permissão do arquivo.

### 10.2 Backend → n8n: referência a trabalho canônico

Mensagem conceitual, produzida apenas depois do registro durável e das verificações:

```json
{
  "contractVersion": "creative-generation.v1-proposal",
  "eventId": "fixture-evento-01",
  "jobId": "fixture-job-01",
  "snapshotId": "fixture-contexto-01",
  "correlationId": "fixture-trilha-01"
}
```

Sem prompt completo, arquivo/base64, URL assinada, chave ou token no payload/histórico do n8n. Autenticação serviço a serviço fica fora do corpo, ainda a implementar. O backend resolve o negócio canônico e rejeita job/snapshot divergentes, versão desconhecida, trabalho já concluído e reivindicação concorrente. Mensagem idêntica repetida pode consultar/retomar o mesmo job, nunca reservar ou cobrar de novo por si só. Callback/evento externo é apenas sinal: só a persistência conferida pelo backend muda a fonte consultada pelo app.

### 10.3 Registro de execução, evidência e resposta ao app

O registro canônico proposto vincula: pedido/negócio → snapshot imutável → job → tentativa → reserva → arquivo. O snapshot contém documentos com ID/versão/hash, nicho exato, briefing, marca/referências com IDs/hashes e autorizações. Mudança de documento não altera snapshot existente. Uma eventual nova criação é outra operação autorizada; não é retry disfarçado.

Exemplo de resposta bloqueada, antes de qualquer gasto:

```json
{
  "requestId": "fixture-pedido-01",
  "status": "blocked",
  "reasonCode": "niche_document_missing",
  "message": "Precisamos concluir o contexto deste negócio antes de criar a imagem.",
  "pendingOwner": "v2g_team",
  "artifactId": null,
  "providerCalled": false
}
```

Exemplo de registro interno após arquivo persistido; valores monetários abaixo são **inventados para demonstrar o formato**, não preço medido ou orçamento aprovado:

```json
{
  "jobId": "fixture-job-01",
  "snapshotId": "fixture-contexto-01",
  "status": "artifact_available",
  "attemptId": "fixture-tentativa-01",
  "artifactId": "fixture-arquivo-01",
  "artifactHash": "sha256-dos-bytes-a-medir",
  "providerRequestId": null,
  "mock": false,
  "cost": {
    "currency": "USD",
    "estimated": "0.10",
    "reservedCap": "0.20",
    "usageReported": null,
    "billed": null,
    "billingStatus": "awaiting_reconciliation",
    "pricingRuleVersion": "fixture-tabela-01"
  }
}
```

Esse último objeto não é um retorno público integral. O app recebe apenas ID, andamento, mensagem segura e disponibilidade do arquivo, e obtém visualização privada após revalidar acesso. Caminho privado, detalhes de fornecedor e livro de custos permanecem no servidor. Arquivo disponível e cobrança conciliada são evidências independentes; cobrança desconhecida não desaparece nem vira zero por causa do sucesso visual.

### 10.4 Estados e retomadas, ainda conceituais

| Estado proposto | Motivo / saída permitida |
| --- | --- |
| `pending` | Pedido durável; ainda não implica chamada paga. |
| `blocked` | Falta contexto, direito, configuração ou autorização financeira. Expor motivo seguro e responsável; sem provedor. |
| `reserved` | Reserva atômica válida para aquela tentativa/configuração. Não é custo já cobrado. |
| `running` | Reivindicação exclusiva e tentativa registrada antes da chamada. Não afirmar que o provedor já terminou. |
| `reconciliation_required` | Timeout/resultado ou cobrança incertos. Manter reserva pendente; consultar evidência/revisão, sem retry pago automático. |
| `storage_pending` | Bytes recebidos e duravelmente recuperáveis, mas arquivo/vínculo incompleto. Retomar só armazenamento. Se os bytes não forem recuperáveis, não fingir esse estado: exigir reconciliação. |
| `failed` | Falha classificada e registrada. Liberação de reserva só com evidência de não cobrança; eventual custo continua contabilizado. |
| `artifact_available` | Bytes válidos medidos, hash e vínculo privado persistidos, recuperáveis pelo dono. Não significa aprovação, anúncio publicado ou cobrança conciliada. |

A implementação futura deve escolher mecanismo durável para bytes recebidos antes de confirmar `storage_pending`; memória do worker não é suficiente. Estado e evento precisam de transição condicional e identificador de tentativa, para um término atrasado não sobrescrever trabalho mais recente. Falha do n8n pode retomar orquestração; não libera nova chamada de geração.

## 11. Matriz de aceite do futuro bloco simulado

**Critérios propostos, não testes executados.** Primeira implementação deve usar fakes locais, sem provedor, material de cliente ou configuração externa. Contagem abaixo é de chamadas ao fake; não mede cobrança real.

| Caso | Resultado esperado | Prova exigida / chamadas ao fake |
| --- | --- | --- |
| Contexto válido, um formato | Arquivo privado vinculado ao snapshot correto | Hash/dimensões dos bytes, IDs e consulta do dono; 1 chamada. |
| Mesmo pedido entregue duas vezes / dois workers | Um job e uma reserva; sem segundo processamento pago | Barreira concorrente determinística e unicidade; 1 chamada. |
| Documento de nicho ausente ou hash divergente | `blocked` com dono da pendência | Nenhum snapshot elegível/reserva consumida; 0 chamadas. |
| Marca pertence a outro negócio | Recusa sem revelar existência/conteúdo | Autorização no servidor e isolamento de leitura; 0 chamadas. |
| Referência sem direito de uso / foto de fachada ausente quando exigida | Bloqueio ou composição sem esse elemento, somente se regras permitirem | Motivo explícito, nunca inventar fachada nem enviar material vedado; 0 chamadas enquanto bloqueado. |
| Reserva insuficiente / limite desconhecido | `blocked` | Testar duas reservas concorrentes contra o mesmo saldo; sem saldo negativo; 0 chamadas recusadas. |
| Timeout com resultado desconhecido | `reconciliation_required` | Reentrega do evento não chama novamente; 1 tentativa, gasto não declarado zero. |
| Provedor retornou bytes, Storage falhou | `storage_pending` somente com bytes duráveis | Reexecutar persistência com mesmo hash, sem gerar novamente; 1 chamada total. |
| Término repetido ou atrasado de outra tentativa | Registro atual preservado | Transição condicional por tentativa e idempotência; sem arquivo trocado. |
| Modelo devolveu mock, vazio ou dimensão incorreta | Não declarar entrega real válida | Origem e bytes conferidos; registrar falha/custo separadamente. |
| Documento mudou após snapshot | Pedido mantém contexto original | Repetição usa o hash antigo; não remonta silenciosamente. |
| Callback adulterado / versão desconhecida | Recusa, nenhum acesso ou gasto novo | Autenticação e vínculo job/snapshot validados; mensagem não é autoridade. |

O piloto real posterior adiciona comparação de fidelidade visual, latência e custo **medidos** por imagem aprovada. Exige novo bloco, orçamento máximo, provedor/destino e materiais autorizados. Os critérios acima não liberam cobrança, implantação, migração nem publicação. Itens 3/4/5 permanecem fora do escopo.
