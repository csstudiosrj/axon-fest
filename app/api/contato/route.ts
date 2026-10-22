import { NextRequest, NextResponse } from "next/server";
import { enviarEmail, escapeHtml } from "@/lib/email";
import { CONTATO } from "@/lib/site/conteudo";

// Formulário de contato do site institucional → e-mail para a equipe.
// Proteções simples: campo-isca (honeypot), limites de tamanho e de envios por IP.

const ASSUNTOS: Record<string, string> = {
  conhecer: "Quero conhecer o ARXUM Fest",
  pro: "Plano Pro",
  suporte: "Suporte",
  outro: "Outro assunto",
};

const JANELA_MS = 10 * 60 * 1000;
const MAX_POR_JANELA = 5;
const envios = new Map<string, number[]>();

function limitar(ip: string): boolean {
  const agora = Date.now();
  const recentes = (envios.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  envios.set(ip, recentes);
  return recentes.length > MAX_POR_JANELA;
}

function campo(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  if (limitar(ip)) {
    return NextResponse.json({ error: "Muitas mensagens em pouco tempo. Tente de novo em alguns minutos." }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Robôs preenchem o campo escondido; respondemos "ok" sem enviar nada
  if (campo(body.site, 200)) return NextResponse.json({ success: true });

  const nome = campo(body.nome, 120);
  const email = campo(body.email, 200).toLowerCase();
  const telefone = campo(body.telefone, 30);
  const festival = campo(body.festival, 160);
  const assunto = ASSUNTOS[campo(body.assunto, 20)] ?? ASSUNTOS.outro;
  const mensagem = campo(body.mensagem, 4000);

  if (!nome || !mensagem || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Preencha nome, e-mail válido e mensagem." }, { status: 400 });
  }

  const linhas = [
    ["Nome", nome],
    ["E-mail", email],
    ["Telefone", telefone || "—"],
    ["Festival / produtora", festival || "—"],
    ["Assunto", assunto],
  ]
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5e7a94">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`)
    .join("");

  try {
    await enviarEmail({
      para: CONTATO.email,
      responderPara: email,
      assunto: `[Site] ${assunto} — ${nome}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px">
          <h2 style="margin:0 0 16px">Nova mensagem pelo site</h2>
          <table style="font-size:14px;border-collapse:collapse">${linhas}</table>
          <p style="white-space:pre-wrap;font-size:14px;line-height:1.6;margin-top:20px">${escapeHtml(mensagem)}</p>
        </div>`,
    });
  } catch (e) {
    console.error("[api/contato]", e);
    return NextResponse.json(
      { error: "Não conseguimos enviar agora. Escreva para " + CONTATO.email + " ou chame no WhatsApp." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
