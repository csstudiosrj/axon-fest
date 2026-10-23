"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { CampoSenha } from "@/app/_components/CampoSenha";
import { Direitos } from "@/app/_components/Direitos";
import { ROLES, ROLES_GRUPO, ROLES_PAINEL_ADMIN, destinoPorRole } from "@/lib/auth/roles";

// Login único: produção, equipe, operador (caixa), jurado e grupos. Cada um vai para a sua área.
const ROLES_LOGIN: readonly string[] = [...ROLES, ...ROLES_PAINEL_ADMIN, ...ROLES_GRUPO];

const MENSAGENS_ERRO: Record<string, string> = {
  "sem-acesso": "Sua conta não tem acesso a esta área.",
  "link-invalido": "Link inválido ou expirado. Peça um novo convite à organização ou use “Esqueci minha senha”.",
};

// Só aceita caminhos internos em ?next= (evita open redirect)
function destinoSeguro(next: string | null, padrao: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return padrao;
  return next;
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; next?: string }>;
}) {
  const params = use(searchParams);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState((params.erro && MENSAGENS_ERRO[params.erro]) || "");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      if (authData.session) {
        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select("role, ativo, produtoras:produtora_id ( ativo ), grupos:organizacao_id ( ativo )")
          .eq("id", authData.session.user.id)
          .single();

        if (userError || !userData) {
          await supabase.auth.signOut();
          setError("Erro ao verificar permissões. Contate o suporte.");
          setLoading(false);
          return;
        }

        const bloqueada = userData.ativo === false || userData.grupos?.ativo === false
          || (!["jurado", "super_admin"].includes(userData.role) && userData.produtoras?.ativo === false);
        if (bloqueada) {
          await supabase.auth.signOut();
          setError("Este acesso está bloqueado. Fale com o suporte do ARXUM Fest.");
          setLoading(false);
          return;
        }

        if (!ROLES_LOGIN.includes(userData.role)) {
          await supabase.auth.signOut();
          setError("Esta conta não tem acesso ao sistema. Fale com a organização do festival.");
          setLoading(false);
          return;
        }

        router.push(destinoSeguro(params.next ?? null, destinoPorRole(userData.role)));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message === "Invalid login credentials" ? "E-mail ou senha incorretos." : message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-axon-bg text-white relative">
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-left">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              ARXUM <span className="text-axon-gold">Fest</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400">Produção, equipe, jurados, caixa e grupos inscritos: entre com seu e-mail e senha.</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border border-axon-border bg-axon-panel px-4 py-3 text-white focus:border-axon-gold focus:outline-none focus:ring-1 focus:ring-axon-gold transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
                <CampoSenha
                  value={password}
                  onChange={setPassword}
                  className="block w-full rounded-md border border-axon-border bg-axon-panel px-4 py-3 text-white focus:border-axon-gold focus:outline-none focus:ring-1 focus:ring-axon-gold transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-md border border-red-500/20 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center items-center gap-2 rounded-md bg-axon-gold text-black py-3 px-4 text-sm font-bold shadow-lg hover:opacity-90 transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Entrar no Sistema"}
            </button>
            <p className="text-center text-sm">
              <Link href="/esqueci-senha" className="text-gray-400 hover:text-axon-gold">Esqueci minha senha</Link>
            </p>
            <p className="text-center text-xs leading-relaxed text-gray-500">
              Grupo, escola ou companhia ainda sem cadastro? Faça a inscrição pelo link do festival.
              <br />
              Produtora nova? <Link href="/criar-conta" className="text-gray-400 hover:text-axon-gold">Crie sua conta</Link>.
            </p>
          </form>
        </div>

        <div className="absolute bottom-6 w-full text-center px-4">
          <Direitos className="text-xs text-gray-500" />
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative bg-axon-panel border-l border-axon-border items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-axon-bg via-axon-bg/80 to-transparent" />
        <div className="relative z-10 p-12 text-center max-w-2xl">
          <h2 className="text-4xl font-bold text-white mb-4">Gestão de Festivais</h2>
          <p className="text-lg text-gray-400">A plataforma definitiva para eventos artísticos.</p>
        </div>
      </div>
    </div>
  );
}