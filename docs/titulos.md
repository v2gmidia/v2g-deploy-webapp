# Títulos de aba — o mapa rota → nome

O mapa vale em [`lib/titulos.ts`](../lib/titulos.ts). Este arquivo é o
espelho legível, uma linha por rota. Se os dois divergirem, vale o código.

Cada página faz `export const metadata = tituloDaAba("/rota")`, e nenhuma
repete a string. `/entrar` e `/recuperar` são `"use client"`, e página
client não exporta `metadata`. Por isso o título dessas duas vem de um
`layout.tsx` na pasta de cada uma, que não desenha nada.

## As regras — decisão do Victor, 14/09/2026

1. **Rota que aparece na barra de cinco itens** (Início, Criativos,
   Anúncios, Avisos, Conta) **usa o rótulo da barra, letra por letra.** O
   mesmo lugar não pode ter dois nomes.
2. **Nas demais**, o título é um nome curto do assunto da tela: nunca frase,
   nunca ponto final, com alvo de 25 caracteres antes do ` — V2G`. Se o nome
   tirado da tela passar disso, a rota volta para o Victor antes de entrar
   no mapa.
3. **O título é fixo por rota.** Ele não acompanha o estado da tela, porque
   quem mostra estado é o `<h1>`. Não há `generateMetadata` para título.
4. **Rota dinâmica nunca leva o parâmetro no título.** O parâmetro é dado do
   cliente, e o título da aba vai para o histórico do navegador e para o
   compartilhamento de tela.

## O mapa

| Rota | Título | De onde veio o nome |
|---|---|---|
| `/inicio` | Início — V2G | rótulo da barra |
| `/criativos` | Criativos — V2G | rótulo da barra |
| `/anuncios` | Anúncios — V2G | rótulo da barra |
| `/alertas` | Avisos — V2G | rótulo da barra |
| `/conta` | Conta — V2G | rótulo da barra |
| `/vendas` | Suas vendas — V2G | `<h1>` da tela |
| `/meu-negocio` | Seu negócio — V2G | título que já existia antes deste lote |
| `/saude-meta` | Fila de revisão — V2G | título que já existia antes deste lote |
| `/revisar-perfil` | Quem está esperando — V2G | título que já existia; exceção à regra 2, mantida por decisão |
| `/revisar-perfil/[proposta]` | Revisar perfil — V2G | título que já existia antes deste lote |
| `/onboarding` | Sobre o seu negócio — V2G | `<h1>` da tela, confirmado pelo Victor |
| `/onboarding/contas` | Suas contas — V2G | `<h1>` da tela |
| `/expectativas` | Expectativas — V2G | definido pelo Victor |
| `/conectar` | Conectar sua conta — V2G | definido pelo Victor |
| `/conectar/escolher` | Escolher página — V2G | definido pelo Victor |
| `/verba` | Sua verba e o cartão — V2G | `<h1>` da tela |
| `/aprovar` | Aprovar anúncio — V2G | definido pelo Victor |
| `/reprovado` | Aprovar anúncio — V2G | definido pelo Victor; é o mesmo título de propósito, mesmo assunto em outro desfecho |
| `/sem-instagram` | Instagram profissional — V2G | definido pelo Victor |
| `/whatsapp-business` | WhatsApp Business — V2G | definido pelo Victor |
| `/entrar` | Entrar — V2G | definido pelo Victor; cobre cadastro e login |
| `/recuperar` | Recuperar acesso — V2G | `<h1>` da tela, sem o ponto final |
| `/redefinir` | Nova senha — V2G | definido pelo Victor |
| `/exclusao-de-dados/[codigo]` | Exclusão de dados — V2G | definido pelo Victor; o código nunca entra |
| `/` | V2G | padrão do layout raiz; a rota ficou fora deste lote (decisão de produto pendente) |
| `/campanhas` | — | não desenha página, só redireciona (308) para `/anuncios` |
