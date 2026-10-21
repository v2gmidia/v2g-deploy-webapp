import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isIP } from "node:net";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { asaasSandbox, idAsaas } from "@/lib/contratacao/asaas-sandbox";
import { validarDadosCartao } from "@/lib/contratacao/dados-cartao";
import { MAX_TENTATIVAS_CARTAO } from "@/lib/contratacao/retentativa-cartao";
import { lerDispositivo3ds, callback3dsQa, urlDesafio3ds } from "./cartao-3ds";
import { origemAsaasNoServidor } from "./origem-asaas-servidor";
import { hashDeSeguranca, ipConfiavelDaVercel, segurancaCheckoutAtiva,
  verificarTurnstile } from "@/lib/seguranca/checkout";

export type PagamentoState = { erro?: string };

function hojeEmSaoPaulo(): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const valor = (tipo: string) => partes.find(parte => parte.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export async function iniciarPagamentoInterno(_anterior: PagamentoState, form: FormData,
  segurancaJaVerificada = false): Promise<PagamentoState> {
  if (!checkoutSandboxSeguroNesteServidor() || process.env.V2G_CHECKOUT_API_ENABLED !== "true")
    return { erro: "O pagamento de teste está indisponível neste ambiente." };
  const referencia = String(form.get("ref") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(referencia)) return { erro: "Pedido inválido. Volte ao início da contratação." };
  const admin = createAdminClient();
  const assistidoAtivo = process.env.V2G_ASSISTED_ASAAS_ENABLED === "true";
  const { data: pedido, error: erroPedido } = await admin.from("commercial_orders")
    .select("id, origin, status, buyer_email, buyer_name, buyer_whatsapp, legal_name, cnpj, payment_method, billing_period, total_cents, provider_customer_id, provider_charge_id, provider_subscription_id, provider_checkout_id, checkout_creation_started_at, payment_creation_started_at, payment_attempt_count")
    .eq("external_ref", referencia).maybeSingle();
  if (erroPedido || !pedido || !await origemAsaasNoServidor(admin, pedido, assistidoAtivo))
    return { erro: "Não foi possível localizar o pedido de teste." };
  if (pedido.status !== "awaiting_payment" || pedido.provider_checkout_id
      || pedido.checkout_creation_started_at || pedido.provider_charge_id
      || pedido.provider_subscription_id || pedido.payment_creation_started_at)
    return { erro: "Este pedido já está em processamento. Atualize a página para ver o estado." };
  if (pedido.payment_method !== "asaas_pix" && pedido.payment_method !== "asaas_card")
    return { erro: "A forma de pagamento deste pedido não está disponível aqui." };
  if (pedido.payment_method === "asaas_card" && pedido.payment_attempt_count >= MAX_TENTATIVAS_CARTAO)
    return { erro: "Este cartão já teve três tentativas. Procure a V2G para continuar com segurança." };

  const cabecalhos = await headers();
  const ipDoProxy = ipConfiavelDaVercel(cabecalhos);
  const ipSeguro = segurancaCheckoutAtiva() ? ipDoProxy : null;
  if (segurancaCheckoutAtiva() && !segurancaJaVerificada) {
    const token = String(form.get("cf-turnstile-response") ?? "");
    const ipHash = ipSeguro ? hashDeSeguranca(ipSeguro) : null;
    const contatoHash = hashDeSeguranca(pedido.buyer_email);
    if (!ipSeguro || !ipHash || !contatoHash || !await verificarTurnstile(token, ipSeguro))
      return { erro: "Não foi possível confirmar a verificação de segurança. Atualize a página e tente novamente." };
    const { data: permitido, error: erroLimite } = await admin.rpc("consumir_limite_checkout", {
      p_scope: "payment", p_ip_hash: ipHash, p_contact_hash: contatoHash,
    });
    if (erroLimite || permitido !== true)
      return { erro: "Recebemos várias tentativas recentes. Aguarde uma hora ou procure a V2G." };
  }

  const cartao = pedido.payment_method === "asaas_card" ? validarDadosCartao(form) : null;
  if (cartao && !cartao.dados) return { erro: cartao.erro };
  let remoteIp: string | null = null;
  if (cartao) {
    if (cabecalhos.get("x-forwarded-proto") !== "https")
      return { erro: "O teste com cartão exige uma página HTTPS de QA. Nenhum dado do cartão foi enviado." };
    remoteIp = ipDoProxy ?? (cabecalhos.get("cf-connecting-ip") ?? cabecalhos.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
    if (!isIP(remoteIp) || remoteIp === "127.0.0.1" || remoteIp === "::1")
      return { erro: "Não foi possível identificar o IP do pagador. Nenhum dado do cartão foi enviado." };
  }

  // Uma unica tentativa externa por pedido. Timeout ou resposta ambigua exige
  // conciliacao antes de repetir, pois o Asaas pode ter criado a cobranca.
  const hoje = hojeEmSaoPaulo();
  // Este é o fluxo direto já provado apenas no Sandbox. Produção depende do
  // desenho cobrança avulsa 3DS -> PAYMENT_CONFIRMED -> assinatura no mês
  // seguinte, registrado separadamente em fluxo-cartao-mensal.ts.
  const usa3ds = pedido.billing_period === "monthly" && pedido.payment_method === "asaas_card"
    && process.env.V2G_CHECKOUT_3DS_SCHEMA_ENABLED === "true"
    && process.env.V2G_CHECKOUT_3DS_ENABLED === "true";
  const dispositivo = usa3ds ? lerDispositivo3ds(String(form.get("deviceInfo") ?? ""),
    remoteIp ?? "", cabecalhos.get("user-agent") ?? "") : null;
  if (usa3ds && (!ipDoProxy || !dispositivo))
    return { erro: "Não foi possível verificar os dados do dispositivo para autenticar o cartão. Atualize a página." };
  const assinaturaDiretaSandbox = pedido.billing_period === "monthly" && !usa3ds;
  const reservadoEm = new Date().toISOString();
  const tentativasUsadas = pedido.payment_attempt_count + (cartao ? 1 : 0);
  const { data: reservado, error: erroReserva } = await admin.from("commercial_orders")
    .update({ payment_creation_started_at: reservadoEm,
      provider_first_due_date: pedido.billing_period === "monthly" ? hoje : null,
      ...(usa3ds ? { provider_card_flow: "initial_3ds" } : {}),
      payment_attempt_count: tentativasUsadas })
    .eq("id", pedido.id).eq("status", "awaiting_payment")
    .eq("payment_attempt_count", pedido.payment_attempt_count)
    .is("payment_creation_started_at", null).is("provider_charge_id", null)
    .is("provider_subscription_id", null).is("checkout_creation_started_at", null)
    .select("id").maybeSingle();
  if (erroReserva || !reservado)
    return { erro: "O pedido já está em processamento. Atualize a página." };
  if (usa3ds) {
    const agora = new Date();
    const limpeza = await admin.from("checkout_3ds_context").delete().lt("expires_at", agora.toISOString());
    const contexto = await admin.from("checkout_3ds_context").upsert({ order_id: pedido.id,
      payer_ip: remoteIp, expires_at: new Date(agora.getTime() + 24 * 60 * 60 * 1000).toISOString() });
    if (limpeza.error || contexto.error)
      return { erro: "Não foi possível preparar a autenticação do cartão. Procure a V2G antes de tentar novamente." };
  }

  let clienteId = idAsaas(pedido.provider_customer_id, "cus");
  if (!clienteId) {
    const cliente = await asaasSandbox("/customers", { method: "POST", body: {
      name: pedido.legal_name, cpfCnpj: pedido.cnpj, email: pedido.buyer_email,
      mobilePhone: pedido.buyer_whatsapp, externalReference: pedido.id,
      // No Sandbox, contatos sinteticos nao devem receber SMS ou e-mail.
      notificationDisabled: true,
    } });
    const corpo = cliente.body && typeof cliente.body === "object" ? cliente.body as Record<string, unknown> : null;
    clienteId = cliente.ok ? idAsaas(corpo?.id, "cus") : null;
    if (!clienteId) {
      // HTTP 401 rejeita a chamada antes de criar o pagador. Somente nesse
      // caso certo liberamos a reserva: timeout e demais falhas podem ter
      // criado algo no provedor e exigem conciliação antes de outra tentativa.
      if (cliente.status === 401) {
        const { data: liberado, error: erroLiberacao } = await admin.from("commercial_orders")
          .update({ payment_creation_started_at: null, provider_first_due_date: null,
            payment_attempt_count: pedido.payment_attempt_count })
          .eq("id", pedido.id).eq("status", "awaiting_payment")
          .eq("payment_creation_started_at", reservadoEm)
          .eq("payment_attempt_count", tentativasUsadas)
          .is("provider_customer_id", null).is("provider_charge_id", null)
          .is("provider_subscription_id", null)
          .select("id").maybeSingle();
        if (!erroLiberacao && liberado)
          return { erro: "O pagamento de teste está temporariamente indisponível. Tente novamente mais tarde." };
      }
      return { erro: "O cadastro do pagador não foi confirmado. A V2G precisa conferir antes de tentar novamente." };
    }
    const { data: vinculo, error: erroVinculo } = await admin.from("commercial_orders")
      .update({ provider_customer_id: clienteId }).eq("id", pedido.id)
      .eq("status", "awaiting_payment").is("provider_customer_id", null)
      .select("id").maybeSingle();
    if (erroVinculo || !vinculo) return { erro: "O pagador foi criado, mas o vínculo falhou. Procure a V2G antes de tentar novamente." };
  }

  const titular = cartao?.dados;
  const dadosDoCartao = titular ? {
    creditCard: { holderName: titular.holderName, number: titular.cardNumber,
      expiryMonth: titular.expiryMonth, expiryYear: titular.expiryYear, ccv: titular.ccv },
    creditCardHolderInfo: { name: titular.holderName, email: pedido.buyer_email,
      cpfCnpj: titular.holderDocument, postalCode: titular.postalCode,
      addressNumber: titular.addressNumber, mobilePhone: pedido.buyer_whatsapp },
    remoteIp,
  } : {};
  const resposta = await asaasSandbox(assinaturaDiretaSandbox ? "/subscriptions" : "/payments", {
    method: "POST", timeoutMs: titular ? 65_000 : 20_000,
    body: assinaturaDiretaSandbox ? {
      customer: clienteId, billingType: "CREDIT_CARD", cycle: "MONTHLY",
      nextDueDate: hoje, value: pedido.total_cents / 100,
      description: "Gestão de anúncios V2G", externalReference: pedido.id,
      ...dadosDoCartao,
    } : {
      customer: clienteId, billingType: pedido.payment_method === "asaas_pix" ? "PIX" : "CREDIT_CARD",
      dueDate: hoje, value: pedido.total_cents / 100,
      description: "Gestão de anúncios V2G", externalReference: pedido.id,
      ...dadosDoCartao,
      ...(usa3ds ? { threeDSecure: { callbackUrl: callback3dsQa(referencia) }, deviceInfo: dispositivo } : {}),
    },
  });
  const corpo = resposta.body && typeof resposta.body === "object" ? resposta.body as Record<string, unknown> : null;
  const id = resposta.ok ? idAsaas(corpo?.id, assinaturaDiretaSandbox ? "sub" : "pay") : null;
  if (!id) {
    // Uma rejeição de autenticação também ocorre antes da criação da cobrança.
    // O pagador pode permanecer vinculado; liberar só a reserva desta tentativa.
    if (resposta.status === 401) {
      const { data: liberado, error: erroLiberacao } = await admin.from("commercial_orders")
        .update({ payment_creation_started_at: null, provider_first_due_date: null,
          payment_attempt_count: pedido.payment_attempt_count })
        .eq("id", pedido.id).eq("status", "awaiting_payment")
        .eq("payment_creation_started_at", reservadoEm)
        .eq("payment_attempt_count", tentativasUsadas)
        .eq("provider_customer_id", clienteId)
        .is("provider_charge_id", null).is("provider_subscription_id", null)
        .select("id").maybeSingle();
      if (!erroLiberacao && liberado)
        return { erro: "O pagamento de teste está temporariamente indisponível. Tente novamente mais tarde." };
    }
    if (cartao && resposta.cardDeclined) {
      // O Asaas confirma que essa recusa 400 nao persiste cobranca nem
      // assinatura. A reserva so e liberada se nenhum ID chegou ao pedido.
      const { data: liberado, error: erroLiberacao } = await admin.from("commercial_orders")
        .update({ payment_creation_started_at: null, provider_first_due_date: null })
        .eq("id", pedido.id).eq("status", "awaiting_payment")
        .eq("payment_creation_started_at", reservadoEm)
        .is("provider_charge_id", null).is("provider_subscription_id", null)
        .select("id").maybeSingle();
      if (!erroLiberacao && liberado)
        return { erro: tentativasUsadas >= MAX_TENTATIVAS_CARTAO
          ? "O cartão foi recusado. Após três tentativas, procure a V2G para continuar."
          : "O cartão foi recusado. Confira os dados ou tente outro cartão." };
    }
    return { erro: "O Asaas não confirmou a criação. A V2G precisa conferir antes de tentar novamente." };
  }

  const { data: salvo, error: erroSalvar } = await admin.from("commercial_orders")
    .update(assinaturaDiretaSandbox ? { provider_subscription_id: id } : { provider_charge_id: id })
    .eq("id", pedido.id).eq("status", "awaiting_payment")
    .select("id").maybeSingle();
  if (erroSalvar || !salvo) return { erro: "A cobrança foi criada, mas o vínculo falhou. Procure a V2G antes de pagar." };
  if (usa3ds && corpo?.threeDSecureChallengeUrl != null) {
    const desafio = urlDesafio3ds(corpo.threeDSecureChallengeUrl);
    if (!desafio) return { erro: "A autenticação do cartão precisa de conferência. Procure a V2G antes de tentar novamente." };
    redirect(desafio);
  }
  redirect(`/contratar/pagamento?ref=${encodeURIComponent(referencia)}`);
}
