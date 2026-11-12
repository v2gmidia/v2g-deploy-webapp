# Ajuste público de endereços — preparado, não aplicado

> APLICADO E CONFERIDO em 11/11/2026 após “Autorizo esse ajuste de endereços”: Site URL/callback Supabase salvos e persistentes após recarga; variável pública existente alterada e relida somente em Production. Dois redirects anteriores preservados. Sem deploy ou ativação financeira. [Resultado e pendências atuais](../../estado/n26-comercial-enderecos-aplicados-provedores-conferidos-11-11.md). O conteúdo abaixo preserva a proposta anterior à autorização.

Conferência de 11/11/2026. Banco mínimo produtivo já aplicado; esta proposta não repete esse ato nem habilita pagamento. A configuração abaixo foi apresentada a Victor em pergunta específica; resposta ainda pendente no encerramento desta etapa.

| Onde | Antes observado | Ajuste proposto |
| --- | --- | --- |
| Supabase `V2G-SITE` / Site URL | `https://v2g-deploy-webapp.vercel.app` | `https://app.v2gmidia.com.br` |
| Supabase / Redirect URLs | `https://v2g-deploy-webapp.vercel.app/**` e `http://localhost:3000/**` | Preservar ambas e acrescentar somente `https://app.v2gmidia.com.br/auth/confirmar`. |
| Vercel projeto `v2g-deploy-webapp`, Production / `NEXT_PUBLIC_SITE_URL` | Nome existente; valor não lido. | Definir explicitamente `https://app.v2gmidia.com.br` somente em Production. Sem alterar Preview/Development. |

O aplicativo já usa `/auth/confirmar` para cadastro e recuperação. Os dois templates produtivos usam `{{ .ConfirmationURL }}`, compatível com o retorno tratado pelo código. A allowlist atual não inclui o host app. Segundo a [documentação Supabase](https://supabase.com/docs/guides/auth/redirect-urls), o retorno informado deve corresponder à lista permitida, e Site URL participa do retorno padrão/confirmacão de e-mail.

Preservar templates, SMTP, confirmação de e-mail, permissões de usuários, URLs antigas e páginas legais. Não criar chave/token ou ler `.env`. Não abrir checkout ou ligar processamento/e-mail financeiro. O ajuste de variável não autoriza publicação: a nova configuração precisa ser conferida na versão que a receber em um release posterior autorizado; salvar no painel não prova efeito no deployment existente.

`NEXT_PUBLIC_SITE_URL` possui outros consumidores, inclusive autenticação/recuperação e retorno de exclusão Meta. A mudança de origem deve ser verificada nessas portas na publicação correspondente, sem executar exclusão ou alterar página legal. Não alterar callbacks de integração Meta por consequência deste ajuste.

Identidade do alvo: Supabase `ushccxpoxjikzqnwhgfd`; Vercel `prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl`. Evidência anterior da tela e URLs salva privadamente em `C:/Users/victo/.codex/private-backups/v2g/conexoes-producao-20261111/`. Não foi clicado Save changes/Add URL nem alterado campo remoto.

Próxima ação após autorização nominal: revalidar os valores correntes, preservar o antes, aplicar apenas o delta aprovado, reler e registrar. Se outra frente alterar a configuração, preservar e reconciliar. Nenhuma cobrança, teste financeiro ou abertura pública está incluído.
