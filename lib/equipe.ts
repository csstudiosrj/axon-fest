import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

// Pessoas da produtora (equipe, operadores e jurados) com a situação do acesso

export interface Membro {
  id: string;
  nome: string | null;
  email: string;
  role: string;
  setor_pdv: string | null;
  ativo: boolean;
  pendente: boolean;   // ainda não criou a senha / nunca entrou
  telefone: string | null;
  foto_url: string | null;
  especialidade: string | null;
  mini_bio: string | null;
  ultimoAcesso: string | null;
}

const PAPEIS_EQUIPE = ["admin", "produtor", "financeiro", "marketing", "assistente", "operador", "jurado", "produtora_admin", "produtora_staff"];

export async function carregarEquipe(produtoraId: string, papeis = PAPEIS_EQUIPE): Promise<Membro[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("usuarios")
    .select("id, nome, email, role, setor_pdv, ativo, telefone, foto_url, especialidade, mini_bio")
    .eq("produtora_id", produtoraId).in("role", papeis).order("nome");
  const lista = data ?? [];
  const contas = await Promise.all(lista.map((u) => admin.auth.admin.getUserById(u.id).then((r) => r.data.user).catch(() => null)));
  return lista.map((u, i) => ({
    id: u.id, nome: u.nome, email: u.email, role: u.role, setor_pdv: u.setor_pdv, ativo: u.ativo,
    pendente: !contas[i]?.last_sign_in_at,
    telefone: u.telefone, foto_url: u.foto_url, especialidade: u.especialidade, mini_bio: u.mini_bio,
    ultimoAcesso: contas[i]?.last_sign_in_at ?? null,
  }));
}

export interface JuradoEquipe extends Membro {
  vinculo: "pendente" | "aceito" | "recusado";
  origem: boolean; // chegou ao ARXUM Fest por esta produtora (só ela altera perfil e acesso)
}

// Jurados ligados à produtora (jurado é único no sistema e aceita cada produtora)
export async function carregarJurados(produtoraId: string): Promise<JuradoEquipe[]> {
  const admin = createAdminClient();
  const { data: links } = await admin.from("produtora_jurados").select("jurado_id, status").eq("produtora_id", produtoraId);
  const ids = (links ?? []).map((l) => l.jurado_id);
  if (!ids.length) return [];
  const { data } = await admin.from("usuarios")
    .select("id, nome, email, role, ativo, telefone, foto_url, especialidade, mini_bio, produtora_id")
    .in("id", ids).order("nome");
  const lista = data ?? [];
  const contas = await Promise.all(lista.map((u) => admin.auth.admin.getUserById(u.id).then((r) => r.data.user).catch(() => null)));
  return lista.map((u, i) => ({
    id: u.id, nome: u.nome, email: u.email, role: u.role, setor_pdv: null, ativo: u.ativo,
    pendente: !contas[i]?.last_sign_in_at,
    telefone: u.telefone, foto_url: u.foto_url, especialidade: u.especialidade, mini_bio: u.mini_bio,
    ultimoAcesso: contas[i]?.last_sign_in_at ?? null,
    vinculo: (links ?? []).find((l) => l.jurado_id === u.id)?.status as JuradoEquipe["vinculo"],
    origem: u.produtora_id === produtoraId,
  }));
}
