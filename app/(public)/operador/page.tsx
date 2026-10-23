"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CampoSenha } from "@/app/_components/CampoSenha";
import { Direitos } from "@/app/_components/Direitos";
import { ROLES_OPERADOR, destinoPorRole } from "@/lib/auth/roles";

// Porta dos operadores: entrada própria do caixa e da bilheteria, fora do painel.
// Cada operador cai direto no seu setor; ao sair, volta para cá.
export default function EntradaOperador() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEntrando(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error || !data.user) {
      setEntrando(false);
      return setErro("E-mail ou senha incorretos.");
    }
    const { data: u } = await supabase.from("usuarios").select("role, setor_pdv, ativo").eq("id", data.user.id).maybeSingle();
    if (!u || u.ativo === false || !ROLES_OPERADOR.includes(u.role)) {
      await supabase.auth.signOut();
      setEntrando(false);
      return setErro("Esta entrada é só para quem opera o caixa ou a bilheteria. Para as outras áreas, use o login do ARXUM Fest.");
    }
    // Operador vai para o seu setor; a gestão (admin, financeiro) começa pelo caixa
    router.push(u.role === "operador" ? destinoPorRole(u.role, u.setor_pdv) : "/caixa");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-axon-bg px-4 py-10 text-white">
      <div className="w-full max-w-sm space-y-7">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex w-fit gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-axon-border bg-axon-panel"><ShoppingBag size={22} className="text-axon-gold" /></span>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-axon-border bg-axon-panel"><Ticket size={22} className="text-axon-gold" /></span>
          </div>
          <h1 className="text-2xl font-bold">ARXUM <span className="text-axon-gold">Fest</span> · Operador</h1>
          <p className="text-sm text-gray-400">Entrada do caixa e da bilheteria. Use o e-mail e a senha que a produção cadastrou para você.</p>
        </div>
        <form onSubmit={entrar} className="space-y-4 rounded-2xl border border-axon-border bg-axon-panel p-5">
          <label className="block space-y-1.5">
            <span className="text-xs text-gray-400">E-mail</span>
            <input type="email" name="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-axon-border bg-axon-bg px-4 py-3 text-sm text-white outline-none focus:border-axon-gold" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-gray-400">Senha</span>
            <CampoSenha value={senha} onChange={setSenha} className="w-full rounded-xl border border-axon-border bg-axon-bg px-4 py-3 text-sm text-white outline-none focus:border-axon-gold" />
          </label>
          {erro && <p className="text-sm text-red-300">{erro}</p>}
          <button type="submit" disabled={entrando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-axon-gold py-3 text-sm font-bold text-black disabled:opacity-50">
            {entrando && <Loader2 size={16} className="animate-spin" />} Entrar
          </button>
        </form>
        <p className="text-center text-xs text-gray-500">
          Esqueceu a senha? <Link href="/esqueci-senha" className="text-axon-gold hover:underline">Criar uma nova</Link>
        </p>
        <Direitos className="text-center text-xs text-gray-600" />
      </div>
    </main>
  );
}
