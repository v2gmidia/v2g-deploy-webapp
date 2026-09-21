/**
 * AS VALIDAÇÕES DO ONBOARDING NOVO — funções puras, sem React e sem rede.
 *
 * ============================================================
 * BANCADA. Este diretório inteiro é `app/exemplo/_onboarding/`, alcançado
 * só pela rota `/exemplo/onboarding`, que é 404 em produção. Nada aqui
 * grava no banco, e nenhuma tela de produção importa este arquivo.
 * ============================================================
 *
 * PURAS DE PROPÓSITO: a recusa é a parte que o cliente sente, e ela
 * precisa ser conferível sem navegador. Quem escreve a frase é este
 * arquivo — a tela só mostra o que voltar daqui.
 *
 * NENHUMA FRASE USA A PALAVRA "ERRO", e nenhuma culpa quem digitou. A
 * regra é a mesma de `lib/criativos/envio.ts`, que já passa no
 * `conferir:envio`: dizer o que fazer, não o que a pessoa deixou de fazer.
 */

export type Veredito =
  | { ok: true; valor: string }
  | { ok: false; recado: string };

const aparar = (bruto: string) => bruto.trim().replace(/\s+/g, " ");

/** 1. Nome da pessoa: letras, espaço e acento. Número e símbolo não. */
export function validarNome(bruto: string): Veredito {
  const nome = aparar(bruto);
  if (nome.length === 0) {
    return { ok: false, recado: "Me diz como posso te chamar." };
  }
  if (/\d/.test(nome)) {
    return { ok: false, recado: "Aqui vai só o seu nome — sem números." };
  }
  // `\p{L}` cobre acento sem lista de caracteres à mão. Apóstrofo e hífen
  // entram porque existem em nome de gente ("D'Ávila", "Ana-Clara").
  if (!/^[\p{L}][\p{L}\s'’-]*$/u.test(nome)) {
    return { ok: false, recado: "Aqui vai só o seu nome, sem símbolos." };
  }
  if (nome.length < 2) {
    return { ok: false, recado: "Escreve seu nome inteiro, por favor." };
  }
  return { ok: true, valor: nome };
}

/** 2. Nome da empresa: mínimo de 2 caracteres. É o que sai no anúncio. */
export function validarEmpresa(bruto: string): Veredito {
  const nome = aparar(bruto);
  if (nome.length < 2) {
    return {
      ok: false,
      recado: "Escreve o nome do seu negócio como ele aparece para o cliente.",
    };
  }
  return { ok: true, valor: nome };
}

/**
 * 3. CEP: oito dígitos, formatado como `00000-000`.
 *
 * SÓ O FORMATO. Não existe resolvedor de CEP neste repositório — medido
 * em 20/09/2026: nenhuma chamada a ViaCEP ou equivalente, e a única
 * resolução geográfica é `garantirGeo()` em `lib/meta/publicar.ts`, que
 * fala com a Meta e exige token. Dizer "esse CEP não existe" sem
 * consultar nada seria afirmar o que não se mediu. Ver DUVIDAS.md.
 */
export function validarCep(bruto: string): Veredito {
  const digitos = bruto.replace(/\D/g, "");
  if (digitos.length === 0) {
    return { ok: false, recado: "Me diz o CEP de onde você atende." };
  }
  if (digitos.length !== 8) {
    return { ok: false, recado: "O CEP tem oito números. Confere pra mim?" };
  }
  return { ok: true, valor: `${digitos.slice(0, 5)}-${digitos.slice(5)}` };
}

export function mascararCep(bruto: string): string {
  const d = bruto.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** 4. Descrição: o piso de 10 é o do schema do backend (`descricao_livre`). */
export function validarDescricao(bruto: string): Veredito {
  const texto = bruto.trim();
  if (texto.length < 10) {
    return {
      ok: false,
      recado:
        "Conta um pouco mais — uma frase inteira ajuda a IA a entender o que você vende.",
    };
  }
  return { ok: true, valor: texto };
}

/**
 * 5. Instagram: sai daqui sempre como `@usuario`.
 *
 * Aceita a URL colada inteira, com ou sem `https`, com ou sem `www`, com
 * barra e query no fim — é o que a pessoa tem na mão quando abre o perfil
 * no celular e toca em "copiar link".
 */
export function validarInstagram(bruto: string): Veredito {
  const texto = aparar(bruto).replace(/\s/g, "");
  if (texto.length === 0) {
    return { ok: false, recado: "Me diz o @ do seu Instagram." };
  }

  const daUrl = texto.match(/instagram\.com\/([^/?#]+)/i);
  const cru = (daUrl ? daUrl[1]! : texto).replace(/^@/, "").replace(/\/+$/, "");

  if (!/^[a-zA-Z0-9._]{1,30}$/.test(cru)) {
    return {
      ok: false,
      recado: "Aqui vai só o @ do perfil, ou o link dele. Pode colar como veio.",
    };
  }
  return { ok: true, valor: `@${cru.toLowerCase()}` };
}

/**
 * 6. Site: exige domínio com ponto, e completa o `https://` sozinho.
 *
 * "Não tenho site" NÃO passa por aqui — é botão próprio na tela, e não é
 * recusa. Ver o passo `site` em `perguntas.ts`.
 */
export function validarSite(bruto: string): Veredito {
  const texto = aparar(bruto).replace(/\s/g, "");
  if (texto.length === 0) {
    return {
      ok: false,
      recado: "Escreve o endereço do site — ou toca em “Não tenho site”.",
    };
  }

  const comEsquema = /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;

  let url: URL;
  try {
    url = new URL(comEsquema);
  } catch {
    return { ok: false, recado: "Esse endereço não parece completo. Confere pra mim?" };
  }

  // Ponto no meio, e pelo menos duas letras depois dele: `v2gmidia.com.br`
  // passa, `meusite` e `meusite.` não.
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(url.hostname)) {
    return { ok: false, recado: "Falta o final do endereço, tipo .com ou .com.br." };
  }
  return { ok: true, valor: url.toString().replace(/\/$/, "") };
}

/**
 * 8. WhatsApp: DDD + número, no formato que o Brasil usa hoje.
 *
 * Dez dígitos (fixo) e onze (celular com o 9) passam. O `55` colado na
 * frente é aceito e descartado: quem copia do próprio WhatsApp copia com
 * ele.
 */
export function validarWhatsapp(bruto: string): Veredito {
  let d = bruto.replace(/\D/g, "");
  if (d.length === 0) {
    return { ok: false, recado: "Me diz o WhatsApp que recebe cliente." };
  }
  if (d.length === 12 || d.length === 13) {
    if (d.startsWith("55")) d = d.slice(2);
  }
  if (d.length !== 10 && d.length !== 11) {
    return { ok: false, recado: "Faltou algum número. É DDD + o número inteiro." };
  }
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { ok: false, recado: "Esse DDD não existe por aqui. Confere pra mim?" };
  }
  if (d.length === 11 && d[2] !== "9") {
    return { ok: false, recado: "Número de celular com nove dígitos começa com 9." };
  }
  return { ok: true, valor: mascararWhatsapp(d) };
}

export function mascararWhatsapp(bruto: string): string {
  const d = bruto.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
