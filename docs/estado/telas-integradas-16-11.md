# Início, Criativos, Anúncios e Conta — integração local de 16/11/2026

As quatro telas aprovadas estão reunidas no código do produto e nas prévias locais. Entrada para revisão sem login: `http://localhost:3000/exemplo/inicio`. O executor informou servidor aberto nessa rota. Este registro documenta integração e revisão locais; não comprova publicação nem operação autenticada ponta a ponta.

## Estado implementado — fatos do código

| Superfície | Comportamento e evidência |
|---|---|
| Navegação | Quatro destinos: Início, Criativos, Anúncios e Conta (`components/ui/Casco.tsx:146`). No celular, quatro colunas (`app/produto-editorial.css:203`). Na bancada, os links permanecem em `/exemplo/` (`components/ui/NavItem.tsx:26`). |
| Início | Mantém a tela compartilhada e reúne reconexão e pendências do negócio selecionado (`app/(protected)/inicio/page.tsx:218`). Cadastro aponta para Conta; ajustes pedidos apontam para Criativos (`components/ui/PendenciasDoNegocio.tsx:29`). |
| Criativos | Galeria com Biblioteca, Em revisão e Arquivados; busca e detalhes da peça (`app/(protected)/criativos/GaleriaCriativos.tsx:25`, `:93`, `:139`). Pedidos de ajuste aparecem no contexto da galeria (`:126`). As leituras incluem e filtram `business_id` (`app/(protected)/criativos/page.tsx:102`, `:125`). |
| Anúncios | Lista por anúncio retornado pelo inventário, com busca, filtros, métricas e detalhes; histórico por rodada permanece recolhível (`lib/anuncios/lista-cliente.ts:28`; `app/(protected)/anuncios/ListaDeAnuncios.tsx:16`; `app/(protected)/anuncios/page.tsx:195`). |
| Conta | Componente compartilhado `TelaDeConta`, com seis linhas: Seu perfil, Seu negócio, Conexões, Plano e contrato, Preferências e Acesso. A rota autenticada mantém formulário de perfil, tema, conexões, documentos e saída reais (`app/(protected)/conta/page.tsx:204`, `:255`, `:260`). As linhas expandem com `details`/`summary` (`app/(protected)/conta/TelaDeConta.tsx:18`). |
| Avisos | Removido da navegação. `/alertas` redireciona para `/inicio` (`app/(protected)/alertas/page.tsx:4`); `/exemplo/avisos` para `/exemplo/inicio` (`app/exemplo/[tela]/page.tsx:274`). Pendências do negócio ficam em Conta, revisão de peças em Criativos e reconexão aponta para Conta/Conexões (`components/ui/PendenciasDoNegocio.tsx:6`; `components/ui/FaixaReconectar.tsx:64`). |

## Direção visual e escopo

Direção aprovada **Operate**: composição limpa, Archivo, navy e cobalto herdados, linhas divisórias e ações junto do conteúdo. Conta usa largura máxima de 1120px, coluna de rótulo de 190px e uma coluna até 700px (`app/(protected)/conta/conta-clean.module.css:1`, `:8`, `:49`). Anúncios recolhe detalhes de verdade, respeitando `hidden` (`app/(protected)/anuncios/lista-cliente.module.css:33`); no celular as métricas ficam em duas colunas (`:58`). A galeria adapta o número de colunas e empilha detalhes no celular (`app/(protected)/criativos/biblioteca.module.css:41`, `:55`).

`DESIGN.md` permanece intacto. Suas referências a cinco destinos e a Avisos descrevem o estado anterior (`DESIGN.md:295`, `:303`, `:331`); para estas quatro superfícies, o código e este registro descrevem a integração atual. Esta composição local não redefine o sistema visual global. O registro da prévia isolada de Conta permanece em `docs/estado/conta-previa-16-11.md` como histórico.

## Dados, vínculos e limites

- A bancada continua exclusiva de desenvolvimento, com dados de exemplo e sem login; compartilha os componentes de apresentação, não as ações reais da Conta (`app/exemplo/[tela]/page.tsx:91`, `:213`, `:223`, `:242`).
- Vínculo entre anúncio e criativo exige o mesmo `business_id` e correspondência exata de `external_ad_id`. Nomes não estabelecem associação (`lib/anuncios/lista-cliente.ts:35`).
- A lista real não inventa miniaturas: sem imagem disponível, mostra ícone. Métrica ausente aparece como traço, identificado como “Não medido”, e não zero (`app/(protected)/anuncios/ListaDeAnuncios.tsx:26`, `:31`, `:38`).
- O parâmetro `anuncio` é preservado ao escolher conta e no retorno do login do cliente (`app/(protected)/anuncios/InventarioCliente.tsx:15`, `:19`; `lib/anuncios/retorno-login.ts:5`). Isso conserva navegação, não concede acesso.
- O limite existente de até 31 dias do inventário permanece (`lib/anuncios/contrato-meta.ts:46`). Não houve ampliação do backend nesta integração.

## Validação recebida do executor e reviewer

Esta documentação conferiu as referências do código e registrou os resultados abaixo; não repetiu a suíte nem o navegador.

| Verificação | Resultado e momento |
|---|---|
| `pnpm conferir` | Passou antes do ajuste final de `hidden`. |
| `pnpm build` | Passou antes desse ajuste; log em `.impeccable/review/integracao-build.log:8` e `:16`. Não representa um build posterior ao último ajuste. |
| `pnpm typecheck` | Passou após o último ajuste. |
| Testes dirigidos | 86/86 na rodada anterior; 6/6 de telas reunidas; 65/65 de anúncios após o ajuste. |
| Chrome | Percurso de prévia em desktop 1440×1000 e mobile 390×844, sem overflow nem erros de console observados. Não cobre autenticação ponta a ponta. |
| Detector | Uma execução, nove avisos consultivos de escala tipográfica herdados; sem nova execução. Registro: `.impeccable/review/integracao-detector.json`. |
| Revisão final | P2 de perda do anúncio selecionado na escolha entre contas corrigido; veredito informado: P2 resolvido, aprovado para revisão local. |

Capturas em `.impeccable/review/`: `integrado-inicio-desktop.jpg` e `integrado-{conta,anuncios,criativos}-{desktop,mobile}.jpg`.

Sem commit, push, deploy, escrita no banco ou escrita na Meta. Permanecem fora da comprovação: dados reais, efeitos das ações autenticadas e estado publicado. Sidecar de escopo: `.impeccable/telas-integradas-design.json`.
