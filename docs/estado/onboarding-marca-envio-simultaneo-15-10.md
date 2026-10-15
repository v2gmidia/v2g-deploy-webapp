# Marca: aguardar todos os envios antes de concluir

## 0. Pendente de decisão ou ação humana

- Ensaiar no QA com sessão autenticada o envio simultâneo de logo, imagens adicionais e PDF, incluindo uma falha de envio. O botão de conclusão deve permanecer indisponível até terminar o último envio e a última leitura de cores.
- A agenda própria ainda depende de configuração, publicação autorizada e teste real. O link público antigo precisa ser desativado na ativação para não contornar a reserva única por CNPJ.

## O que foi encontrado e alterado

Em `Marca.tsx`, o botão de conclusão aguardava a leitura de cores, mas não o preparo e o envio dos arquivos filhos. O cliente podia clicar em “Guardar e escolher horário” enquanto logo, imagens ou PDF ainda estavam sendo enviados; a navegação podia ocorrer antes de a sugestão de cores aparecer. Além disso, um único booleano para análise podia voltar a `false` quando a primeira de duas análises simultâneas terminava.

Os três formulários agora informam ao componente da marca quando começam e terminam, inclusive em erro. A conclusão fica indisponível enquanto existir qualquer envio ou análise. Um contador mantém o bloqueio até terminar a última análise simultânea. A tela mostra “Enviando materiais…” ou “Analisando cores…” no botão nesse intervalo. Nenhuma mudança foi feita na gravação dos arquivos ou na confirmação explícita da paleta.

## Verificação local

- `pnpm typecheck`: passou.
- `git diff --check`: passou, com apenas avisos preexistentes de normalização LF/CRLF no Windows.
- Não houve teste com arquivos reais no QA, publicação, migração, commit ou escrita externa.
