import { NextRequest, NextResponse } from "next/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { listarGrupos, listarParticipantes, listarPessoas, listarProdutoras } from "@/lib/super/dados";
import { createAdminClient } from "@/lib/supabase/server";
import { registrar } from "@/lib/super/registro";

// Planilha (CSV, abre no Excel) das listas do super admin, com a origem de cada um
const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "");

export async function GET(req: NextRequest) {
  const eu = await getUsuarioAtual();
  if (eu?.role !== "super_admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const tipo = req.nextUrl.searchParams.get("tipo");
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  let linhas: (string | number)[][] = [];

  if (tipo === "produtoras") {
    const { linhas: l } = await listarProdutoras(q);
    linhas = [["Produtora", "CPF/CNPJ", "E-mail", "Telefone", "Cidade", "Plano", "Pro até", "Eventos", "Equipe", "Situação", "Criada em"],
      ...l.map((p) => [p.nome, p.documento, p.email ?? "", p.telefone, p.cidade, p.planoCatalogo ?? p.plano, data(p.proAte), p.eventos, p.equipe, p.ativo ? "Ativa" : "Bloqueada", data(p.criadoEm)])];
  } else if (tipo === "pessoas") {
    const { linhas: l } = await listarPessoas(q, req.nextUrl.searchParams.get("cargo") ?? undefined);
    linhas = [["Nome", "E-mail", "Cargo", "Produtora/Grupo", "Situação", "Último acesso", "Criada em"],
      ...l.map((p) => [p.nome ?? "", p.email, p.cargoNome, p.onde, p.ativo ? "Ativa" : "Bloqueada", data(p.ultimoAcesso), data(p.criadoEm)])];
  } else if (tipo === "grupos") {
    const { linhas: l } = await listarGrupos(q);
    linhas = [["Grupo", "CPF/CNPJ", "Responsável", "E-mail", "Telefone", "Cidade", "Chegou pela produtora", "Festivais", "Situação", "Criado em"],
      ...l.map((g) => [g.nome, g.documento, g.responsavel ?? "", g.email, g.telefone, g.cidade, g.origem, g.festivais, g.ativo ? "Ativo" : "Bloqueado", data(g.criadoEm)])];
  } else if (tipo === "participantes") {
    const { linhas: l } = await listarParticipantes(q);
    linhas = [["Nome", "CPF", "Idade", "E-mail", "Chegou pela produtora", "Chegou pelo grupo", "Grupos", "Termo assinado", "Cadastrado em"],
      ...l.map((p) => [p.nome, p.cpf, p.idade ?? "", p.email ?? "", p.origemProdutora, p.origemGrupo, p.grupos, p.termo ? "Sim" : "Não", data(p.criadoEm)])];
  } else {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }

  await registrar(createAdminClient(), eu.id, "Exportou planilha", { tipo: tipo! }, { linhas: linhas.length - 1, busca: q ?? null });
  const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="arxum_${tipo}_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
