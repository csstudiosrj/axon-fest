import "server-only";
import type { createAdminClient } from "@/lib/supabase/server";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";
import { nomeFuncao, perfilPorSlug, type Perfil } from "@/lib/perfis";

type Admin = ReturnType<typeof createAdminClient>;

// Envia à pessoa o link para confirmar o vínculo com o grupo (e assinar o termo).
// O destinatário é sempre o e-mail já cadastrado da pessoa, nunca um informado
// por quem pediu o envio.
export async function enviarConfirmacaoVinculo(admin: Admin, token: string, perfil?: Perfil) {
  const { data: vinculo } = await admin
    .from("grupo_participante")
    .select("grupo_id, participante_id, funcao")
    .eq("token_confirmacao", token)
    .maybeSingle();
  if (!vinculo) throw new Error("Vínculo não encontrado.");

  const [{ data: grupo }, { data: participante }] = await Promise.all([
    admin.from("grupos").select("nome").eq("id", vinculo.grupo_id).maybeSingle(),
    admin.from("participantes").select("nome, email_contato").eq("id", vinculo.participante_id).maybeSingle(),
  ]);
  if (!grupo || !participante) throw new Error("Vínculo inconsistente.");
  if (!participante.email_contato) throw new Error("Participante sem e-mail de contato.");

  const p = perfil ?? perfilPorSlug(null);
  const funcao = nomeFuncao(p, vinculo.funcao as string | null);

  await enviarEmail({
    para: participante.email_contato as string,
    assunto: `Confirme sua participação em ${grupo.nome}`,
    html: emailComBotao({
      titulo: `Olá, ${escapeHtml(participante.nome as string)}!`,
      paragrafos: [
        `Você foi adicionado(a) ao ${escapeHtml(p.termos.elenco)} de <strong>${escapeHtml(grupo.nome as string)}</strong> no ARXUM Fest.`,
        ...(funcao ? [`<strong>Sua função:</strong> ${escapeHtml(funcao)}`] : []),
        "Para confirmar e assinar o termo de participação, clique no botão abaixo:",
      ],
      botaoTexto: "Confirmar participação",
      botaoUrl: urlAbsoluta(`/confirmar-participacao/${encodeURIComponent(token)}`),
      rodape: "Se você não reconhece este convite, ignore este e-mail.",
    }),
  });
}
