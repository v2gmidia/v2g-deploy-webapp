# E28 01/02 — senha, retorno e prova de acesso após estorno, 25/10/2026

## 0. Estado e próximo portão

Bloco local separado, iniciado após concluir CPF/CNPJ. Código e testes prontos;
sem commit, push, build compartilhado, deploy, migration ou acesso remoto.
Nenhuma senha real foi lida, procurada, usada ou alterada. Fixtures apenas em
memória; nenhum envio de recuperação ou autenticação de conta real.

Próximo portão: revisão/publicação QA autorizada e repetição humana de
recuperação → salvar → confirmação → entrar. Conferir a política Auth remota
antes da publicação coordenada: somente a configuração local foi alinhada,
e este bloco não mediu nem alterou exigências do provedor no QA/produção.

A prova visual de acesso após estorno foi registrada no checkpoint existente
`e28-01-02-retomada-asaas-23-10.md`. Corrigir a política de acesso por
pedido/negócio permanece outro bloco; não houve suspensão de conta, revogação
global ou mudança de proprietário para produzir um teste verde.

## 1. Prova recebida: estornado ainda acessível

Fonte: comunicação do Central após ensaio autenticado com Victor, em 25/10.
QA04 exibiu cinco negócios. Foi aberto **V2G QA Multiconta B — FICTÍCIA**;
depois, pelo menu, **V2G QA 3DS Final 21-10 — FICTICIA**. O aplicativo foi para
`/inicio` e mostrou o último como ativo, apesar de o pedido correspondente
estar classificado como estornado na auditoria já registrada.

É falha reproduzida da política de acesso pós-estorno, não compra ativa nem
prova de que a reentrega do webhook concedeu acesso. A futura decisão deve
avaliar direitos de cada pedido/negócio e preservar outros negócios válidos.
Não reexecutamos cobrança, estorno, evento ou login para registrar esse relato.

## 2. Regra de senha encontrada e revisão

Regra anterior em `lib/auth-senha.ts`: mínimo de 15 caracteres; maiúscula,
minúscula, número, símbolo, confirmação igual e rejeição de padrões previsíveis.
Reutilização mapeada antes da edição:

- `app/(public)/entrar/actions.ts`: primeiro acesso, antes de criar conta.
- `app/(public)/entrar/page.tsx`: critérios/indicador e habilitação do botão.
- `app/(public)/redefinir/actions.ts`: salvamento da nova senha.
- `app/(public)/redefinir/Form.tsx`: mínimo dos dois inputs.
- `components/ui/CriteriosSenha.tsx`: lista compartilhada de critérios.
- `scripts/conferir-senha.mjs`: fronteira e regressões.
- `supabase/config.toml`: Auth local estava em mínimo 6, sem classes; não é
  evidência de configuração do projeto remoto.

Victor rejeitou o mínimo fixo de 15 e autorizou ajuste mantendo critérios.
Escolha de implementação: **12 caracteres** com os demais requisitos mantidos.
O indicador agora diz “Critérios atendidos”, em vez de prometer força por um
checklist. Senhas previsíveis curtas com classes também foram incluídas na
negação local. Não é medição de entropia nem consulta a base de senhas vazadas.
Login de conta existente não é revalidado pela regra de criação de senha.

O arquivo de configuração Auth LOCAL passou a mínimo 12 e
`lower_upper_letters_digits_symbols`. Nenhuma configuração remota foi alterada.
O provedor pode ter outra regra; o ensaio no QA deve medir a aceitação real,
sem afrouxar proteção de sessão ou pedir a senha no chat.

## 3. Defeitos concretos e correções do retorno

### Exportação inválida da Server Action

`app/(public)/redefinir/actions.ts` exportava o objeto initialState junto da
ação em um módulo `use server`. O validador do **Next instalado**,
`next/dist/build/webpack/loaders/next-flight-loader/action-validate.js`, recusa
esse objeto. A regressão reproduz a rejeição e confere os exports reais atuais.
O estado inicial foi movido para o formulário cliente. O módulo de ação agora
exporta em runtime somente `redefinirAction`; a interface de tipo é apagada.

### Confirmação ainda dependia de Auth no proxy

A página `/redefinir/concluido` era pública e independente da sessão, porém
`proxy.ts` consultava Auth antes de deixá-la passar. Uma indisponibilidade nessa
fronteira podia impedir o resultado justamente depois do logout. O teste injeta
Auth indisponível e comprova a abertura da confirmação sem essa consulta.
Somente GET/HEAD desse caminho exato passa direto; POST, caminhos parecidos,
login e rotas protegidas mantêm o comportamento anterior. A página não contém
dados de conta nem concede acesso.

A action mantém redirect fora de catch após sucesso. Logout falho direciona
para confirmação com aviso próprio; a senha já salva não vira falsa falha de
salvamento. Exceção ao criar cliente/salvar agora retorna orientação honesta:
não foi possível confirmar a alteração; tentar entrar com a nova senha ou pedir
outro link. Não expõe erro cru, senha ou token. Os dois olhinhos permanecem.

### Recuperação PKCE sem type podia ir ao Início

O callback escolhia o destino antes da troca do código, dependendo só de
`type=recovery` na URL. O SDK instalado devolve `redirectType` da origem guardada
com o verifier, mas o callback não o usava. Agora uma recuperação confirmada
pelo SDK, mesmo sem type na URL, vai a `/redefinir`. OTP recovery também mantém
esse destino. Recuperação não reivindica compras; confirmação comum mantém
seu fluxo anterior e o destino local seguro. Nenhum template ou redirectTo de
e-mail foi alterado, evitando introduzir incompatibilidade de query string.

**Limite causal:** são defeitos de código/contratos reproduzidos localmente,
não uma correlação com o log/URL exatos da tela de erro original de Victor.
Não foi comprovada uma resposta 404 daquela ocorrência, nem se afirma uma
causa única para ela. O encerramento do sintoma real exige o QA publicado.

## 4. Arquivos e provas

Arquivos deste bloco:

- `lib/auth-senha.ts`, `components/ui/CriteriosSenha.tsx`.
- `app/(public)/redefinir/{actions.ts,Form.tsx,page.tsx}`.
- `app/(public)/entrar/page.tsx` (somente texto do indicador nesta rodada).
- `app/auth/confirmar/route.ts`, `proxy.ts`, `supabase/config.toml` local.
- `scripts/conferir-senha.mjs`, novo `scripts/conferir-recuperacao-completa.mjs`,
  comando `conferir:recuperacao` em `package.json`.
- `docs/decisoes.md`, índice, este checkpoint e adendo de prova visual no
  checkpoint existente de retomada Asaas. Mudanças CPF/CNPJ anteriores preservadas.

Provas:

- `pnpm conferir:recuperacao` (mesmos três arquivos executados pelo node test):
  24 testes de política, action, export Next, proxy, callback e olhinhos.
- Rodada conjunta com documento do contratante e acesso: **45/45 PASS**.
- `node scripts/conferir-auth-email.mjs`: templates de confirmação/recuperação
  continuam válidos, sem modificação de template ou envio de e-mail.
- `pnpm typecheck`: PASS. Diff local revisado. Sem build/dev concorrente.
- Action e callbacks reais com portas isoladas; validador real do Next e HTML
  real da confirmação. Sucesso, logout com erro/exceção, update com erro/exceção,
  senha de 11/12 caracteres e classes ausentes; erro nunca concede acesso.

Não certifica a política Auth remota, e-mail entregue, recuperação real,
transição no navegador publicado ou solução do acesso pós-estorno.

## 5. Ensaio humano após publicação QA

1. Victor pede recuperação da QA04 pelo endereço QA e abre o novo e-mail no mesmo
   navegador. Senha/código permanecem só com ele.
2. O link deve abrir `/redefinir`, com dois controles de visibilidade e critérios
   de 12 caracteres/classes. Não deve abrir um negócio ou enviar pagamento.
3. Após salvar, deve aparecer `/redefinir/concluido`, mensagem de senha salva e
   botão “Entrar com a nova senha”. Falha no logout tem aviso separado.
4. O botão abre `/entrar?modo=login&adicionar=1`, sem pular para negócio anterior.
   Victor entra e confere a identidade da QA04. Acesso a negócio estornado
   continua uma pendência conhecida; não tratá-lo como aceite de compra ativa.
5. Se ocorrer erro, registrar somente caminho/horário/mensagem pública e versão
   QA. Não copiar URL com token, senha, cookie ou credencial.

Referências primárias:
[exports válidos em use server](https://nextjs.org/docs/messages/invalid-use-server-value),
[recuperação por senha no Supabase](https://supabase.com/docs/guides/auth/passwords).
O comportamento de `redirectType` foi conferido no código local instalado de
`@supabase/auth-js@2.111.0`, `_exchangeCodeForSession`, antes da implementação.
