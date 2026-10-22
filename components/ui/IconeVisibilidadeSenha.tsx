/** Ícone compartilhado dos controles de mostrar/ocultar senha. */
export function IconeVisibilidadeSenha({ visivel }: { visivel: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.5" />
    {visivel && <path d="M3 21 21 3" />}
  </svg>;
}
