import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { arquivoDaEquipe, origemPermitida } from "@/lib/midias/acesso";

// Entrega um arquivo técnico para a equipe guardar no aparelho, quando o
// navegador não consegue baixá-lo direto do armazenamento.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const acesso = await arquivoDaEquipe(createAdminClient(), id);
  if (!acesso) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const url = acesso.arquivo.url as string;
  if (!origemPermitida(url)) return NextResponse.json({ error: "Origem do arquivo não permitida." }, { status: 400 });

  const r = await fetch(url).catch(() => null);
  if (!r || !r.ok || !r.body) return NextResponse.json({ error: "Arquivo indisponível." }, { status: 502 });

  return new NextResponse(r.body, {
    headers: {
      "Content-Type": (acesso.arquivo.mime as string | null) || r.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
}
