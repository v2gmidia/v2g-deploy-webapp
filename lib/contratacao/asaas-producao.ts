import "server-only";
import { novasComprasProducaoSeguras, processamentoProducaoSeguro } from "./ambiente-producao";
import { cartaoRecusadoSemCobranca } from "./retentativa-cartao";

type Opcoes = {method?:"GET"|"POST";body?:unknown;timeoutMs?:number};
const vazio = {ok:false,status:0,body:null,cardDeclined:false};
/** Fixed productive origin, separate key, no redirects/retries. Never accepts a caller URL. */
export async function asaasProducao(caminho:string,options:Opcoes={},finalidade:"purchase"|"processing"="processing") {
  if (!(finalidade==="purchase" ? novasComprasProducaoSeguras() : processamentoProducaoSeguro())) return vazio;
  const method=options.method??"GET";
  if (!caminho.startsWith("/") || caminho.startsWith("//") || /[\s\\#]|%2[ef]|%5c/i.test(caminho)) return vazio;
  if (method==="POST" && !(finalidade==="purchase" ? ["/customers","/payments"] : ["/subscriptions"]).includes(caminho)) return vazio;
  if (method==="GET" && !/^\/(payments|subscriptions)(\/|\?|$)/.test(caminho)) return vazio;
  try {
    const url=new URL(`https://api.asaas.com/v3${caminho}`);
    if (url.origin!=="https://api.asaas.com" || url.pathname!==`/v3${caminho.split("?")[0]}`) return vazio;
    const r=await fetch(url.href,{method,redirect:"error",cache:"no-store",
      headers:{"Content-Type":"application/json","User-Agent":"V2G-WebApp/1.0",access_token:process.env.ASAAS_PRODUCTION_API_KEY!},
      ...(options.body===undefined?{}:{body:JSON.stringify(options.body)}),
      signal:AbortSignal.timeout(Math.min(options.timeoutMs??15000,65000))});
    const raw:unknown=r.ok||r.status===400?await r.json():null;
    const errors=raw&&typeof raw==="object"&&"errors"in raw&&Array.isArray(raw.errors)?raw.errors:null;
    const first=errors?.[0];
    return {ok:r.ok,status:r.status,body:r.ok?raw:null,
      cardDeclined:cartaoRecusadoSemCobranca(r.status,first?.code,first?.description)};
  } catch {return vazio;}
}
