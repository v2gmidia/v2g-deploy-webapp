# Gravação parcial e retomada da marca — 11/10/2026

## 0. Pendência

Percorrer a tela autenticada com persistência real após o retorno do QA. Os testes desta sessão usaram cliente de banco simulado; não provam RLS, rede ou navegação real.

## Falha e correção

A etapa da marca grava site e Instagram, limpa campos removidos e mescla a resposta visual em chamadas separadas. Se uma chamada intermediária ou a última falha, pode haver campos já gravados. A tela anterior dizia apenas que não conseguiu salvar e permitia reenviar sem conferir o estado.

A ação agora sinaliza quando o resultado de uma gravação é incerto ou parcial. A tela mostra um aviso de conferência, oferece **Recarregar** e bloqueia outro envio até obter o estado atual. Uma falha de validação anterior à gravação continua como erro corrigível no próprio formulário. Também não afirma que a conclusão foi vista quando a leitura posterior à gravação falha.

## Verificação

- `node --test scripts/conferir-onboarding-preservacao.mjs`: 49/49. O cenário de falha na última chamada confirma site e Instagram gravados sem marcar conclusão; a releitura e nova tentativa concluem. Outro cenário cobre erro de leitura após conclusão gravada.
- `pnpm typecheck`: passou.
- `pnpm build` com servidor de desenvolvimento parado: passou.
- Interface autenticada, persistência Supabase e recarga no navegador: não verificadas; QA está pausado.

Sem deploy, migration ou escrita externa.
