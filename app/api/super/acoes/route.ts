import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { inicioDe } from "@/lib/auth/permissoes";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";
import { registrar } from "@/lib/super/registro";

// Ações do super admin sobre contas, produtoras e grupos. Tudo fica registrado.
type Admin = ReturnType<typeof createAdminClient>;
const erro = (mensagem: string, status = 400) => NextResponse.json({ error: mensagem }, { status });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID = /^[0-9a-f-]{36}$/i;

async function bloquearUsuarios(admin: Admin, ids: string[], ativo: boolean) {
  for (const id of ids) await admin.auth.admin.updateUserById(id, { ban_duration: ativo ? "none" : "876000h" });
}

export async function POST(req: NextRequest) {
  try {
    const eu = await getUsuarioAtual();
    if (eu?.role !== "super_admin") return erro("Não autorizado.", 403);
    const body = (await req.json().catch(() => ({}))) as { acao?: string; id?: string; ativo?: boolean; email?: string };
    if (!body.id || !UUID.test(body.id)) return erro("Registro inválido.");
    const admin = createAdminClient();

    // ── Produtora: bloquear / desbloquear (equipe inteira perde o acesso; páginas saem do ar)
    if (body.acao === "bloquear_produtora") {
      const ativo = body.ativo === true;
      const { data: p } = await admin.from("produtoras").update({ ativo }).eq("id", body.id).select("nome").single();
      if (!p) return erro("Produtora não encontrada.", 404);
      const { data: equipe } = await admin.from("usuarios").select("id").eq("produtora_id", body.id).not("role", "in", "(jurado,super_admin)");
      await bloquearUsuarios(admin, (equipe ?? []).map((u) => u.id), ativo);
      await registrar(admin, eu.id, ativo ? "Desbloqueou produtora" : "Bloqueou produtora", { tipo: "produtora", id: body.id, nome: p.nome });
      return NextResponse.json({ success: true });
    }

    // ── Grupo: bloquear / desbloquear
    if (body.acao === "bloquear_grupo") {
      const ativo = body.ativo === true;
      const { data: g } = await admin.from("grupos").update({ ativo }).eq("id", body.id).select("nome").single();
      if (!g) return erro("Grupo não encontrado.", 404);
      const { data: contas } = await admin.from("usuarios").select("id").eq("organizacao_id", body.id);
      await bloquearUsuarios(admin, (contas ?? []).map((u) => u.id), ativo);
      await registrar(admin, eu.id, ativo ? "Desbloqueou grupo" : "Bloqueou grupo", { tipo: "grupo", id: body.id, nome: g.nome });
      return NextResponse.json({ success: true });
    }

    // Demais ações: uma conta
    const { data: alvo } = await admin.from("usuarios").select("id, nome, email, role, organizacao_id").eq("id", body.id).maybeSingle();
    if (!alvo) return erro("Conta não encontrada.", 404);
    if (alvo.id === eu.id && body.acao !== "trocar_email") return erro("Use o seu próprio perfil para isso.");
    const nomeAlvo = alvo.nome ?? alvo.email;

    if (body.acao === "bloquear_usuario") {
      const ativo = body.ativo === true;
      await admin.from("usuarios").update({ ativo }).eq("id", alvo.id);
      await bloquearUsuarios(admin, [alvo.id], ativo);
      await registrar(admin, eu.id, ativo ? "Desbloqueou conta" : "Bloqueou conta", { tipo: "pessoa", id: alvo.id, nome: nomeAlvo });
      return NextResponse.json({ success: true });
    }

    if (body.acao === "trocar_email") {
      const novo = (body.email ?? "").trim().toLowerCase();
      if (!EMAIL.test(novo)) return erro("E-mail inválido.");
      const { data: ja } = await admin.from("usuarios").select("id").eq("email", novo).maybeSingle();
      if (ja && ja.id !== alvo.id) return erro("Este e-mail já é de outra conta.", 409);
      const { error } = await admin.auth.admin.updateUserById(alvo.id, { email: novo, email_confirm: true });
      if (error) return erro(error.message);
      await admin.from("usuarios").update({ email: novo }).eq("id", alvo.id);
      // e-mail de acesso do grupo acompanha o do responsável
      if (alvo.organizacao_id) await admin.from("grupos").update({ email: novo }).eq("id", alvo.organizacao_id).eq("email", alvo.email);
      await registrar(admin, eu.id, "Trocou e-mail", { tipo: "pessoa", id: alvo.id, nome: nomeAlvo }, { de: alvo.email, para: novo });
      return NextResponse.json({ success: true });
    }

    if (body.acao === "reenviar_acesso") {
      const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email: alvo.email });
      if (error || !link.properties?.hashed_token) return erro("Não foi possível gerar o link.");
      await enviarEmail({
        para: alvo.email,
        assunto: "Seu acesso ao ARXUM Fest",
        html: emailComBotao({
          titulo: alvo.nome ? `Olá, ${escapeHtml(alvo.nome.split(" ")[0])}!` : "Olá!",
          paragrafos: ["Este é o seu link para criar uma nova senha e acessar o <strong>ARXUM Fest</strong>.", "O link vale por 1 hora."],
          botaoTexto: "Criar senha e entrar",
          botaoUrl: urlAbsoluta(`/auth/confirmar?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=recovery&next=/definir-senha`),
        }),
      });
      await registrar(admin, eu.id, "Reenviou acesso", { tipo: "pessoa", id: alvo.id, nome: nomeAlvo });
      return NextResponse.json({ success: true });
    }

    // ── Entrar como: link de uso único para abrir numa janela anônima (suporte)
    if (body.acao === "entrar_como") {
      if (alvo.role === "super_admin") return erro("Não é possível entrar como outro super admin.");
      const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: alvo.email });
      if (error || !link.properties?.hashed_token) return erro("Não foi possível gerar o acesso.");
      await registrar(admin, eu.id, "Entrou como", { tipo: "pessoa", id: alvo.id, nome: nomeAlvo });
      return NextResponse.json({
        success: true,
        link: urlAbsoluta(`/auth/confirmar?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=magiclink&next=${encodeURIComponent(inicioDe(alvo.role))}`),
      });
    }

    return erro("Ação inválida.");
  } catch (e) {
    console.error("[api/super/acoes]", e);
    return erro("Erro interno do servidor.", 500);
  }
}
