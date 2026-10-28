import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rotinaDiaria } from "@/lib/faturas/servico";

// Rotina diária de faturamento (Vercel Cron, ver vercel.json). A Vercel manda
// "Authorization: Bearer <CRON_SECRET>"; sem a variável configurada, não roda.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET?.trim();
  if (!segredo || req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const resultado = await rotinaDiaria(createAdminClient());
  console.log("[cron faturamento]", JSON.stringify(resultado));
  return NextResponse.json(resultado);
}
