# Histórico publicado e validação Piligrin — QA — noite de 09/11/2026

## 0. Resultado e próxima ação

**WebApp conferido, backend publicado exclusivamente na QA e histórico validado na sessão real da Piligrin.** A ausência de rodadas da V2G deixou de aparecer como falha de consulta. Os números Meta continuam separados e não são somados aos do histórico.

| Frente | Estado comprovado | Próxima ação / responsável / prova |
| --- | --- | --- |
| WebApp QA | Commit `b6334de` READY no alias QA. | Central: manter esta referência na conferência do piloto. |
| Backend QA | Pacote publicado, build Success e runtime `90c134b76109` saudável. | Victor: conferir o registro Git na pasta candidata; a correção do histórico ainda está local. |
| Histórico Piligrin | Mensagem correta de ausência de rodadas na página autenticada de Anúncios. | Encerrado este defeito; não criar rodada fictícia para preencher a tela. |
| Resultados Dúú | 01–07/11: R$ 281,80, 26.129 impressões, 466 cliques, gráfico de sete dias; cobertura parcial 1/10. | Central: preservar o mesmo recorte e a indicação de cobertura nas provas seguintes. |
| Revisão da peça | Imagem carregada, peça aprovada, Cauã Carlos e publicação ainda em conferência. | Cauã: confirmar a data desta versão da imagem no AD 01; depois usar o fluxo legítimo de confirmação na QA. |
| Marca/material | Pendência continua explícita no Início. | Victor/gestor: conferir os materiais e cores; não aceitar automaticamente pelo agente. |
| Plano de novembro | Há registros antigos na planilha que precisam ser reconciliados com as provas atuais. | Central no próximo ciclo: atualizar somente estados comprovados, donos e próxima prova, preservando detalhes e histórico. |

Produção, banco, anúncios, verba Meta, permissões, credenciais e automações n8n não receberam alterações neste bloco. Nenhum commit/push foi feito pelo agente.

## 1. WebApp publicado

- Projeto `v2g-webapp-qa`, ID `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`.
- Alias `https://v2g-webapp-qa.vercel.app` aponta para `dpl_9ipzAUVio3ksjbZSjsWuZk4a3a41`, **READY**.
- Branch `QA`, commit `b6334de03aaed36d3ecfa225cad1ff09c0d4c80a`.
- URL imutável `https://v2g-webapp-7ftvzsh3f-v2-g.vercel.app`.
- O `target=production` da Vercel pertence ao projeto isolado QA; não houve promoção ao projeto de produção da V2G.
- Checkout WebApp estava limpo nessa conferência. Este registro e a entrada no índice são documentação nova posterior ao push informado.

## 2. Backend: fonte, publicação e retorno

Destino conferido na UI autenticada do Easypanel: projeto **ia**, serviço **backend-qa**, fonte **Upload**, builder **Dockerfile**, caminho **infra/Dockerfile**. Nenhuma configuração foi editada.

A candidata `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-qa-inicio`, branch `codex/qa-inicio-serie-diaria`, continua em `18d503b1abe9761a082a0ad723285c5790fc1620`. A consulta direta à branch remota retornou o mesmo SHA. `src/api/rotas.py` está modificado; o teste e a nota de histórico continuam sem rastreamento. Portanto, não foi comprovado o commit/push desta correção no backend, apesar da informação inicial do usuário. Não se alterou o Git para resolver a diferença.

Foi usado o método de pacote QA já autorizado. Comparação integral com o manifesto do pacote anterior: **286 arquivos idênticos e apenas `src/api/rotas.py` diferente**; mesmo conjunto de 287 arquivos. O diff é a correção de consolidado vazio com titular comprovado, sem alteração de autenticação. O TAR foi relido membro a membro, com hashes conferidos e sem `.env*`, `.git`, ambientes virtuais, caches ou credenciais.

- Pacote privado: `C:/Users/victo/.codex/private-backups/v2g/releases/qa-historico-20261109/backend-qa-historico.tar.gz`.
- SHA-256: `134439cad852b580fce98ac2fabe9a59aa7225eb9da7923cec4b2016cf556d5f`.
- Manifesto e preparação: mesma pasta privada; não incluídos no Git.
- Saúde antes: `ff1ef5226922`; depois: **`90c134b76109`**, igual ao cálculo local e ao pacote.
- `ok=true`, esquema conferido, nenhuma migração pendente, leitura Meta habilitada e observador desligado. Banco real da QA; demais modos simulados preservados.
- A saúde informa `ambiente=production` porque esse é o modo da imagem. O destino é o host nominal QA `ia-backend-qa.5hue9s.easypanel.host` e o serviço `ia/backend-qa`.
- Upload realizado uma vez; iniciou automaticamente Deploy service. Não foi clicado Implantar novamente.
- Build **Success** em `10/11/2026 02:57:42 UTC` (`09/11 23:57:42` em Brasília).
- Imagem `docker.io/easypanel/ia/backend-qa:latest`; manifest list `sha256:c3140cfcf22e71b603f7892c34e52fee459c5740bd6856eaeaea6f66a0a1e0a2`.

O pacote anterior de onboarding continua preservado como referência de retorno do código. Não é backup byte a byte da imagem anterior nem garantia das mesmas dependências resolvidas pelo instalador. A impressão digital mede o fonte Python, não o conjunto completo de dependências.

## 3. Prova autenticada com a Piligrin

Sessão: Victor, negócio ativo **Piligrin**, ID `9cb85308-02cc-4ce7-bacf-15be77f9ba5e`. Anunciante declarado: **Dúú Gomes**. Conta Meta `act_1165478988908157`. Nenhuma identidade ou sessão do Cauã foi utilizada por aproximação.

Antes do backend novo, o WebApp já publicado ainda mostrava a falha no histórico. Depois da saúde confirmar o runtime novo, recarregar a mesma página autenticada de Anúncios produziu:

> Histórico por rodada da V2G
>
> Ainda não há rodadas da V2G para este negócio.
>
> As campanhas e os resultados da Meta são acompanhados na consulta acima.

A consulta Meta acima permaneceu disponível. Campanha `52570261860675`: **R$ 281,80 / 26.129 impressões / 466 cliques**, no recorte **01–07/11**. O mesmo valor observado no conjunto não foi somado outra vez. Conversas continuam **não medidas**. Consulta exibida em Anúncios: `09/11/2026 23:58:20` em Brasília.

Retorno ao Início do Dúú preservou total, gráfico de sete dias, aviso de cobertura **1 de 10 campanhas**, teto **R$ 3.000**, região **Todo o estado do Rio de Janeiro** e responsável **Cauã Carlos**. Pontos do gráfico: R$ 45,14; 29,37; 56,56; 66,87; 28,76; 29,18; 25,92. A volta pela navegação mantém o estado da tela; não constitui nova conferência independente de cada dia na BM.

Em Criativos, a prévia real carregou **1254 × 1254**. O acompanhamento separa **Peça aprovada pelo gestor**, em 09/11, de **Publicação em conferência / Ainda sem confirmação de publicação**. A volta aos Criativos da agência manteve busca Dúú, uma peça, responsável e o mesmo estado. Nada foi enviado novamente, aprovado outra vez ou marcado como publicado.

Limite do aceite: esta prova encerra o defeito do histórico vazio. Não demonstra rodada V2G executada, operação de 50 clientes, cobertura completa da conta Meta ou aceite geral do piloto.

## 4. Testes e evidências

Nesta rodada, `test_historico_sem_rodadas.py` e `test_consolidado_do_negocio.py`: **27 aprovados, 2 avisos**, sem falhas. Incluem vazio comprovado, titular diferente/ausente, falta de perfil, período inválido e falha de leitura que não vira vazio. Uma chamada inicial apontou para nome de arquivo de teste inexistente; não executou testes e foi corrigida para o arquivo real antes da publicação.

A suíte completa **3.073 aprovados / 10 pulados**, Ruff, mypy, `pnpm conferir`, build e regressões de revisão/publicação são a validação anterior deste mesmo diff, registrada em `n26-pendencias-caua-historico-qa-09-11.md`. Não foram apresentadas como novas execuções nesta rodada. Não houve nova mudança de código de produto.

Provas privadas em `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/historico-publicado-qa-09-11/`: log do build, saúde, DOM autenticado de Anúncios/Início/Criativos, retorno à carteira e `historico-piligrin-qa.png`. A imagem foi aberta e conferida: mostra a página de Anúncios da Piligrin com a mensagem correta.

## 5. Cauã e trabalho noturno

O grupo **🎯 03 | Operação — Gestores** ainda mostra o pedido das **22:51** entregue e sem resposta sobre a data desta versão da arte no **AD 01 `52570262604075`**. Nenhuma nova cobrança foi enviada. Não foi inferida data de publicação a partir da criação da campanha ou de resposta sobre outro assunto.

Automação existente `acompanhar-v2g-durante-a-noite` atualizada, **ACTIVE**, vinculada a esta conversa, a cada **30 minutos** até **10/11 às 08h de Brasília**. As demais automações noturnas anteriores permanecem pausadas. A recorrência é para avançar o piloto autorizado, não para repetir acompanhamento deste deploy já concluído.

Ordem das próximas provas: reconciliar o plano e a visão geral com fatos atuais; preparar o próximo percurso assistido; tratar apenas nova resposta pertinente do Cauã. Correções locais ficam no escopo aprovado das quatro telas/onboarding/histórico e exigem testes proporcionais. Sem novo deploy/commit/push, migração, escrita Meta ou confirmação fictícia por consequência da recorrência. Duas execuções sem mudança verificável ou com o mesmo bloqueio provocam pausa; também pausa quando Victor retornar, o escopo terminar ou chegar o horário limite.
