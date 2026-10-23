import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { inscricoesAbertas } from "@/lib/eventos/status";
import { lerOcupacao, situacaoVagas } from "@/lib/eventos/vagas";

// ─────────────────────────────────────────────────────────────────────────────
// Grupo já cadastrado no ARXUM Fest se inscreve num festival pela página
// pública: precisa estar logado como responsável do grupo e dar o aceite.
// O vínculo grupo ↔ festival só nasce aqui (a produtora não inscreve grupos).
// ─────────────────────────────────────────────────────────────────────────────

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return erro("Entre com o login do grupo para continuar.", 401);

    const body = (await req.json().catch(() => ({}))) as { evento_id?: string; aceite?: boolean };
    if (body.aceite !== true) return erro("É preciso aceitar o regulamento para se inscrever.", 400);

    const admin = createAdminClient();
    const { data: usuario } = await admin.from("usuarios").select("role, organizacao_id, ativo").eq("id", user.id).maybeSingle();
    if (!usuario?.organizacao_id || !usuario.ativo) return erro("Esta conta não é de um grupo participante.", 403);
    if (!["org_admin", "escola_admin"].includes(usuario.role)) return erro("Só o responsável pelo grupo confirma a inscrição em um festival.", 403);

    const { data: evento } = await admin.from("eventos").select("id, status, vagas_total").eq("id", body.evento_id ?? "").maybeSingle();
    if (!evento) return erro("Festival não encontrado.", 404);
    if (!inscricoesAbertas(evento.status)) return erro("As inscrições deste festival não estão abertas.", 409);

    const { data: jaInscrito } = await admin.from("inscricoes_grupo_evento").select("id").eq("grupo_id", usuario.organizacao_id).eq("evento_id", evento.id).maybeSingle();
    if (!jaInscrito) {
      const [{ data: cats }, { data: ocup }] = await Promise.all([
        admin.from("categorias").select("id, categoria_pai_id, vagas").eq("evento_id", evento.id),
        admin.rpc("ocupacao_evento", { p_evento: evento.id }),
      ]);
      if (situacaoVagas(cats ?? [], lerOcupacao(ocup), evento.vagas_total).esgotado) return erro("As vagas deste festival estão esgotadas.", 409);
    }

    const { error } = await admin.from("inscricoes_grupo_evento").upsert({
      grupo_id: usuario.organizacao_id, evento_id: evento.id, status: "ativo", origem: "landing",
      aceite_em: new Date().toISOString(), aceite_ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    }, { onConflict: "grupo_id,evento_id" });
    if (error) {
      console.error("[api/grupo/cadastro]", error);
      return erro("Não foi possível registrar a inscrição.", 500);
    }
    return NextResponse.json({ success: true, grupo_id: usuario.organizacao_id });
  } catch (err) {
    console.error("[api/grupo/cadastro]", err);
    return erro("Erro interno do servidor.", 500);
  }
}
