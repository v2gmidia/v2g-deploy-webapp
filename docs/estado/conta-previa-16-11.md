# Conta — prévia local de 16/11/2026

> Histórico da prévia isolada. A integração posterior de Início, Criativos, Anúncios e Conta, incluindo a retirada de Avisos da navegação real, está registrada em [telas-integradas-16-11.md](telas-integradas-16-11.md). As afirmações abaixo descrevem o momento anterior à integração.

Escopo: `/exemplo/conta-clean`, sem integração à Conta real. Direção **Operate**, herdando Archivo, navy e cobalto da identidade editorial vigente. Este registro descreve somente esta superfície; não altera `DESIGN.md` nem redefine o produto.

## Composição e comportamento confirmados no código

- Seis linhas: Seu perfil, Seu negócio, Conexões, Plano e contrato, Preferências e Acesso. Cada linha abre conteúdo com `details`/`summary`, sem grade de cartões ou painel-resumo (`app/exemplo/_conta/ContaClean.tsx:28`).
- Desktop: coluna de rótulo de 190px e conteúdo flexível, largura máxima de 1120px. Até 700px: uma coluna, campos empilhados e ações junto da respectiva seção (`app/exemplo/_conta/conta-clean.module.css:1`, `:8`, `:45`).
- Foco visível e redução de movimento estão previstos no CSS local (`app/exemplo/_conta/conta-clean.module.css:42`, `:60`).
- Perfil e negócio usam estado local; recarregar não constitui persistência. Os dados são explicitamente de exemplo. Conexão, recuperação, atendimento do plano e saída são simulações; não consultam contas externas, não enviam mensagens ou e-mail, não alteram senha e não encerram a sessão real (`app/exemplo/_conta/ContaClean.tsx:6`, `:38`, `:55`, `:73`, `:86`, `:103`, `:107`).
- Feedback de sucesso fica junto da ação correspondente, com `role="status"`; erros de formulário usam `role="alert"`. A conexão interrompida mantém a pendência e a ação de recuperação dentro de Conexões (`app/exemplo/_conta/ContaClean.tsx:20`, `:44`, `:72`).
- Preferências reutiliza `SeletorDeTema`: Claro, Escuro e Do aparelho. Diferentemente dos salvamentos simulados, essa preferência usa o cookie local de tema existente (`app/exemplo/[tela]/page.tsx:213`; `app/(protected)/conta/SeletorDeTema.tsx:1`; `lib/tema.ts:1`).

## Navegação e fronteira de integração

Avisos foi retirado somente dos menus de `/exemplo/conta-clean` e `/exemplo/anuncios-clean`; a rota real `/alertas` permanece. Conta e Anúncios se ligam às respectivas prévias clean nesses dois menus (`components/ui/NavItem.tsx:29`). A navegação móvel dessas superfícies usa quatro colunas (`app/exemplo/_conta/conta-clean.module.css:44`; `app/exemplo/_anuncios/previa-clean.module.css:2`). A composição de Anúncios já aprovada foi mantida.

Na futura integração, remover um destino do menu não pode apagar pendências: elas precisam continuar visíveis no contexto da ação que resolve cada uma. Identidade, autorização, dados comerciais e conexões reais ainda precisam de implementação e validação próprias. O bloqueio de produção da bancada está no código (`app/exemplo/[tela]/page.tsx:92`); não foi revalidado por build nesta execução.

## Evidências desta execução

Resultados fornecidos pelo executor e pelo reviewer desta sessão; esta etapa documental conferiu o código e a existência dos arquivos, sem repetir navegador ou testes:

| Verificação | Resultado e limite |
|---|---|
| Navegador desktop e mobile | Salvamento de perfil, interrupção e recuperação da conexão e recuperação de senha simulada exercitados; sem overflow; zero warnings/errors observados no percurso testado. |
| `pnpm typecheck` | Passou. |
| `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-qa-interface.mjs` | 8/8 passaram. Não equivale à suíte completa. |
| Detector visual | Uma execução, três avisos consultivos de tipografia em 13/15px. Não foi apresentado como zero achados. |
| Revisão | Disposição **ship para a prévia local**, após correção do feedback junto de cada ação. Não é aceite de integração ou produção. |

Capturas: [desktop 1440×1000](../../.impeccable/review/conta-clean-desktop.jpg), [mobile 390×844](../../.impeccable/review/conta-clean-mobile.jpg) e [feedback mobile](../../.impeccable/review/conta-clean-mobile-feedback.jpg).

Sem build desta prévia, dados reais, validação de autenticação, deploy, commit ou push. O bloco termina na prévia local documentada; integração depende de novo escopo aprovado.
