"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { destinoPorRole } from "@/lib/auth/roles";

// Tela usada após aceitar convite (ou recuperar senha): a sessão já foi
// criada em /auth/confirmar, aqui o usuário só define a senha.
export default function DefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (senha.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Link expirado. Peça um novo convite à organização.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: senha });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase.from("usuarios").select("role").eq("id", user.id).maybeSingle();
    router.push(destinoPorRole(userData?.role ?? ""));
  };

  const inputClass =
    "block w-full rounded-md border border-axon-border bg-axon-panel px-4 py-3 text-white focus:border-axon-gold focus:outline-none focus:ring-1 focus:ring-axon-gold transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-axon-bg text-white p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            ARXUM <span className="text-axon-gold">Fest</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">Crie sua senha para acessar o sistema.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nova senha</label>
              <input type="password" required autoComplete="new-password" value={senha}
                onChange={(e) => setSenha(e.target.value)} className={inputClass} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirmar senha</label>
              <input type="password" required autoComplete="new-password" value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)} className={inputClass} placeholder="••••••••" />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-md border border-red-500/20 text-center">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="flex w-full justify-center items-center gap-2 rounded-md bg-axon-gold text-black py-3 px-4 text-sm font-bold shadow-lg hover:opacity-90 transition-all duration-200 active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Salvar senha e entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
