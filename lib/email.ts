import "server-only";
import { Resend } from "resend";

const REMETENTE_PADRAO = "ARXUM Fest <noreply@csstudios.site>";

// Escapa texto vindo do usuário/banco antes de interpolar em HTML de e-mail
export function escapeHtml(valor: string | null | undefined): string {
  return (valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function enviarEmail(opcoes: { para: string; assunto: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? REMETENTE_PADRAO,
    to: opcoes.para,
    subject: opcoes.assunto,
    html: opcoes.html,
  });
  if (error) throw new Error(error.message);
}

// Layout padrão (dourado ARXUM) com um botão de ação
export function emailComBotao(opcoes: {
  titulo: string;
  paragrafos: string[];
  botaoTexto: string;
  botaoUrl: string;
  rodape?: string;
}): string {
  const corpo = opcoes.paragrafos.map((p) => `<p>${p}</p>`).join("");
  return `
    <div style="font-family: sans-serif; max-width: 500px;">
      <h2>${opcoes.titulo}</h2>
      ${corpo}
      <p style="margin: 24px 0;">
        <a href="${escapeHtml(opcoes.botaoUrl)}" style="background-color: #C5A059; color: black; padding: 10px 20px; text-decoration: none; border-radius: 8px;">${escapeHtml(opcoes.botaoTexto)}</a>
      </p>
      ${opcoes.rodape ? `<p style="color: #888; font-size: 12px;">${opcoes.rodape}</p>` : ""}
    </div>
  `;
}
