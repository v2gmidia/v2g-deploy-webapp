import { permanentRedirect } from "next/navigation";

/** Ver a nota em `app/(protected)/campanhas/page.tsx`. */
export default function CriativosRedirect() {
  permanentRedirect("/anuncios");
}
