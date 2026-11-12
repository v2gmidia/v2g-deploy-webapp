> BLOQUEIO LOCAL RESOLVIDO após autorização de Victor: [build aprovado e entrega mínima pronta](./n26-comercial-release-minimo-pronto-11-11.md). Registro histórico abaixo preservado; nada publicado.

# Comercial — revisão para publicação fechada e bloqueio de build

## 0. Estado reconciliado e próxima ação

11/11/2026. Pedido: seguir banco → conexões → prova final → vendas. A tabela enviada é anterior aos atos já concluídos; não reaplicar banco nem recriar credenciais.

| Etapa | Estado com evidência | Falta |
|---|---|---|
| Banco mínimo | Aplicado e conferido em produção em 11/11, migration `20261111150656`; dados anteriores e isolamento estrutural preservados | Nenhuma reaplicação |
| Conexões | Configuradas e conferidas no bloco anterior, com controles/webhook/fila OFF; conteúdo das credenciais não lido | Prova funcional produtiva ainda não realizada |
| Eventos sem pedido | Correção local com 78 casos novos e 108 regressões aprovados; typecheck aprovado | Revisão/publicação em bloco próprio; build completo agora encontrou bloqueio adicional |
| Publicação fechada | Domínio produtivo consultado nesta revisão: mesmo deployment READY e mesma revisão anteriores | Corrigir o bloqueio local abaixo, concluir build e autorizar eventual publicação com tudo OFF |
| Prova final | Ainda não realizada em produção | Definir comprador/método/valor/recorrência/tratamento posterior; autorização específica e ação financeira de Victor; confirmar pagamento → e-mail recebido → sessão legítima → negócio correto |
| Abrir vendas | Ainda não liberadas | Aceite da prova final e autorização para contratação/encaminhamento da LP |

**Responsável pela próxima decisão: Victor.** Aprovar o ajuste mínimo de organização do cookie OAuth em código local, descrito na §3 e entregue em patch não aplicado. A autorização anterior delimitou a correção dos eventos sem pedido; esta descoberta envolve outros dois arquivos de rota. Regra do repositório: mapear → apresentar → esperar aprovação → implementar → parar/relatar.

## 1. Conferência atual da publicação

Consulta autenticada somente leitura ao deployment de `app.v2gmidia.com.br` retornou:

- projeto `prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl`;
- deployment `dpl_A2GgHjfNbRGGcNwNXwdS412xC7aW`, READY, target production;
- branch main, revisão `13f8943471b391bd22e9dd8362f5748653ad9c5b`.

Mesmo deployment/revisão do checkpoint de conexões. A correção financeira permanece local; a consulta não demonstra sua presença em produção nem substitui a prova financeira. Variáveis, seus valores, logs financeiros e banco não foram consultados nesta revisão. OFF permanece o estado registrado no bloco anterior, sem nova medição dos controles.

## 2. Build isolado: falha nova comprovada

Para revisar o pacote além dos testes já encerrados, copiada a fonte necessária para pasta temporária `C:/Users/victo/AppData/Local/Temp/v2g-commercial-build-NxSZog`. Dependências existentes usadas por junction. Nenhum `.env` copiado; processo filho com lista explícita de variáveis de sistema e identificadores públicos fictícios, sem credenciais herdadas. Flags comerciais ausentes/OFF. Não foi tocado o `.next` do checkout compartilhado.

Executado Next.js 16.2.12, `build --webpack`: compilação concluída, mas geração/conferência dos tipos de rotas falhou, exit 1:

```text
.next/types/app/auth/meta/iniciar/route.ts:14:13
Property 'COOKIE_STATE' is incompatible with index signature.
Type '"meta_oauth_state"' is not assignable to type 'never'.
```

FATO: `app/auth/meta/iniciar/route.ts:14` exporta `COOKIE_STATE`; `app/auth/meta/callback/route.ts:8` importa a constante desse arquivo de rota. Arquivos de rota têm um conjunto restrito de exports reconhecidos pelo Next. A compilação sem gerar novamente esses tipos não havia demonstrado esse erro: o typecheck aprovado não substitui o build limpo completo.

Esse código era preexistente: comparação com os fingerprints anteriores mantém somente `lib/contratacao/webhook-pagamento.ts` e `package.json` alterados entre os 805 arquivos anteriores. Não atribuir a falha à correção financeira nem declarar o pacote completo pronto para publicação.

Não se prosseguiu para teste HTTP do artefato nem houve publicação após esse bloqueio. Não é prova de que o ambiente atualmente publicado esteja quebrado; é um impedimento no build limpo da fonte local revisada.

## 3. Ajuste mínimo preparado, ainda não aplicado

Patch revisável: `docs/comercial/revisao-publicacao-fechada-11-11/ajuste-proposto-nao-aplicado.patch`.

1. Criar `lib/meta/oauth-state.ts`, exportando o mesmo literal `meta_oauth_state`.
2. Importar a constante desse módulo em iniciar e callback.
3. Remover somente o export indevido do arquivo de rota.

O patch não propõe alterar o valor do cookie, nonce, prazo, flags, validações de sessão/negócio, chamada Meta, credenciais, permissões ou banco. Não está aplicado nem testado ainda; a prova após aprovação será novo build isolado e, se passar, conferência local das portas fechadas. Se surgir outro erro, registrar sua evidência antes de ampliar escopo.

## 4. Evidências e preservação

Pasta `docs/comercial/revisao-publicacao-fechada-11-11/`: `build-isolado.log`, `build-resultado.json`, `build-metadados.json`, `revisao.json` e patch proposto. Metadados identificam os hashes exatos de handler/verificador/package usados no build.

Checkpoint financeiro anterior preservado: `n26-comercial-eventos-sem-pedido-local-11-11.md`. Banco e configuração encerrados permanecem em `n26-comercial-banco-minimo-aplicado-producao-11-11.md` e `n26-comercial-conexoes-off-concluidas-11-11.md`.

Sem edição adicional de código do produto, leitura de `.env`/segredos, alteração remota, migração, cobrança, assinatura, e-mail, anúncio, commit, push, merge ou publicação. Testes já aprovados não foram repetidos; o trabalho novo foi a revisão de build e o diagnóstico concreto de sua primeira falha.
