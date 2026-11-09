# Novo onboarding — publicação e validação QA — 09/11/2026

## Escopo e estado

Victor informou commit/push e autorizou conferir o WebApp, publicar o backend somente na QA e validar com a Piligrin e os dados do Dúú. Produção, Meta, permissões e workflows n8n não recebem alterações por consequência.

**Backend QA publicado e saudável. WebApp novo publicado no projeto QA correto. Validação real parcial do onboarding: seis respostas e referência de preço salvas/retomadas, sem sobrescrever a agência nem criar execução. Falta confirmar se “Rio de Janeiro inteiro” significa município ou estado antes de gravar a praça e concluir o teste integrado.**

## WebApp publicado

- Projeto `v2g-webapp-qa`, alias `https://v2g-webapp-qa.vercel.app`.
- Deployment `dpl_6TzN8GeoQAbmP5PjSJBfU2Pq2LM6`, estado **READY**, branch **QA**, commit **36da22a38668fed3267c1c7f04fbaf53eea0b9d2**.
- URL imutável `https://v2g-webapp-eewxh498p-v2-g.vercel.app`.
- Checkout WebApp limpo nesse commit na conferência inicial; ref remota QA igual.
- `target=production` na Vercel é o alvo principal do projeto isolado QA, não o projeto de produção do produto.

## Backend publicado

- Destino confirmado na UI: projeto **ia**, serviço **backend-qa**, fonte **Upload**, Dockerfile **infra/Dockerfile**.
- Saúde antes: **002587a88fae**; saúde depois: **ff1ef5226922**, exatamente igual à impressão digital do pacote testado.
- `ok=true`, esquema conferido, migrations pendentes vazias, leitura Meta habilitada, observador automático desligado. Banco real QA; demais provedores seguem simulados conforme saúde, sem mudar configuração.
- A imagem usa `APP_ENV=production`; esse modo não altera o destino QA, identificado pelo host `ia-backend-qa.5hue9s.easypanel.host` e serviço nominal.
- Upload feito **uma vez**, iniciando automaticamente Deploy service. Não foi clicado Implantar de novo. Build terminou **Success** e nomeou `docker.io/easypanel/ia/backend-qa:latest`.
- Manifest de imagem: `sha256:951712e630cf591a722e99ca4fe8c9eb8f1891dca56145173dc3763237b23a7c`.
- A rota `/cadastro/operacional`, modelo V2 e resposta `conferido_sem_execucao` existem no OpenAPI publicado. POST puro sem token retornou **401**, conforme esperado.
- Nenhum workflow n8n foi importado/ativado. O pacote de backend não inclui essas automações no runtime.

### Fonte exata e diferença no Git

Ao contrário do informado inicialmente por Victor, o backend candidato ainda apresentou alterações locais: **31 arquivos**, HEAD/ref remota **646ab181d30255cf6a592d98b0bb994ce454c704**, branch `codex/qa-inicio-serie-diaria`. A main permaneceu em **c3e13596e5c4642b1cf9a342472fa411907313d4**. As worktrees localizadas são a main, a frente criativo-a2 e a candidata QA. Não foi possível ler a janela minimizada do GitHub Desktop; não se atribuiu a ela um destino presumido.

A autorização explícita de publicação QA foi cumprida usando o mesmo método de pacote fechado já adotado anteriormente. Antes de empacotar, os **31/31 hashes** foram comparados ao snapshot final da implementação testada. Nenhum arquivo mudou. O TAR contém **287 arquivos** de runtime, todos relidos e conferidos; exclui `.env*`, `.git`, `.venv`, caches e credenciais. Não se publicou a main por aproximação nem se fez commit/push pelo agente.

- Pacote privado: `C:/Users/victo/.codex/private-backups/v2g/releases/qa-onboarding-operacional-20261109/backend-qa-onboarding-operacional.tar.gz`.
- SHA-256: **6385994c36888ec928ec4ff16d39c13e57bebdb7dcb496883b23ef02f274dc20**.
- Manifesto: `manifesto-pacote-qa.json`, na mesma pasta.
- A impressão digital mede o código; não é identidade completa das dependências resolvidas durante o build.
- **Pendência de Git:** registrar e enviar os arquivos dessa pasta/branch QA, pelo fluxo manual de Victor. Publicação por pacote não comprova esse commit.

## Validação real na sessão Piligrin

Sessão do WebApp conferida na UI: **Victor**, negócio ativo **Piligrin**. Projeto Supabase nominal **v2g-webapp-qa**, ref **zskpijnqgkqwxksqmzmf**, negócio **9cb85308-02cc-4ce7-bacf-15be77f9ba5e**.

Backup privado da linha do negócio capturado antes das gravações: `piligrin-antes.json`, na pasta privada do pacote. Continha onboarding vazio, nome Piligrin, orçamento 3000 com procedência confirmada e campos econômicos vazios. Nenhum dado de autenticação ou configuração foi consultado para esse backup.

Pelo próprio formulário publicado, com confirmação de gravação e posterior recarregamento:

1. Agência/gestor opera para o anunciante.
2. Anunciante: Dúú Gomes.
3. Contratante: Piligrin.
4. Ramo: indústria de bebidas, usando atividade escrita sem forçar um nicho técnico inexistente.
5. Produto: chope de vinho, principalmente para bares/pontos de venda e algumas vendas para consumidores finais.
6. Comprador: empresas, bares e pontos de venda para revenda, com vendas ocasionais a consumidor final.

O cabeçalho mostra **Anúncios de Dúú Gomes**, com **Contratante/responsável informado: Piligrin**, e retoma em **6 de 9 respostas**, na pergunta de praça. Não foi criado acesso para o Dúú nem renomeada a linha Piligrin.

Na referência opcional foi gravado **69 a 70 BRL / fardo**, certeza **aproximado**, com fonte e data. O sucesso foi exibido; após reload, faixa, unidade e certeza foram recuperadas. Não se registrou quantidade de seis unidades como confirmada, nem preço unitário.

Releitura direta de QA confirmou: nome **Piligrin**, descrição/ramo/cidade/CEP/raio/site/Instagram canônicos continuam como antes; teto **3000** e sua procedência preservados; ticket, custo e lucro continuam **null**; execuções do negócio **0**, igual ao início. As respostas e a oferta ficam no JSON do anunciante. Nenhum formulário financeiro obrigatório voltou a aparecer.

### Resultado e limites da prova

- Publicação, saúde, existência do contrato e recusa sem token: comprovadas na QA.
- Sessão/negócio, persistência, retomada e separação agência/anunciante: comprovadas nos seis campos e na oferta salvos.
- **Ainda não comprovado:** retorno autenticado V2 completo ao WebApp e gravação do estado de conferência, pois faltam praça/destino/caminho no percurso sequencial.
- Região informada por Victor nesta rodada: **“Rio de Janeiro inteiro”**. A confirmação município/estado foi solicitada; não se escolheu raio/cidade por inferência. A UI publicada oferece raio/cidade/Brasil, sem abrir texto livre para praça; se a resposta for estado, será necessário expor esse caminho já aceito pela action antes de considerar a etapa encerrada.
- Materiais/marca, decisão da peça pelo Cauã e autorização de campanha são estados separados; não foram marcados como concluídos sem prova.

## Regressão dos resultados

Após a publicação do backend, Início na sessão Piligrin, conta **act_1165478988908157**, recorte **01–07/11**: **R$ 281,80**, **26.129 impressões**, **466 cliques**, cobertura **1/10**. Coleta exibida após reload: **09/11/2026 17:34:22 BRT**. Gráfico e sete linhas diárias presentes, iguais à referência anterior; teto **R$ 3.000,00** preservado. As pendências do cadastro são exibidas separadamente e não viram “campanha sendo preparada”.

Gastos diários: 45,14; 29,37; 56,56; 66,87; 28,76; 29,18; 25,92. A observação desconhecida das demais campanhas não virou zero. Não foi feita nova conferência independente de cada impressão/clique diário na BM.

## Evidências e parada

Pasta `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/onboarding-publicado-qa-09-11/`: deployment WebApp, saúde posterior, fonte antes do upload, log/build Success, referência salva, onboarding parcial e Início após backend. Backups da linha antes/parcial e manifesto de fonte ficam na pasta privada do pacote.

Não houve alteração em produção, configuração de ambiente, permissões, DNS, Meta, cobrança ou workflows. Não houve commit/push pelo agente. A validação completa do cadastro permanece aberta até a confirmação da região e a prova das etapas restantes.
