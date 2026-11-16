# Ajustes locais de Início e Criativos — 16/11/2026

Registro da implementação e das validações informadas pelo agente principal.
Estado: implementação local; não publicada.

## Implementação

- `CampoDeTema`: controle com sol/lua.
- `Casco`: contato somente na base da sidebar e no rodapé mobile.
- Início: perguntas compactas e flutuantes; limite mensal lado a lado;
  restante mostrado quando o gasto é conhecido; seção “Outras ações” removida.
- Criativos: removidas faixa laranja, busca e “Resultados não disponíveis”.
  Abas e associação de criativos foram preservadas.
- Título do diálogo: corrigida a largura de 100% herdada pelo botão,
  usando `width: auto` e `min-width: 0`.
- Upload: CSS deixou de depender de ancestral ausente; formulário com raio de 12 px.
- Wizard removido. Confirmação compacta e centralizada: “Subir criativo?”;
  “Não” preserva o formulário e “Sim” envia.
- Validações e revisão real existentes foram mantidas. A prévia não grava.
- Anúncios e Conta não receberam redesign.

## Arquivos envolvidos

- `components/ui/CampoDeTema.tsx` e `components/ui/Casco.tsx`.
- `app/produto-editorial.css` e `app/inicio-editorial.css`.
- `app/(protected)/inicio/PerguntaDoDia.tsx`, `TelaDoInicio.tsx` e `page.tsx`.
- `app/(protected)/criativos/GaleriaCriativos.tsx` e `PedirRevisao.tsx`.
- `app/(protected)/criativos/biblioteca.module.css` e `PedirRevisao.module.css`.
- `scripts/conferir-inicio.ts`: corrigida assertion antiga do link de exemplo.

## Validação e limites

- `pnpm typecheck`: passou, inclusive após a última correção.
- 26 testes de interface/loading/recepção e 53 de intenção/revisão: passaram.
- `pnpm conferir`: suíte completa com saída 0.
- `pnpm build`: saída 0.
- Suíte completa e build ocorreram **antes** da correção final em
  `app/(protected)/inicio/page.tsx:152`: o repasse de `investidoNoMesCentavos`
  exige que a resposta mensal tenha moeda BRL.
- O typecheck posterior passou; suíte completa e build não foram repetidos
  após essa última correção.
- Revisor independente `ajustes_finish_reviewer` verificou a guarda final
  e aprovou tecnicamente a alteração local.
- Capturas desktop e mobile de 391 px; sem overflow no modal observado.
- Verificados sol/lua e confirmação Sim/Não na prévia.
- Última leitura de logs sem erros; não equivale a garantia sobre todos os fluxos.
- Sem E2E autenticado e sem envio real de criativo.

## Evidências e acesso local

Capturas em `.impeccable/review/`:

- `ajustes-inicio-desktop.png` e `ajustes-inicio-mobile.png`.
- `ajustes-criativo-desktop.png` e `ajustes-criativo-mobile-escuro.png`.
- `ajustes-confirmacao-desktop.png` e `ajustes-envio-final.png`.

Logs informados: `ajustes-conferir.log` e `ajustes-build.log`.

Servidor de desenvolvimento em `http://localhost:3000`;
`/exemplo/inicio` e `/exemplo/criativos` abertos no Chrome.
As rotas de exemplo são prévias locais de desenvolvimento.

Nenhum commit, push, deploy, alteração de banco ou escrita na Meta foi realizado.

## Integração autorizada para commit e push

Em 16/11, Victor autorizou commit e push. A integração incorporou os três
commits remotos até `190f434`, preservando a visão de agência e as conversas
atribuídas pela Meta. A galeria direta usa o leitor autenticado compartilhado,
mantendo acesso aos ajustes antigos e à peça selecionada pelo anúncio.

- `pnpm conferir`: passou após ajustar os testes aos módulos integrados.
- Testes dirigidos: 110/110 de integração e 97/97 de regressão.
- Build passou após resolver os conflitos; a guarda que evita consultar
  o consolidado legado na visão de agência teve typecheck e testes posteriores.
- Mantido o contrato remoto de até 31 dias por consulta Meta e recusa de
  parâmetros repetidos. Nenhuma ampliação de período do backend foi feita.
- Capturas e logs continuam locais. O documento comercial de outra frente
  não integra este commit. Não houve validação autenticada ponta a ponta.
