/** Contexto de navegação, nunca autorização. O carregador reconfirma os vínculos após entrar. */
export function destinoDaLeitura(pathname: string, busca: URLSearchParams): string | null {
  if (!["/anuncios", "/gestor", "/supergestor"].includes(pathname)) return null;
  const retorno = new URLSearchParams();
  const campos = pathname === "/anuncios" ? ["desde", "ate", "conta"] : ["desde", "ate", "conta", "metricas"];
  for (const campo of campos) {
    // Não esconder entrada repetida/inválida: a validação existente deve
    // continuar recusando-a após o login, em vez de escolher um valor sozinha.
    for (const valor of busca.getAll(campo)) retorno.append(campo, valor);
  }
  const consulta = retorno.toString();
  return pathname + (consulta ? `?${consulta}` : "");
}

/** Reusa o modo existente de login explícito, mesmo se o navegador conserva uma sessão. */
export function entradaDaLeitura(pathname: string, busca: URLSearchParams): string {
  return `/entrar?${new URLSearchParams({ adicionar: "1", next: destinoDaLeitura(pathname, busca) ?? "/anuncios" })}`;
}
