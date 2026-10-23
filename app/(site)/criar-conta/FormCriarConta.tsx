"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { Campo, Entrada, Isca, base } from "../_components/Formulario";
import { CampoSenha } from "@/app/_components/CampoSenha";
import { mascaraTelefone } from "@/lib/mascaras";

export function FormCriarConta() {
  const [enviando, setEnviando] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const dados = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    if (dados.senha !== dados.confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(apiUrl("/api/produtora/cadastro"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Não foi possível criar a conta agora.");
      setEmailEnviado(dados.email);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar a conta agora.");
    } finally {
      setEnviando(false);
    }
  }

  if (emailEnviado) {
    return (
      <div className="rounded-xl border border-arx-line bg-arx-surface p-8 sm:p-10">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-arx-fest/12 text-arx-fest"><MailCheck size={18} /></span>
        <h2 className="mt-6 text-[22px] font-medium tracking-[-0.02em] text-white">Confirme seu e-mail.</h2>
        <p className="mt-3 text-[15px] leading-[1.7] text-arx-mist">
          Enviamos um link para <span className="text-white">{emailEnviado}</span>. Abra o e-mail e clique em
          “Confirmar e-mail” para entrar e configurar o seu primeiro evento.
        </p>
        <p className="mt-6 text-[13px] text-arx-slate">Não chegou? Confira a caixa de spam ou promoções.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="relative grid gap-5 rounded-xl border border-arx-line bg-arx-surface p-6 sm:p-10">
      <Isca />
      <Campo label="Seu nome"><Entrada name="nome" required autoComplete="name" /></Campo>
      <Campo label="Nome do festival ou produtora"><Entrada name="festival" required autoComplete="organization" /></Campo>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="E-mail"><Entrada name="email" type="email" required autoComplete="email" /></Campo>
        <Campo label="WhatsApp" opcional><Entrada name="telefone" type="tel" autoComplete="tel" placeholder="(00) 00000-0000" onChange={(e) => { e.currentTarget.value = mascaraTelefone(e.currentTarget.value); }} /></Campo>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Senha"><CampoSenha name="senha" value={senha} onChange={setSenha} minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" className={base} /></Campo>
        <Campo label="Repita a senha"><CampoSenha name="confirmar" value={confirmar} onChange={setConfirmar} minLength={8} autoComplete="new-password" className={base} /></Campo>
      </div>
      {confirmar && senha !== confirmar && <p className="text-[13px] text-red-300">As senhas não são iguais.</p>}
      {erro && <p className="text-[14px] text-red-300" role="alert">{erro}</p>}
      <button type="submit" disabled={enviando}
        className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-arx-fest px-6 text-[14px] font-semibold text-arx-obsidian transition-colors hover:bg-[#e2c255] disabled:opacity-60">
        {enviando && <Loader2 size={16} className="animate-spin" />}
        {enviando ? "Criando conta…" : "Criar conta grátis"}
      </button>
      <p className="text-center text-[12px] leading-[1.6] text-arx-slate">
        Ao criar a conta, você concorda com os{" "}
        <Link href="/termos-de-uso" className="text-arx-mist underline underline-offset-4 hover:text-white">Termos de Uso</Link> e a{" "}
        <Link href="/privacidade" className="text-arx-mist underline underline-offset-4 hover:text-white">Política de Privacidade</Link>.
      </p>
      <p className="text-center text-[13px] text-arx-slate">
        Já tem conta? <Link href="/login" className="text-arx-mist underline-offset-4 hover:text-white hover:underline">Entrar</Link>
      </p>
    </form>
  );
}
