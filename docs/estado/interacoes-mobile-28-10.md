# Interações do primeiro bloco — 28/10/2026

## 0. Estado e próxima decisão

Implementação local autorizada pelo pedido de Victor para experimentar no localhost, após a proposta de navegação mobile, campos de acesso e envio de imagens. Sem commit, push, deploy, mudança de autenticação ou escrita remota. Prévia: `http://localhost:3000/exemplo/interacoes`.

Avisos empilhados, gráfico compacto e confirmação por código continuam fora deste primeiro bloco. O envio aprimorado neste bloco é o de criativos para revisão; os formulários de marca do onboarding e da Conta não foram alterados.

## 1. Implementado

- `app/produto-editorial.css`: barra inferior com margem, cantos arredondados, separação suave do conteúdo, cinco rótulos e resposta ao toque. Ajuste específico até 380px conserva os nomes completos. Mantém proteção de área segura e espaço inferior do conteúdo.
- `components/ui/NavItem.tsx`: links internos do Next, sem pré-carregamento especulativo. URLs e indicação de página ativa preservadas. `app/layout.tsx` declara a rolagem suave já existente para as transições internas.
- `app/(public)/entrar/TelaEntrada.tsx` e `app/entrada-editorial.css`: rótulos flutuantes em e-mail/senha de login e primeiro acesso, incluindo repetição da senha. Rótulo continua associado ao input; estados preenchido/foco/autofill e movimento reduzido. Login recebe mostrar/ocultar senha. Regras e actions de acesso preservadas.
- `app/(protected)/criativos/PedirRevisao.tsx` e CSS Module: alvo de seleção mais suave, arrastar/soltar uma imagem, recusa local de formato/tamanho/quantidade e mensagem junto ao campo. Seleção mantém miniatura/nome/tamanho; conferência e confirmação continuam obrigatórias. Indicador indeterminado acompanha envio real, sem porcentagem inventada. Não modifica actions, storage ou publicação.
- `app/exemplo/interacoes`, `app/exemplo/acesso`, `app/exemplo/_interacoes`: bancada dev-only com celular/computador e os componentes reais. Login/cadastro usam actions fictícias sem rede. Criativos reaproveita a bancada existente, com `previa` sem gravação.

## 2. Verificação

- `pnpm typecheck`: passou após alterações de TypeScript.
- `node --test scripts/conferir-intencao-envio.mjs scripts/conferir-revisao-criativos.mjs scripts/conferir-qa-interface.mjs`: 42/42.
- `node --test scripts/conferir-cadastro-interface.mjs`: 9/9.
- Chrome local: preenchimento dos campos com dados fictícios, rótulos sem sobreposição e mostrar senha; seleção de `app/icon.png`, objetivo, conferência e confirmação fictícia sem envio; arquivo `.txt` recusado junto ao seletor, CTA permanece desabilitado; navegação até Avisos com estado ativo correto.
- Em viewport de 320px (305px úteis com scrollbar), navegação sem rolagem horizontal; cinco alvos com aproximadamente 55,8 × 56px e rótulos completos. Também inspecionadas composição mobile de 390px e desktop na bancada.
- Capturas em `C:/Users/victo/.codex/visualizations/2026/10/28/interacoes-v2g/`.

## 3. Limites da prova

Não houve envio real, autenticação, teste em aparelho físico, Safari/iOS ou build de produção. Arrastar/soltar foi implementado, mas o gesto nativo entre aplicativos não foi ensaiado; a seleção pelo seletor de arquivos foi exercitada. Autofill tem suporte CSS, sem ensaio de gerenciador de senhas real. A prévia estreita usa iframe, não emulação completa de um dispositivo.
