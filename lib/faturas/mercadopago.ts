import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Mercado Pago (Checkout Pro): link de pagamento de cada fatura, consulta do
// pagamento e conferência da assinatura dos avisos (webhook).
// Chaves por produto, na Vercel: MERCADOPAGO_ACCESS_TOKEN e MERCADOPAGO_WEBHOOK_SECRET.

const API = () => (process.env.MERCADOPAGO_API_URL || "https://api.mercadopago.com").replace(/\/+$/, "");
const TOKEN = () => process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || "";

export const mercadoPagoConfigurado = () => !!TOKEN();
// Chaves de teste do Mercado Pago começam com TEST-
export const mercadoPagoTeste = () => TOKEN().startsWith("TEST-");

async function chamar<T>(caminho: string, init: RequestInit & { idempotencia?: string } = {}): Promise<T> {
  if (!TOKEN()) throw new Error("Mercado Pago não configurado (MERCADOPAGO_ACCESS_TOKEN).");
  const res = await fetch(`${API()}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN()}`,
      "Content-Type": "application/json",
      ...(init.idempotencia ? { "X-Idempotency-Key": init.idempotencia } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${json.message ?? "erro"}`);
  return json;
}

export interface Preferencia { id: string; init_point: string }

export function criarPreferencia(p: {
  faturaId: string; titulo: string; valor: number; notificacao: string; retorno: string; emailPagador?: string | null;
}) {
  return chamar<Preferencia>("/checkout/preferences", {
    method: "POST",
    idempotencia: `fatura-${p.faturaId}-${p.valor.toFixed(2)}`,
    body: JSON.stringify({
      items: [{ id: p.faturaId, title: p.titulo.slice(0, 250), quantity: 1, unit_price: Math.round(p.valor * 100) / 100, currency_id: "BRL" }],
      external_reference: p.faturaId,
      notification_url: p.notificacao,
      back_urls: { success: p.retorno, pending: p.retorno, failure: p.retorno },
      auto_return: "approved",
      statement_descriptor: "ARXUM FEST",
      ...(p.emailPagador ? { payer: { email: p.emailPagador } } : {}),
    }),
  });
}

export interface Pagamento {
  id: number;
  status: string; // approved, pending, rejected, cancelled, refunded…
  external_reference: string | null;
  transaction_amount: number;
  payment_type_id: string | null; // bank_transfer (Pix), ticket (boleto), credit_card…
  date_approved: string | null;
}

export interface PagamentoPix {
  id: number;
  status: string;
  date_of_expiration: string | null;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
}

// Pix direto (sem sair do painel): devolve o QR Code e o "copia e cola"
export function criarPix(p: { faturaId: string; valor: number; descricao: string; email: string; notificacao: string; tentativa: number }) {
  const expira = new Date(Date.now() + 30 * 60000); // 30 minutos
  return chamar<PagamentoPix>("/v1/payments", {
    method: "POST",
    idempotencia: `pix-${p.faturaId}-${p.tentativa}`,
    body: JSON.stringify({
      transaction_amount: Math.round(p.valor * 100) / 100,
      description: p.descricao.slice(0, 250),
      payment_method_id: "pix",
      payer: { email: p.email },
      external_reference: p.faturaId,
      notification_url: p.notificacao,
      date_of_expiration: expira.toISOString().replace("Z", "-00:00"),
    }),
  });
}

export const buscarPagamento = (id: string) => chamar<Pagamento>(`/v1/payments/${encodeURIComponent(id)}`);

export const contaMercadoPago = () => chamar<{ id: number; nickname?: string; email?: string }>("/users/me");

export const NOME_FORMA: Record<string, string> = {
  bank_transfer: "Pix", ticket: "Boleto", credit_card: "Cartão de crédito", debit_card: "Cartão de débito", account_money: "Saldo Mercado Pago",
};

// Assinatura do aviso: x-signature = "ts=...,v1=..." e o manifesto
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" com HMAC-SHA256 da chave secreta
export function assinaturaValida(cabecalho: string | null, requestId: string | null, dataId: string, segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || ""): boolean {
  if (!segredo || !cabecalho || !dataId) return false;
  const partes = Object.fromEntries(cabecalho.split(",").map((p) => p.trim().split("=").map((s) => s.trim()) as [string, string]));
  if (!partes.ts || !partes.v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifesto = `id:${id};${requestId ? `request-id:${requestId};` : ""}ts:${partes.ts};`;
  const esperado = createHmac("sha256", segredo).update(manifesto).digest("hex");
  const a = Buffer.from(esperado), b = Buffer.from(partes.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
