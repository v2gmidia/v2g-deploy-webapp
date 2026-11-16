# Conversas e aviso de cobertura — revisão antes de produção

**Preparado e testado localmente em 14/11/2026. Não aplicado.**
Nenhum commit, push, merge, deploy, escrita no banco ou alteração remota neste bloco.
Este pacote parte das mains atuais de produção, com somente a correção de conversas/cobertura.

## O que Victor verá depois da aplicação

| Parte | Hoje na versão produtiva | Com o pacote |
|---|---|---|
| Início do Dúú | Card de conversas sem integração | **Conversas por mensagem (Meta)**, com a contagem real da conta e período selecionados |
| Anúncios | Campo legado de WhatsApp sem contagem homologada | A mesma definição de conversas por mensagem, para campanha, conjunto e anúncio, cada um com o seu valor |
| Cobertura | Uma campanha observada e nove sem linhas podem gerar “Resultados parciais” | **“1 campanha com dados no período; 9 sem registros neste período.”** |
| Incompletude real | Aviso genérico | Aviso mantido quando há cobertura/campos incompletos ou período aberto; ausência continua “Não medido” |
| Sobre esta leitura | Explicação anterior | Explica fonte, atribuição, ausência e que não se somam os níveis da hierarquia |
| Resumo do cliente direto | Três indicadores | Quarto indicador de conversas, usando a mesma identidade visual e adaptação móvel |

O gráfico continua sendo de investimento diário. Não há gráfico de conversas inferido do total.
Não há promessa de pessoas únicas, vendas, caixa de entrada confirmada ou WhatsApp exclusivo.
Se a fonte não confirmar a ação em alguma linha diária observada, o valor desse objeto
permanece “Não medido”; zero exige confirmação explícita.

## Evidência já observada na QA

Na sessão legítima da Piligrin, Dúú, **01–07/11/2026**, Início e Anúncios mostraram
**105 conversas, R$ 281,80, 466 cliques e 26.129 impressões**. O gráfico e a tabela de
sete dias conferiram; a volta à carteira funcionou. Em 01–14/11, o aviso de período
incompleto continuou aparecendo. Esses são resultados da QA, não uma publicação deste pacote em produção.

Os números serão consultados novamente na produção depois da aplicação autorizada;
105 não é um valor gravado/fixado no código de produto.

## Identidade e conteúdo

| Projeto | Pasta candidata | Branch local | Base produtiva |
|---|---|---|---|
| WebApp | `C:/Users/victo/v2g-deploy/webapp-conversas-producao` | `codex/conversas-producao` | `d09287c8aa943d4d61fbcd9d03ebbc584aea6806` |
| Backend | `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-conversas-producao` | `codex/conversas-producao` | `540e135487237e07aedb13e04daba5bc28280a25` |

As branches estão sem upstream. As pastas anteriores e alterações de outros chats foram preservadas.
Não mesclar a QA inteira para entregar este ajuste: ela contém diferenças de onboarding,
autorização, automações e documentação que não pertencem a este pacote.

- **WebApp:** sete arquivos de produto, seis de verificação. `webapp.patch` contém os 13.
- **Backend:** um arquivo Python de produto (`src/meta/leitura_anuncios.py`), três de
  verificação e um contrato documental. `backend.patch` contém os cinco.
- `manifesto.json`: hashes normalizados LF dos arquivos-base/candidatos e SHA-256 dos patches/TARs.
  Ambos os patches passaram na verificação reversa sem aplicar mudanças.
- Novo contrato aditivo: `conversas_mensagem` e `definicao_conversas_mensagem` opcionais.
  As **57 rotas**, autorização e todos os outros schemas/campos são iguais aos da base.
- SHA do código backend produtivo conferido em `/saude`: **5729135ceac1**,
  igual ao cálculo local da base. Candidata: **088a9da1e501**.
- O WebApp produtivo foi confirmado no deploy **dpl_4iMkzxy1jadcMwXQaDCJEetZ9i7Q**, READY,
  correspondente à main acima e ao domínio `app.v2gmidia.com.br`.

Não há mudança em migrations, tabelas, dados, titularidade, carteiras, sessões,
permissões, RLS, flags, credenciais, checkout/pagamentos, páginas legais ou n8n.
O histórico e as guardas específicas da produção são preservados.

## Testes e limites

- Backend candidato: **3.170 testes passaram, 9 pulados**, 9 avisos de depreciação existentes.
  Ruff e mypy passaram (183 arquivos fonte).
- WebApp candidato: typecheck e build passaram. Conversas, parser, soma, cobertura,
  agência, promoção, marca/período e fronteira cliente foram conferidos localmente.
- Três cenários do conferidor de Anúncios inicialmente falharam porque faltavam as
  dependências de histórico/agência da versão produtiva na bancada. O componente real de
  histórico foi incluído; o contexto cliente simulado ficou explícito. Os 62 casos desse
  conferidor passaram depois do ajuste. Não se mudou produto para esconder essa falha.
- O conferidor de cadastro aceita LF/CRLF, mantendo a exigência de guarda antes de `/cadastro`.
- Ponte backend → JSON ASGI real → parser/resumo/Anúncios/gráfico SSR passou nos modos
  QA e produção simulados; outro negócio/conta/período é recusado.
- Reconstituição local dos dados observados do Dúú não é uma captura bruta de `actions`.
  A captura autenticada real foi realizada na QA. Não houve leitura autenticada dos números
  produtivos da candidata, pois o pacote ainda não está publicado.
- Nenhum teste conectado ao banco, chamada de criação/ativação ou cobrança foi executado.

## Aplicação proposta — somente depois da autorização

1. Conferir que as duas mains e o backend ativo continuam nas bases acima. Se mudaram,
   refazer a comparação antes de publicar; não sobrepor alterações novas.
2. Registrar privadamente a referência exata da imagem backend atualmente implantada e a
   configuração necessária para retorno, sem expor credenciais. Preservar o deploy WebApp atual.
3. Revisar e registrar os commits seletivos destas duas candidatas. Push/merge para main
   faz parte da futura autorização de aplicação; não ocorreu nesta preparação.
4. Publicar **primeiro o backend** no serviço produtivo `ia/backend`, mantendo configurações.
   Candidata esperada: **088a9da1e501**. Não copiar os modos simulados da QA para produção.
5. Conferir saúde, esquema, leitura Meta e configurações existentes. A produção já tem
   observador ativo e integrações reais; não habilitar, desabilitar ou disparar rotinas neste pacote.
6. Publicar o WebApp no projeto `v2g-deploy-webapp`, domínio `app.v2gmidia.com.br`.
7. Pela sessão legítima da Piligrin, comparar Início/Anúncios do Dúú em 01–07/11: conta,
   atribuição, moeda, período, conversas, cobertura e sete pontos do gráfico. Conferir volta à carteira.
8. Registrar o resultado real e parar. Não publicar anúncios nem alterar verba para testar.

Compatibilidade: backend novo funciona com a tela anterior, que ignora os campos adicionais.
WebApp novo diante do backend anterior mostra “Não medido” e preserva os outros valores.

## Retorno

- WebApp: retornar ao deploy produtivo registrado acima se a nova tela falhar.
- Backend: retornar à imagem que será registrada antes da publicação. Os arquivos privados
  `backend-candidato.tar.gz` e `backend-retorno-fonte.tar.gz`, em
  `C:/Users/victo/.codex/private-backups/v2g/releases/conversas-producao-20261114/`,
  foram relidos membro a membro. Há 291 membros em cada TAR.
- O TAR de retorno preserva o **código-base**; não é backup da imagem implantada nem das
  dependências resolvidas pelo instalador. A referência exata da imagem é um gate da aplicação.
- Não há rollback de banco neste pacote: nenhuma alteração de banco está prevista.

**Decisão pendente de Victor: autorizar a aplicação desse pacote seletivo em produção.**
