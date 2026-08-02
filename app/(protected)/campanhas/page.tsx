import { permanentRedirect } from "next/navigation";

/**
 * `/campanhas` e `/criativos` viraram `/anuncios` (lote 8).
 *
 * A rota fica como redirecionamento em vez de sumir: link antigo em
 * e-mail, aba aberta há uma semana e favorito do cliente não deixam de
 * existir só porque a gente reorganizou o menu. Um 404 aqui seria a gente
 * cobrando do cliente uma mudança que foi nossa.
 *
 * `permanentRedirect` (308) e não `redirect` (307) porque a mudança é
 * definitiva — assim o navegador e os buscadores param de pedir a rota
 * velha em vez de bater aqui para sempre.
 */
export default function CampanhasRedirect() {
  permanentRedirect("/anuncios");
}
