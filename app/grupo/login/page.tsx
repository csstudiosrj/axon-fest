"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLES_GRUPO } from "@/lib/auth/roles";
import { BASE_PATH, apiUrl } from "@/lib/base-path";
import { Loader2 } from "lucide-react";


export default function GrupoLoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nome, setNome] = useState("");
  const [nomeOrganizacao, setNomeOrganizacao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (authData.session) {
        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select("role, organizacao_id, produtora_id")
          .eq("id", authData.session.user.id)
          .maybeSingle();

        let role = userData?.role as string | undefined;

        // Primeiro login após confirmar o e-mail: cria o cadastro no servidor
        if (!userData && !userError) {
          const res = await fetch(apiUrl("/api/grupo/cadastro"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }).catch(() => null);
          if (res?.ok) role = "org_admin";
        }

        if (!role) {
          await supabase.auth.signOut();
          setError("Erro ao verificar permissões. Contate o suporte.");
          setLoading(false);
          return;
        }

        if (!ROLES_GRUPO.includes(role)) {
          await supabase.auth.signOut();
          setError("Acesso negado. Área restrita às organizações participantes.");
          setLoading(false);
          return;
        }

        router.push("/grupo/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      const emailValue = email.trim();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailValue,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${BASE_PATH}/grupo/login`,
          data: { nome: nome.trim() },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Com sessão (confirmação de e-mail desligada) já cria o cadastro;
        // sem sessão, ele é criado no primeiro login (handleLogin).
        if (authData.session) {
          await fetch(apiUrl("/api/grupo/cadastro"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome_usuario: nome.trim() }),
          });
        }

        setError("Cadastro realizado! Verifique seu email para confirmar a conta.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-axon-bg to-black p-4">
      <div className="w-full max-w-md bg-axon-panel border border-axon-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLogin ? "Acesso da Organização" : "Cadastro de Organização"}
          </h1>
          <p className="text-gray-400 text-sm">
            {isLogin ? "Acesse o seu painel" : "Cadastre-se para participar"}
          </p>
        </div>

        <div className="flex mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
              isLogin ? "bg-axon-gold text-black" : "bg-axon-bg text-gray-400 hover:bg-gray-700"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
              !isLogin ? "bg-axon-gold text-black" : "bg-axon-bg text-gray-400 hover:bg-gray-700"
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleCadastro} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Seu Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-axon-gold"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Organização/Grupo</label>
                <input
                  type="text"
                  value={nomeOrganizacao}
                  onChange={(e) => setNomeOrganizacao(e.target.value)}
                  className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-axon-gold"
                  placeholder="Nome do grupo ou escola"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Responsável</label>
                <input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-axon-gold"
                  placeholder="Nome do responsável"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-axon-gold"
                  placeholder="(21) 99999-9999"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-axon-gold"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-axon-gold"
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-axon-gold"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {error && (
            <div className={`border rounded-lg p-3 ${
              error.includes("sucesso") || error.includes("Verifique")
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}>
              <p className={`text-sm ${
                error.includes("sucesso") || error.includes("Verifique")
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-axon-gold text-black font-bold py-3 rounded-lg hover:bg-axon-gold/90 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {isLogin ? "Entrar" : "Cadastrar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-axon-gold hover:underline text-sm">
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}