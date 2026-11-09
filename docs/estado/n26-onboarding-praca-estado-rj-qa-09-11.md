# Onboarding — área estadual do Dúú Gomes — 09/11/2026

## 0. Estado e próximo passo

Victor confirmou **todo o estado do Rio de Janeiro**, e não apenas a cidade. A dúvida de região do registro `n26-onboarding-publicacao-validacao-qa-09-11.md` está resolvida.

A correção do formulário está **local, pronta para commit/push manual da branch QA**. A região ainda não foi salva no cadastro real: a interface publicada precisa receber esta correção para completar o percurso pelo aplicativo. Não houve publicação, escrita em banco nem alteração em produção neste bloco.

Após a publicação QA: retomar a pergunta 7 da sessão Piligrin, abrir **Escrever do meu jeito**, registrar **Todo o estado do Rio de Janeiro**, concluir destino/campanha com dados confirmados e conferir a resposta autenticada V2 do backend. Não marcar o cadastro completo antes dessa prova.

## Correção e preservação

Em `app/(fluxo)/onboarding/perguntas.ts`, a pergunta `praca` já tinha label e placeholder de texto livre, mas não declarava `chipAbreTexto`. Por isso `Chat.tsx` não mostrava o botão que abre o campo. Acrescentada somente essa propriedade, reutilizando o componente e a action existentes.

O texto declarado fica em `onboarding.respostas.praca`. A action já aceita origem `texto`, sem inferir município, CEP ou raio; em B2B2B preserva os campos canônicos da agência. Não foi acrescentada opção fixa exclusiva para o piloto nem convertida área estadual em um raio.

Esta alteração não muda as seis respostas e a referência de preço já salvas, o teto, permissões ou campanhas. A preservação no cadastro real após o novo envio ainda será conferida na QA publicada.

## Validação local

- `pnpm typecheck`: aprovado.
- `pnpm conferir:onboarding-preservacao`: **79/79** aprovados, incluindo texto livre da praça, preservação B2B2B, isolamento entre negócios, concorrência e retomada de falhas.
- `pnpm conferir:onboarding-operacional`: aprovado, incluindo B2B/B2B2B, legado, Unicode, preço e guardas.
- Não foi feito novo build nem teste visual neste bloco; trata-se de expor o controle existente. A confirmação visual e o salvamento real ficam para a versão publicada na QA.

O backend QA já publicado permanece na versão `ff1ef5226922`. Os 31 arquivos do backend continuavam sem commit na candidata na última conferência; esta mudança de interface não resolve essa pendência no Git.
