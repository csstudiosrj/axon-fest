import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Recebe os links de e-mail (convite, recuperação de senha) no formato
// ?token_hash=...&type=...&next=/caminho, valida no Supabase e grava a sessão
// nos cookies. Depois manda o usuário para `next` (só caminhos internos).
const TIPOS: EmailOtpType[] = ["invite", "recovery", "signup", "magiclink", "email", "email_change"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/login";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/login";

  const destino = request.nextUrl.clone();
  destino.search = "";

  if (tokenHash && type && TIPOS.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      destino.pathname = next;
      return NextResponse.redirect(destino);
    }
  }

  destino.pathname = "/login";
  destino.searchParams.set("erro", "link-invalido");
  return NextResponse.redirect(destino);
}
