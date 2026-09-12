import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { TETO_DO_SERVIDOR_TEXTO } from "./lib/criativos/limites.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fixa a raiz do workspace neste diretório — sem isso, o Next.js
  // detecta um package-lock.json solto na pasta pessoal do usuário
  // (fora deste repositório) e infere a raiz errada.
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      /**
       * ============================================================
       * O PADRÃO DO NEXT É 1 MB, E FOI ELE QUE QUEBROU A `/criativos`.
       *
       * Medido em 12/09/2026: foto de celular tem 2 a 8 MB, passava da
       * validação do navegador (que não tinha teto) e era recusada AQUI,
       * pelo framework, com `Body exceeded 1 MB limit.` — antes de a
       * action rodar. A recusa do framework não passa pelo nosso
       * tratamento de falha: a promessa rejeitava e a tela ficava
       * carregando para sempre.
       *
       * O número NÃO é digitado aqui. Sai de
       * `lib/criativos/limites.mjs`, o mesmo módulo de onde sai o teto
       * do navegador — que é derivado deste, com folga declarada.
       * ============================================================
       */
      bodySizeLimit: TETO_DO_SERVIDOR_TEXTO,
    },
  },
};

export default nextConfig;
