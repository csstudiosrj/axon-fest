import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { pode } from "@/lib/auth/permissoes";
import { cpfValido, soDigitos } from "@/lib/documentos";
import { limparHtml } from "@/lib/termos-html";
import { documentosDoParticipante, elencoDoEvento, enviarPedidoAssinatura, hashTexto } from "@/lib/assinaturas";

// carregar / assinar: rota pública autorizada só pelo token do link enviado por e-mail.
// pedir: a produção (Termos) ou o diretor do grupo manda os links para quem falta assinar.

type Admin = ReturnType<typeof createAdminClient>;
const erro = (mensagem: string, status = 400) => NextResponse.json({ error: mensagem }, { status });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const normal = (s: string | null | undefined) => (s ?? "").normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();

async function pedidoPorToken(admin: Admin, token: unknown) {
  if (typeof token !== "string" || !UUID.test(token)) return null;
  const { data } = await admin.from("pedidos_assinatura").select("participante_id, evento_id, expira_em").eq("token", token).maybeSingle();
  if (!data || new Date(data.expira_em) < new Date()) return null;
  return data;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const admin = createAdminClient();

  if (body.acao === "carregar" || body.acao === "assinar") {
    const pedido = await pedidoPorToken(admin, body.token);
    if (!pedido) return erro("Link inválido ou vencido. Peça um novo ao grupo ou à produção.", 404);
    const info = await documentosDoParticipante(admin, pedido.participante_id, pedido.evento_id);
    if (!info) return erro("Cadastro não encontrado.", 404);
    const p = info.participante;

    if (body.acao === "carregar") {
      return NextResponse.json({
        participante: { nome: p.nome, menor: info.menor, responsavel_nome: p.responsavel_nome ?? "", responsavel_parentesco: p.responsavel_parentesco ?? "" },
        evento: { nome: info.evento.nome },
        documentos: info.documentos.map((d) => ({ id: d.id, titulo: d.titulo, html: limparHtml(d.conteudo), arquivo: d.arquivo_url, assinaturaId: d.assinaturaId })),
      });
    }

    // ── assinar ──
    const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ").slice(0, 160) : "";
    const cpf = soDigitos(typeof body.cpf === "string" ? body.cpf : "");
    const parentesco = typeof body.parentesco === "string" ? body.parentesco.trim().slice(0, 60) : "";
    if (body.aceite !== true) return erro("Marque que leu e concorda com os documentos.");
    if (!cpfValido(cpf)) return erro("CPF inválido.");
    if (info.menor) {
      if (nome.split(" ").length < 2) return erro("Informe o nome completo do responsável.");
      if (!parentesco) return erro("Informe o parentesco do responsável.");
      if (cpf === soDigitos(p.documento)) return erro("Use o CPF do responsável, não o do menor.");
      if (p.responsavel_cpf && soDigitos(p.responsavel_cpf) !== cpf) return erro("O CPF não confere com o do responsável já registrado neste cadastro.");
    } else {
      if (normal(nome) !== normal(p.nome)) return erro("Digite seu nome completo exatamente como no cadastro.");
      if (soDigitos(p.documento) !== cpf) return erro("O CPF não confere com o do cadastro.");
    }
    const pendentes = info.documentos.filter((d) => !d.assinaturaId);
    if (!pendentes.length) return NextResponse.json({ success: true });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null;
    const { error } = await admin.from("assinaturas_documentos").upsert(pendentes.map((d) => ({
      documento_id: d.id, versao: d.versao, evento_id: pedido.evento_id, participante_id: p.id,
      assinante_nome: nome, assinante_cpf: cpf, assinante_papel: info.menor ? "responsavel" : "participante",
      parentesco: info.menor ? parentesco : null, conteudo_hash: hashTexto(d.conteudo || d.arquivo_url || ""), ip, user_agent: userAgent,
    })), { onConflict: "documento_id,participante_id,versao", ignoreDuplicates: true });
    if (error) {
      console.error("[api/assinaturas]", error);
      return erro("Não foi possível registrar a assinatura agora.", 500);
    }
    if (info.menor && !p.responsavel_cpf) {
      await admin.from("participantes").update({ responsavel_nome: nome, responsavel_cpf: cpf, responsavel_parentesco: parentesco }).eq("id", p.id);
    }
    return NextResponse.json({ success: true });
  }

  if (body.acao === "pedir") {
    const usuario = await getUsuarioAtual();
    if (!usuario) return erro("Não autenticado.", 401);
    const eventoId = typeof body.evento_id === "string" && UUID.test(body.evento_id) ? body.evento_id : null;
    if (!eventoId) return erro("Evento inválido.");
    let grupoId: string | undefined;
    if (["org_admin", "escola_admin"].includes(usuario.role) && usuario.organizacao_id) {
      grupoId = usuario.organizacao_id;
    } else {
      const { data: ev } = await admin.from("eventos").select("produtora_id").eq("id", eventoId).maybeSingle();
      if (!ev || !pode(usuario.role, "termos") || (usuario.role !== "super_admin" && ev.produtora_id !== usuario.produtora_id)) return erro("Sem permissão.", 403);
    }
    const elenco = await elencoDoEvento(admin, eventoId, grupoId);
    const pedidos = Array.isArray(body.participantes) ? elenco.filter((id) => (body.participantes as unknown[]).includes(id)) : elenco;
    let enviados = 0;
    let semEmail = 0;
    for (const pid of pedidos.slice(0, 500)) {
      try {
        if (await enviarPedidoAssinatura(admin, pid, eventoId)) enviados++;
        else {
          const { data } = await admin.from("participantes").select("email_contato").eq("id", pid).maybeSingle();
          if (!data?.email_contato) semEmail++;
        }
      } catch (e) {
        console.error("[api/assinaturas] envio", e);
      }
    }
    return NextResponse.json({ success: true, enviados, semEmail });
  }

  return erro("Ação inválida.");
}
