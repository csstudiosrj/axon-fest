import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Proxy (antigo middleware): renova a sessão do Supabase a cada request e
// barra quem não está logado nas áreas restritas. A checagem de CARGO fica
// nos layouts (server), que leem a tabela usuarios.
// request.nextUrl.pathname já vem sem o basePath (/fest).
// ─────────────────────────────────────────────────────────────────────────────

const AREAS_ADMIN = [
  "/dashboard",
  "/eventos",
  "/inscricoes",
  "/jurados",
  "/loja",
  "/marketing",
  "/midias",
  "/pdv",
  "/perfil",
  "/termos",
  "/usuarios",
  "/configuracoes",
  "/cadastro",
  "/definir-senha",
];
const AREAS_OPERADOR = ["/bilheteria", "/caixa"];
const AREAS_JURADO = ["/jurado"];

function comecaCom(pathname: string, prefixos: string[]) {
  return prefixos.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function loginPara(pathname: string): string | null {
  if (pathname.startsWith("/grupo/") && pathname !== "/grupo/login") return "/login";
  if (comecaCom(pathname, [...AREAS_ADMIN, ...AREAS_OPERADOR, ...AREAS_JURADO])) return "/login";
  return null;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Não colocar código entre createServerClient e getUser(): é aqui que o
  // token expirado é renovado e os cookies novos são gravados.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const login = loginPara(pathname);

  if (!user && login) {
    const url = request.nextUrl.clone();
    url.pathname = login;
    url.search = "";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    // Mantém cookies eventualmente limpos/renovados pelo Supabase
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo, exceto API, assets do Next e arquivos estáticos
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|pdf)$).*)",
  ],
};
