import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { pode } from "@/lib/auth/permissoes";

// Check-in da produção: marca (ou desmarca) quem se apresentou em cada apresentação.
// É a base dos certificados: só quem tem check-in recebe o da apresentação.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const erro = (mensagem: string, status = 400) => NextResponse.json({ error: mensagem }, { status });

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return erro("Não autenticado.", 401);
  if (usuario.role !== "super_admin" && !pode(usuario.role, "checkin")) return erro("Sem permissão.", 403);

  const body = (await req.json().catch(() => ({}))) as { apresentacao_id?: string; participante_id?: string; presente?: boolean; todos?: boolean };
  if (!UUID.test(body.apresentacao_id ?? "")) return erro("Apresentação inválida.");
  const admin = createAdminClient();
  const { data: ap } = await admin.from("apresentacoes")
    .select("id, evento_id, eventos ( produtora_id ), apresentacao_elenco ( participante_id )")
    .eq("id", body.apresentacao_id!).maybeSingle();
  const ev = Array.isArray(ap?.eventos) ? ap?.eventos[0] : ap?.eventos;
  if (!ap || !ap.evento_id || !ev || (usuario.role !== "super_admin" && ev.produtora_id !== usuario.produtora_id)) return erro("Apresentação não encontrada.", 404);
  const eventoId = ap.evento_id;

  const elenco = (ap.apresentacao_elenco ?? []).map((e) => e.participante_id as string);
  const alvos = body.todos ? elenco : elenco.filter((id) => id === body.participante_id);
  if (!alvos.length) return erro("Pessoa não está no elenco desta apresentação.");

  if (body.presente === false) {
    await admin.from("checkins").delete().eq("apresentacao_id", ap.id).in("participante_id", alvos);
  } else {
    const { error } = await admin.from("checkins").upsert(
      alvos.map((pid) => ({ evento_id: eventoId, apresentacao_id: ap.id, participante_id: pid, feito_por: usuario.id })),
      { onConflict: "apresentacao_id,participante_id", ignoreDuplicates: true },
    );
    if (error) {
      console.error("[api/checkin]", error);
      return erro("Não foi possível registrar.", 500);
    }
  }
  return NextResponse.json({ success: true });
}
