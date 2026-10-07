# Entrada pública e jornada LP → WebApp — 07/10/2026

**Estado:** implementação local revisada, com disposition `ship` para este
bloco. Não houve commit, push ou deploy. A revisão não comprova produção,
pagamento, autenticação completa nem persistência de lead no banco real.

## 0. O que depende de decisão ou bloco futuro

- Publicação e seleção dos arquivos continuam com Victor no GitHub Desktop.
- Checkout automático, cliente da API Asaas, webhook de pagamento,
  assinatura eletrônica, fiscal e preparação de lançamento exigem bloco
  próprio. Não foram entregues nesta integração visual/comercial.
- A conta Asaas consta como aprovada no registro de 07/10 em
  `docs/decisoes.md`; isso não comprova integração ou cobrança testada.
- Uma troca de domínio exige revisar as origens, os redirects autorizados
  do Supabase e da Meta e, quando existirem, checkout e webhook. Trocar
  somente o `href` não conclui essa mudança.

## 1. Fatos implementados

| Superfície | Comportamento e evidência de código |
|---|---|
| Oferta na LP existente | R$ 500 mensais por conta de anúncios, permanência mínima de seis meses e verba de mídia separada. Contratação assistida, sem cobrança nova. Fonte de decisão: `docs/decisoes.md`, correção de 06/10; apresentação: `../lp/index.html:103`. |
| Contato antes do WhatsApp | Os CTAs comerciais levam a `#pre-cadastro`; o formulário completo, seus qualificadores, consentimento, payload e RPC existentes foram preservados. Nome, e-mail e WhatsApp são obrigatórios (`../lp/index.html:135`, `../lp/assets/lp.v6.js:129`). |
| Liberação do contato | A API só devolve `contato_url` após `resultado.ok === true` (`../lp/api/pre-cadastro.js:158`). Honeypot não libera o contato. O navegador valida protocolo, host, caminho e ausência de credenciais antes de mostrar o botão (`../lp/assets/lp.v6.js:250`). Abrir o WhatsApp depende de clique manual. |
| LP → WebApp | Links de login/primeiro acesso usam origem central em `../lp/assets/jornada.v6.js:5` e têm `href` público de reserva no HTML. Desenvolvimento: `localhost:3000`; endereço público configurado: `v2g-deploy-webapp.vercel.app`. Não transportam dados pessoais na URL. |
| WebApp → LP | Origem central em `lib/site-publico.ts:2`: `localhost:5173` em desenvolvimento e `www.v2gmidia.com.br` nos demais ambientes. Marca, plano, contato e links legais são montados em `components/ui/EntradaEditorial.tsx:12`. |
| Login e primeiro acesso | `/entrar?modo=login|cadastro`, com login como padrão e `next` preservado ao alternar modo (`app/(public)/entrar/page.tsx:20`). Primeiro acesso orienta usar o e-mail da compra após aprovação do pagamento. |
| Recuperação e acesso pendente | `/recuperar`, `/redefinir` e `/acesso-pendente` usam o mesmo invólucro editorial. Link inválido, envio, erros, nova conferência de acesso e saída continuam disponíveis. A conferência da liberação permanece em `app/(public)/acesso-pendente/page.tsx:13`. |

As ações de autenticação, `Marca`, layouts, proxy e guards não foram
alterados por este bloco. Criar conta não confirma compra nem libera
serviço. Páginas legais, variáveis de ambiente, banco e migrations ficaram
fora deste trabalho. A extensão visual está descrita em `DESIGN.md`, no
suplemento de entrada pública; não redesenha o Casco protegido.

## 2. Validação registrada na sessão de implementação

- `typecheck` e build passaram. O build emitiu aviso não fatal de rede na
  consulta `GET /nichos`.
- `pnpm conferir` parou na pendência preexistente de RevOps:
  migration `20261007160925` não aplicada, com sete tabelas e duas RPCs
  ausentes. **A suíte completa não ficou verde.** As verificações após
  esse ponto foram executadas separadamente e passaram.
- `conferir:veiculacao` detectou o slogan na entrada nova; ele foi corrigido
  para “Seus anúncios. Clareza em cada etapa.” e a verificação passou com
  117 checagens.
- Na LP, `scripts/conferir-contato.cjs` e `scripts/conferir-jornada.cjs`
  passaram com mocks, sem rede.
- Navegador local: ida LP → login → LP, envio fictício no simulador,
  contraste em claro/escuro e versões mobile de 390px e 320px. A simulação
  mostra aviso explícito de prévia e informa que nenhum contato foi salvo.
- Revisão independente de 14 capturas: `ship`, sem achados materiais.
  Evidências em `.impeccable/review/entrada-lp-07-10/`; são capturas locais.
  Detector executado uma vez: três avisos tipográficos de 36/54px,
  justificados pelo papel público no suplemento de `DESIGN.md`.

Este registro consolida as verificações do bloco. A etapa documental não
reexecutou testes ou build. Não houve validação viva da gravação de leads,
envio de WhatsApp, pagamento ou integração de provedores.

## 3. Escolhas de implementação e limite da entrega

Foi mantida a LP existente, com um suplemento de oferta e jornada, para
preservar a identidade aprovada e o contrato do formulário. O contato
retornado pelo servidor evita liberar o CTA com uma mera resposta HTTP
200. As origens centralizadas tornam a navegação local verificável, sem
confundir o endereço de desenvolvimento com o público configurado.

**Interpretação:** o bloco conecta descoberta, atendimento assistido e
entrada na conta. A compra automática e o lançamento completo continuam
fora do resultado validado.

## 4. Seleção deste bloco no GitHub Desktop

Repositório `C:/Users/victo/v2g-deploy/webapp` — arquivos deste bloco:

- `components/ui/EntradaEditorial.tsx`
- `app/entrada-editorial.css`
- `lib/site-publico.ts`
- `app/(public)/entrar/page.tsx`
- `app/(public)/recuperar/page.tsx`
- `app/(public)/redefinir/page.tsx`
- `app/(public)/acesso-pendente/page.tsx`
- `DESIGN.md` — somente a extensão pública, caso haja outras mudanças.
- `docs/estado/entrada-lp-07-10.md`

`docs/decisoes.md`, `docs/estado/indice.md` e `PRODUCT.md` recebem atualizações
paralelas: conferir e selecionar apenas os trechos pertinentes, sem
marcar o arquivo inteiro por consequência desta lista. Não incluir
alterações de RevOps ou gestor. As imagens em
`.impeccable/review/entrada-lp-07-10/` podem permanecer como evidência local;
não precisam entrar no commit de produto.

A lista exata do segundo repositório está em
[`LP — jornada comercial`](../../../lp/docs/jornada-comercial-07-10.md).
