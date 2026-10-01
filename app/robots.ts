import type { MetadataRoute } from "next";

/**
 * O app não é página de busca: nada aqui deve ser indexado.
 *
 * Medido em 30/09/2026: não havia `robots.txt` (404) nem `noindex` em lugar
 * nenhum, e "/" era uma vitrine com preço e CNPJ de placeholder — indexável.
 * A vitrine pública é v2gmidia.com.br.
 *
 * QUEM BLOQUEIA É O `noindex` DO LAYOUT RAIZ, E NÃO ESTE ARQUIVO — 01/10/2026.
 *
 * Este robots LIBERA o rastreamento de propósito. Com `Disallow`, o Google
 * não volta às páginas que já indexou, não lê o `noindex` delas e pode
 * mantê-las no índice — sem trecho, mas com o endereço. A vitrine antiga
 * esteve no ar desde 06/08/2026; liberar é o que deixa o Google ver o
 * `noindex` e tirá-la.
 *
 * Disallow só depois que a vitrine antiga sair do índice do Google (revisar
 * em ~30 dias).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
  };
}
