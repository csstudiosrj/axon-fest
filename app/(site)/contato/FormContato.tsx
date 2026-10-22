"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { AreaTexto, Campo, Entrada, Isca, Selecao } from "../_components/Formulario";

export function FormContato({ assuntoInicial }: { assuntoInicial: string }) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const dados = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(apiUrl("/api/contato"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Não conseguimos enviar agora.");
      setEnviado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não conseguimos enviar agora.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="rounded-xl border border-arx-line bg-arx-surface p-8 sm:p-10">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-arx-fest/12 text-arx-fest"><Check size={18} /></span>
        <h2 className="mt-6 text-[22px] font-medium tracking-[-0.02em] text-white">Mensagem recebida.</h2>
        <p className="mt-3 text-[15px] leading-[1.7] text-arx-mist">Respondemos no e-mail informado em até um dia útil.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="relative grid gap-5 rounded-xl border border-arx-line bg-arx-surface p-6 sm:grid-cols-2 sm:p-10">
      <Isca />
      <Campo label="Nome"><Entrada name="nome" required autoComplete="name" /></Campo>
      <Campo label="E-mail"><Entrada name="email" type="email" required autoComplete="email" /></Campo>
      <Campo label="WhatsApp" opcional><Entrada name="telefone" type="tel" autoComplete="tel" placeholder="(00) 00000-0000" /></Campo>
      <Campo label="Festival ou produtora" opcional><Entrada name="festival" autoComplete="organization" /></Campo>
      <div className="sm:col-span-2">
        <Campo label="Assunto">
          <Selecao name="assunto" defaultValue={assuntoInicial}>
            <option value="conhecer">Quero conhecer o ARXUM Fest</option>
            <option value="pro">Plano Pro</option>
            <option value="suporte">Suporte</option>
            <option value="outro">Outro assunto</option>
          </Selecao>
        </Campo>
      </div>
      <div className="sm:col-span-2">
        <Campo label="Mensagem"><AreaTexto name="mensagem" required placeholder="Conte um pouco sobre o seu festival." /></Campo>
      </div>
      {erro && <p className="text-[14px] text-red-300 sm:col-span-2" role="alert">{erro}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={enviando}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-arx-fest px-6 text-[14px] font-semibold text-arx-obsidian transition-colors hover:bg-[#e2c255] disabled:opacity-60 sm:w-auto">
          {enviando && <Loader2 size={16} className="animate-spin" />}
          {enviando ? "Enviando…" : "Enviar mensagem"}
        </button>
      </div>
    </form>
  );
}
