import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { equipeDoEvento, getUsuarioAtual } from "@/lib/apuracao/acesso";

type Admin = ReturnType<typeof createAdminClient>;

// Arquivo técnico + apresentação + evento, se quem chama é da equipe do evento
export async function arquivoDaEquipe(admin: Admin, arquivoId: string) {
  const usuario = await getUsuarioAtual();
  if (!usuario || !/^[0-9a-f-]{36}$/i.test(arquivoId)) return null;
  const { data: arquivo } = await admin
    .from("apresentacao_arquivos")
    .select("id, tipo, url, nome, mime, status, apresentacoes ( id, nome, evento_id, grupo_id )")
    .eq("id", arquivoId)
    .maybeSingle();
  const ap = Array.isArray(arquivo?.apresentacoes) ? arquivo?.apresentacoes[0] : arquivo?.apresentacoes;
  if (!arquivo || !ap) return null;
  const apresentacao = ap as { id: string; nome: string; evento_id: string; grupo_id: string | null };
  if (!(await equipeDoEvento(admin, usuario, apresentacao.evento_id))) return null;
  return { usuario, arquivo, apresentacao };
}

// Só baixamos de onde os arquivos são guardados (evita usar o servidor como proxy aberto)
export function origemPermitida(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : null;
    return /(^|\.)(ufs\.sh|utfs\.io|uploadthing\.com)$/.test(u.host) || u.host === supabase;
  } catch {
    return false;
  }
}
