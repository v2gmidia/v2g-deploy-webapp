# Piligrin — marca e período corrigidos localmente na QA

> PUBLICADO E CONFERIDO em 12/11/2026: push de Victor `916d8df`, deployment QA READY, inicial P e datas/números/gráfico confirmados na sessão legítima da Piligrin. Detalhes em `n26-qa-marca-periodo-publicados-12-11.md`. Não repetir o pedido de push destes ajustes.

## 0. Resultado e próximo passo

12/11/2026. Victor autorizou corrigir a marca da Piligrin e a clareza do período, testar somente na QA e atualizar a proposta produtiva antes de aplicar. **Correções concluídas no código da branch QA e na candidata local do pacote.** Próximo passo de Victor: commit e push somente da QA; depois conferir a publicação autenticada. O alias QA ainda não recebeu estas alterações por ação do agente.

Pacote atualizado para **revisão 2** em `docs/producao/piligrin-duu-12-11/REVISAO.md:1`. Três diffs reversos conferidos sem aplicação: ajuste QA, WebApp candidato e backend anterior. A revisão 1 foi copiada para backup privado de arquivos. Não é backup do banco. Backend, SQL, dados propostos, ativos e privilégios permanecem os da revisão 1; os bloqueios legítimos de ativação produtiva continuam documentados.

## 1. Mudanças

- `lib/agencia/da-sessao.ts`: identifica o compartilhamento histórico da raiz com o anunciante a partir do vínculo explícito já lido e validado. Também cobre a compatibilidade legada da QA. Não acrescenta consulta, permissão ou escrita.
- `lib/agencia/identidade-do-menu.ts:8`: transforma somente a apresentação da marca dessa raiz em logo ausente; o Casco existente mostra a inicial **P** ao lado de Piligrin. Não remove o arquivo e não altera a imagem do Dúú. Agência com marca própria e cadastro separado mantém o logo.
- `app/(protected)/layout.tsx`: aplica essa apresentação ao cabeçalho e às opções da conta após a autorização existente. Nenhuma marca é escolhida por semelhança de nome ou parâmetro de URL.
- `components/agencia/InicioDoCliente.tsx`: datas completas em destaque dentro da seção “Resumo do período”, associadas por `aria-describedby`; rótulo **“Investido no período”**. Usa `dados.periodo` da leitura validada e o formatador do calendário.
- `components/agencia/inicio-cliente.module.css`: preserva tokens/identidade, separa o resumo do estado acima e mantém rótulos/valores alinhados quando o texto ocupa duas linhas no celular.

## 2. Provas

- **107 testes locais na QA**, incluindo relação compartilhada/separada, preservação do logo original, seleção do anunciante, isolamento, datas completas, mudança de período/ano, gráfico, retorno e histórico.
- **125 testes locais na candidata do pacote**, preservando seus opt-ins produtivos e regras de acesso anteriores. Apenas os seis arquivos desta correção foram portados; não substituída a candidata pela QA inteira.
- Typecheck e builds isolados finais passaram em ambas as bases, sem copiar `.env`, herdar credenciais ou tocar na `.next` da área de trabalho. QA: `C:/Users/victo/AppData/Local/Temp/v2g-agency-build-WrO7Ay`. Candidata: `C:/Users/victo/AppData/Local/Temp/v2g-agency-build-3qBOlM`.
- Inspeção visual única em computador (1536 px) e celular (390 px), uma correção de espaçamento e confirmação final. Sem rolagem horizontal; avatares da Piligrin com P e zero imagens indevidas, margem do resumo 24 px. Prévia descartável baseada na QA, com aviso explícito de **números fictícios**, sem sessão ou consulta Meta real.
- Troca na prévia de 01–07/11 para 08–09/11 atualizou calendário, texto do resumo, total de ensaio, pontos do gráfico e datas do link para Anúncios. Prova local de apresentação; não é nova medição da conta Dúú nem validação do deploy QA.
- Chrome de ensaio foi fechado, tamanho de tela restaurado e servidor local encerrado. Aba QA do usuário preservada.
- Backend e banco não foram retestados nem consultados remotamente sem mudança: o pacote confere que seus hashes permanecem iguais aos da revisão 1 e identifica as provas herdadas como anteriores.

Evidências: `C:/Users/victo/.codex/private-backups/v2g/qa-marca-periodo-20261112/prova-visual.json`, `desktop-final.png` e `mobile-final.png`. Testes novos em `scripts/conferir-agencia-marca-periodo.mjs`; caso adicional de raiz separada em `scripts/conferir-agencia-estrutura.mjs`.

## 3. Limites

Sem publicação, migração, alteração de cadastro/arquivo remoto, cobrança, anúncio, credencial, papel, produção, n8n, commit ou push. Não foi cadastrada uma logo da Piligrin por suposição: a inicial P é o fallback até existir material próprio. O pacote está atualizado para revisão; aplicação produtiva continua exigindo aprovação e as conferências de acesso/Meta/autoria já registradas.
