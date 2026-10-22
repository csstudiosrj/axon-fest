import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ROLES_GRUPO } from "@/lib/auth/roles";

// ─────────────────────────────────────────────────────────────────────────────
// Cadastro de grupo/escola e inscrição em evento, feito no servidor.
// Antes o navegador gravava usuarios.role/organizacao_id direto, o que permitia
// alguém se vincular ao grupo de outra pessoa. Aqui:
//   • o usuário precisa estar logado (conta recém-criada/confirmada);
//   • o cargo é sempre org_admin e o grupo vinculado é sempre o criado agora
//     (ou o que a conta já possui);
//   • o evento da inscrição precisa existir.
// ─────────────────────────────────────────────────────────────────────────────

interface Corpo {
  nome_usuario?: string;
  grupo?: {
    nome?: string;
    documento?: string;
    tipo_documento?: string;
    email_contato?: string | null;
    responsavel?: string;
    telefone?: string;
    cidade?: string;
    estado?: string;
  } | null;
  evento_id?: string | null;
}

function texto(valor: unknown, max = 200): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim();
  return t ? t.slice(0, max) : null;
}

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return erro("Não autenticado.", 401);

    const body = (await req.json()) as Corpo;
    const admin = createAdminClient();

    const { data: existente } = await admin
      .from("usuarios")
      .select("id, role, organizacao_id")
      .eq("id", user.id)
      .maybeSingle();

    if (existente && !ROLES_GRUPO.includes(existente.role)) {
      return erro("Esta conta não é de um grupo participante.", 409);
    }

    let evento: { id: string; produtora_id?: string | null } | null = null;
    if (body.evento_id) {
      const { data } = await admin.from("eventos").select("*").eq("id", body.evento_id).maybeSingle();
      if (!data) return erro("Evento não encontrado.", 404);
      evento = data as { id: string; produtora_id?: string | null };
    }

    let grupoId: string | null = existente?.organizacao_id ?? null;

    // Cria o grupo somente se a conta ainda não tiver um
    if (!grupoId && body.grupo) {
      const g = body.grupo;
      const nome = texto(g.nome);
      const responsavel = texto(g.responsavel);
      if (!nome || !responsavel) return erro("Nome do grupo e responsável são obrigatórios.", 400);

      const { data: grupo, error: grupoError } = await admin
        .from("grupos")
        .insert({
          nome,
          documento: texto(g.documento, 20)?.replace(/\D/g, "") || null,
          tipo_documento: texto(g.tipo_documento, 10),
          email: user.email,
          email_contato: texto(g.email_contato, 320),
          responsavel,
          telefone: texto(g.telefone, 20)?.replace(/\D/g, "") || null,
          cidade: texto(g.cidade, 100),
          estado: texto(g.estado, 2),
          ...(evento?.produtora_id ? { origem_produtora_id: evento.produtora_id } : {}),
        })
        .select("id")
        .single();

      if (grupoError || !grupo) {
        console.error("[api/grupo/cadastro] grupo", grupoError);
        return erro("Não foi possível salvar o grupo.", 500);
      }
      grupoId = grupo.id as string;
    }

    if (!existente) {
      const { error: usuarioError } = await admin.from("usuarios").insert({
        id: user.id,
        email: user.email,
        nome: texto(body.nome_usuario) ?? texto(body.grupo?.responsavel) ?? texto(user.user_metadata?.nome),
        role: "org_admin",
        organizacao_id: grupoId,
        ativo: true,
      });
      if (usuarioError) {
        console.error("[api/grupo/cadastro] usuario", usuarioError);
        return erro("Não foi possível vincular o usuário ao grupo.", 500);
      }
    } else if (!existente.organizacao_id && grupoId) {
      await admin.from("usuarios").update({ organizacao_id: grupoId }).eq("id", user.id);
    }

    if (evento) {
      if (!grupoId) return erro("Sua conta não está vinculada a nenhum grupo.", 400);
      const { error: inscricaoError } = await admin
        .from("inscricoes_grupo_evento")
        .upsert(
          { grupo_id: grupoId, evento_id: evento.id, status: "ativo", origem: "landing" },
          { onConflict: "grupo_id,evento_id" }
        );
      if (inscricaoError) {
        console.error("[api/grupo/cadastro] inscricao", inscricaoError);
        return erro("Não foi possível registrar a inscrição.", 500);
      }
    }

    return NextResponse.json({ success: true, grupo_id: grupoId });
  } catch (err) {
    console.error("[api/grupo/cadastro]", err);
    return erro("Erro interno do servidor.", 500);
  }
}
