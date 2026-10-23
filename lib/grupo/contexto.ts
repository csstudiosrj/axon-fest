import "server-only";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, type UsuarioAtual } from "@/lib/auth/session";
import { ROLES_GRUPO } from "@/lib/auth/roles";
import { perfilPorSlug, type Perfil } from "@/lib/perfis";
import { aceitaArquivos, infoStatus, inscricoesAbertas } from "@/lib/eventos/status";

// Contexto das telas do portal do grupo dentro de um evento.
// Leituras usam o cliente com RLS (o grupo só enxerga o que é dele).

export interface EventoGrupo {
  id: string;
  nome: string;
  status: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  local: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
  regulamento_url: string | null;
  slug: string | null;
  liberar_comentarios: boolean;
  resultado_publicado_em: string | null;
  produtora_nome: string | null;
}

export interface ContextoGrupo {
  usuario: UsuarioAtual & { organizacao_id: string };
  grupo: { id: string; nome: string };
  evento: EventoGrupo;
  perfil: Perfil;
  inscricao: { id: string; status: string | null };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function perfilDoEvento(linha: { perfis_festival?: unknown }): Perfil {
  const p = linha.perfis_festival as { slug?: string } | { slug?: string }[] | null | undefined;
  return perfilPorSlug(Array.isArray(p) ? p[0]?.slug : p?.slug);
}

export async function exigirUsuarioGrupo() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  if (!ROLES_GRUPO.includes(usuario.role) || !usuario.organizacao_id) redirect("/login?erro=sem-acesso");
  return usuario as UsuarioAtual & { organizacao_id: string };
}

export async function carregarContextoGrupo(eventoId: string): Promise<ContextoGrupo> {
  const usuario = await exigirUsuarioGrupo();
  if (!UUID.test(eventoId)) notFound();

  const supabase = await createClient();
  const [{ data: inscricao }, { data: grupo }, { data: evento }] = await Promise.all([
    supabase.from("inscricoes_grupo_evento").select("id, status")
      .eq("evento_id", eventoId).eq("grupo_id", usuario.organizacao_id).maybeSingle(),
    supabase.from("grupos").select("id, nome").eq("id", usuario.organizacao_id).maybeSingle(),
    supabase.from("eventos")
      .select("id, nome, status, data_inicio, data_fim, local, logo_url, cor_primaria, regulamento_url, slug, liberar_comentarios, resultado_publicado_em, produtora_id, perfis_festival:perfil_id ( slug )")
      .eq("id", eventoId).maybeSingle(),
  ]);
  if (!inscricao || !grupo || !evento) notFound();

  // O grupo não lê a tabela produtoras; o nome do organizador vem pelo servidor
  let produtoraNome: string | null = null;
  if (evento.produtora_id) {
    const { data } = await createAdminClient().from("produtoras").select("nome").eq("id", evento.produtora_id).maybeSingle();
    produtoraNome = (data?.nome as string | undefined) ?? null;
  }

  return {
    usuario,
    grupo: { id: grupo.id as string, nome: grupo.nome as string },
    evento: {
      id: evento.id as string,
      nome: evento.nome as string,
      status: (evento.status as string | null) ?? null,
      data_inicio: (evento.data_inicio as string | null) ?? null,
      data_fim: (evento.data_fim as string | null) ?? null,
      local: (evento.local as string | null) ?? null,
      logo_url: (evento.logo_url as string | null) ?? null,
      cor_primaria: (evento.cor_primaria as string | null) ?? null,
      regulamento_url: (evento.regulamento_url as string | null) ?? null,
      slug: (evento.slug as string | null) ?? null,
      liberar_comentarios: !!evento.liberar_comentarios,
      resultado_publicado_em: (evento.resultado_publicado_em as string | null) ?? null,
      produtora_nome: produtoraNome,
    },
    perfil: perfilDoEvento(evento),
    inscricao: { id: inscricao.id as string, status: (inscricao.status as string | null) ?? null },
  };
}

// Situação do evento do ponto de vista do grupo
export function situacaoEvento(status: string | null) {
  return {
    podeEditar: inscricoesAbertas(status),
    podeEnviarArquivos: aceitaArquivos(status),
    rotulo: infoStatus(status).rotulo,
  };
}

// ── Elenco do grupo (lido pelo servidor para proteger dados de terceiros) ──

export interface IntegranteElenco {
  vinculo_id: string;
  participante_id: string;
  nome: string | null;          // null = pessoa já cadastrada que ainda não confirmou
  nome_artistico: string | null;
  data_nascimento: string | null;
  email: string | null;
  documento_final: string | null;
  funcao: string | null;
  confirmado: boolean;
  termo_assinado: boolean;
  editavel: boolean;            // cadastro feito por este grupo e ainda sem termo
}

function finalDocumento(doc: string | null | undefined) {
  const d = (doc ?? "").replace(/\D/g, "");
  return d.length >= 2 ? d.slice(-2) : null;
}

export async function carregarElenco(grupoId: string, usuarioId: string): Promise<IntegranteElenco[]> {
  const admin = createAdminClient();
  const { data: vinculos } = await admin
    .from("grupo_participante")
    .select("id, participante_id, funcao, confirmado, status")
    .eq("grupo_id", grupoId)
    .order("data_vinculo", { ascending: true });
  const ids = (vinculos ?? []).map((v) => v.participante_id as string);
  if (ids.length === 0) return [];

  const { data: pessoas } = await admin
    .from("participantes")
    .select("id, nome, nome_artistico, data_nascimento, email_contato, documento, termo_assinado, criado_por")
    .in("id", ids);
  const porId = new Map((pessoas ?? []).map((p) => [p.id as string, p]));

  return (vinculos ?? [])
    .filter((v) => (v.status ?? "ativo") === "ativo")
    .map((v) => {
      const p = porId.get(v.participante_id as string);
      const meu = p?.criado_por === usuarioId;
      const visivel = !!v.confirmado || meu;
      return {
        vinculo_id: v.id as string,
        participante_id: v.participante_id as string,
        nome: visivel ? ((p?.nome as string | undefined) ?? null) : null,
        nome_artistico: visivel ? ((p?.nome_artistico as string | null) ?? null) : null,
        data_nascimento: visivel ? ((p?.data_nascimento as string | null) ?? null) : null,
        email: visivel ? ((p?.email_contato as string | null) ?? null) : null,
        documento_final: finalDocumento(p?.documento as string | null),
        funcao: (v.funcao as string | null) ?? null,
        confirmado: !!v.confirmado,
        termo_assinado: !!p?.termo_assinado,
        editavel: meu && !p?.termo_assinado,
      };
    });
}
