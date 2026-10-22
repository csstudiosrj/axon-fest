import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { equipeDoEvento, getUsuarioAtual } from "@/lib/apuracao/acesso";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";

// A produção inscreve um grupo no evento. Se o grupo já existe (mesmo CPF/CNPJ),
// só cria a inscrição. Senão, cria o grupo e convida o responsável por e-mail
// para criar a senha e cuidar do elenco e das apresentações no portal.

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const eventoId = texto(body.evento_id, 40);
  const admin = createAdminClient();
  if (!(await equipeDoEvento(admin, usuario, eventoId))) return NextResponse.json({ error: "Sem permissão para este evento." }, { status: 403 });

  const documento = texto(body.documento, 20).replace(/\D/g, "");
  if (documento.length !== 11 && documento.length !== 14) return NextResponse.json({ error: "Informe um CPF ou CNPJ válido." }, { status: 400 });

  const { data: evento } = await admin.from("eventos").select("id, nome, produtora_id").eq("id", eventoId).single();
  const { data: existente } = await admin.from("grupos").select("id, nome").eq("documento", documento).maybeSingle();

  let grupoId = existente?.id ?? null;
  let convidado = false;
  if (!grupoId) {
    const nome = texto(body.nome, 160);
    const responsavel = texto(body.responsavel, 120);
    const email = texto(body.email, 200).toLowerCase();
    if (!nome || !responsavel) return NextResponse.json({ error: "Informe o nome do grupo e do responsável." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Informe o e-mail do responsável." }, { status: 400 });
    const { data: conta } = await admin.from("usuarios").select("id").eq("email", email).maybeSingle();
    if (conta) return NextResponse.json({ error: "Este e-mail já tem conta no ARXUM Fest. Use outro e-mail ou peça ao grupo para se inscrever pelo link." }, { status: 409 });

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "invite", email, options: { data: { nome: responsavel } } });
    if (linkErr || !link.user) return NextResponse.json({ error: "Não foi possível criar o acesso do grupo." }, { status: 400 });
    const { data: grupo, error: gErr } = await admin.from("grupos").insert({
      nome, responsavel, email, documento, tipo_documento: documento.length === 14 ? "cnpj" : "cpf",
      telefone: texto(body.telefone, 20).replace(/\D/g, "") || null, cidade: texto(body.cidade, 100) || null,
      estado: texto(body.estado, 2).toUpperCase() || null, origem_produtora_id: evento!.produtora_id,
    }).select("id").single();
    if (gErr || !grupo) {
      await admin.auth.admin.deleteUser(link.user.id);
      return NextResponse.json({ error: "Não foi possível cadastrar o grupo." }, { status: 500 });
    }
    grupoId = grupo.id;
    await admin.from("usuarios").insert({ id: link.user.id, email, nome: responsavel, role: "org_admin", organizacao_id: grupoId, ativo: true });
    try {
      await enviarEmail({
        para: email,
        assunto: `Sua inscrição em ${evento!.nome}`,
        html: emailComBotao({
          titulo: `Olá, ${escapeHtml(responsavel.split(" ")[0])}!`,
          paragrafos: [
            `A produção de <strong>${escapeHtml(evento!.nome)}</strong> inscreveu <strong>${escapeHtml(nome)}</strong> no festival.`,
            "Crie sua senha para acessar o portal do grupo e cadastrar elenco, apresentações e arquivos.",
          ],
          botaoTexto: "Criar senha e acessar",
          botaoUrl: urlAbsoluta(`/auth/confirmar?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=invite&next=/definir-senha`),
        }),
      });
      convidado = true;
    } catch (e) {
      console.error("[api/eventos/inscrever-grupo] e-mail", e);
    }
  }

  const { error } = await admin.from("inscricoes_grupo_evento").upsert(
    { grupo_id: grupoId!, evento_id: eventoId, status: "ativo", origem: "producao" },
    { onConflict: "grupo_id,evento_id", ignoreDuplicates: true }
  );
  if (error) return NextResponse.json({ error: "Não foi possível registrar a inscrição." }, { status: 500 });
  return NextResponse.json({ success: true, existente: !!existente, nome: existente?.nome ?? null, convidado });
}
