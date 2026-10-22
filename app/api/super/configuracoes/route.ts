import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { TAG_CONFIGURACOES } from "@/lib/site/configuracoes";
import type { Json } from "@/lib/supabase/database.types";

// Salva um grupo de configurações (precos | contato | empresa). Só super admin.
const ESQUEMA: Record<string, Record<string, "numero" | "numero_ou_nulo" | "texto">> = {
  precos: {
    taxaPercentual: "numero", taxaFixa: "numero", caixaPercentual: "numero", caixaIsencaoAte: "numero",
    mesesStart: "numero", mesesGuarda: "numero", mensalidadePro: "numero_ou_nulo",
  },
  contato: { email: "texto", whatsapp: "texto" },
  empresa: { razaoSocial: "texto", cnpj: "texto", endereco: "texto", foro: "texto", emailPrivacidade: "texto", vigencia: "texto" },
};

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (usuario?.role !== "super_admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { chave?: string; valor?: Record<string, unknown> };
  const esquema = body.chave ? ESQUEMA[body.chave] : undefined;
  if (!esquema || !body.valor) return NextResponse.json({ error: "Configuração inválida." }, { status: 400 });

  const valor: Record<string, unknown> = {};
  for (const [campo, tipo] of Object.entries(esquema)) {
    const v = body.valor[campo];
    if (tipo === "texto") {
      valor[campo] = typeof v === "string" ? v.trim().slice(0, 500) : "";
    } else if (tipo === "numero_ou_nulo" && (v === null || v === "" || v === undefined)) {
      valor[campo] = null;
    } else {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: `Valor inválido em ${campo}.` }, { status: 400 });
      valor[campo] = n;
    }
  }

  const { error } = await createAdminClient().from("configuracoes_sistema").upsert({
    chave: body.chave as string, valor: valor as { [k: string]: Json }, atualizado_em: new Date().toISOString(), atualizado_por: usuario.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag(TAG_CONFIGURACOES, { expire: 0 }); // o site passa a mostrar o valor novo na próxima visita
  return NextResponse.json({ success: true, valor });
}
