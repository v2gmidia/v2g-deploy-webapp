# Agência publicada na QA — conferência Piligrin depende de login

## 0. Resultado atual e próxima ação

> RESOLVIDO em 12/11/2026: Victor entrou legitimamente na QA. Roteiro Piligrin → Dúú concluído na revisão publicada, incluindo números, gráfico, criativos e retorno. Registro atual em `n26-piligrin-duu-validacao-autenticada-qa-12-11.md`. Não pedir novo login por esta pendência antiga.

> 12/11/2026: Victor adiou o login por estar indo dormir e pediu avanço independente. Regressão publicada da sessão B2B disponível concluída e registrada em `n26-qa-conferencia-independente-login-12-11.md`. A conferência positiva da Piligrin permanece pendente, sem novo pedido ou recorrência para repetir essa dependência.

11/11/2026. Victor informou o push e autorizou continuar a conferência somente na QA.

**Publicação QA confirmada READY na revisão correta.** Prova de isolamento publicada aprovada em Início, Criativos e Anúncios usando a sessão legítima disponível, pertencente a outro cadastro. **O percurso positivo Piligrin → Dúú ainda não foi conferido nesta nova publicação**, porque essa sessão não está aberta.

Foi deixada a aba **Entrar — V2G**, exclusivamente em `https://v2g-webapp-qa.vercel.app/entrar`, no navegador interno, com o e-mail QA da Piligrin preparado. Victor precisa concluir a senha e o login privadamente. Pergunta assíncrona enviada; não foi solicitado envio de senha, link ou código no chat.

Depois do login: conferir agência sem questionário → carteira → Abrir aplicativo do Dúú → números e gráfico no mesmo período → Criativos → Anúncios → volta com filtros. Não tratar a pendência de login como defeito comprovado do produto nem trocar propriedade, permissões ou sessão por atalhos.

## 1. Publicação conferida

- Branch local/remota `QA`, HEAD `60b4114404495147d80c2df679b9cac02da7338d`, checkout limpo no início da conferência.
- Projeto Vercel `v2g-webapp-qa`, ID `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`.
- Deployment `dpl_3ATyTy9fVYRUUTfunu9rPCqyE6qF`, fonte Git na branch QA e no mesmo SHA, **READY**.
- Alias `https://v2g-webapp-qa.vercel.app` aponta para essa revisão.
- URL imutável `https://v2g-webapp-jg49kby3t-v2-g.vercel.app`.
- O target `production` da Vercel é o ambiente do projeto isolado QA. Não houve promoção ao projeto produtivo da V2G.
- Os 20 arquivos de produto/testes conferem com os hashes do snapshot do pacote aprovado; nenhuma divergência. Não houve mudança de código neste acompanhamento nem necessidade de repetir a suíte já encerrada.

## 2. Provas publicadas executadas

1. Sessão já existente do Chrome abriu o negócio **V2G**, com seu próprio resumo de resultados. Seu seletor oferecia somente esse negócio; não foi tratado como acesso da Piligrin. Nenhuma sessão/papel/identidade foi forjada e esse usuário não foi desconectado pelo agente.
2. Após a nova revisão estar READY, solicitar o ID do Dúú em `?cliente=` nas rotas `/inicio`, `/criativos` e `/anuncios` retornou **Cliente indisponível**, com orientação para abrir um cliente disponível. Não foram exibidas peças ou métricas do Dúú nesse outro cadastro.
3. A consulta administrativa somente leitura confirmou a relação histórica explícita Piligrin/Dúú e a relação FamFire já existentes, mesmo titular. O acesso piloto QA da Piligrin permanece não revogado, com expiração registrada em 05/12/2026. Isso não autentica o navegador por conta própria.
4. Fingerprints dos dois negócios comparados antes e depois das provas de navegação: **2/2 idênticos**. Não houve escrita SQL, migração, mudança de vínculo, resposta de onboarding ou dado comercial neste acompanhamento.

As negativas publicadas complementam as 48 provas de agência, 14 de histórico, 34 provas SQL locais e o build aprovados no bloco anterior. Não substituem a conferência positiva da sessão real da Piligrin.

## 3. Limites e encerramento deste acompanhamento

A publicação e a negativa de isolamento estão encerradas. A única dependência para retomar o roteiro positivo é o login privado correto. Não reenviar pedidos ao Cauã, mexer em pagamentos, publicar backend ou anúncios, aplicar migração ou alterar produção como consequência desta espera.

Os próximos resultados devem ser registrados após o login ou uma falha concreta nova. Nenhum novo commit, push, merge ou deploy foi feito pelo agente.
