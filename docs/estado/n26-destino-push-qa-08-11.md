# Destino do push — QA separado de produção — 08/11/2026

## 0. Decisão operacional atual

**Conferência de código aprovada; push na `main` não liberado neste bloco QA.** A Vercel está configurada para publicar produção automaticamente a partir dela. A candidata deve chegar à branch **`QA` (maiúscula)**, que publica no projeto isolado `v2g-webapp-qa`, preservando a `main` sem novo push/merge neste bloco.

Este achado posterior torna específicas as orientações genéricas de commit/push nos checkpoints anteriores. Não desativa nem modifica nenhuma configuração. O ato manual continua com Victor, conforme a regra do repositório de não commitar, empurrar, mesclar ou fazer deploy pelo agente.

## Fatos medidos às 23:34 BRT

- Branch local atual: `main`; HEAD `13f8943471b391bd22e9dd8362f5748653ad9c5b`, com alterações locais não commitadas.
- Branch local `QA` e referência local `origin/QA` existem. Não houve fetch nem prova de atualização remota nesta conferência.
- `QA` local está em `50d72feaa0d1b43209512e179b9b7681d6b87c6f`. Comparação local `QA...main`: **0 commits exclusivos de QA e 27 exclusivos de main**. Mudar para QA sem atualizar sua base pode deixar código necessário de fora.
- O conector Vercel `get_git_deployment_context` confirmou os dois projetos ligados a `v2gmidia/v2g-deploy-webapp`.
- O conector `get_project` não retorna os campos de vínculo/branch; ausência desses campos não foi interpretada como repositório desconectado. A regra exata foi conferida na UI autenticada.

| Projeto conferido | Branch Tracking na UI | Auto-assign Custom Production Domains | Destino visível |
|---|---|---|---|
| `v2g-deploy-webapp` (`prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl`) | `main` | Enabled | `v2g-deploy-webapp.vercel.app` |
| `v2g-webapp-qa` (`prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`) | `QA` | Enabled | `v2g-webapp-qa.vercel.app` |

Fontes UI: `https://vercel.com/v2-g/v2g-deploy-webapp/settings/environments/production` e `https://vercel.com/v2-g/v2g-webapp-qa/settings/environments/production`. Nenhum controle foi alterado; Save permaneceu desabilitado.

“Production Deployment” dentro do **projeto isolado QA** é a terminologia da plataforma para seu ambiente principal. O projeto de produção do produto é outro. Não se deve confundir os dois.

## Próximo ato manual concreto

1. Preservar as alterações locais no GitHub Desktop; preparar a branch `QA` com a base atual da `main` e as alterações deste bloco. Não descartar arquivos nem restaurar o estado antigo da QA. A comparação acima é local; conferir o remoto no fluxo manual antes de atualizar a branch.
2. Revisar e commitar na **QA** a candidata coerente, com seus documentos e pacotes selados. Os 16 arquivos M1/M2 identificam um recorte; não devem ser publicados isoladamente sem o restante do código necessário. Não incluir backup privado, credenciais ou arquivos de ambiente.
3. Fazer push **da QA**, acompanhando o build/deployment no projeto **v2g-webapp-qa** e registrando SHA/URL. Build novo ainda não foi executado neste fechamento local. Não fazer push/merge da main ou promover para o outro projeto.
4. Depois do deployment QA READY, ensaiar números e revisão de peça com cliente/Cauã em suas sessões próprias, conforme `docs/handoffs/n26-m1-m2-publicacao-manual-qa-08-11.md`. Permissão do leitor Meta, flags e fluxo real continuam sujeitos a essa prova; não se ampliam acessos por conveniência.

Estado técnico que embasa a candidata: U1–U6 aplicadas/verificadas no QA, `pnpm conferir` completo exit 0, correção de sessão com regressão, 155 selos íntegros e `git diff --check` exit 0. Esses resultados não liberam produção nem certificam a rodada real.

Evidências locais: `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/piloto-duu-08-11/main-publica-producao.jpg` e `qa-publica-qa.jpg` na mesma pasta.

Nenhum Git de escrita, deploy, alteração de painel, publicação de anúncio ou gasto foi realizado. Parada após identificar o destino correto; o projeto QA deve ser a única publicação do próximo ato.
