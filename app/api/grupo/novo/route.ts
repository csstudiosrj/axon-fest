import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";
import { inscricoesAbertas } from "@/lib/eventos/status";

// Cadastro de grupo NOVO pela página de inscrição do evento, feito todo no
// servidor: conta (ainda não confirmada), grupo, vínculo e inscrição. A pessoa
// recebe pelo Resend o link de confirmação e já cai no portal do grupo.

const JANELA_MS = 60 * 60 * 1000;
const MAX_POR_JANELA = 5;
const tentativas = new Map<string, number[]>();

function limitar(ip: string): boolean {
  const agora = Date.now();
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  tentativas.set(ip, recentes);
  return recentes.length > MAX_POR_JANELA;
}

const campo = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const erro = (mensagem: string, status: number) => NextResponse.json({ error: mensagem }, { status });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  if (limitar(ip)) return erro("Muitas tentativas. Tente novamente mais tarde.", 429);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const eventoId = campo(body.evento_id, 40);
  const email = campo(body.email, 200).toLowerCase();
  const senha = typeof body.senha === "string" ? body.senha : "";
  const nomeGrupo = campo(body.nome, 160);
  const responsavel = campo(body.responsavel, 120);
  const telefone = campo(body.telefone, 30).replace(/\D/g, "");
  const cidade = campo(body.cidade, 100);
  const estado = campo(body.estado, 2).toUpperCase();
  const documento = campo(body.documento, 20).replace(/\D/g, "");
  const tipoDocumento = documento.length === 14 ? "cnpj" : documento.length === 11 ? "cpf" : null;
  const emailContato = campo(body.email_contato, 200).toLowerCase() || null;

  if (!nomeGrupo || !responsavel || !telefone || !cidade || !estado) return erro("Preencha todos os campos obrigatórios.", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("Informe um e-mail válido.", 400);
  if (senha.length < 8) return erro("A senha precisa ter pelo menos 8 caracteres.", 400);
  if (documento && !tipoDocumento) return erro("CPF ou CNPJ inválido.", 400);

  const admin = createAdminClient();
  const { data: evento } = await admin.from("eventos").select("id, nome, status, produtora_id").eq("id", eventoId).maybeSingle();
  if (!evento) return erro("Evento não encontrado.", 404);
  if (!inscricoesAbertas(evento.status)) return erro("As inscrições deste evento não estão abertas.", 409);

  const { data: existente } = await admin.from("usuarios").select("id").eq("email", email).maybeSingle();
  if (existente) return erro("Este e-mail já tem conta. Use a opção de entrar com e-mail e senha.", 409);
  if (documento) {
    const { data: doc } = await admin.from("grupos").select("id").eq("documento", documento).maybeSingle();
    if (doc) return erro("Já existe um grupo com este CPF/CNPJ. Entre com o login do grupo.", 409);
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "signup", email, password: senha, options: { data: { nome: responsavel } },
  });
  if (linkError || !link.user) {
    const jaExiste = linkError?.message?.toLowerCase().includes("already");
    return erro(jaExiste ? "Este e-mail já tem conta. Use a opção de entrar com e-mail e senha." : "Não foi possível criar a conta agora.", jaExiste ? 409 : 400);
  }

  const userId = link.user.id;
  let grupoId: string | null = null;
  const desfazer = async () => {
    await admin.from("usuarios").delete().eq("id", userId);
    if (grupoId) await admin.from("grupos").delete().eq("id", grupoId);
    await admin.auth.admin.deleteUser(userId);
  };

  try {
    const { data: grupo, error: gErr } = await admin.from("grupos").insert({
      nome: nomeGrupo, responsavel, email, email_contato: emailContato, telefone, cidade, estado,
      documento: documento || null, tipo_documento: tipoDocumento, origem_produtora_id: evento.produtora_id,
    }).select("id").single();
    if (gErr || !grupo) throw gErr ?? new Error("grupo");
    grupoId = grupo.id;

    const { error: uErr } = await admin.from("usuarios").insert({
      id: userId, email, nome: responsavel, telefone, role: "org_admin", organizacao_id: grupoId, ativo: true,
    });
    if (uErr) throw uErr;

    const { error: iErr } = await admin.from("inscricoes_grupo_evento").insert({
      grupo_id: grupoId, evento_id: evento.id, status: "ativo", origem: "landing",
    });
    if (iErr) throw iErr;

    const confirmar = urlAbsoluta(
      `/auth/confirmar?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=signup&next=${encodeURIComponent(`/grupo/${evento.id}/inicio`)}`
    );
    await enviarEmail({
      para: email,
      assunto: `Confirme sua inscrição em ${evento.nome}`,
      html: emailComBotao({
        titulo: `Olá, ${escapeHtml(responsavel.split(" ")[0])}!`,
        paragrafos: [
          `Recebemos a inscrição de <strong>${escapeHtml(nomeGrupo)}</strong> em <strong>${escapeHtml(evento.nome)}</strong>.`,
          "Confirme seu e-mail para acessar o portal do grupo e cadastrar elenco e apresentações.",
        ],
        botaoTexto: "Confirmar e-mail",
        botaoUrl: confirmar,
        rodape: "Se você não fez este cadastro, ignore este e-mail.",
      }),
    });
  } catch (e) {
    console.error("[api/grupo/novo]", e);
    await desfazer();
    return erro("Não foi possível concluir o cadastro agora. Tente novamente em instantes.", 500);
  }

  return NextResponse.json({ success: true });
}
