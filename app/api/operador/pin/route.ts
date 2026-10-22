import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { ROLES_OPERADOR } from "@/lib/auth/roles";

// Valida o PIN do PDV da produtora do usuário logado. O PIN nunca vai para o
// navegador. Após MAX_FALHAS erros seguidos a conta fica bloqueada por
// BLOQUEIO_MS (contador salvo no app_metadata do usuário, vale entre instâncias).
const MAX_FALHAS = 5;
const BLOQUEIO_MS = 5 * 60 * 1000;

function iguais(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario || !ROLES_OPERADOR.includes(usuario.role)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!usuario.produtora_id) {
    return NextResponse.json({ error: "Usuário sem produtora vinculada." }, { status: 403 });
  }

  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  if (typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN inválido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: authData } = await admin.auth.admin.getUserById(usuario.id);
  const meta = (authData.user?.app_metadata ?? {}) as { pin_falhas?: number; pin_bloqueado_ate?: number };

  if (meta.pin_bloqueado_ate && meta.pin_bloqueado_ate > Date.now()) {
    const minutos = Math.ceil((meta.pin_bloqueado_ate - Date.now()) / 60000);
    return NextResponse.json({ error: `Muitas tentativas. Tente em ${minutos} min.` }, { status: 429 });
  }

  const { data: config } = await admin
    .from("pdv_config")
    .select("pin_admin")
    .eq("produtora_id", usuario.produtora_id)
    .maybeSingle();

  const pinCorreto = (config?.pin_admin as string | null | undefined) ?? "";
  if (!pinCorreto) {
    return NextResponse.json(
      { error: "PIN não configurado. Peça ao organizador para definir em PDV & Bilheteria." },
      { status: 409 }
    );
  }

  if (!iguais(pin, pinCorreto)) {
    const falhas = (meta.pin_falhas ?? 0) + 1;
    await admin.auth.admin.updateUserById(usuario.id, {
      app_metadata: {
        pin_falhas: falhas >= MAX_FALHAS ? 0 : falhas,
        pin_bloqueado_ate: falhas >= MAX_FALHAS ? Date.now() + BLOQUEIO_MS : null,
      },
    });
    return NextResponse.json({ error: "PIN incorreto." }, { status: 401 });
  }

  if (meta.pin_falhas || meta.pin_bloqueado_ate) {
    await admin.auth.admin.updateUserById(usuario.id, {
      app_metadata: { pin_falhas: 0, pin_bloqueado_ate: null },
    });
  }

  return NextResponse.json({ success: true });
}
