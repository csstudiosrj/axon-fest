import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { pode } from "@/lib/auth/permissoes";
import { registrar } from "@/lib/super/registro";
import { contaMercadoPago, mercadoPagoTeste } from "@/lib/faturas/mercadopago";
import { garantirLink, marcarPaga, revisarBloqueio, rotinaDiaria } from "@/lib/faturas/servico";

// pagar: admin/financeiro da produtora pega o link de pagamento da fatura.
// Super admin: gerar_agora, marcar_paga, cancelar, desbloquear, testar_mp.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const erro = (mensagem: string, status = 400) => NextResponse.json({ error: mensagem }, { status });

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return erro("Não autenticado.", 401);
  const body = (await req.json().catch(() => ({}))) as { acao?: string; id?: string; observacao?: string };
  const admin = createAdminClient();
  const ehSuper = usuario.role === "super_admin";

  if (body.acao === "pagar") {
    if (!UUID.test(body.id ?? "")) return erro("Fatura inválida.");
    const { data: f } = await admin.from("faturas").select("produtora_id, status").eq("id", body.id!).maybeSingle();
    if (!f || (!ehSuper && (f.produtora_id !== usuario.produtora_id || !pode(usuario.role, "faturas")))) return erro("Fatura não encontrada.", 404);
    if (f.status !== "aberta") return erro("Esta fatura não está em aberto.");
    try {
      const link = await garantirLink(admin, body.id!);
      if (!link) return erro("O pagamento online ainda não está disponível. Fale com o suporte ARXUM.", 503);
      return NextResponse.json({ link });
    } catch (e) {
      console.error("[api/faturas] link", e);
      return erro("Não foi possível abrir o pagamento agora. Tente de novo em instantes.", 502);
    }
  }

  if (!ehSuper) return erro("Sem permissão.", 403);

  if (body.acao === "gerar_agora") {
    const r = await rotinaDiaria(admin);
    await registrar(admin, usuario.id, "gerar_faturas", { tipo: "sistema" }, r);
    return NextResponse.json(r);
  }
  if (body.acao === "testar_mp") {
    try {
      const conta = await contaMercadoPago();
      return NextResponse.json({ ok: true, conta: conta.nickname ?? conta.email ?? String(conta.id), teste: mercadoPagoTeste() });
    } catch (e) {
      return erro((e as Error).message, 502);
    }
  }
  if (!UUID.test(body.id ?? "")) return erro("Identificador inválido.");
  if (body.acao === "marcar_paga") {
    const ok = await marcarPaga(admin, body.id!, { forma: "Baixa manual", observacao: body.observacao?.slice(0, 300) ?? null });
    if (!ok) return erro("Fatura não está em aberto.");
    await registrar(admin, usuario.id, "fatura_baixa_manual", { tipo: "fatura", id: body.id! }, { observacao: body.observacao ?? null });
    return NextResponse.json({ ok: true });
  }
  if (body.acao === "cancelar") {
    const { data: f } = await admin.from("faturas").update({ status: "cancelada", observacao: body.observacao?.slice(0, 300) ?? null })
      .eq("id", body.id!).eq("status", "aberta").select("produtora_id").maybeSingle();
    if (!f) return erro("Fatura não está em aberto.");
    await revisarBloqueio(admin, f.produtora_id);
    await registrar(admin, usuario.id, "fatura_cancelada", { tipo: "fatura", id: body.id! }, { observacao: body.observacao ?? null });
    return NextResponse.json({ ok: true });
  }
  if (body.acao === "desbloquear") {
    // Libera por 7 dias (a rotina diária não bloqueia de novo nesse período)
    const ate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    await admin.from("produtoras").update({ bloqueio_financeiro: false, liberado_ate: ate }).eq("id", body.id!);
    await registrar(admin, usuario.id, "desbloqueio_financeiro", { tipo: "produtora", id: body.id! }, { liberado_ate: ate });
    return NextResponse.json({ ok: true });
  }
  return erro("Ação inválida.");
}
