/**
 * O aviso da seção 2-A da política, na voz de quem fala com o cliente.
 *
 * MORA NUMA CONSTANTE porque é gravado junto com cada imagem, em
 * `creatives.copy.declaracao.texto`. A LGPD pede consentimento
 * demonstrável, e "clicou em enviar" não demonstra o quê — o que demonstra
 * é a redação vigente no momento do aceite.
 *
 * Se este texto mudar, as imagens antigas continuam guardando o texto
 * ANTIGO, que é exatamente o comportamento certo: cada uma registra o que
 * aquela pessoa leu, não o que passou a valer depois.
 *
 * A regra em si está em lp/privacidade.html §2-A. Aqui é a tradução dela
 * para português de gente — o cliente não lê política, lê a tela.
 */
export const TEXTO_DA_DECLARACAO =
  "Pode mandar foto em que você aparece. Foto de funcionário, cliente ou " +
  "qualquer outra pessoa não dá — quem aparece no anúncio precisa ter " +
  "autorizado, e essa autorização é da pessoa, não sua.";
