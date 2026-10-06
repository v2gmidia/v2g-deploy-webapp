# Identidade editorial do WebApp — 06/10/2026

## 0. Autorização e escopo

Victor aprovou as prévias navegáveis de Início e Criativos e autorizou aplicar
a direção às cinco telas do produto: Início, Criativos, Anúncios, Avisos e
Conta. Pediu corrigir as cores do tema escuro. Claro é a referência visual;
Claro, Escuro e Do aparelho e a preferência salva continuam disponíveis.

A referência é a LP publicada em https://www.v2gmidia.com.br/, conferida no
navegador, e seus assets locais. A aplicação recebe a linguagem visual, com
hierarquia de operação, sem reproduzir a composição comercial da LP.

## 1. Casco e temas

- `components/ui/Casco.tsx`: classe de escopo `v2g-editorial`, navegação de
  cinco itens, atalho para conteúdo e preferência de tema no topo.
- `components/ui/PreferenciaDeTema.tsx` e `CampoDeTema.tsx`: leem o cookie
  existente e usam a mesma `definirTemaAction` da Conta. Não há segundo
  armazenamento nem alteração no contrato da preferência.
- `app/produto-editorial.css`: tokens e controles da área do produto.
  Importado depois de `globals.css`; as regras exigem o novo casco.
- `Marca` recebe uma variante editorial explícita. Usa o símbolo vetorial
  da LP (`public/marca-editorial.svg`) e assinatura “mídia”. A variante
  anterior permanece nas superfícies externas ao casco.

Paleta: marinho `#051225`, cobalto `#0B40DA`, gelo `#B0E9FD`, lima `#EAFF64`,
papel `#ECF5F2` e canvas `#F8FBFA`. Archivo 400 nos títulos, 450–500 em
hierarquia intermediária; números tabulares. Controles com raio de 4px,
alvos de toque preservados, linhas leves em vez de molduras completas.

Escuro: canvas `#0D1929`, superfície `#142337`, superfície elevada `#1B2C40`,
texto `#ECF5F2`, apoio `#BACAD6`, links `#9FBFFF`. Cobalto de botão continua
separado do cobalto de texto. Advertência, erro e confirmação conservam
pares semânticos próprios; lima fica restrito a sinais de conclusão.

O atributo real é `data-tema`, não `data-theme` da prévia independente.
A ausência do atributo segue `prefers-color-scheme`. Os aliases de cores
são redeclarados no casco, para não herdar valores já resolvidos no root.
`--navy` segue como alias legado da tinta; fundos escuros usam `--plate`.

## 2. Blocos e verificações

### Bloco 1 — casco, tokens e Início

`TelaDoInicio.tsx` preserva as duas ramificações e todas as condições,
frases de veiculação, dados, CTAs e pergunta diária. A composição passa
a ter estado, próxima tarefa, quatro fases em linha e números abertos.
As seis etapas detalhadas permanecem disponíveis. O pontilhado deixa de
ser usado pela tela. Estilos em `app/inicio-editorial.css`.

Verificações concluídas neste bloco: `pnpm typecheck`, `pnpm conferir` e
`pnpm build` (via Corepack), todos com saída 0. O build registrou uma
degradação de rede na leitura de nichos durante geração, sem reprovar.

No navegador: mesmo componente real pela bancada `/exemplo/inicio`,
cenários de chegada e anúncio no ar; claro/escuro, persistência do escuro
após recarregar, largura de 1440, 390 e 320px sem transbordamento horizontal.
Não foram submetidas respostas, conexões ou ações de campanha.

### Bloco 2 — Criativos e Anúncios

Criativos: seleção da imagem em uma área de trabalho com contexto lateral,
histórico explicitamente indisponível e desenho futuro da criação em uma
seção expansível. O mesmo input dispara a análise automaticamente; handlers,
validação, requests, timeout, recuperação e resultados não foram trocados.
Os limites visíveis são importados da mesma fonte que valida o arquivo.

Anúncios: campanhas apresentadas como fichas separadas por divisores, números
em grade aberta, orientação e estados vazios com menor peso visual. Todas
as consultas, condições e strings factuais são as anteriores. Sem soma entre
moedas, inferência de veiculação por campanha ou métricas derivadas.

Verificações concluídas: `pnpm typecheck`, `pnpm conferir` e `pnpm build`,
todos com saída 0. O servidor de desenvolvimento foi encerrado antes do build.

### Bloco 3 — Avisos e Conta

Avisos: pendências primeiro, registros informativos em lista e atendimento
em coluna de apoio. Títulos identificam o assunto da pendência. Datas usam
`time`; consultas, ordenação, payloads, vazios e falhas foram preservados.
Não se atribuiu estado “resolvido” a registros sem esse contrato.

Conta: ficha contínua com títulos laterais, materiais, perfil, aparência e
atendimento. Formulários e ações continuam os mesmos. Miniaturas dos três
temas refletem a nova paleta. Estilos em `app/editorial-conta-avisos.css`.

Verificações concluídas: `pnpm typecheck`, `pnpm conferir` e `pnpm build`,
todos com saída 0. O build voltou a registrar a leitura de nichos degradada
por rede, sem reprovar. O servidor de desenvolvimento estava encerrado.

## 3. Revisão final

- Inspeção no navegador das cinco telas: desktop claro em 1440px e celular
  escuro em 390px; Início também no desktop escuro. Campos da Conta e envio
  de Criativos foram conferidos após rolagem.
- Checagem de transbordamento em 320px: 11 cenários de Início, Criativos,
  Anúncios, Avisos e Conta, incluindo vereditos, ausência, vazio e falhas;
  nenhum transbordamento horizontal encontrado.
- Na bancada real `/exemplo/inicio`, o seletor salvou “Do aparelho”, removeu
  o atributo explícito e acompanhou o aparelho claro. A preferência se
  manteve ao recarregar. Escuro e sua persistência já foram conferidos.
- Revisão independente de código e capturas: sem bloqueios materiais.
  O rótulo preexistente “Precisa de você” no anúncio reprovado foi mantido
  como identificação operacional de estado, sem criar uma nova mensagem.
- Detector de estilo executado uma vez: seis avisos referentes ao catálogo
  anterior (marca 32/10px, título móvel 28px, destaque 40px e azul de link
  escuro). São decisões intencionais da identidade; registradas em `DESIGN.md`.

Capturas e bancada estática estão fora do repositório, em
`C:/Users/victo/.codex/visualizations/2026/10/06/01a11318-5334-70d2-b76c-8b36d8f44d00/v2g-webapp-preview/`.
`produto-review/` contém as capturas; `qa-produto/` contém 16 cenários em
três temas (48 HTMLs) e manifesto com hashes das fontes. Essa bancada usa
JSX e CSS reais, dados sintéticos explicitamente identificados e ações
inertes. Ela comprova apresentação SSR; não comprova hidratação, upload,
autenticação nem integrações. Nenhum envio de imagem ou ação operacional
foi executado. A troca de tema foi validada separadamente no Next real.

## 4. Limites preservados

Sem alterações em consultas, contratos, banco, migrations, variáveis de
ambiente, ações Meta, páginas legais ou regras de negócio. Sem commit,
push ou deploy. Alterações de oferta já existentes em `docs/decisoes.md`,
`docs/estado/indice.md`, `lib/comercial/` e seu conferidor são de outro
trabalho e foram preservadas.

Durante o trabalho também apareceram alterações paralelas em `package.json`
e `scripts/medir-jev.ts`; não pertencem a este bloco visual e não foram
alteradas. Textos comerciais preexistentes da Conta apresentam divergência
entre “mês a mês” e permanência mínima de seis meses. Foram preservados
neste escopo visual; esta entrega não valida esses termos comerciais.

Contraste calculado nos pares centrais: apoio claro/tarefa 5,57:1; legenda
clara/superfície 5,16:1; apoio escuro/tarefa 8,38:1; legenda escura/superfície
8,01:1; branco/cobalto 7,61:1. Isso mede esses pares, não declara auditoria
completa de todo o aplicativo.
