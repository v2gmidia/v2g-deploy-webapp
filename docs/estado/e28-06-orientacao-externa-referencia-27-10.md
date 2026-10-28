# E28-06 — orientação externa a partir de referência — 27/10/2026

## §0. Resultado e próximo portão

**Recorte local implementado e conferido no navegador.** O cliente pode escolher uma referência pública do piloto de barbearia e preparar/copiar uma orientação com sua marca, oferta, objetivo e composição desejada. Depois, cria a imagem na ferramenta de sua escolha e retorna ao envio existente para revisão.

**Não é geração de imagem dentro da V2G. Não foi publicado ou homologado no QA.** Nenhum modelo, Jev, Meta, Storage ou banco foi acionado por esta orientação. Nenhuma chamada paga, flag, configuração externa ou autorização de IA foi alterada.

Falta integrar este recorte pela publicação autorizada e conferir `/criativos` com uma sessão real de QA, negócio de barbearia e o piloto já habilitado pelo responsável. Este chat não realizou commit, push ou deploy. A geração interna real continua com os portões registrados em `e28-06-v2-consumidor-local-27-10.md` e no pacote de QA; este bloco não os remove.

## Mapa e limite do bloco

- Seleção de referência e vínculo ao pedido/envio já existiam. O trabalho deste bloco foi somente preencher a lacuna de orientação copiável; não reescrever o upload nem a fila.
- `app/(protected)/criativos/ReferenciasDoNicho.tsx:15` esclarece que o corte de 80% no Jev é pertinência textual ao nicho, sem prova de venda ou qualidade. O componente mantém os links públicos e acrescenta a orientação somente após selecionar uma referência (`:26`).
- `lib/criativos/orientacao-externa.ts:7` prepara texto local validando referência da lista, marca/cores declaradas, objetivo, oferta, composição e validade real da promoção. O texto pede arte original, somente material próprio e nenhuma fachada ou dado inventado.
- `app/(protected)/criativos/OrientacaoExterna.tsx:7` oferece campos locais e um botão de cópia com fallback manual. Campos sem `name` não entram no envio existente; não há formulário aninhado. O resultado deriva dos dados atuais e a confirmação de cópia fica vinculada ao texto exato.
- `PedirRevisao.tsx:188` reaproveita o objetivo fechado WhatsApp/Instagram e o prazo existentes. A oferta aparece apenas dentro da orientação opcional; não foi adicionada como pergunta obrigatória ao fluxo de upload.
- `PedidoDeImagem.tsx:75` reaproveita objetivo, oferta, ação e prazo já preenchidos no pedido de criação.
- As duas bancadas `/exemplo/criativos?referencias=barbearia` e `/exemplo/criativos-pedido-duravel?referencias=barbearia` expõem o piloto só na prévia dev existente. A proteção dev-only foi preservada.

Marca e composição são declarações manuais temporárias. Não há leitura automática de identidade autorizada, inspeção visual automática do anúncio ou novo registro persistido dessas declarações. Trocar a referência remonta a orientação e limpa seus campos. O link da referência é para consulta manual: o texto não instrui baixar ou reproduzir mídia concorrente.

## Provas deste bloco

- `node --test scripts/conferir-orientacao-externa.mjs`: **6/6 passaram**. Cobrem referência permitida, campos ausentes/limites, data real e inclusiva, promoção desligada sem prazo residual, dados delimitados e renderização do seletor sem submit/formulário adicional.
- `pnpm typecheck`: passou após as alterações finais de componentes e bancadas.
- `git diff --check`: sem erro de whitespace; somente avisos de conversão LF/CRLF.
- Navegador em `http://127.0.0.1:3107/exemplo/criativos?referencias=barbearia#subir-criativo`: objetivo WhatsApp, referência `700155112131034`, marca fictícia e oferta/composição preenchidas; botão habilitou e exibiu **“Orientação copiada”**. Leitura da área de transferência imediatamente após a cópia confirmou marca fictícia, ID da referência e objetivo corretos.
- Campos vazios mantiveram cópia desabilitada com instrução visível. Sem arquivo selecionado, **“Conferir criativo”** permaneceu desabilitado: copiar orientação não enviou nem criou criativo.
- Inspeção visual em 1280 px e 390 px. Largura do documento 1265/375 px, respectivamente, sem rolagem horizontal; campos móveis de 309 px dentro da tela. Override de viewport foi removido depois.
- Evidências: [desktop](../qa/orientacao-externa-local-27-10/desktop.png) e [celular](../qa/orientacao-externa-local-27-10/mobile.png). Dados usados são fictícios. Não foi anexado arquivo privado nem acessada a imagem original do concorrente.

O primeiro acesso à bancada respondeu 404. Uma reinicialização controlada do servidor próprio, em modo development explícito e porta local 3107, resolveu; a prova acima foi feita após o carregamento correto. Nenhum `.env` foi lido ou editado. Não foi executado build com o dev ativo, nem repetida a suíte verde de geração sem alteração na fila.

## Roteiro após publicação autorizada

1. Abrir `https://v2g-webapp-qa.vercel.app/criativos` com nova sessão real e negócio ativo de barbearia. Não usar `/exemplo` em QA publicado.
2. Com o piloto já habilitado pelo responsável, abrir as referências e um anúncio público. Confirmar link correto e ausência de promessa de resultado.
3. Escolher referência, objetivo e prazo; preencher marca/oferta/composição na orientação opcional. Copiar e conferir os mesmos dados e o prazo no texto. Nenhuma geração ou envio deve ocorrer ao copiar.
4. Em ensaio de upload autorizado, retornar com imagem própria/fictícia permitida, conferir e enviar pelo fluxo existente. Comprovar referência associada ao mesmo pedido e releitura após novo login. **Essa persistência autenticada não foi retestada neste bloco local de texto.**
5. Para outro nicho ou piloto desligado, não deve aparecer a lista de barbearia. Não há busca dinâmica para todos os nichos.

Alterações concorrentes em anúncios e recebimento Meta foram preservadas. Índice compartilhado não foi editado neste recorte, para integração pelo responsável. Sem mudança de backend, migration ou produção.
