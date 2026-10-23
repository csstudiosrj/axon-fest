"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/base-path";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const res = await fetch(apiUrl("/api/auth/recuperar"), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setEnviando(false);
    if (!res?.ok) return setErro(json?.error ?? "Não foi possível enviar agora. Tente de novo.");
    setEnviado(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-axon-bg px-4 text-white">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ARXUM <span className="text-axon-gold">Fest</span></h1>
          <p className="mt-2 text-sm text-gray-400">Recuperar acesso</p>
        </div>

        {enviado ? (
          <div className="space-y-4 rounded-xl border border-axon-border bg-axon-panel p-6">
            <p className="flex items-center gap-2 font-medium text-emerald-300"><CheckCircle2 size={18} /> Verifique seu e-mail</p>
            <p className="text-sm text-gray-300">
              Se <strong className="text-white">{email}</strong> tiver conta no ARXUM Fest, você vai receber em instantes um link para criar uma nova senha. Confira também a caixa de spam.
            </p>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4 rounded-xl border border-axon-border bg-axon-panel p-6">
            <p className="text-sm text-gray-300">Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.</p>
            <label className="block">
              <span className="mb-1 block text-sm text-gray-400">E-mail</span>
              <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-axon-border bg-axon-bg px-4 py-3 text-white focus:border-axon-gold focus:outline-none" />
            </label>
            {erro && <p className="text-sm text-red-300">{erro}</p>}
            <button type="submit" disabled={enviando}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-axon-gold px-4 py-3 text-sm font-bold text-black disabled:opacity-50">
              {enviando && <Loader2 size={16} className="animate-spin" />} Enviar link
            </button>
          </form>
        )}

        <p className="text-center text-sm">
          <Link href="/login" className="text-axon-gold hover:underline">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
