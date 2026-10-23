import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BASE_PATH } from "@/lib/base-path";

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

  // Redireciona com endereço relativo: em produção o app é servido em www.arxum.com.br
  // por reescrita, e request.url aponta para o domínio interno (arxum-fest.vercel.app),
  // onde o cookie da sessão recém-criada não existe. Relativo, o navegador fica no mesmo domínio.
  const ir = (caminho: string) => new NextResponse(null, { status: 307, headers: { Location: `${BASE_PATH}${caminho}` } });

  if (tokenHash && type && TIPOS.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return ir(next);
  }

  return ir("/login?erro=link-invalido");
}
