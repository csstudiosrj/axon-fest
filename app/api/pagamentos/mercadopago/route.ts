import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { assinaturaValida, buscarPagamento, NOME_FORMA } from "@/lib/faturas/mercadopago";
import { marcarPaga } from "@/lib/faturas/servico";

// Aviso de pagamento do Mercado Pago (webhook). Confere a assinatura, consulta o
// pagamento na API (nunca confia no corpo do aviso) e dá baixa na fatura.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };
  const tipo = req.nextUrl.searchParams.get("type") ?? body.type ?? "";
  const dataId = String(req.nextUrl.searchParams.get("data.id") ?? body.data?.id ?? "");
  if (!assinaturaValida(req.headers.get("x-signature"), req.headers.get("x-request-id"), dataId)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }
  // Outros tipos de aviso (merchant_order etc.) não interessam: responde 200 para não reenviar
  if (tipo !== "payment" || !dataId) return NextResponse.json({ ok: true });

  try {
    const pg = await buscarPagamento(dataId);
    if (pg.status !== "approved" || !pg.external_reference) return NextResponse.json({ ok: true, status: pg.status });
    const admin = createAdminClient();
    const { data: f } = await admin.from("faturas").select("id, valor_total, status").eq("id", pg.external_reference).maybeSingle();
    if (!f) return NextResponse.json({ ok: true, fatura: "não encontrada" });
    if (f.status === "aberta" && Number(pg.transaction_amount) + 0.01 >= Number(f.valor_total)) {
      await marcarPaga(admin, f.id, { forma: NOME_FORMA[pg.payment_type_id ?? ""] ?? pg.payment_type_id ?? "Mercado Pago", pagamentoId: String(pg.id) });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook mercadopago]", e);
    // 500: o Mercado Pago tenta de novo mais tarde
    return NextResponse.json({ error: "Falha ao processar." }, { status: 500 });
  }
}
