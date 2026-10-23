"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CampoSenha } from "@/app/_components/CampoSenha";
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
  // Convidados chegam sem nome cadastrado: pedimos aqui (aparece para grupos e no site do evento)
  const [precisaNome, setPrecisaNome] = useState(false);
  const [nome, setNome] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("usuarios").select("nome").eq("id", user.id).maybeSingle();
      if (data && !data.nome?.trim()) setPrecisaNome(true);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (precisaNome && nome.trim().length < 3) {
      setError("Informe seu nome completo.");
      return;
    }
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

    if (precisaNome) await supabase.from("usuarios").update({ nome: nome.trim() }).eq("id", user.id);

    const { data: userData } = await supabase.from("usuarios").select("role, setor_pdv").eq("id", user.id).maybeSingle();
    router.push(destinoPorRole(userData?.role ?? "", userData?.setor_pdv));
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
            {precisaNome && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Seu nome completo</label>
                <input type="text" required autoComplete="name" value={nome}
                  onChange={(e) => setNome(e.target.value)} className={inputClass} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nova senha</label>
              <CampoSenha value={senha} onChange={setSenha} autoComplete="new-password" minLength={8} className={inputClass} placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Repita a senha</label>
              <CampoSenha value={confirmar} onChange={setConfirmar} autoComplete="new-password" name="confirmar" className={inputClass} placeholder="••••••••" />
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
