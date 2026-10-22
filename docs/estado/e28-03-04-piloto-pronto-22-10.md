# E28 — 03/04 — piloto de recebimento Meta pronto para iniciar

**Janela:** noite de 21→22/10/2026  
**Estado:** playbook documental pronto; nenhum ativo operado.  
**Etapas 03/04:** permanecem concluídas no recorte aprovado. Este piloto é continuidade operacional e não reabre onboarding, multiconta ou agenda.

## 0. Dependência humana única

Victor precisa nomear uma conta-piloto externa autorizada e fornecer por canal seguro: responsável autorizado, portfólio empresarial, conta de anúncios, Página, Instagram/dataset apenas se usados e operador V2G da sessão. Não enviar senha, token, chave ou código de 2FA.

## Resultado deste bloco

- Reconciliado `docs/recebimento-cliente-meta.md` com o código pós-push.
- Confirmado WebApp OAuth/Graph `v25.0` em `lib/meta/oauth.ts:15,75-99`.
- Confirmado backend Graph `v23.0` e fallback atual para System User em `backend_v2g/src/meta/graph.py:67,128-162`.
- Confirmado que `POST /campanhas` continua sem preencher token por pedido e exige conta/Página explícitas, sem fallback V2G (`backend_v2g/src/api/rotas.py:3388-3412` e bloco seguinte).
- Confirmado que `lib/meta/publicar.ts` existe, mas não há consumidor de `publicarCampanha`; não foi promovido a runtime atual.
- Preservado o estado do n8n: export versionado aceita conta/Página informadas pelo operador; paridade do workflow ao vivo não foi medida nesta rodada.
- Acrescentado checklist copiável de IDs, responsável, operação e evidência por passagem.
- Acrescentada mesa local de dois negócios no mesmo canal, apontando para os 16 cenários já executados pelo 07/08 em vez de duplicá-los.

## Dependências reconciliadas

- Envio/revisão de imagem: 17 verificações HTTPS anteriores com Auth, banco e Storage. Não prova Meta.
- Compra/e-mail: evidências próprias preservadas; não foram repetidas e não provam acesso Meta.
- Backend QA: serviço visível no painel, mas não implantado/operacional; schema e segredos QA ainda têm portões individuais.
- Aceites continuam separados: acesso manual; API de leitura; API de publicação.

## Arquivos

- Atualizado: `docs/recebimento-cliente-meta.md`.
- Novo: `docs/estado/e28-03-04-piloto-pronto-22-10.md`.
- Preservado: FigJam `DGGCCnjlOlmy5vzsa11yoW`; não recriado nem editado.

## Verificações desta rodada

- Inspeção read-only de versões Graph, escopos OAuth, armazenamento/seleção dos IDs, consumidor do publicador direto e montagem do pedido no backend.
- Leitura dos checkpoints HTTPS de imagem e da ponte local 07/08.
- Nenhum build, restart, suíte ampla ou repetição dos 16 cenários, pois não houve mudança de código nem risco funcional novo.

## Não medido / não executado

- acesso atual de uma conta externa;
- atribuição real de ativos ao parceiro, pessoas ou System User;
- API Meta de leitura ou escrita nesta rodada;
- backend-qa implantado e resposta 200 com dados;
- paridade entre export n8n e workflow vivo;
- campanha publicada ou em veiculação;
- nova submissão do App Review.

## Ações com autorização específica

Criar conta/usuário/fixture externa; convidar pessoas; conceder permissões; compartilhar ativos; aplicar schema/migration; inserir/trocar segredo; implantar backend-qa; alterar configuração, OAuth, runtime ou n8n; realizar escrita na Meta; publicar/usar verba; reenviar App Review.

## Próximo passo

Após Victor nomear o piloto, executar somente o inventário e o compartilhamento assistido. Encerrar com três resultados independentes: acesso manual, leitura API e publicação API. Falha de um não apaga a evidência dos outros e não autoriza fallback para ativos V2G.
