import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { nomeCargo } from "@/lib/auth/cargos";
import { mascaraCpfCnpj, mascaraTelefone } from "@/lib/mascaras";
import { idadeEm } from "@/lib/documentos";

// Listas do Super Admin (telas e planilhas). Sempre com o cliente de serviço:
// só chamar depois de conferir que quem pede é super_admin.

type Admin = ReturnType<typeof createAdminClient>;
const um = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
const LIMITE = 1000;

// Nome de cada produtora (algumas colunas de origem não têm chave estrangeira)
async function nomesProdutoras(admin: Admin) {
  const { data } = await admin.from("produtoras").select("id, nome");
  return new Map((data ?? []).map((p) => [p.id, p.nome]));
}

function filtroTexto(q: string | undefined) {
  const t = (q ?? "").trim().replace(/[%,()]/g, " ").slice(0, 80);
  return t ? `%${t}%` : null;
}

export interface LinhaPessoa {
  id: string; nome: string | null; email: string; cargo: string; cargoNome: string; ativo: boolean;
  onde: string; ultimoAcesso: string | null; criadoEm: string | null;
}

export async function listarPessoas(q?: string, cargo?: string, admin: Admin = createAdminClient()) {
  let consulta = admin.from("usuarios")
    .select("id, nome, email, role, ativo, created_at, produtoras:produtora_id ( nome ), grupos:organizacao_id ( nome )", { count: "exact" })
    .order("created_at", { ascending: false }).limit(LIMITE);
  const f = filtroTexto(q);
  if (f) consulta = consulta.or(`nome.ilike.${f},email.ilike.${f}`);
  if (cargo) consulta = consulta.eq("role", cargo);
  const { data, count } = await consulta;
  // Último acesso vem do Auth (uma página basta para a lista)
  const { data: auth } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const acesso = new Map((auth?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]));
  const linhas: LinhaPessoa[] = (data ?? []).map((u) => ({
    id: u.id, nome: u.nome, email: u.email, cargo: u.role, cargoNome: nomeCargo(u.role), ativo: u.ativo,
    onde: um(u.grupos)?.nome ?? um(u.produtoras)?.nome ?? "—",
    ultimoAcesso: acesso.get(u.id) ?? null, criadoEm: u.created_at ?? null,
  }));
  return { linhas, total: count ?? linhas.length };
}

export interface LinhaGrupo {
  id: string; nome: string; documento: string; responsavel: string | null; email: string; telefone: string;
  cidade: string; origem: string; festivais: number; ativo: boolean; criadoEm: string;
}

export async function listarGrupos(q?: string, admin: Admin = createAdminClient()) {
  let consulta = admin.from("grupos")
    .select("id, nome, documento, responsavel, email, telefone, cidade, estado, ativo, created_at, origem_produtora_id, inscricoes_grupo_evento ( id )", { count: "exact" })
    .order("created_at", { ascending: false }).limit(LIMITE);
  const f = filtroTexto(q);
  const digitos = (q ?? "").replace(/\D/g, "");
  if (f) consulta = consulta.or(`nome.ilike.${f},email.ilike.${f},responsavel.ilike.${f}${digitos.length >= 3 ? `,documento.ilike.%${digitos}%` : ""}`);
  const [{ data, count }, produtoras] = await Promise.all([consulta, nomesProdutoras(admin)]);
  const linhas: LinhaGrupo[] = (data ?? []).map((g) => ({
    id: g.id, nome: g.nome, documento: mascaraCpfCnpj(g.documento), responsavel: g.responsavel, email: g.email,
    telefone: mascaraTelefone(g.telefone), cidade: [g.cidade, g.estado].filter(Boolean).join("/"),
    origem: (g.origem_produtora_id && produtoras.get(g.origem_produtora_id)) || "—", festivais: (g.inscricoes_grupo_evento ?? []).length, ativo: g.ativo, criadoEm: g.created_at,
  }));
  return { linhas, total: count ?? linhas.length };
}

export interface LinhaParticipante {
  id: string; nome: string; cpf: string; idade: number | null; email: string | null;
  origemProdutora: string; origemGrupo: string; grupos: number; termo: boolean; criadoEm: string;
}

export async function listarParticipantes(q?: string, admin: Admin = createAdminClient()) {
  let consulta = admin.from("participantes")
    .select("id, nome, documento, data_nascimento, email_contato, termo_assinado, created_at, origem_produtora_id, grupos:origem_grupo_id ( nome ), grupo_participante ( id )", { count: "exact" })
    .order("created_at", { ascending: false }).limit(LIMITE);
  const f = filtroTexto(q);
  const digitos = (q ?? "").replace(/\D/g, "");
  if (f) consulta = consulta.or(`nome.ilike.${f},email_contato.ilike.${f}${digitos.length >= 3 ? `,documento.ilike.%${digitos}%` : ""}`);
  const [{ data, count }, produtoras] = await Promise.all([consulta, nomesProdutoras(admin)]);
  const linhas: LinhaParticipante[] = (data ?? []).map((p) => ({
    id: p.id, nome: p.nome, cpf: mascaraCpfCnpj(p.documento), idade: idadeEm(p.data_nascimento), email: p.email_contato,
    origemProdutora: (p.origem_produtora_id && produtoras.get(p.origem_produtora_id)) || "—", origemGrupo: um(p.grupos)?.nome ?? "—",
    grupos: (p.grupo_participante ?? []).length, termo: !!p.termo_assinado, criadoEm: p.created_at,
  }));
  return { linhas, total: count ?? linhas.length };
}

export interface LinhaProdutoraSuper {
  id: string; nome: string; documento: string; email: string | null; telefone: string; cidade: string; ativo: boolean;
  demonstracao: boolean; plano: string; planoCatalogo: string | null; proAte: string | null; eventos: number; equipe: number;
  adminId: string | null; criadoEm: string | null;
}

export async function listarProdutoras(q?: string, admin: Admin = createAdminClient()) {
  let consulta = admin.from("produtoras")
    .select("id, nome, documento, email, telefone, cidade, estado, ativo, demonstracao, plano, pro_ate, created_at, planos_catalogo:plano_catalogo_id ( nome ), eventos ( id ), usuarios ( id, role )", { count: "exact" })
    .order("created_at", { ascending: false }).limit(LIMITE);
  const f = filtroTexto(q);
  if (f) consulta = consulta.or(`nome.ilike.${f},email.ilike.${f}`);
  const { data, count } = await consulta;
  const linhas: LinhaProdutoraSuper[] = (data ?? []).map((p) => {
    const equipe = (p.usuarios ?? []).filter((u) => u.role !== "jurado");
    return {
      id: p.id, nome: p.nome, documento: mascaraCpfCnpj(p.documento), email: p.email, telefone: mascaraTelefone(p.telefone),
      cidade: [p.cidade, p.estado].filter(Boolean).join("/"), ativo: p.ativo, demonstracao: p.demonstracao,
      plano: p.plano, planoCatalogo: um(p.planos_catalogo)?.nome ?? null, proAte: p.pro_ate,
      eventos: (p.eventos ?? []).length, equipe: equipe.length, adminId: equipe.find((u) => u.role === "admin")?.id ?? null, criadoEm: p.created_at,
    };
  });
  return { linhas, total: count ?? linhas.length };
}
