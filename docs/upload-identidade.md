# Upload de logo e fachada

**Implementado.** Migration `0014`, `lib/identidade/`, seção em `/conta`.

O cliente não tem hoje como mandar o logo nem a foto da fachada. O backend
do Gabriel tem upload, mas pendura o arquivo em `execucoes` — e logo é do
**negócio**, não de uma rodada. Reenviar a cada campanha é errado duas
vezes: dá trabalho ao cliente e produz N cópias do mesmo arquivo sem
ninguém saber qual é a boa.

Este documento propõe o caminho do nosso lado, ligado a `businesses`.

---

## 1. Sem tabela nova: `creatives` já é a tabela certa

Ela tem tudo: `business_id` obrigatório, `storage_path`, `file_name`,
`type`, RLS por dono desde a 0001, e — desde a 0010 — as colunas `uso` e
`pessoa_id`. O `uso` foi criado exatamente para isto e já tem a restrição:

```sql
check (uso in ('logo', 'identidade', 'campanha', 'referencia'))
```

| `uso` | o que é | quem cria |
|---|---|---|
| `logo` | a marca do negócio | **o cliente, nesta tela** |
| `identidade` | fachada, ambiente, equipe, produto | **o cliente, nesta tela** |
| `campanha` | a peça gerada que foi ao ar | o pipeline |
| `referencia` | exemplo que o cliente mandou como inspiração | depois |

O que o cliente manda aqui é `logo` e `identidade`. **Nada mais muda no
schema.**

### O único acréscimo: um índice

```sql
create index if not exists creatives_identidade_do_negocio_idx
  on public.creatives (business_id, uso, created_at desc)
  where uso in ('logo', 'identidade') and arquivado_em is null;
```

A tela pergunta "quais são as imagens de identidade deste negócio" a cada
carregamento, e sem o índice isso varre a tabela junto com todas as peças
de campanha — que é a parte que cresce sem limite.

### O que NÃO fazer: um `logo_url` em `businesses`

Tentador, porque logo é um por negócio. Mas criaria duas fontes para a
mesma pergunta: um arquivo em `creatives` com `uso = 'logo'` e uma URL na
outra tabela, que divergem no primeiro dia em que alguém trocar o logo por
um caminho e não pelo outro. **Um logo por negócio é regra, não schema** —
e é garantida por índice único parcial:

```sql
create unique index if not exists creatives_um_logo_por_negocio
  on public.creatives (business_id)
  where uso = 'logo' and arquivado_em is null;
```

Trocar o logo é substituir, não empilhar. O índice faz o banco recusar o
segundo em vez de deixar a tela decidir qual dos dois é o certo.

### Substituir ARQUIVA, nunca apaga o objeto

A pergunta é boa e a resposta é uma só: **o arquivo continua no storage.**

O logo pode ter sido insumo de uma peça que está no ar. Não é que apagá-lo
derrube o anúncio — a peça publicada já foi para o Meta e vive lá com hash
próprio —, é que *"de qual logo saiu este anúncio"* precisa continuar tendo
resposta. Apagar o arquivo na troca destruiria a prova no momento em que o
cliente está justamente mudando de marca, que é quando a pergunta aparece.

Como fica: a linha antiga recebe `arquivado_em`, sai do índice único (o que
libera o novo logo) e some da tela. **Nada é removido do bucket.**

Isso não contraria o "logo único sem histórico" que foi aprovado: não há
histórico *para o cliente* — ele vê um logo, e a versão anterior não volta
por nenhum botão. O que existe é registro, do nosso lado.

A remoção física acontece num lugar só: o **fluxo de exclusão da LGPD** —
cancelamento de conta ou pedido do titular —, apagando por prefixo. Mistura
esses dois caminhos e a exclusão vira efeito colateral de "troquei meu
logo".

Vale o mesmo para o botão "remover" da galeria: arquiva, não apaga.

### `arquivado_em` e não um valor em `status`

`status` é o ciclo de revisão do Meta: `draft`, `pending_review`,
`approved`, `rejected`, `paused`. São estados de uma peça diante da
plataforma de anúncio. *"Este arquivo ainda é o vigente?"* é outra pergunta,
do nosso lado — e enfiar a resposta na mesma coluna faria `rejected` e
`removido` disputarem o mesmo campo, quando uma peça pode perfeitamente ser
as duas coisas.

---

## 2. Bucket: o `v2g-midia` que já existe

Não crie outro. Três motivos, em ordem de peso:

1. **Ele já é privado** (`public = false`) e já guarda 20 arquivos vindos
   da migração do Oregon, sob `criativos/{analysis_run_id}/{hash}.png`.
   Um segundo bucket duplicaria a decisão de acesso, e duas decisões de
   acesso divergem.
2. **Separar por bucket separa a coisa errada.** O que muda entre um logo e
   uma peça de campanha não é a política de acesso — é o dono e o uso, e os
   dois já estão em `creatives`. Bucket separado por tipo de conteúdo é
   organização que se paga em nada e cobra em configuração dobrada.
3. **O caminho já dá a separação necessária**, sem bucket novo:

```
criativos/{analysis_run_id}/{hash}.png      ← o que já existe, do pipeline
identidade/{business_id}/logo.{ext}         ← novo
identidade/{business_id}/{uuid}.{ext}       ← novo, fachada e ambiente
```

O prefixo `identidade/{business_id}/` é o que torna possível **apagar ou
mover tudo de um negócio numa operação só**. Isso serve a dois caminhos já
previstos, e o segundo apareceu depois:

1. **Exclusão da LGPD** — o pedido do titular precisa remover os arquivos de
   um negócio sem varrer a tabela inteira.
2. **Migração do Supabase Storage para o GCP em região brasileira.** A
   revisão jurídica levantou que o GCP já tem as cláusulas-padrão
   contratuais da ANPD e o Supabase provavelmente não — e a seção 6 da
   política está justamente parada esperando essa conferência. Não muda o
   desenho agora, mas o recorte de uma migração dessas é **exatamente este
   prefixo**.

### O que já facilita a migração, e o que ainda atrapalharia

O que ajuda, e foi decidido pensando nisso:

- **O caminho é derivado, não aleatório.** `identidade/{business_id}/{uuid}.{ext}`
  é reconstruível a partir da linha em `creatives`; migrar é copiar o
  prefixo e reescrever `storage_path`.
- **`storage_path` é um caminho relativo, não uma URL.** Se guardássemos a
  URL completa do Supabase, cada linha carregaria o host antigo e a migração
  viraria um `UPDATE` com substring em cima de texto.
- **Nada é servido por URL pública.** Toda leitura passa por
  `createSignedUrls`, então a troca de provedor mexe num lugar só —
  `lib/identidade/armazenar.ts` — e não em cada `<img>` espalhado pelas
  telas.

O que **ainda atrapalharia**, e vale saber antes:

- **Os 20 arquivos antigos do pipeline** estão em `criativos/{analysis_run_id}/`,
  agrupados por execução e não por negócio. Migrar só as fotos de identidade
  deixaria os dois provedores em uso ao mesmo tempo. Ou migra-se tudo, e aí
  o prefixo `criativos/` precisa de um mapa execução → negócio, ou aceita-se
  a dupla origem por um tempo — com a política tendo que descrever as duas.
- **`storage_path` não diz o provedor.** Hoje não precisa: só existe um. Numa
  migração parcial, precisaria — e o acréscimo mínimo é uma coluna
  `storage_provedor` com default `supabase`. Não vou criar agora: coluna que
  só tem um valor possível é ruído até o dia em que o segundo valor existe.

### O achado que muda a implementação: **não há política de RLS no storage**

`storage.objects` tem RLS **ligada e nenhuma política**. Ou seja: hoje
ninguém além de `service_role` lê ou escreve no bucket. Upload direto do
navegador com a chave `anon` seria negado — silenciosamente, do ponto de
vista de quem está montando a tela.

Duas saídas, e eu recomendo a segunda:

**(a) Criar políticas de storage** casando o primeiro segmento do caminho
com o negócio do usuário. Permite upload direto do navegador. O preço é uma
segunda superfície de autorização — a regra de quem-pode-o-quê passaria a
morar em `creatives` **e** em `storage.objects`, e as duas precisariam
concordar para sempre.

**(b) Upload por Server Action, com o cliente admin.** O arquivo sobe para
o nosso servidor, que confere dono, tipo, tamanho e dimensão, e só então
grava no bucket e insere a linha em `creatives`. A autorização continua num
lugar só.

**Recomendo (b)**, e o motivo é o mesmo que já vale para a `/revisar-perfil`:
Server Action é endpoint POST de verdade e confere o dono por dentro. Além
disso, **as validações do §3 só existem se alguém as executar** — validação
no navegador é conveniência, não garantia, e num upload direto ela seria a
única. Com (b), o limite de tamanho e a dimensão mínima são conferidos onde
não dá para contornar.

O custo de (b) é o arquivo passar pelo servidor Next. Para imagem de até
10 MB, uma vez por negócio, é irrelevante.

---

## 3. O que aceitar, e os limites

| | logo | fachada e ambiente |
|---|---|---|
| formatos | PNG, SVG | JPG, PNG |
| tamanho máx. | 5 MB | 10 MB |
| dimensão mín. | 512 × 512 px (só PNG) | 1080 × 1080 px |
| transparência | preferida, não exigida | — |
| quantidade | 1 (substitui) | até 10 |

### De onde vêm esses números

**1080 px é o piso do Meta**, não uma preferência nossa. Abaixo disso a
imagem é reamostrada para cima na entrega e aparece borrada no feed — e o
cliente descobre isso vendo o próprio anúncio, que é o pior lugar para
descobrir. Como a peça pode sair quadrada (1:1), vertical (4:5) ou story
(9:16), **1080 no menor lado** cobre os três sem recorte que perca conteúdo.

**512 px para o logo** porque ele nunca ocupa a arte inteira — entra como
selo, canto ou marca d'água. Exigir 1080 recusaria logo bom à toa.

**SVG não tem dimensão mínima**: é vetor, escala sem perda. Mas tem um
problema que PNG não tem, no §5.

**5 e 10 MB** são folga, não meta. Um PNG de fachada bem exportado tem
menos de 2 MB; os arquivos que já estão no bucket têm entre 1,4 e 2,3 MB. O
teto existe para barrar o RAW de 40 MB que alguém vai mandar sem querer,
não para apertar o caso normal.

### Recusar com o motivo, sempre

Recusa que diz só "arquivo inválido" faz a pessoa tentar de novo com o mesmo
arquivo. Cada regra tem sua frase:

- *"Essa imagem tem 640 × 480. Para o anúncio não sair borrado, ela precisa
  ter pelo menos 1080 de largura e de altura. Se você tiver o arquivo
  original da foto, ele costuma servir."*
- *"Esse arquivo tem 24 MB e o limite é 10 MB. Uma foto tirada pelo celular
  normalmente já está abaixo disso."*
- *"O logo precisa ser PNG. JPG não guarda fundo transparente, e sem isso
  ele entra no anúncio dentro de um retângulo branco."*
- **SVG tem frase própria**, e não é firula. Quem tem o logo em SVG tem um
  arquivo legítimo e vai tentar de novo se ouvir "formato inválido" — a
  recusa genérica gera uma segunda tentativa com o mesmo arquivo. A frase
  diz o que fazer: *"Esse logo está em SVG e aqui a gente aceita PNG. Abra
  o arquivo no programa onde ele foi feito e exporte como PNG com fundo
  transparente, com pelo menos 512 pixels de lado. Se não tiver como, fala
  com a gente que a gente converte."* A detecção de SVG serve **só para
  escolher a frase** — nunca para aceitar o arquivo.

---

## 4. A regra da seção 2-A, na tela

A política publicada diz: foto com pessoa identificável só é aceita quando
a pessoa for **o próprio titular da conta**. Terceiro identificável não é
aceito.

**Isso aparece ANTES do seletor de arquivo**, não depois, não em link, não
em letra miúda. Depois do upload é tarde: o arquivo já está no nosso
servidor, e aí o problema deixa de ser evitar e passa a ser apagar.

Proposta de texto:

> **Sobre foto com gente**
>
> Pode mandar foto em que **você** aparece. Foto de funcionário, cliente ou
> qualquer outra pessoa **não dá** — quem aparece no anúncio precisa ter
> autorizado, e essa autorização é da pessoa, não sua.
>
> Tem uma foto boa com alguém da sua equipe? [Fala com a gente] que a gente
> resolve junto com você.

Três coisas sobre esse texto, todas deliberadas:

**"não dá" e não "não é permitido".** A segunda é linguagem de contrato e
faz a pessoa procurar a brecha. A primeira é como se fala.

**O motivo vem junto, em uma linha.** Regra sem motivo parece burocracia
nossa e convida a burlar. Com o motivo — *a autorização é da pessoa* — a
regra fica do lado do cliente, não contra ele.

**O caminho para quem tem a foto é um botão, não um beco.** Você pediu isso
e é o ponto que faz a regra funcionar: quem tem foto com funcionário **tem**
essa foto e quer usar. Sem saída, a pessoa manda mesmo assim e escreve
"sou eu" — e aí a regra virou uma pergunta cuja resposta ninguém confere.
O botão leva ao WhatsApp que já existe no `(fluxo)/layout.tsx`, com o
assunto pré-preenchido.

### Nada de detecção de rosto

Não temos, e fingir seria pior que não ter: um detector que erra 5% dá
**confiança** de 100% para quem lê a tela, e o erro passa a ser nosso e não
do cliente. A garantia aqui é declaração informada mais o caminho de
exceção — e isso é honesto sobre o que a ferramenta faz.

### O que registrar quando a foto é aceita

`creatives.pessoa_id` fica **nulo** neste fluxo, e é isso que a política
exige hoje: só entra foto do titular, e o titular não é uma linha em
`pessoas_do_negocio` — ele é o dono da conta. O comentário na 0010 já
explica que os campos de consentimento ficam sem uso enquanto a regra 2-A
valer.

O que **precisa** ser registrado é o aceite da regra: data, e o texto exato
mostrado. A LGPD pede consentimento demonstrável, e "clicou em enviar" não
demonstra o quê. Cabe em `creatives.copy` (jsonb, já existe) sob uma chave
`declaracao`, sem coluna nova:

```json
{ "declaracao": { "em": "2026-08-19T...", "texto": "Pode mandar foto em que você aparece..." } }
```

---

## 5. Duas coisas que vão morder, ditas agora

**SVG é executável.** Um `.svg` pode conter `<script>`, e servido do nosso
domínio ele roda com as nossas permissões. Duas medidas, as duas
necessárias: servir sempre por URL assinada com `Content-Disposition:
attachment` — nunca embutido em `<img>` de página logada sem sanitizar — e
higienizar o XML na entrada, removendo `<script>`, `<foreignObject>` e
atributos `on*`. Se isso parecer trabalho demais para o valor, **a
alternativa honesta é aceitar só PNG no logo** e dizer isso na tela. Prefiro
essa: transparência o PNG dá, e vetor só ganha em escala que o anúncio não
usa.

**Dimensão não se lê no navegador com confiança.** `new Image()` no cliente
funciona, mas é a validação que não vale (§2). No servidor, ler
largura/altura exige decodificar a imagem — para PNG e JPG dá para ler só o
cabeçalho, sem biblioteca e sem carregar o arquivo inteiro na memória. É o
que proponho: um leitor de cabeçalho de ~40 linhas, não uma dependência de
processamento de imagem.

---

## 6. Onde fica

Aba **Conta**, seção nova entre *"Dados do seu negócio"* e *"De qual página
seus anúncios saem"* — depois do que o negócio **é**, antes de como ele
**aparece**.

Um cartão, três blocos: o aviso da 2-A no topo, o logo (um, substituível), e
a galeria de identidade (até 10, com remover). Sem faixa de destaque: a
`/conta` não tem faixa por decisão registrada em `docs/padrao-visual.md`.

**Estado vazio honesto**, como em toda tela: sem logo, o espaço diz que não
há logo — não mostra um genérico nem um "adicione seu logo aqui" desenhado
como se já houvesse algo.

---

## 7. O que este desenho NÃO faz

- **Não conecta com o backend do Gabriel.** O upload dele é por execução e a
  divergência não foi resolvida. Quando for, o caminho provável é ele passar
  a ler `creatives` com `uso in ('logo','identidade')` pelo `business_id` —
  mas isso é conversa com ele, não decisão nossa.
- **Não gera criativo.** Este lote entrega arquivo guardado e ligado ao
  negócio, nada mais.
- **Não detecta rosto.**
- **Não mexe em `pessoas_do_negocio`.** Enquanto a 2-A valer, aquela tabela
  não recebe linha por este caminho.

---

## 8. O que eu quero que você conteste

1. **PNG-só no logo, descartando SVG.** É a decisão que mais restringe o
   cliente, e o motivo é segurança e não produto.
2. **Upload por Server Action em vez de direto do navegador.** Passa o
   arquivo pelo nosso servidor. Se um dia forem 50 fotos por negócio, essa
   escolha pesa.
3. **1080 px como piso rígido.** Vai recusar foto de celular antigo e print
   de rede social. É o piso do Meta, mas quem paga a recusa é o cliente.
4. **Índice único de um logo por negócio.** Impede guardar o logo antigo ao
   trocar. Se alguém quiser voltar atrás, não tem de onde.
