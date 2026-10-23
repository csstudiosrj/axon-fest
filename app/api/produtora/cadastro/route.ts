import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";

// Cadastro self-service do dono de festival (plano Start).
// Cria, no servidor: usuário do Auth (não confirmado), produtora e usuarios(role=admin).
// O acesso só é liberado depois que a pessoa confirma o e-mail pelo link enviado.

const JANELA_MS = 60 * 60 * 1000;
const MAX_POR_JANELA = 5;
const tentativas = new Map<string, number[]>();

function limitar(ip: string): boolean {
  const agora = Date.now();
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  tentativas.set(ip, recentes);
  return recentes.length > MAX_POR_JANELA;
}

function campo(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  if (limitar(ip)) return erro("Muitas tentativas. Tente novamente mais tarde.", 429);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (campo(body.site, 200)) return NextResponse.json({ success: true }); // robô

  const nome = campo(body.nome, 120);
  const email = campo(body.email, 200).toLowerCase();
  const telefone = campo(body.telefone, 30).replace(/\D/g, "");
  const produtora = campo(body.festival, 160);
  const senha = typeof body.senha === "string" ? body.senha : "";

  if (!nome || !produtora) return erro("Informe seu nome e o nome do festival ou produtora.", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("Informe um e-mail válido.", 400);
  if (senha.length < 8) return erro("A senha precisa ter pelo menos 8 caracteres.", 400);

  const admin = createAdminClient();

  const { data: existente } = await admin.from("usuarios").select("id").eq("email", email).maybeSingle();
  if (existente) return erro("Este e-mail já tem conta. Entre pela página de login.", 409);

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password: senha,
    options: { data: { nome } },
  });
  if (linkError || !link.user) {
    const jaExiste = linkError?.message?.toLowerCase().includes("already");
    return erro(jaExiste ? "Este e-mail já tem conta. Entre pela página de login." : "Não foi possível criar a conta agora.", jaExiste ? 409 : 400);
  }

  const userId = link.user.id;
  let produtoraId: string | null = null;

  const desfazer = async () => {
    await admin.from("usuarios").delete().eq("id", userId);
    if (produtoraId) await admin.from("produtoras").delete().eq("id", produtoraId);
    await admin.auth.admin.deleteUser(userId);
  };

  try {
    const { data: prod, error: prodError } = await admin
      .from("produtoras")
      .insert({ nome: produtora, email, telefone: telefone || null, ativo: true })
      .select("id")
      .single();
    if (prodError || !prod) throw prodError ?? new Error("produtora");
    produtoraId = prod.id as string;

    const { error: usuarioError } = await admin.from("usuarios").insert({
      id: userId,
      email,
      nome,
      telefone: telefone || null,
      role: "admin",
      produtora_id: produtoraId,
      ativo: true,
    });
    if (usuarioError) throw usuarioError;

    const confirmar = urlAbsoluta(
      `/auth/confirmar?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=signup&next=/dashboard`
    );

    await enviarEmail({
      para: email,
      assunto: "Confirme seu e-mail para começar no ARXUM Fest",
      html: emailComBotao({
        titulo: `Olá, ${escapeHtml(nome.split(" ")[0])}!`,
        paragrafos: [
          `A conta de <strong>${escapeHtml(produtora)}</strong> no ARXUM Fest está quase pronta.`,
          "Confirme seu e-mail para entrar e configurar o seu primeiro evento.",
        ],
        botaoTexto: "Confirmar e-mail",
        botaoUrl: confirmar,
        rodape: "Se você não criou esta conta, ignore este e-mail.",
      }),
    });
  } catch (e) {
    console.error("[api/produtora/cadastro]", e);
    await desfazer();
    return erro("Não foi possível concluir o cadastro agora. Tente novamente em instantes.", 500);
  }

  return NextResponse.json({ success: true });
}
