import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail } from "@/lib/email";

// "Esqueci minha senha": gera o link de recuperação e envia pelo Resend.
// A resposta é sempre a mesma, exista ou não a conta (não revela e-mails
// cadastrados). Limite: um pedido por minuto por conta.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INTERVALO_MS = 60_000;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 320) : "";
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });

  const ok = NextResponse.json({ success: true });
  const admin = createAdminClient();

  const { data: usuario } = await admin.from("usuarios").select("id, nome, ativo").eq("email", email).maybeSingle();
  if (!usuario || usuario.ativo === false) return ok;

  const { data: conta } = await admin.auth.admin.getUserById(usuario.id);
  const ultimo = Number(conta.user?.app_metadata?.ultimo_pedido_senha ?? 0);
  if (Date.now() - ultimo < INTERVALO_MS) return ok;
  await admin.auth.admin.updateUserById(usuario.id, {
    app_metadata: { ...(conta.user?.app_metadata ?? {}), ultimo_pedido_senha: Date.now() },
  });

  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (error || !data.properties?.hashed_token) {
    console.error("[api/auth/recuperar]", error);
    return ok;
  }

  const link = urlAbsoluta(
    `/auth/confirmar?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&next=/definir-senha`
  );
  try {
    await enviarEmail({
      para: email,
      assunto: "Crie uma nova senha — ARXUM Fest",
      html: emailComBotao({
        titulo: "Recuperação de senha",
        paragrafos: [
          "Recebemos um pedido para criar uma nova senha para a sua conta no ARXUM Fest.",
          "O link vale por 1 hora e só pode ser usado uma vez.",
        ],
        botaoTexto: "Criar nova senha",
        botaoUrl: link,
        rodape: "Se você não pediu, ignore este e-mail: sua senha atual continua valendo.",
      }),
    });
  } catch (e) {
    console.error("[api/auth/recuperar] e-mail", e);
  }
  return ok;
}
