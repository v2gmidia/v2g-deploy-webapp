# E28-05/06 — Biblioteca independente do estado da geração — 25/10/2026

## 0. Dependências e limite

Correção LOCAL solicitada pelo Central: sucesso/biblioteca 1 → desligar geração → consultar não pode virar biblioteca 0. Bloco encerrado com testes e navegador. Sem deploy, migration, alteração de runtime/worker, configuração externa, uso de cliente real ou geração paga. As dependências de identidade humana/QA/infraestrutura continuam as anteriores.

**Limite preservado:** listar um registro persistido e autorizar a leitura dos bytes são operações distintas. A prévia privada continua exigindo as conferências existentes de sessão, backend, direitos e hash. Com esse serviço indisponível, o card pode mostrar prévia indisponível; o registro não some da biblioteca. Não se removeu uma conferência de acesso para manter pixels visíveis.

## Causa e alcance

- **Defeito reproduzido da bancada:** `app/exemplo/_geracao_fila/Previa.tsx` construía `itens` a partir de `ultimo.ok && ultimo.imagemUrl`. A resposta de indisponibilidade sobrescrevia `ultimo`; o componente recebia `[]` e mostrava biblioteca 0. O arquivo e o registro SQL não haviam sido removidos.
- **Tela real:** `app/(protected)/criativos/page.tsx` já consulta `creatives`/`creative_review_requests` e não usa a última resposta da geração para decidir quais cards existem. A queda 1→0 da bancada não era evidência de exclusão na tela real. A flag de geração altera a prévia gerada, sem filtrar o registro persistido.
- **Outro defeito concreto na tela real:** uma falha da própria leitura retornava arrays vazios junto ao aviso superior, e a galeria ainda desenhava contagem 0/“Nenhuma peça aqui”. Corrigido neste mesmo recorte: indisponibilidade não é ausência confirmada.

## Correção

1. A bancada lê a biblioteca de uma fonte separada, `/biblioteca`, baseada em `creatives` já persistidos no banco descartável, por negócio e dono. Não consulta fila/provedor para listar e não cria outro acervo. A consulta conserva ID do criativo e request_id no caminho de leitura autenticada existente.
2. Estado da biblioteca agora é independente do resultado de geração: carregando/pronta/falhou, resposta protegida por negócio e número de consulta. A geração pode falhar sem apagar os itens. Reload também relê essa fonte diretamente.
3. O harness permite simular indisponibilidade **da biblioteca**, separada de geração OFF. Essa fonte falha com HTTP 503, sem lista vazia confirmada.
4. `GaleriaCriativos` recebe `falhou`/`carregando`: contagens ficam desconhecidas (`—`), itens conhecidos continuam renderizados quando houver leitura parcial, e erro sem itens mostra indisponibilidade em vez de “Nenhuma peça aqui”.
5. Na tela real, `page.tsx` passa a falha de fonte por `TelaDeCriativos` à galeria. Nenhuma alteração no formulário/upload, nos estados da fila, no handler privado ou no backend.

## Testes direcionados executados

| Comando/prova | Resultado |
|---|---|
| `node --test scripts/conferir-ui-fila-geracao-local.mjs` | **11 passaram**: nove anteriores + biblioteca persistida com geração OFF/releitura/negócio diferente + falha/restauração da fonte. Usa action, FastAPI/PGlite/Storage instrumentados do harness existente. |
| `node --test scripts/conferir-biblioteca-geracao-off.mjs` | **3 passaram**: renderiza a página e a galeria reais com portas de sessão/SQL substituídas; card/biblioteca 1 com geração ON/OFF, erro de fonte sem falso vazio, leitura parcial conservando card. Nenhuma consulta de geração permitida nesse teste de listagem. Não é autenticação real. |
| `node --test scripts/conferir-revisao-criativos.mjs scripts/conferir-intencao-envio.mjs` | **31 passaram**, preservando upload/revisão/intenção/isolamento. |
| `pnpm typecheck` | Passou. |
| `git diff --check` | Sem erro de whitespace; somente avisos de conversão LF/CRLF. |

**45 testes nesta rodada**, mais um percurso de navegador abaixo. Não somar novamente os 62 do checkpoint anterior como novas verificações independentes. A primeira tentativa do novo teste SSR precisou declarar a porta de negócio ativo para não carregar `next/headers`; os três testes finais passaram com essa fronteira explícita.

## Prova no navegador

Teste reproduzível: `scripts/qa/biblioteca-geracao-off-browser.mjs`, função `conferirBibliotecaComGeracaoOff(tab)`, executada no `cua_repl` pela aba `http://localhost:3000/exemplo/geracao-fila`. Todas as interações passam pelos controles reais/DOM; o teste usa somente o harness fictício de loopback.

**PASSOU:**

| Percurso | Biblioteca / resultado | Efeito persistido |
|---|---|---|
| Limpar → preparar → criar → worker explícito | Biblioteca **1**, imagem de teste disponível | **1 trabalho / 1 envio / 1 recibo fictício** |
| Desligar geração → consultar andamento | Mensagem de geração indisponível; biblioteca **1** | Mesmos IDs e contagens |
| Reload com geração OFF | Pedido retomado, biblioteca **1** | Mesmas contagens, sem novo envio |
| Indisponibilizar fonte da biblioteca | Aviso explícito, contagem **—**, sem “Nenhuma peça aqui” | Registro não removido |
| Reload com fonte indisponível | “A biblioteca está indisponível”; **—**, sem falso vazio | Nenhuma nova criação |
| Restaurar fonte, ainda com geração OFF | Biblioteca **1** | Mesmo criativo |
| Religar geração → consultar | Biblioteca **1**, resultado disponível | Ainda **1/1/1** |
| Trocar para negócio B | Biblioteca **0** confirmada pela fonte, sem card do A | Sem cruzamento de registros |
| Voltar ao A | Biblioteca **1** | Mesmo registro |

Prova detalhada: `docs/qa/geracao-ui-local-25-10/biblioteca-geracao-off.json`. Captura adicional após desligar novamente/consultar e conferir Biblioteca 1: `docs/qa/geracao-ui-local-25-10/biblioteca-geracao-off.png`. Captura e JSON são locais, não QA/produção. O teste não mede geração/fatura paga ou autenticação humana; o provedor é o mesmo fake já aprovado para o laboratório.

## Arquivos e fechamento

- Produto: `app/(protected)/criativos/GaleriaCriativos.tsx`, `TelaDeCriativos.tsx`, `page.tsx` — somente falha de leitura/listagem.
- Bancada: `app/exemplo/_geracao_fila/Previa.tsx`, `scripts/servir-fila-geracao-local.mjs`, `scripts/test-utils/fila-geracao-local.mjs` — fonte persistida de biblioteca separada, falha controlada e escopo por negócio.
- Testes: ampliado `scripts/conferir-ui-fila-geracao-local.mjs`; novos `scripts/conferir-biblioteca-geracao-off.mjs` e `scripts/qa/biblioteca-geracao-off-browser.mjs`.
- Registro: este checkpoint, provas JSON/PNG e nota no checkpoint inicial. Demais alterações preservadas; índice/decisões/instrumentos compartilhados não editados.

Não se criou rota de produto adicional, tabela, fila, retry pago, URL pública ou atalho de direitos. Nenhuma mensagem enviada a outra pessoa/chat. **Bloco corretivo concluído localmente; parar aqui.**
