import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual, type UsuarioAtual } from "@/lib/auth/session";
import { ROLES_GRUPO, ROLES_PAINEL_ADMIN } from "@/lib/auth/roles";
import { enviarConfirmacaoVinculo } from "@/lib/grupo/vinculo";

// Envia o e-mail de confirmação de vínculo participante ↔ grupo.
// Recebe só o token: destinatário, nome, grupo e função vêm do banco, e quem
// chama precisa ter acesso ao grupo (produtora dona/organizadora ou o próprio grupo).

type Admin = ReturnType<typeof createAdminClient>;


async function podeAcessarGrupo(
  admin: Admin,
  caller: UsuarioAtual,
  grupo: { id: string; origem_produtora_id: string | null }
): Promise<boolean> {
  if (caller.role === "super_admin") return true;
  if (ROLES_GRUPO.includes(caller.role)) return caller.organizacao_id === grupo.id;
  if (!ROLES_PAINEL_ADMIN.includes(caller.role) || !caller.produtora_id) return false;
  if (grupo.origem_produtora_id === caller.produtora_id) return true;

  // Grupo inscrito em algum evento da produtora de quem chama
  const { data: eventos } = await admin.from("eventos").select("id").eq("produtora_id", caller.produtora_id);
  const ids = (eventos ?? []).map((e) => e.id as string);
  if (ids.length === 0) return false;
  const { count } = await admin
    .from("inscricoes_grupo_evento")
    .select("id", { count: "exact", head: true })
    .eq("grupo_id", grupo.id)
    .in("evento_id", ids);
  return (count ?? 0) > 0;
}

export async function POST(request: NextRequest) {
  try {
    const caller = await getUsuarioAtual();
    if (!caller) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { token } = (await request.json()) as { token?: string };
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: vinculo } = await admin
      .from("grupo_participante")
      .select("id, grupo_id, participante_id, funcao, confirmado")
      .eq("token_confirmacao", token)
      .maybeSingle();
    if (!vinculo) return NextResponse.json({ error: "Vínculo não encontrado." }, { status: 404 });
    if (vinculo.confirmado) return NextResponse.json({ success: true, jaConfirmado: true });

    const [{ data: grupo }, { data: participante }] = await Promise.all([
      admin.from("grupos").select("id, nome, origem_produtora_id").eq("id", vinculo.grupo_id).maybeSingle(),
      admin.from("participantes").select("nome, email_contato").eq("id", vinculo.participante_id).maybeSingle(),
    ]);

    if (!grupo || !participante) {
      return NextResponse.json({ error: "Vínculo inconsistente." }, { status: 404 });
    }
    if (!(await podeAcessarGrupo(admin, caller, grupo))) {
      return NextResponse.json({ error: "Sem permissão para este grupo." }, { status: 403 });
    }
    if (!participante.email_contato) {
      return NextResponse.json({ error: "Participante sem e-mail de contato." }, { status: 400 });
    }

    await enviarConfirmacaoVinculo(admin, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/enviar-confirmacao-vinculo]", error);
    return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 });
  }
}
