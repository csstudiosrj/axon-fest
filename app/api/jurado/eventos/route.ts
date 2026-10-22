import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";

// Eventos para os quais o jurado logado foi designado
export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.role !== "jurado") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("evento_jurados")
    .select("evento_id, eventos(id, nome, data_inicio, data_fim, local, status)")
    .eq("jurado_id", usuario.id);
  if (error) return NextResponse.json({ error: "Não foi possível carregar os eventos." }, { status: 500 });

  const eventos = (data ?? [])
    .map((d) => (Array.isArray(d.eventos) ? d.eventos[0] : d.eventos))
    .filter(Boolean)
    .sort((a, b) => String(a!.data_inicio ?? "").localeCompare(String(b!.data_inicio ?? "")));
  return NextResponse.json({ jurado: { id: usuario.id, nome: usuario.nome }, eventos });
}
