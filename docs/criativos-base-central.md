# Criativos — documento central de contexto e decisão

Versão de trabalho: 18/10/2026. Direção de produto aprovada; **não é prompt em produção, integração ativa nem autorização de publicação**. A decisão humana vigente está em [`decisoes.md`](./decisoes.md); o modelo aplicável a cada nicho está em [`criativos-modelo-nicho.md`](./criativos-modelo-nicho.md).

## 1. Missão e fronteira

Preparar uma imagem publicitária adequada ao negócio e à oferta declarada, com custo medido e rastreabilidade. O cliente fornece o objetivo concreto (por exemplo, promoção e prazo) antes da geração; o sistema usa sua marca e referências selecionadas; o cliente pode pedir até três refações. **Criativo aprovado não significa anúncio publicado.** O gestor prepara e publica enquanto o fluxo assistido estiver vigente, mediante aprovação exigida e prova do estado na Meta. A criação de peças não decide sozinha público, teto de mídia, publicação ou troca de anúncios.

O primeiro recorte já implementado é outro: envio privado de uma peça pronta para revisão humana e análise opcional. Não confundir esse recorte com geração automática. Ver [`estado/criativos-envio-analise-piloto-18-10.md`](./estado/criativos-envio-analise-piloto-18-10.md).

## 2. Contexto mínimo, com proveniência

Cada campo consumido pelo agente deve carregar `valor`, `origem`, `registrado_em`, `estado` e, quando aplicável, `confirmado_por`/`confirmado_em`. Estados: **confirmado pelo cliente**, **declarado sem conferência**, **observado em fonte externa**, **inferido para revisão** ou **ausente**. Uma inferência nunca substitui uma confirmação. Não preencher lacunas com padrão inventado.

| Bloco | Conteúdo necessário | Fonte atual ou limite |
|---|---|---|
| Negócio | ID do negócio selecionado, atividade, área atendida, produto/serviço, comprador, entrega, diferencial e provas permitidas | Respostas do onboarding são declarações; a escolha de negócio deve ser conferida em cada leitura. Ver `docs/decisoes.md` (14/10). |
| Marca | Logo vigente, fotos de identidade, cores confirmadas e restrições visuais | `lib/identidade/armazenar.ts` lê `creatives` com `business_id`, `uso` e `arquivado_em`; arquivos são privados. Não deduzir manual de marca inexistente. |
| Oferta para a peça | Objetivo, produto, preço/desconto se houver, validade, condições, destino da conversa e alegações comprováveis | Coleta específica antes da geração. Nada de inventar promoção, prazo, prova social ou resultado. |
| Nicho | ID confirmado no catálogo técnico e regras do documento de nicho versionado | `lib/backend/nichos.ts` lê `GET /nichos`; não copiar lista estática ou tomar texto livre do onboarding por ID técnico. |
| Referências | Imagem, texto, URL/origem, data de captura, licença/condição de uso, hipótese de padrão e revisão humana | Ainda não há catálogo persistido nem coleta da Biblioteca/Pinterest neste fluxo. Referência não é evidência de performance. |
| Operação | Peça, versão, revisão, aprovação explícita, vínculo com anúncio e prova de publicação | `creative_review_requests` guarda hoje a fila humana da peça pronta, não as novas versões geradas nem a aprovação formal no app. |

## 3. Ordem das decisões

1. Conferir sessão, negócio e permissões; reunir contexto e mostrar o que falta ao gestor/cliente. Dado de outro CNPJ nunca serve de fallback.
2. Validar oferta e afirmações: sem preço, prazo, condição ou prova confirmados, perguntar; não improvisar. Objetivo geral de venda por WhatsApp não cria uma promoção específica.
3. Selecionar o documento do nicho confirmado e referências admissíveis. Referências inspiram estrutura/ângulo; não copiar logo, texto, identidade ou composição protegida de terceiro. Registrar por que cada referência foi escolhida.
4. Produzir um briefing estruturado para o gerador de imagem escolhido no piloto: formato, oferta, identidade, elementos obrigatórios/proibidos e origem de cada afirmação. Guardar versão do modelo, prompt, insumos, custo e tempo.
5. Gerar uma primeira proposta; aceitar até três refações solicitadas pelo cliente, cada uma com instrução textual e nova versão preservada. O limite é de produto proposto, ainda não implementado.
6. Exibir a peça para decisão explícita da pessoa autorizada no app. Aceitar/recusar a versão específica; não converter clique de upload, silêncio ou WhatsApp em aprovação.
7. Separar revisão do gestor, publicação pelo backend autorizado e confirmação da Meta. Só após prova de veiculação mostrar “no ar”; só após vínculo mensurável mostrar números por anúncio/criativo.

## 4. Jev no recorte correto

O Jev pode ser testado para **classificação fechada** de criativos autorizados: formato, gancho, tipo de oferta, presença de prova social e legibilidade/elementos visuais. Para cada pergunta, definir opções mutuamente distinguíveis, saída “indeterminado” e amostra rotulada por humano. Comparar acurácia, taxa de revisão, tempo e custo por peça antes de automatizar triagem. Score isolado ou confiança informada pelo modelo não comprovam qualidade do anúncio.

Há integração local de Jev em `lib/jev/typesafe.ts`, mas ela classifica prioridade de pendências textuais e fica atrás de flag. `lib/jev/criativos-piloto.ts` prepara e valida localmente o contrato visual; não tem chamada de rede nem consumidor no app. A documentação oficial da TypeSafe aceita imagens no System One, mas diz que imagens/Box são experimentais, exigem cabeçalho específico e têm limites de arquivo/dimensões. Não habilitar imagem em produção com base apenas no artigo ou nesta documentação. Jev também não coleta anúncios da Meta, não conhece conversões de concorrentes e não gera a imagem final por esse endpoint. Fontes: [Images](https://docs.typesafe.ai/images), [Primitives](https://docs.typesafe.ai/primitives).

## 5. Pilotos e portas de avanço

**A. Peça pronta:** ensaio autenticado de upload, isolamento entre negócios, análise opcional, persistência do resultado e custo. Requer negócio/material piloto e teto autorizados por Victor antes de chamada paga. Persistência/migration precisa de aprovação separada.

**B. Referências:** começar por curadoria pequena e lícita de nichos já atendidos; registrar origem e data. Antes de varrer em massa, validar meio de acesso, termos de uso, direito de guardar/usar imagens e limites. Testar Jev com lote rotulado; não chamar anúncios ativos de vencedores.

**C. Geração:** comparar provedores com o mesmo conjunto de briefings e critério de aceite. Medir `custo_total / imagens_aprovadas`, tempo até aprovação, refações e falhas, incluindo armazenamento, análise e reprocessamento. Preço anunciado por token/chamada não é custo final. Escolher provedor só após números reais.

**D. Publicação e aprendizado:** exige aprovação formal registrada no app, vínculo inequívoco `negócio → conta → anúncio → criativo → versão`, prova da Meta via `backend_v2g`, métricas atribuíveis e correções humanas. Troca automática de criativo permanece visão futura; não é parte deste piloto.

Nenhuma destas portas autoriza deploy, migration, escrita na Meta ou alteração de configuração externa sem aprovação específica.
