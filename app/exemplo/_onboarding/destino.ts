/**
 * ONDE CADA RESPOSTA VAI MORAR — só dado e função pura, sem rede.
 *
 * ============================================================
 * ESTE ARQUIVO NÃO ESCREVE NADA. Ele diz o que SERIA escrito. A bancada
 * grava no `localStorage`; produção grava por `confirmar_campo_do_cliente`
 * — a mesma porta da `/meu-negocio`, que põe valor e procedência na mesma
 * transação (migrations 0015/0016).
 *
 * Separar o MAPA da ESCRITA é o que deixa o mapa ser conferido fora do
 * navegador e fora do banco: `pnpm exec node scratchpad/checar-destino.ts`
 * exercita as onze perguntas sem tocar em nada.
 * ============================================================
 *
 * ============================================================
 * O ESTADO DE CADA COLUNA, medido em 20/09/2026 contra
 * `supabase/migrations/` e o schema vivo:
 *
 *   EXISTEM   profiles.full_name, businesses.radius_km, businesses.name,
 *             businesses.cep, businesses.description,
 *             businesses.instagram_handle, businesses.site_url,
 *             businesses.niche, businesses.monthly_budget
 *   FALTA     businesses.whatsapp_do_anuncio — migration 0022 escrita,
 *             NÃO APLICADA
 *   SEM CASA  a correção do resumo (DUVIDA-ONB-9) e os arquivos de
 *             logo/foto, que não são coluna: vão para o Storage
 *
 * A DUVIDA-ONB-7 dizia que três colunas faltavam. Estava errada: duas
 * delas já existiam desde a `0001_init.sql`.
 * ============================================================
 */

/** A porta de escrita, e o que ela exige saber. */
export interface Escrita {
  /** a pergunta do onboarding que produziu este valor */
  pergunta: string;
  tabela: "profiles" | "businesses";
  campo: string;
  /** o valor como a coluna espera — texto, número ou nulo */
  valor: string | number | null;
  /**
   * A coluna existe no banco HOJE? `false` quer dizer que a escrita vai
   * falhar até a 0022 rodar — e é melhor falhar alto do que gravar em
   * lugar nenhum em silêncio.
   */
  colunaExiste: boolean;
  /**
   * O cliente consegue editar isto depois, pela `/meu-negocio`? Depende
   * da lista branca da `confirmar_campo_do_cliente`, não da coluna.
   */
  naListaBranca: boolean;
}

/** O que cada pergunta vira. `null` = não é coluna. */
interface Destino {
  tabela: "profiles" | "businesses";
  campo: string;
  /** converte a resposta da tela no que a coluna espera */
  converter?: (bruto: string) => string | number | null;
  colunaExiste: boolean;
  naListaBranca: boolean;
}

/**
 * Só dígitos, sem máscara? NÃO. A coluna guarda como o cliente digitou.
 *
 * Quem precisar de E.164 para a Meta converte na LEITURA: guardar o
 * formato de uma integração dentro da coluna faz a segunda integração
 * herdar a escolha da primeira. O mesmo vale para o CEP, que a `validarCep`
 * já devolve como `00000-000`.
 */
const COMO_DIGITADO = (bruto: string) => bruto;

/** Reais inteiros, do slider, para uma coluna `numeric`. */
const EM_NUMERO = (bruto: string) => {
  const n = Number(bruto);
  return Number.isFinite(n) ? n : null;
};

/**
 * O Instagram vai SEM arroba: é o que o catálogo manda
 * (`lib/agentes/campos.ts`, campo `instagram_handle`: "sem arroba e sem
 * URL"), e a tela mostra com arroba porque é assim que o dono o chama.
 */
const SEM_ARROBA = (bruto: string) => bruto.replace(/^@+/, "");

const MAPA: Record<string, Destino | null> = {
  pessoa: { tabela: "profiles", campo: "full_name", colunaExiste: true, naListaBranca: false },
  empresa: { tabela: "businesses", campo: "name", colunaExiste: true, naListaBranca: true },
  local: {
    tabela: "businesses",
    campo: "cep",
    converter: COMO_DIGITADO,
    colunaExiste: true,
    naListaBranca: true,
  },
  local_raio: {
    tabela: "businesses",
    campo: "radius_km",
    // ============================================================
    // "BRASIL INTEIRO" NÃO VIRA NÚMERO, e não vira escrita.
    //
    // `radius_km` é `int`. Um raio que cubra o país seria número que
    // parece número e não é — e o backend monta o alvo da Meta como um
    // círculo em volta de um ponto (`src/meta/graph.py:1166`), então um
    // raio absurdo é um círculo no mar, não o Brasil.
    //
    // `EM_NUMERO` devolve `null` para "brasil", e `escritasDe` descarta.
    // A resposta EXISTE e fica guardada; o que não existe é a coluna que
    // saiba recebê-la. DUVIDA-ONB-11.
    // ============================================================
    converter: EM_NUMERO,
    colunaExiste: true,
    naListaBranca: true,
  },
  descricao: { tabela: "businesses", campo: "description", colunaExiste: true, naListaBranca: true },
  instagram: {
    tabela: "businesses",
    campo: "instagram_handle",
    converter: SEM_ARROBA,
    colunaExiste: true,
    naListaBranca: true,
  },
  site: { tabela: "businesses", campo: "site_url", colunaExiste: true, naListaBranca: true },
  nicho: { tabela: "businesses", campo: "niche", colunaExiste: true, naListaBranca: true },
  whatsapp: {
    tabela: "businesses",
    campo: "whatsapp_do_anuncio",
    converter: COMO_DIGITADO,
    // A 0022 está escrita e NÃO aplicada. Enquanto isso for `false`, a
    // tela sabe que esta resposta não tem onde cair.
    colunaExiste: false,
    // E mesmo depois da 0022 continua fora: a lista branca precisa de uma
    // migration própria, junto com `lib/agentes/campos.ts`. Ver
    // docs/migracao-whatsapp-do-anuncio.md.
    naListaBranca: false,
  },
  verba: {
    tabela: "businesses",
    campo: "monthly_budget",
    converter: EM_NUMERO,
    colunaExiste: true,
    naListaBranca: true,
  },
  // Estes NÃO são coluna, e dizer isso aqui é melhor do que o mapa ficar
  // quieto sobre eles.
  nicho_outro: null, // o texto de quem escolheu "Outro" — DUVIDA-ONB-12
  cores: null, // as cores da logo — as colunas existem, a porta não: DUVIDA-ONB-14
  material: null, // arquivos: Supabase Storage, como a /conta já faz
  conexao: null, // a conexão com a Meta tem tabela própria
  correcao: null, // um recado sobre o cadastro, não um campo — DUVIDA-ONB-9
};

/**
 * As escritas que ESTE conjunto de respostas produziria, na ordem das
 * perguntas. Resposta vazia não vira escrita: campo em branco é ausência,
 * e a `confirmar_campo_do_cliente` recusa valor em branco de propósito.
 */
export function escritasDe(respostas: Record<string, string>): Escrita[] {
  const saida: Escrita[] = [];
  for (const [pergunta, bruto] of Object.entries(respostas)) {
    const destino = MAPA[pergunta];
    if (!destino) continue;
    if (bruto === undefined || bruto === null || bruto.trim() === "") continue;
    const valor = destino.converter ? destino.converter(bruto) : bruto;
    if (valor === null) continue;
    saida.push({
      pergunta,
      tabela: destino.tabela,
      campo: destino.campo,
      valor,
      colunaExiste: destino.colunaExiste,
      naListaBranca: destino.naListaBranca,
    });
  }
  return saida;
}

/** As que não têm onde cair hoje. Vazio é o estado que a gente quer. */
export function semOndeCair(respostas: Record<string, string>): Escrita[] {
  return escritasDe(respostas).filter((e) => !e.colunaExiste);
}

/**
 * As perguntas que não viram coluna nenhuma, com o destino que elas
 * PRECISAM ganhar. Não é lista de pendência minha: é o que falta decidir.
 */
export const FORA_DE_COLUNA: { pergunta: string; onde: string }[] = [
  {
    pergunta: "nicho_outro",
    onde: "sem destino — não existe nicho genérico no backend (DUVIDA-ONB-12)",
  },
  {
    pergunta: "cores",
    onde: "identidade_visual.cor_primaria/secundaria/destaque EXISTEM, mas fora da lista branca e ninguém as lê (DUVIDA-ONB-14)",
  },
  { pergunta: "material", onde: "Supabase Storage, com RLS por business_id — o padrão de lib/identidade/armazenar.ts" },
  { pergunta: "conexao", onde: "meta_connections, que já existe e é escrita pelo callback da Meta" },
  { pergunta: "correcao", onde: "sem destino decidido — DUVIDA-ONB-9" },
];
