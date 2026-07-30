import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

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
};

export default nextConfig;
