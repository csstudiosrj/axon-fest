import "server-only";
import { createHash } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/server";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";
import { idadeEm } from "@/lib/documentos";

// Assinatura eletrônica dos documentos do evento por cada integrante do elenco
// (ou pelo responsável, se for menor): uso de imagem para todos e autorização
// de menores para quem tem menos de 18 anos na data do evento. Fica registrado
// quem assinou, CPF, data, IP, aparelho e o resumo (hash) do texto assinado.

type Admin = ReturnType<typeof createAdminClient>;

export const TIPOS_ASSINAVEIS = ["uso_imagem", "autorizacao_menores"] as const;

export interface DocumentoAssinavel {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: string;
  versao: number;
  arquivo_url: string | null;
  assinaturaId: string | null; // null = falta assinar a versão atual
}

export const hashTexto = (texto: string) => createHash("sha256").update(texto, "utf8").digest("hex");

// Documentos que esta pessoa precisa assinar neste evento e o que já assinou
export async function documentosDoParticipante(admin: Admin, participanteId: string, eventoId: string) {
  const [{ data: p }, { data: ev }, { data: docs }, { data: feitas }] = await Promise.all([
    admin.from("participantes").select("id, nome, documento, data_nascimento, email_contato, responsavel_nome, responsavel_cpf, responsavel_parentesco").eq("id", participanteId).maybeSingle(),
    admin.from("eventos").select("id, nome, data_inicio, produtora_id").eq("id", eventoId).maybeSingle(),
    admin.from("termos_documentos").select("id, tipo, titulo, conteudo, versao, arquivo_url").eq("evento_id", eventoId).eq("ativo", true).in("tipo", [...TIPOS_ASSINAVEIS]),
    admin.from("assinaturas_documentos").select("id, documento_id, versao").eq("participante_id", participanteId).eq("evento_id", eventoId),
  ]);
  if (!p || !ev) return null;
  const idade = idadeEm(p.data_nascimento, ev.data_inicio);
  const menor = idade !== null && idade < 18;
  const documentos: DocumentoAssinavel[] = (docs ?? [])
    .filter((d) => d.tipo !== "autorizacao_menores" || menor)
    .sort((a, b) => TIPOS_ASSINAVEIS.indexOf(a.tipo as never) - TIPOS_ASSINAVEIS.indexOf(b.tipo as never))
    .map((d) => ({
      id: d.id, tipo: d.tipo, titulo: d.titulo, conteudo: d.conteudo ?? "", versao: d.versao, arquivo_url: d.arquivo_url ?? null,
      assinaturaId: (feitas ?? []).find((f) => f.documento_id === d.id && f.versao === d.versao)?.id ?? null,
    }));
  return { participante: p, evento: ev, menor, documentos };
}

// Pessoas do elenco das apresentações de um evento (opcionalmente só de um grupo)
export async function elencoDoEvento(admin: Admin, eventoId: string, grupoId?: string) {
  let q = admin.from("apresentacoes").select("id, apresentacao_elenco ( participante_id )").eq("evento_id", eventoId);
  if (grupoId) q = q.eq("grupo_id", grupoId);
  const { data } = await q;
  return [...new Set((data ?? []).flatMap((a) => (a.apresentacao_elenco ?? []).map((e) => e.participante_id as string)))];
}

// Cria (ou reaproveita) o link de assinatura e manda por e-mail. Devolve false se a pessoa não tem e-mail.
export async function enviarPedidoAssinatura(admin: Admin, participanteId: string, eventoId: string): Promise<boolean> {
  const info = await documentosDoParticipante(admin, participanteId, eventoId);
  if (!info || !info.participante.email_contato || info.documentos.every((d) => d.assinaturaId)) return false;
  const { data: existente } = await admin.from("pedidos_assinatura").select("token")
    .eq("participante_id", participanteId).eq("evento_id", eventoId).gt("expira_em", new Date(Date.now() + 7 * 86400000).toISOString())
    .order("criado_em", { ascending: false }).limit(1).maybeSingle();
  const token = existente?.token ?? (await admin.from("pedidos_assinatura").insert({ participante_id: participanteId, evento_id: eventoId }).select("token").single()).data?.token;
  if (!token) return false;
  const quem = info.menor ? "o(a) responsável por" : "";
  await enviarEmail({
    para: info.participante.email_contato,
    assunto: `Assinatura de documentos: ${info.evento.nome}`,
    html: emailComBotao({
      titulo: "Documentos para assinar",
      paragrafos: [
        `${escapeHtml(info.participante.nome)} está no elenco de <strong>${escapeHtml(info.evento.nome)}</strong>.`,
        `Para participar, ${quem ? `${quem} ${escapeHtml(info.participante.nome.split(" ")[0])} precisa` : "você precisa"} ler e assinar online: ${info.documentos.filter((d) => !d.assinaturaId).map((d) => escapeHtml(d.titulo)).join(", ")}.`,
        "Leva um minuto e vale como assinatura eletrônica, com registro de data, hora e IP.",
      ],
      botaoTexto: "Ler e assinar",
      botaoUrl: urlAbsoluta(`/assinar/${token}`),
      rodape: "O link vale por 30 dias.",
    }),
  });
  return true;
}
