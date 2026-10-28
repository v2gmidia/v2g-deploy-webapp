# 03/04 — resposta por voz no onboarding — 27/10/2026

## 0. Dependência humana

Para o microfone funcionar no QA, o ambiente publicado precisa ter o nome `OPENAI_API_KEY` configurado e `V2G_VOICE_TRANSCRIPTION_ENABLED` não pode estar com bloqueio explícito. Não ler, copiar ou registrar o valor da chave. Conferir os nomes no painel e republicar são mudanças externas e não foram feitas neste bloco.

Depois da publicação, o menor aceite é uma sessão autenticada em navegador compatível: permitir o microfone, falar uma resposta fictícia, conferir que a transcrição continua editável e só então enviar. Repetir negando a permissão e confirmar que o teclado permanece disponível.

## 1. Causa comprovada e limite

- Fato: `app/(fluxo)/onboarding/page.tsx` transformava configuração em um booleano.
- Fato: `Chat.tsx` só renderizava `RespostaPorVoz` quando esse booleano era verdadeiro. Quando falso, o controle e qualquer explicação sumiam.
- Fato: `RespostaPorVoz.tsx` usa uma sessão temporária do provedor e WebRTC. O arquivo `lib/onboarding/fala-ao-vivo.ts`, baseado no reconhecimento do navegador, não possui consumidor no fluxo atual.
- Hipótese não confirmada: no QA visto por Victor falta a variável de chave ou a flag está explicitamente desligada. Este bloco não leu valores nem abriu o painel externo, portanto não escolhe entre as duas causas ambientais.

## 2. Correção local

- O servidor agora entrega `disponivel`, `nao_configurada` ou `desativada`, sem expor segredo.
- Com voz disponível, o controle ganhou o rótulo visível “Responder por voz”.
- Sem voz, atividade, área atendida e perguntas abertas mostram o motivo e orientam a digitação; o teclado nunca desaparece.
- Permissão negada, microfone ausente, sessão encerrada, negócio não selecionado, limite e falha do provedor têm recados próprios com saída por digitação.
- A transcrição parcial/final continua entrando no campo editável e não é salva automaticamente.
- A sessão externa deixou de ser antecipada ao montar o componente e só é pedida depois que a pessoa autoriza e o navegador entrega o microfone.

## 3. Verificação local

- `pnpm conferir:onboarding-voz`: 6/6 verdes, com fixtures fictícias para configuração, suporte/aparelho, permissão negada, falha de transcrição, revisão e envio.
- `pnpm typecheck --pretty false`: verde.
- `pnpm conferir:onboarding-preservacao`: 72/72 verdes.
- Prévia dev `/exemplo/onboarding-conversa-integrada`: conferida em desktop; o estado sem configuração mostra “Responder por voz” e mantém o campo e o envio.
- Detector Impeccable: nenhuma ocorrência nova causada pelo fallback. Permanecem avisos históricos da folha compartilhada, como transição de largura e literais antigos fora do catálogo; não foram ampliados para este bloco.

## 4. O que não foi feito

Nenhuma chave, flag, chamada de áudio, permissão real, dado real, QA publicado, Vercel, Supabase, commit, push ou deploy foi alterado. O verde é local; funcionamento do microfone no QA continua dependente do portão da seção 0.
