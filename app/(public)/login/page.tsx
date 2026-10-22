"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { ROLES, ROLES_GRUPO, ROLES_PAINEL_ADMIN, destinoPorRole } from "@/lib/auth/roles";

// Login único da produtora, operador (caixa) e jurado. Grupos também são aceitos.
const ROLES_LOGIN: readonly string[] = [...ROLES, ...ROLES_PAINEL_ADMIN, ...ROLES_GRUPO];

const MENSAGENS_ERRO: Record<string, string> = {
  "sem-acesso": "Sua conta não tem acesso a esta área.",
  "link-invalido": "Link inválido ou expirado. Peça um novo convite à organização.",
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
          .select("role")
          .eq("id", authData.session.user.id)
          .single();

        if (userError || !userData) {
          await supabase.auth.signOut();
          setError("Erro ao verificar permissões. Contate o suporte.");
          setLoading(false);
          return;
        }

        if (!ROLES_LOGIN.includes(userData.role)) {
          await supabase.auth.signOut();
          setError("Acesso negado. Área restrita à organização do festival.");
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
            <p className="mt-2 text-sm text-gray-400">Acesso restrito à organização do evento.</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border border-axon-border bg-axon-panel px-4 py-3 text-white focus:border-axon-gold focus:outline-none focus:ring-1 focus:ring-axon-gold transition-colors"
                  placeholder="admin@festival.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
          </form>
        </div>

        <div className="absolute bottom-6 w-full text-center px-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} ARXUM Fest. Todos os direitos reservados.
          </p>
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