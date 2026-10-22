import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { ROLES_OPERADOR } from "@/lib/auth/roles";

// Tudo o que o caixa precisa para vender sem internet: produtos ativos, eventos
// da produtora e dados do PIX (sem o PIN, que nunca sai do servidor).
export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario || !ROLES_OPERADOR.includes(usuario.role)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!usuario.produtora_id) return NextResponse.json({ error: "Usuário sem produtora vinculada." }, { status: 403 });

  const admin = createAdminClient();
  const pid = usuario.produtora_id;
  const [{ data: produtora }, { data: config }, { data: produtos }, { data: eventos }] = await Promise.all([
    admin.from("produtoras").select("nome").eq("id", pid).maybeSingle(),
    admin.from("pdv_config").select("pix_chave, pix_nome, pix_cidade").eq("produtora_id", pid).maybeSingle(),
    admin.from("pdv_produtos").select("id, nome, preco, categoria, tipo, ordem").eq("produtora_id", pid).eq("ativo", true)
      .order("ordem", { nullsFirst: false }).order("nome"),
    admin.from("eventos").select("id, nome, data_inicio, status").eq("produtora_id", pid)
      .not("status", "in", "(finalizado,cancelado)").order("data_inicio", { ascending: true, nullsFirst: false }),
  ]);

  return NextResponse.json(
    {
      usuario: { id: usuario.id, nome: usuario.nome ?? usuario.email },
      produtora: { id: pid, nome: produtora?.nome ?? "" },
      pix: config?.pix_chave && config.pix_nome && config.pix_cidade
        ? { chave: config.pix_chave, nome: config.pix_nome, cidade: config.pix_cidade }
        : null,
      produtos: (produtos ?? []).map((p) => ({
        id: p.id, nome: p.nome, preco: Number(p.preco), categoria: p.categoria ?? "Outros", tipo: p.tipo as "cantina" | "bilheteria",
      })),
      eventos: (eventos ?? []).map((e) => ({ id: e.id, nome: e.nome, data_inicio: e.data_inicio })),
      baixado_em: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
