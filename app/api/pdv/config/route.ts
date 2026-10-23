import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";

// Grava PIX e PIN do PDV da produtora. O PIN é só de escrita: nunca volta
// para o navegador. Quem pode: gestores da produtora (admin, produtor).
const GESTORES = ["admin", "financeiro", "produtora_admin", "super_admin"];

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario || !GESTORES.includes(usuario.role) || !usuario.produtora_id) {
    return NextResponse.json({ error: "Só a gestão da produtora altera o PDV." }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { pix_chave?: string; pix_nome?: string; pix_cidade?: string; pin?: string };
  const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const pin = texto(body.pin, 6);
  if (pin && !/^\d{4,6}$/.test(pin)) return NextResponse.json({ error: "O PIN deve ter de 4 a 6 números." }, { status: 400 });

  const dados: Record<string, string | null> = {
    pix_chave: texto(body.pix_chave, 77) || null,
    pix_nome: texto(body.pix_nome, 200) || null,
    pix_cidade: texto(body.pix_cidade, 100) || null,
  };
  if (pin) dados.pin_admin = pin;

  const admin = createAdminClient();
  const { data: atual } = await admin.from("pdv_config").select("id").eq("produtora_id", usuario.produtora_id).maybeSingle();
  const { error } = atual
    ? await admin.from("pdv_config").update({ ...dados, atualizado_em: new Date().toISOString() }).eq("id", atual.id)
    : await admin.from("pdv_config").insert({ ...dados, produtora_id: usuario.produtora_id });
  if (error) return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  return NextResponse.json({ success: true });
}
