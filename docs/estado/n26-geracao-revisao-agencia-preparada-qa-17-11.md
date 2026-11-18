# Geração → revisão → agência preparada para QA — 17/11/2026

## 0. Resultado e próximo ato

Candidata local revisável pronta, não publicada: C:/Users/victo/v2g-deploy/webapp-criativos-qa/docs/qa/geracao-revisao-agencia-v1/README.md. Prévia estática dos componentes reais em http://127.0.0.1:3047/briefing.html, /fila.html e /retorno.html. Não há imagem IA real nesta rodada. A imagem visual é PNG técnico de ensaio; banco/Auth/Storage/gerador dos testes são instrumentados.

Victor revisa antes de qualquer publicação. Próximo bloco técnico é preparar/aplicar somente QA a instalação do gerador isolado e seus esquemas com backup/restauração e autorização próprios; depois executar uma imagem nominal com fontes/provedor/teto aprovados. Não confundir esta preparação com QA publicada ou geração paga funcionando. Cadastro da Notta foi adiado para o próprio Matheus experimentar depois. E-mail indicado por Victor: nottamarketing01@gmail.com; não foi criado usuário ou vínculo por essa indicação.

## 1. Escopo e composição

Três agentes convocados: geracao_fluxo (briefing/UI/percurso), revisao_retorno (ponte/arquivo/revisão), geracao_backend (runtime e revisão independente). Base de 663 fontes da QA publicada dpl_6odAcruprtVU8i1fKZhFA5yk2Mns, preservando diferenças de outras frentes. Delta: quatro arquivos modificados e cinco novos no WebApp; total candidato de 668 fontes de produto. Backend HTTP é overlay separado no pacote, não foi aplicado a nenhum checkout/serviço backend. Manifesto de fontes e diff de revisão disponíveis no pacote. Git de escrita, deploy, DDL/DML de produto, Meta, n8n, mensagens e chamadas pagas não executados. Planilha existente atualizada com histórico preservado.

## 2. O que já havia e o encaixe novo

Briefing/pedido, dispatcher, worker, leitor privado e revisão de arquivo existiam. Faltava encaminhar a imagem criada à fila existente sem a agência baixar e reenviar. Nova action recebe businessId/requestId + objetivo escolhido + confirmação; não recebe arquivo/URL/hash/autor/provedor. Revalida Auth/negócio/pedido/backend/PNG/hash/dimensões, deriva prazo da intenção salva, reconfere sessão depois do download e reutiliza upload/fila/tarefa. ID estável de negócio/pedido/job/hash preserva replay, decisões e retoma falha parcial; concorrência não cria outra revisão.

Objetivo de briefing é texto livre e não vira enum de campanha por inferência. O humano escolhe WhatsApp/Instagram no envio. Fila do gestor e notas/estados da agência continuam existentes; não inventar autoria do Cauã. Aprovar peça não confirma anúncio publicado.

A galeria usa metadados e consulta em lote dos pedidos para oferecer a ação; não baixa todos os PNGs nem consulta o backend por item. No clique, a action faz a conferência definitiva dos bytes. A mesma versão mostra um cartão de revisão, incluindo resultado fora da janela recente. Formulário reinicia por businessId/requestId.

Opção nova V2G_CREATIVE_GENERATED_REVIEW_QA_ENABLED, default OFF e identidade exata QA. Não foi criada remotamente. Ponte recusa modo fila_ficticia, artefato simulated=true e análise automática ligada. Submissão real v2 existente continua fechada.

## 3. Validação

39 casos únicos: oito novos de ponte, oito de percurso, quinze regressões de leitura real/publicação e oito do bootstrap HTTP. Uma asserção estrutural por regex foi substituída por teste funcional de concorrência, aprovado isoladamente; não somar execuções repetidas. Testes de percurso exercitam action/reader/upload/decisão/galeria reais com portas locais em memória e zero rede externa. Não são prova de RLS remoto nem de sessão HTTPS/Cauã.

Build Next 16.2.12 Turbopack e TypeScript aprovados; pnpm typecheck final exit0. Primeiro build recusou junction node_modules fora da raiz local: script de bancada ampliou apenas temporariamente a raiz de resolução para o pai e restaurou next.config.mjs byte a byte em finally. Isso não integra o delta de produto. Nenhum .env copiado/lido. Backend overlay: oito testes offline, Ruff e mypy aprovados; audit hook recusa leitura .env/rede externa e import não instancia settings/client. Rechecagem de import 1/1 não aumenta total.

Inspeção Chrome: desktop 1536 e celular 390 px; sem transbordamento horizontal nas leituras verificadas. Uma rodada de correção apenas da prévia restaurou a fonte Archivo do build, contraste do banner e seleção explícita do cartão Em revisão no retorno; fonte de produto preservada. HTML estático de componentes reais com CSS Modules mapeados, não equivalência pixel a pixel da aplicação compilada nem teste de hidratação/submit no navegador. Prévia só aceita GET/HEAD e bloqueia formulários/scripts.

## 4. Estado atual da QA, somente leitura

Consulta de catálogo/ACL confirmou profiles, businesses, creatives, creative_generation_requests e creative_review_requests existentes. Faltam seis objetos do gerador: creative_generation_jobs, creative_generation_real_dispatch, creative_generation_brand_approvals, creative_generation_reference_approvals, creative_generation_context_approvals e creative_reference_catalog. Inventário exato em qa-inventario.json. REQUESTS=false; REVIEW=true; BACKEND/REAL_SUBMISSION não configuradas na leitura de nomes/plain da QA. Nenhuma opção foi alterada.

O backend ainda exige instalação do serviço HTTPS de geração separado do GET-only de métricas e executor/tick próprio. O bootstrap HTTP novo já compõe drivers SQL/Storage/Auth reais com entradas explícitas, TLS e lifecycle; provider factory lazy é obrigatória. Não inicia worker nem chama obter_config/.env. Entrega como overlay não é serviço instalado. Documentação/backend-requisitos incluem sete propostas SQL com hashes, somente referências, sem aplicação.

Contrato v2 atual é barbearia com referência pública revisada; Dúú não passa por troca de flag/nicho. Contrato v1 de artefato foi usado no ensaio da ponte com briefing de barbearia fictícia; isso não prova o contexto completo de geração v2, consentimentos ou imagem produzida pelo modelo.

## 5. Limites e próxima prova

Ainda faltam: revisão da composição/infra, schema QA com recuperação, instalação HTTP/worker/configuração explícita, identidade/material/fontes nominais admissíveis, orçamento e uma tentativa real, envio/decisão pelo gestor legítimo e retorno autenticado. Não remover veto v2 antes disso. Falha de provedor sem resultado deve ser conciliada, nunca interpretada como custo zero ou autorização para tentar de novo. Nenhum anúncio ou verba faz parte deste percurso.

Planilha: Visão geral, Novembro — execução e Próximos passos atualizados; Matheus não é bloqueio para revisar a geração. Registros e decisões anteriores mantidos nas notas; estados financeiros continuam desligados.

## 6. Resíduo de teste e revisão automática

Um processo de ensaio com metadata Windows incompleta criou backend-candidato/%SystemDrive%. A remoção dessa pasta temporária foi rejeitada automaticamente com a mensagem literal blocked by policy, sem razão mais específica. Nenhuma remoção ocorreu, nenhuma alternativa foi tentada. O processo limpo foi ajustado e a prova afetada passou. Resíduo e caches ficam fora do manifesto/pacote e não são pendência funcional.
