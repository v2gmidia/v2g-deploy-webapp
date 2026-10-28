# Peça V3 — pronta para revisão local

**Arquivo final:** `v2g-negocio-anuncios-v3.png`, PNG, **1080 × 1080**, 372.404 bytes. SHA-256 em `manifesto.json`.

É design local original, composto com HTML/CSS e exportado pelo navegador. **Não é geração pelo agente V2G.** Nenhuma chamada paga ocorreu. Usa símbolo vetorial próprio, Archivo já usada no aplicativo e cores da identidade V2G; não usa fotos de clientes, concorrentes ou referências de terceiros.

Texto da peça: “Você cuida do negócio. A V2G cuida dos anúncios.” Apoio: “Gestão de anúncios com acompanhamento humano.” CTA: “Converse com a V2G”. Texto do anúncio em `copy.txt`.

## Verificação

- Archivo carregada na renderização 1080 × 1080. Composição inspecionada integralmente.
- O navegador forneceu a captura em JPEG; o original foi preservado em `v2g-negocio-anuncios-v3-captura.jpg` e convertido localmente para PNG sem redimensionamento. A conversão não recupera detalhes já comprimidos. `conferir-exportacao.py` registra formato/dimensões e reconcilia o manifesto.
- O PNG final foi visualizado em viewport 390 × 844, exibido com largura de 358 px, sem rolagem horizontal; leitura da chamada, apoio e CTA conferida visualmente. Evidência: `previa-mobile.png`.
- A imagem não apresenta métricas, resultado garantido ou autonomia total de IA.
- Esta conferência é local. Não comprova aprovação na Meta, elegibilidade de posicionamento, geração no aplicativo ou entrega de campanha.

## Campanha e próximo passo

Decisão recebida de Victor via Central: Leads → conversas no WhatsApp da Página V2G, número com final **2928**, Brasil, **R$ 500 de verba TOTAL de mídia**, publicação junto com Victor. Não é mensalidade anunciada nem autorização para publicar sozinho. Público exato e período seguem para revisão. Nenhuma URL completa de WhatsApp foi inventada pelos quatro últimos dígitos.

Revisar este arquivo exato e o texto com Victor antes de upload/publicação. A arte V1 permanece preservada. Os bloqueios do piloto do agente e do backend permanecem independentes desta entrega local.

## Fonte e prévia

`arte.html` é a fonte editável. `servir-previa.mjs` serve apenas uma lista de arquivos deste diretório em `127.0.0.1:3189`; não expõe o aplicativo ou diretórios. `/previa` mostra o PNG final com identificação de design local. A prévia depende do servidor local permanecer ativo.
