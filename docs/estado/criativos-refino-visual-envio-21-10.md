# Criativos — refino visual do envio — 21/10/2026

## 0. Escopo e dependências

Feedback direto de Victor: apresentação insatisfatória, principalmente o seletor padrão de arquivo; preservar escolhas de objetivo e promoção. Implementado somente o refino visual local. A ausência de `upload_intent` no banco e a homologação autenticada descritas em `criativos-envio-objetivo-validade-21-10.md` continuam pendentes; esta rodada não aplicou SQL nem fez upload real.

Não foram iniciados os caminhos 2/3, geração por IA, novas integrações ou adaptador de leitura. A mensagem de coordenação recebida durante o trabalho não substituiu o feedback direto de Victor nem ampliou este bloco de interface.

## Feito

- Substituído o desenho nativo de “Escolher arquivo” por área de seleção com SVG, ação explícita e foco visível. O input nativo permanece acessível e operante por mouse/teclado; mantém accept, required, disabled e tratamento de mudança anteriores. `app/(protected)/criativos/PedirRevisao.tsx:134`.
- Prévia imediata após escolher, nome completo com quebra, tamanho medido do arquivo e ação “Trocar imagem”. Sem envio automático. `app/(protected)/criativos/PedirRevisao.tsx:144`.
- Composição em duas colunas: imagem / objetivo e promoção; rodapé com ação principal alinhada. No celular, composição empilhada. A seção externa só recebe o ajuste se contiver este formulário; criação/galeria não foram redesenhadas. `app/(protected)/criativos/PedirRevisao.module.css:1`, `:12`, `:53`, `:67`.
- Etapas em lista acessível com estado atual; conferência com imagem ampliada, dados e ações separadas. Botão de voltar recebe cores semânticas explícitas para evitar baixo contraste. `app/(protected)/criativos/PedirRevisao.tsx:127`, `:182`; CSS `:56`, `:63`.
- Mantidos paleta, fonte, tokens e raios da V2G; sem bibliotecas, assets de cliente ou mudança de regra de envio. Impeccable orientou o agrupamento, hierarquia e estados do controle, não uma troca de identidade.

## Provas locais

- `pnpm typecheck`: passou após última alteração.
- `pnpm conferir:intencao-envio`: 16/16, portas em memória, sem rede.
- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-revisao-criativos.mjs`: 11/11.
- Detector Impeccable executado uma vez sobre os dois arquivos: nenhum achado. Ajuste posterior restrito à cor semântica do botão de voltar.
- `git diff --check` dos arquivos: passou, apenas aviso de conversão futura LF/CRLF.
- Navegador: seleção por Space abriu o seletor; mouse abriu a troca; arquivo público `public/marca.png` apareceu na prévia com nome e 12 KB; nenhuma imagem privada foi usada. Objetivo WhatsApp e promoção até 28/10 chegaram à conferência. Confirmação e envio na bancada produziram somente mensagem de simulação. Retorno preservou a imagem; Instagram sem prazo também chegou à conferência.
- Verificados desktop 1280×900, celular 390×844 e temas claro/escuro. No celular, largura do documento 375 para viewport 390, sem excesso horizontal. Console consultado sem erros/avisos. Viewport padrão e tema claro restaurados ao entregar.
- Capturas `.impeccable/review/envio-refinado-*`: vazio/selecionado desktop e conferência mobile. Captura final clara: `envio-refinado-final-claro.png`. O aviso de prévia pertence somente à bancada dev.

## Limites e próximo passo

27 testes direcionados e navegação da bancada não são prova ponta a ponta com Supabase real. Sem build, restart de dev, commit, push, deploy, migration, ativação de flag ou chamada paga. Aguardar avaliação de Victor sobre este refinamento antes de abrir outro bloco. Depois, homologação do envio continua dependendo da autorização específica de QA/schema já registrada.
