import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

// Pessoas da produtora (equipe, operadores e jurados) com a situação do acesso

export interface Membro {
  id: string;
  nome: string | null;
  email: string;
  role: string;
  ativo: boolean;
  pendente: boolean;   // ainda não criou a senha / nunca entrou
  telefone: string | null;
  foto_url: string | null;
  especialidade: string | null;
  mini_bio: string | null;
  ultimoAcesso: string | null;
}

const PAPEIS_EQUIPE = ["admin", "produtor", "marketing", "assistente", "operador", "jurado", "produtora_admin", "produtora_staff"];

export async function carregarEquipe(produtoraId: string, papeis = PAPEIS_EQUIPE): Promise<Membro[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("usuarios")
    .select("id, nome, email, role, ativo, telefone, foto_url, especialidade, mini_bio")
    .eq("produtora_id", produtoraId).in("role", papeis).order("nome");
  const lista = data ?? [];
  const contas = await Promise.all(lista.map((u) => admin.auth.admin.getUserById(u.id).then((r) => r.data.user).catch(() => null)));
  return lista.map((u, i) => ({
    id: u.id, nome: u.nome, email: u.email, role: u.role, ativo: u.ativo,
    pendente: !contas[i]?.last_sign_in_at,
    telefone: u.telefone, foto_url: u.foto_url, especialidade: u.especialidade, mini_bio: u.mini_bio,
    ultimoAcesso: contas[i]?.last_sign_in_at ?? null,
  }));
}
