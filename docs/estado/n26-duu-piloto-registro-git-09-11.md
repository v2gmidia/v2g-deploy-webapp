# Dúú — registro Git, teto confirmado e peça enviada à revisão QA — 09/11/2026

## Resultado deste bloco

> RESOLVIDO POSTERIORMENTE — 09/11/2026: Victor autorizou salvar o teto no aplicativo e validar o cadastro automático só na QA. Teto R$ 3 mil salvo pela UI, recuperado após recarregar e conferido no banco QA com procedência `confirmado`. Cadastro não iniciou: faltam quatro dados, sem execução vinculada. Pedido/retorno da peça continuam aguardando Cauã. Ver [teto salvo e conferência do cadastro](./n26-duu-teto-cadastro-revisao-09-11.md). As referências abaixo a teto apenas operacional descrevem o estado anterior.

- **Backend registrado e enviado ao GitHub**, por autorização expressa de Victor: commit [`646ab181d30255cf6a592d98b0bb994ce454c704`](https://github.com/v2gmidia/backend_v2g/commit/646ab181d30255cf6a592d98b0bb994ce454c704), branch `codex/qa-inicio-serie-diaria`. Checkout limpo e acompanhamento de `origin/codex/qa-inicio-serie-diaria` confirmado. Main remota permaneceu `c3e13596e5c4642b1cf9a342472fa411907313d4` antes/depois. Sem merge ou novo deploy.
- **283/283 arquivos de runtime idênticos ao pacote publicado**, comparados tanto no checkout quanto nos blobs do índice Git antes do commit. Tree `d53c9969dae83c96e7abd31e43965653aa087f0d`. O TAR privado mantém SHA-256 `5db68085bed48197fb0d42659c3da2da1d32452b0f561b5ed5a696ec4564b724`. Manifesto portátil incluído no commit, em `docs/estado/n26-inicio-qa-pacote-publicado-manifesto-09-11.json` do backend.
- **Ruff PASS; mypy PASS (176 fontes); 3025 PASS / 9 SKIP / zero falhas**, 250,54 s, nesta rodada antes do commit. Oito avisos de depreciação HTTP 422; skips preservados e não contados como aprovação. A saúde QA depois do push permaneceu `ok=true`, runtime `002587a88fae`, schema/leitura Meta OK, observador inativo. Não se chamou saúde de produção.
- **Aceite dos números pelo Cauã recebido** no grupo **🎯 03 | Operação — Gestores**, 09/11 às **10:23 BRT**: “A aba ver números deu certo”. É o retorno humano pedido sobre a própria sessão; não se trocou a identidade do navegador para simular o gestor.
- **Teto de R$ 3.000/mês confirmado** por Victor neste chat e pelo Cauã no mesmo grupo: pergunta de Victor 10:54, resposta “Sim” 10:54. Às 10:55 Cauã esclareceu que ainda testa a campanha e não consome todo o teto; só pretende subir o orçamento quando escalar. Teto confirmado não é gasto observado nem ordem para mudar o orçamento atual.
- **Mídia enviada pelo Cauã recebida e submetida uma única vez à revisão QA** pela sessão nominal Victor/Piligrin. A galeria passou de 0 para **Em revisão 1**, mostrou a imagem e o estado **Recebido para revisão do gestor**; confirmação de envio: “Peça recebida para revisão do gestor. Ela ainda não foi publicada.”

## Origem e versão da peça

Fonte: mídia da mensagem do Cauã de **09/11/2026 10:23 BRT**, no grupo de gestores, legenda “Esse é o criativo campeão da duu gomes”. O anexo deste chat é prova da conversa; o arquivo enviado à QA foi baixado pelo controle **Baixar** do visualizador WhatsApp, não uma captura de tela recortada.

| Campo | Conferido |
|---|---|
| Nome recebido | `WhatsApp Image 2026-11-09 at 10.23.29.jpeg` |
| Bytes | 484499 |
| Dimensões | 1254 × 1254 |
| SHA-256 | `0c0d48fdc3e3515f730226b6988d8b363ac854423bbb4c6bbb1c53a3ef24901c` |
| Negócio selecionado | Piligrin, `9cb85308-02cc-4ce7-bacf-15be77f9ba5e` |
| Conta de referência da rodada | CA - Dúú Gomes, `act_1165478988908157` |
| Objetivo escolhido | Receber mensagens no WhatsApp, de acordo com a peça e a campanha de referência |
| Promoção com prazo | Não informada; a imagem não trouxe data de validade |
| Associação a anúncio no aplicativo | **Nenhuma**; a galeria declara “Sem anúncio” |

A palavra “campeão” é a identificação feita por Cauã, não uma conclusão estatística deste bloco. Não foi identificado um `creative_id` independente nem atribuído o arquivo a AD01/AD02 por semelhança. O JPEG recebido pelo WhatsApp é a versão rastreável deste ensaio; não se afirma possuir o arquivo editável da criação ou o binário exato entregue à Meta.

## Encaminhamento ao gestor

Mensagem única enviada no mesmo grupo às **11:07 BRT**, estado posterior **Lida**. Registra o aceite dos números e teto, informa que a imagem recebida foi enviada à QA e encaminha o Cauã à própria fila:

`https://v2g-webapp-qa.vercel.app/gestor/criativos?negocio=9cb85308-02cc-4ce7-bacf-15be77f9ba5e`

Foi pedido que ele confira a imagem e registre a decisão/retorno correspondentes na própria conta. A instrução delimita QA, sem publicação de anúncio, aumento de verba ou produção. A mensagem lida não é prova de decisão no aplicativo ou de que a fila foi aberta por ele.

## Próxima prova e limites

1. Cauã abrir a peça na fila pela própria sessão, conferir a imagem e registrar sua decisão e retorno.
2. Cliente recuperar a mesma peça e o retorno após atualizar/entrar novamente. Só então marcar o percurso **envio → fila do gestor → decisão → retorno** como concluído.
3. Teto mensal foi registrado operacionalmente neste documento e na planilha. **`businesses.monthly_budget` ainda não foi alterado neste ato.** As ações atuais de `/verba` e `/meu-negocio` chamam `dispararSeCompleto`; não se executou esse caminho por consequência da confirmação do teto. Nenhum POST `/cadastro`, webhook n8n ou mudança de verba Meta foi realizado.

O upload e a prévia foram comprovados pelo lado cliente. A fila vista pela sessão do Cauã, a decisão e o retorno ainda dependem da ação dele. Não houve cobrança repetida, identidade simulada, grant, mudança de flag, DDL ou ação em produção. Não se criou monitoramento em loop.

## Evidências

Planilha operacional atualizada no mesmo arquivo: **Visão geral!C10:D11, F10:F13, D12, C13:D13, A23** e **Novembro — execução!J2, L2, H3, J3, L3, H4:L5**. Releitura final: **27/27 campos corretos, 22 células vizinhas intactas**, notas/histórico preservados. As duas abas foram conferidas no Google Planilhas a 100%; textos novos da execução foram compactados sem alterar estrutura/formatação. Números, teto e peça recebida constam como confirmados; decisão e retorno da peça continuam pendentes. Provas `planilha-visao-geral.png` e `planilha-execucao.png` na pasta abaixo.

Pasta local privada/de trabalho: `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/piloto-duu-registro-09-11/`.

- `criativo-recebido-qa.png`, `criativo-recebido-qa-dom.txt`: sessão nominal, negócio, prévia e estado recebido para revisão.
- `caua-encaminhamento-lido.png`, `caua-encaminhamento-dom.txt`: grupo correto, teto e encaminhamento das 11:07 lido.
- Teste integral novo: JUnit privado `registro-git-unit.xml`, ao lado do pacote backend privado; TAR e manifesto original preservados, sem publicar o arquivo privado no Git.

O GitHub Desktop estava minimizado e não expôs janela controlável; não se insistiu nem mudou configuração. O commit e o push autorizados por Victor foram realizados pelo Git e aceitos, com verificação da ref remota e checkout limpo. Nenhuma credencial foi lida, impressa ou alterada.
