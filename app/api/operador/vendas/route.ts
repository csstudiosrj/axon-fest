import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { ROLES_OPERADOR } from "@/lib/auth/roles";
import { setoresPdv } from "@/lib/auth/permissoes";

// Recebe as vendas guardadas no aparelho do caixa. Pode ser chamada várias
// vezes com as mesmas vendas (ex.: a internet caiu no meio do envio): cada
// item tem id próprio e o que já existe é ignorado.

interface ItemVenda {
  id: string;
  venda_id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  forma_pagamento: string;
  evento_id: string | null;
  created_at: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORMAS = new Set(["dinheiro", "pix", "cartao"]);

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario || !ROLES_OPERADOR.includes(usuario.role)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!usuario.produtora_id) return NextResponse.json({ error: "Usuário sem produtora vinculada." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { itens?: ItemVenda[] };
  const itens = Array.isArray(body.itens) ? body.itens.slice(0, 1000) : [];
  if (!itens.length) return NextResponse.json({ aceitos: [] });

  const admin = createAdminClient();
  const pid = usuario.produtora_id;
  const [{ data: produtos }, { data: eventos }] = await Promise.all([
    // Operador de caixa não registra ingresso e vice-versa
    admin.from("pdv_produtos").select("id").eq("produtora_id", pid)
      .in("tipo", setoresPdv(usuario.role, usuario.setor_pdv).map((s) => (s === "caixa" ? "cantina" : "bilheteria"))),
    admin.from("eventos").select("id").eq("produtora_id", pid),
  ]);
  const meusProdutos = new Set((produtos ?? []).map((p) => p.id));
  const meusEventos = new Set((eventos ?? []).map((e) => e.id));

  const validos = itens.filter((i) =>
    UUID.test(i.id) && UUID.test(i.venda_id) && meusProdutos.has(i.produto_id) &&
    (i.evento_id === null || meusEventos.has(i.evento_id)) &&
    Number.isInteger(i.quantidade) && i.quantidade > 0 && i.quantidade <= 999 &&
    Number.isFinite(i.preco_unitario) && i.preco_unitario >= 0 && i.preco_unitario <= 100000 &&
    FORMAS.has(i.forma_pagamento) && !Number.isNaN(Date.parse(i.created_at))
  );

  if (validos.length) {
    const { error } = await admin.from("pdv_vendas").upsert(
      validos.map((i) => ({
        id: i.id,
        venda_id: i.venda_id,
        produtora_id: pid,
        evento_id: i.evento_id,
        produto_id: i.produto_id,
        produto_nome: String(i.produto_nome).slice(0, 160),
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        total: Math.round(i.quantidade * i.preco_unitario * 100) / 100,
        forma_pagamento: i.forma_pagamento,
        operador_id: usuario.id,
        operador_nome: usuario.nome ?? usuario.email,
        sincronizado: true,
        itens: [],
        created_at: new Date(Math.min(Date.parse(i.created_at), Date.now())).toISOString(),
      })),
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (error) {
      console.error("[api/operador/vendas]", error);
      return NextResponse.json({ error: "Não foi possível registrar as vendas agora." }, { status: 500 });
    }
  }

  // Itens recusados (produto apagado, evento de outra produtora…) também saem
  // da fila do aparelho, para não travar o envio das próximas vendas
  return NextResponse.json({ aceitos: validos.map((i) => i.id), recusados: itens.filter((i) => !validos.includes(i)).map((i) => i.id) });
}
