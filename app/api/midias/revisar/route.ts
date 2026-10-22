import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { arquivoDaEquipe } from "@/lib/midias/acesso";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";
import { perfilPorSlug } from "@/lib/perfis";

// Produção aprova ou recusa um arquivo técnico. Na recusa, o grupo recebe
// e-mail com o motivo e o link para enviar outro arquivo.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { arquivo_id?: string; status?: string; observacao?: string };
    const status = body.status;
    if (status !== "aprovado" && status !== "recusado" && status !== "recebido") {
      return NextResponse.json({ error: "Situação inválida." }, { status: 400 });
    }
    const observacao = typeof body.observacao === "string" ? body.observacao.trim().slice(0, 500) : "";
    if (status === "recusado" && !observacao) {
      return NextResponse.json({ error: "Informe o motivo da recusa." }, { status: 400 });
    }

    const admin = createAdminClient();
    const acesso = await arquivoDaEquipe(admin, body.arquivo_id ?? "");
    if (!acesso) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

    const { error } = await admin.from("apresentacao_arquivos")
      .update({ status, observacao: status === "recusado" ? observacao : null, updated_at: new Date().toISOString() })
      .eq("id", acesso.arquivo.id);
    if (error) return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });

    let emailEnviado = false;
    if (status === "recusado" && acesso.apresentacao.grupo_id) {
      const [{ data: grupo }, { data: evento }] = await Promise.all([
        admin.from("grupos").select("nome, email, email_contato").eq("id", acesso.apresentacao.grupo_id).maybeSingle(),
        admin.from("eventos").select("nome, perfis_festival:perfil_id ( slug )").eq("id", acesso.apresentacao.evento_id).maybeSingle(),
      ]);
      const destino = (grupo?.email_contato as string | null) || (grupo?.email as string | null);
      if (destino && evento) {
        const pf = evento.perfis_festival as { slug?: string } | { slug?: string }[] | null;
        const perfil = perfilPorSlug(Array.isArray(pf) ? pf[0]?.slug : pf?.slug);
        const nomeArquivo = perfil.arquivos.find((a) => a.chave === acesso.arquivo.tipo)?.nome ?? "Arquivo técnico";
        try {
          await enviarEmail({
            para: destino,
            assunto: `${nomeArquivo} recusado — ${evento.nome}`,
            html: emailComBotao({
              titulo: `Olá, ${escapeHtml(grupo?.nome as string)}!`,
              paragrafos: [
                `A produção do <strong>${escapeHtml(evento.nome as string)}</strong> recusou o arquivo <strong>${escapeHtml(nomeArquivo)}</strong> de “${escapeHtml(acesso.apresentacao.nome)}”.`,
                `<strong>Motivo:</strong> ${escapeHtml(observacao)}`,
                "Envie um novo arquivo pelo portal do grupo:",
              ],
              botaoTexto: "Enviar novo arquivo",
              botaoUrl: urlAbsoluta(`/grupo/${acesso.apresentacao.evento_id}/apresentacoes#${acesso.apresentacao.id}`),
            }),
          });
          emailEnviado = true;
        } catch (e) {
          console.error("[api/midias/revisar] e-mail", e);
        }
      }
    }
    return NextResponse.json({ success: true, emailEnviado });
  } catch (e) {
    console.error("[api/midias/revisar]", e);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
