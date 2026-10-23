import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { pode } from "@/lib/auth/permissoes";
import { cpfValido, soDigitos } from "@/lib/documentos";
import { novoCodigo } from "@/lib/certificados";

// modelo: a produção salva o modelo de certificado do evento (e libera ou não).
// buscar: rota pública; a pessoa informa CPF e data de nascimento e recebe os
// certificados das apresentações em que fez check-in (eventos com certificado liberado).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const erro = (mensagem: string, status = 400) => NextResponse.json({ error: mensagem }, { status });
const COR = /^#[0-9a-f]{6}$/i;

const JANELA_MS = 15 * 60 * 1000;
const tentativas = new Map<string, number[]>();
function limitar(ip: string) {
  const agora = Date.now();
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  tentativas.set(ip, recentes);
  return recentes.length > 20;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const admin = createAdminClient();

  if (body.acao === "modelo") {
    const usuario = await getUsuarioAtual();
    if (!usuario) return erro("Não autenticado.", 401);
    if (usuario.role !== "super_admin" && !pode(usuario.role, "checkin")) return erro("Sem permissão.", 403);
    const eventoId = typeof body.evento_id === "string" && UUID.test(body.evento_id) ? body.evento_id : null;
    if (!eventoId) return erro("Evento inválido.");
    const { data: ev } = await admin.from("eventos").select("produtora_id").eq("id", eventoId).maybeSingle();
    if (!ev || (usuario.role !== "super_admin" && ev.produtora_id !== usuario.produtora_id)) return erro("Evento não encontrado.", 404);
    const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const titulo = txt(body.titulo, 80);
    const texto = txt(body.texto, 1200);
    if (!titulo || !texto) return erro("Preencha o título e o texto do certificado.");
    const fundo = txt(body.fundo_url, 500);
    const assinaturas = (Array.isArray(body.assinaturas) ? body.assinaturas : [])
      .map((a) => ({ nome: txt((a as { nome?: unknown })?.nome, 80), cargo: txt((a as { cargo?: unknown })?.cargo, 80) }))
      .filter((a) => a.nome).slice(0, 3);
    const { error } = await admin.from("certificado_modelos").upsert({
      evento_id: eventoId, titulo, texto, cor: COR.test(String(body.cor)) ? String(body.cor) : "#C5A059",
      fundo_url: /^https:\/\//.test(fundo) ? fundo : null, assinaturas, liberado: body.liberado === true, atualizado_em: new Date().toISOString(),
    }, { onConflict: "evento_id" });
    if (error) {
      console.error("[api/certificados] modelo", error);
      return erro("Não foi possível salvar.", 500);
    }
    return NextResponse.json({ success: true });
  }

  if (body.acao === "buscar") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (limitar(ip)) return erro("Muitas tentativas. Tente de novo em alguns minutos.", 429);
    const cpf = soDigitos(typeof body.cpf === "string" ? body.cpf : "");
    const nascimento = typeof body.nascimento === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.nascimento) ? body.nascimento : null;
    if (!cpfValido(cpf) || !nascimento) return erro("Informe o CPF e a data de nascimento.");
    const { data: pessoas } = await admin.from("participantes").select("id").eq("documento", cpf).eq("data_nascimento", nascimento);
    const ids = (pessoas ?? []).map((p) => p.id);
    const vazio = NextResponse.json({ certificados: [] });
    if (!ids.length) return vazio;

    const { data: feitos } = await admin.from("checkins")
      .select("apresentacao_id, participante_id, evento_id, apresentacoes ( nome ), eventos ( nome, data_inicio )")
      .in("participante_id", ids);
    if (!feitos?.length) return vazio;
    const { data: modelos } = await admin.from("certificado_modelos").select("evento_id").eq("liberado", true)
      .in("evento_id", [...new Set(feitos.map((f) => f.evento_id))]);
    const liberados = new Set((modelos ?? []).map((m) => m.evento_id));
    const validos = feitos.filter((f) => liberados.has(f.evento_id));
    if (!validos.length) return vazio;

    const { data: existentes } = await admin.from("certificados").select("codigo, apresentacao_id, participante_id")
      .in("participante_id", ids).in("apresentacao_id", validos.map((v) => v.apresentacao_id));
    const um = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] ?? null : v);
    const lista: { codigo: string; evento: string; apresentacao: string; data: string | null }[] = [];
    for (const v of validos) {
      let codigo = existentes?.find((e) => e.apresentacao_id === v.apresentacao_id && e.participante_id === v.participante_id)?.codigo;
      for (let t = 0; !codigo && t < 4; t++) {
        const tentativa = novoCodigo();
        const { error } = await admin.from("certificados").insert({ codigo: tentativa, evento_id: v.evento_id, apresentacao_id: v.apresentacao_id, participante_id: v.participante_id });
        if (!error) codigo = tentativa;
      }
      if (codigo) lista.push({ codigo, evento: um(v.eventos)?.nome ?? "", apresentacao: um(v.apresentacoes)?.nome ?? "", data: um(v.eventos)?.data_inicio ?? null });
    }
    lista.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
    return NextResponse.json({ certificados: lista });
  }

  return erro("Ação inválida.");
}
