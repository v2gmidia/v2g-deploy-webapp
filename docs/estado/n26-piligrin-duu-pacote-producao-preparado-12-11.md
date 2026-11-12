# Piligrin/Dúú — pacote produtivo preparado para revisão

## 0. Resultado e próxima decisão

12/11/2026. Victor pediu preparar o pacote de produção, preservar os dados e mostrar as mudanças antes de aplicar. **Pacote local preparado e selado; nada aplicado ou publicado.** Revisão principal: `docs/producao/piligrin-duu-12-11/REVISAO.md:1`. Hashes e diffs exatos: `docs/producao/piligrin-duu-12-11/manifesto.json:1`.

Próxima decisão de Victor: revisar e aprovar/ajustar o pacote. Ativação completa depende ainda de acesso contratado real ao novo anunciante, conexão Meta produtiva e mapeamento legítimo do Cauã para preservar sua revisão. Não há nova pergunta de WhatsApp a reenviar. Documento e credenciais devem ser inseridos privadamente no momento autorizado.

## 1. Escopo concreto

Piligrin entra na carteira administrativa sem onboarding de anunciante. Dúú ganha registro separado e vínculo explícito com a agência, com os dados/cores/teto/região já confirmados. Início, gráfico, Anúncios, Criativos e retorno à carteira usam contexto conferido. FamFire excluída deste lote. Nenhum acesso direto de Dúú criado.

Candidata WebApp `C:/Users/victo/v2g-deploy/webapp-piligrin-producao`, base produtiva `13f8943471b391bd22e9dd8362f5748653ad9c5b`, 64 arquivos no diff local. Candidata backend `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-piligrin-producao`, base `1bfe3b5c03c1a2a3c25b09ca41cb77613fb20543`, 12 arquivos no diff local.

A base do backend foi verificada por fingerprint igual ao `/saude` produtivo, `dbf2611f3b1e`, em vez de supor que a main local mais recente estava publicada. Candidata `677db34772e8`: duas rotas GET novas com série diária e histórico vazio apenas com titular comprovado. Contratos HTTP anteriores preservados na exportação local. Opt-ins produtivos distintos do piloto QA; nenhuma concessão QA foi ampliada.

O banco proposto contém oito tabelas de relação/carteira/revisão/acesso contratado, índices, funções, RLS e ajuste guardado do cadastro histórico. Está fora de migrações automáticas e não contém pagamento, concessão aceita, gestor atribuído, conta Meta ou publicação pré-preenchidos. Detalhes em `docs/producao/piligrin-duu-12-11/dependencias.json:1`.

## 2. Preservação e testes

- Produção continua no deployment `dpl_A2GgHjfNbRGGcNwNXwdS412xC7aW`, READY, commit `13f894...`.
- Sete negócios com fingerprints idênticos antes/depois; zero pedidos; raiz ainda vazia e estrutura de agência ainda ausente. São metadados de preservação, não backup integral capturado.
- Logo/arte copiados intactos localmente; arte conferiu com SHA-256 da revisão QA. Nenhum objeto foi enviado ao Storage produtivo.
- WebApp: 118 testes, typecheck e build isolado aprovados; nenhuma `.env` ou credencial real herdada pelo build. Inclui regressão de onboarding legado e novo resumo restrito ao anunciante vinculado.
- Uma tentativa intermediária de build falhou com erro Windows 32 ao ler dependência compartilhada ocupada. Sem mexer em outros processos, nova cópia/build isolado concluiu com sucesso (`C:/Users/victo/AppData/Local/Temp/v2g-agency-build-nUu9W5`).
- Backend: 2.864 testes passaram, 9 ignorados e 9 avisos; Ruff `src tests` e mypy limpos. O lint adicional da raiz encontrou 11 alertas anteriores em `produto-site`, preservados fora do pacote.
- PostgreSQL descartável: 111 verificações de DDL/RLS/ACL, cadastro, repetição, drift e preservação. Fixtures focadas não equivalem a restauração do banco produtivo inteiro.
- Ambos os patches conferidos com `git apply --reverse --check`, sem aplicar mudança. Evidência consolidada em `docs/producao/piligrin-duu-12-11/validacao.json:1`.

## 3. Limites e retorno

Não houve migração, cobrança, anúncio, alteração de verba, permissão/credencial remota, painel, n8n, página legal, commit, push, merge ou deploy. As outras worktrees e os arquivos QA de outros blocos foram preservados. Não se concluiu validação autenticada do novo cadastro em produção.

Após aprovação específica, capturar/verificar o backup privado real, reconciliar e aplicar dependências por unidade, preparar cadastros, resolver acesso/Meta/autoria e publicar apenas os diffs aprovados. Retorno completo usa releases anteriores verificadas; não apagar dados novos nem auditoria após uso. Não promover a QA inteira nem a candidata comercial separada por consequência deste pacote.
