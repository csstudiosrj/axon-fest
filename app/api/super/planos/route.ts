import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { TAG_CATALOGO } from "@/lib/site/configuracoes";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { registrar } from "@/lib/super/registro";
import type { TablesInsert } from "@/lib/supabase/database.types";

// Catálogo de planos e pacotes exibido em /precos (só o super admin altera)
const erro = (mensagem: string, status = 400) => NextResponse.json({ error: mensagem }, { status });
const t = (v: unknown, max = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export async function POST(req: NextRequest) {
  const eu = await getUsuarioAtual();
  if (eu?.role !== "super_admin") return erro("Não autorizado.", 403);
  const body = (await req.json().catch(() => ({}))) as { acao?: string; id?: string; plano?: Record<string, unknown> };
  const admin = createAdminClient();

  if (body.acao === "excluir") {
    const { data: p } = await admin.from("planos_catalogo").select("nome, codigo").eq("id", body.id ?? "").maybeSingle();
    if (!p) return erro("Plano não encontrado.", 404);
    if (p.codigo) return erro("Start e Pro controlam o acesso das produtoras: desative em vez de excluir.");
    await admin.from("planos_catalogo").delete().eq("id", body.id!);
    await registrar(admin, eu.id, "Excluiu plano/pacote", { tipo: "plano", id: body.id, nome: p.nome });
    revalidateTag(TAG_CATALOGO, { expire: 0 });
    return NextResponse.json({ success: true });
  }

  if (body.acao === "salvar") {
    const p = body.plano ?? {};
    const nome = t(p.nome, 80);
    if (!nome) return erro("Informe o nome.");
    const tipo = p.tipo === "pacote" ? "pacote" : "plano";
    const periodo = ["mensal", "anual", "unico", "gratis"].includes(String(p.periodo)) ? String(p.periodo) : "mensal";
    const preco = p.preco === null || p.preco === "" || p.preco === undefined ? null : Number(p.preco);
    if (preco !== null && (!Number.isFinite(preco) || preco < 0)) return erro("Preço inválido.");
    const itens = Array.isArray(p.itens) ? (p.itens as unknown[]).map((i) => t(i, 200)).filter((i): i is string => !!i).slice(0, 15) : [];
    const link = t(p.cta_link, 200);
    if (link && !link.startsWith("/") && !/^https:\/\//.test(link)) return erro("O link do botão deve começar com / ou https://");
    const dados: TablesInsert<"planos_catalogo"> = {
      nome, tipo, periodo, preco: periodo === "gratis" ? 0 : preco, descricao: t(p.descricao), detalhe: t(p.detalhe, 80), itens,
      nota: t(p.nota, 400), cta_texto: t(p.cta_texto, 40), cta_link: link, destaque: p.destaque === true, ativo: p.ativo !== false,
      ordem: Number.isFinite(Number(p.ordem)) ? Number(p.ordem) : 0, atualizado_em: new Date().toISOString(),
    };
    const id = typeof body.id === "string" && body.id ? body.id : null;
    const { error } = id
      ? await admin.from("planos_catalogo").update(dados).eq("id", id)
      : await admin.from("planos_catalogo").insert(dados);
    if (error) return erro(error.message);
    await registrar(admin, eu.id, id ? "Alterou plano/pacote" : "Criou plano/pacote", { tipo: "plano", id, nome });
    revalidateTag(TAG_CATALOGO, { expire: 0 });
    return NextResponse.json({ success: true });
  }

  return erro("Ação inválida.");
}
