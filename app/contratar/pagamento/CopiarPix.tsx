"use client";

import { useState } from "react";

export function CopiarPix({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  return <button type="button" className="contratar-copiar" onClick={async () => {
    try { await navigator.clipboard.writeText(codigo); setCopiado(true); }
    catch { setCopiado(false); }
  }}>{copiado ? "Código copiado" : "Copiar código Pix"}</button>;
}
