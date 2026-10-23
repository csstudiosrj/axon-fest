import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";

// Equipe do grupo: o(a) diretor(a) convida coreógrafos(as), reenvia o acesso,
// desativa e remove. Só o diretor (org_admin) do próprio grupo chama esta rota.

type Admin = ReturnType<typeof createAdminClient>;
const erro = (mensagem: string, status = 400) => NextResponse.json({ error: mensagem }, { status });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function enviarLink(admin: Admin, email: string, tipo: "invite" | "recovery", grupoNome: string, nome: string | null) {
  const { data, error } = tipo === "invite"
    ? await admin.auth.admin.generateLink({ type: "invite", email, options: { data: { nome } } })
    : await admin.auth.admin.generateLink({ type: "recovery", email });
  if (error || !data.properties?.hashed_token) throw new Error(error?.message ?? "link");
  await enviarEmail({
    para: email,
    assunto: `Acesso ao portal de ${grupoNome} no ARXUM Fest`,
    html: emailComBotao({
      titulo: nome ? `Olá, ${escapeHtml(nome.split(" ")[0])}!` : "Olá!",
      paragrafos: [
        `Você foi adicionado(a) como <strong>coreógrafo(a)</strong> de <strong>${escapeHtml(grupoNome)}</strong> no ARXUM Fest.`,
        "Pelo portal você cadastra suas coreografias, o elenco delas e envia as músicas.",
      ],
      botaoTexto: "Criar senha e entrar",
      botaoUrl: urlAbsoluta(`/auth/confirmar?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=${tipo}&next=/definir-senha`),
      rodape: "Se você não esperava este e-mail, ignore.",
    }),
  });
  return data.user?.id ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const usuario = await getUsuarioAtual();
    if (!usuario) return erro("Não autenticado.", 401);
    if (!["org_admin", "escola_admin"].includes(usuario.role) || !usuario.organizacao_id) return erro("Só o diretor do grupo gerencia a equipe.", 403);
    const grupoId = usuario.organizacao_id;
    const body = (await req.json().catch(() => ({}))) as { acao?: string; nome?: string; email?: string; userId?: string; ativo?: boolean };
    const admin = createAdminClient();
    const { data: grupo } = await admin.from("grupos").select("nome").eq("id", grupoId).maybeSingle();
    const grupoNome = grupo?.nome ?? "seu grupo";

    if (body.acao === "convidar") {
      const nome = (body.nome ?? "").trim().slice(0, 120);
      const email = (body.email ?? "").trim().toLowerCase();
      if (nome.length < 3) return erro("Informe o nome completo.");
      if (!EMAIL.test(email)) return erro("Informe um e-mail válido.");
      const { data: existe } = await admin.from("usuarios").select("id").eq("email", email).maybeSingle();
      if (existe) return erro("Este e-mail já tem uma conta no ARXUM Fest. Use outro e-mail para o acesso de coreógrafo.", 409);
      let userId: string | null = null;
      try {
        userId = await enviarLink(admin, email, "invite", grupoNome, nome);
      } catch (e) {
        const msg = (e as Error).message.toLowerCase();
        return erro(msg.includes("already") ? "Este e-mail já tem uma conta no ARXUM Fest." : "Não foi possível enviar o convite agora.", msg.includes("already") ? 409 : 502);
      }
      if (!userId) return erro("Não foi possível criar o acesso.", 500);
      const { error } = await admin.from("usuarios").insert({ id: userId, email, nome, role: "org_membro", organizacao_id: grupoId, ativo: true });
      if (error) {
        await admin.auth.admin.deleteUser(userId);
        return erro("Não foi possível salvar o acesso.", 500);
      }
      return NextResponse.json({ success: true });
    }

    // Demais ações: um coreógrafo deste grupo
    const { data: alvo } = await admin.from("usuarios").select("id, email, nome, role, organizacao_id").eq("id", body.userId ?? "").maybeSingle();
    if (!alvo || alvo.organizacao_id !== grupoId || alvo.role !== "org_membro") return erro("Pessoa não encontrada na equipe do grupo.", 404);

    if (body.acao === "reenviar") {
      try {
        await enviarLink(admin, alvo.email, "recovery", grupoNome, alvo.nome);
      } catch {
        return erro("Não foi possível enviar o e-mail agora.", 502);
      }
      return NextResponse.json({ success: true });
    }
    if (body.acao === "ativo") {
      const ativo = body.ativo === true;
      await admin.from("usuarios").update({ ativo }).eq("id", alvo.id);
      await admin.auth.admin.updateUserById(alvo.id, { ban_duration: ativo ? "none" : "876000h" });
      return NextResponse.json({ success: true });
    }
    if (body.acao === "remover") {
      // As coreografias que a pessoa cadastrou continuam no grupo (passam a ser do diretor)
      await admin.from("apresentacoes").update({ criado_por: usuario.id }).eq("criado_por", alvo.id);
      await admin.from("participantes").update({ criado_por: usuario.id }).eq("criado_por", alvo.id);
      const { error } = await admin.from("usuarios").delete().eq("id", alvo.id);
      if (error) return erro("Não foi possível remover.", 400);
      await admin.auth.admin.deleteUser(alvo.id);
      return NextResponse.json({ success: true });
    }
    return erro("Ação inválida.");
  } catch (e) {
    console.error("[api/grupo/usuarios]", e);
    return erro("Erro interno do servidor.", 500);
  }
}
