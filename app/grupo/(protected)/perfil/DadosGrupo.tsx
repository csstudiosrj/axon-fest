"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { soDigitos } from "@/lib/documentos";
import { mascaraCnpj, mascaraTelefone, telefoneValido } from "@/lib/mascaras";
import { colunasEndereco, enderecoDe, type Endereco } from "@/lib/endereco";
import { CamposEndereco } from "@/app/_components/CamposEndereco";
import { Cartao } from "../../_components/ui";

interface Grupo {
  id: string;
  nome: string;
  responsavel: string | null;
  telefone: string | null;
  email: string;
  email_contato: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  documento: string | null;
  tipo_documento: string | null;
}

const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold disabled:opacity-60";

function mascararDocumento(doc: string | null, tipo: string | null) {
  const d = soDigitos(doc);
  if (!d) return "—";
  if (tipo === "cnpj" || d.length === 14) return mascaraCnpj(d);
  return `***.***.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function DadosGrupo({ grupo, podeEditar }: { grupo: Grupo; podeEditar: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({
    nome: grupo.nome ?? "",
    responsavel: grupo.responsavel ?? "",
    telefone: mascaraTelefone(grupo.telefone),
    email_contato: grupo.email_contato ?? "",
  });
  const [endereco, setEndereco] = useState<Endereco>(enderecoDe(grupo));
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: k === "telefone" ? mascaraTelefone(e.target.value) : e.target.value });

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.telefone && !telefoneValido(f.telefone)) return setMsg({ ok: false, texto: "Telefone incompleto: informe DDD e número." });
    setSalvando(true);
    setMsg(null);
    const { error } = await createClient().from("grupos").update({
      nome: f.nome.trim(),
      responsavel: f.responsavel.trim() || null,
      telefone: soDigitos(f.telefone) || null,
      email_contato: f.email_contato.trim().toLowerCase() || null,
      ...colunasEndereco(endereco),
    }).eq("id", grupo.id);
    setMsg(error ? { ok: false, texto: error.message } : { ok: true, texto: "Dados salvos." });
    setSalvando(false);
    router.refresh();
  };

  return (
    <form onSubmit={salvar}>
      <Cartao>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs text-gray-400">Nome do grupo</span>
            <input required minLength={2} value={f.nome} onChange={set("nome")} disabled={!podeEditar} className={`${campo} mt-1.5`} />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">Responsável</span>
            <input required value={f.responsavel} onChange={set("responsavel")} disabled={!podeEditar} className={`${campo} mt-1.5`} />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">Telefone / WhatsApp</span>
            <input inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={f.telefone} onChange={set("telefone")} disabled={!podeEditar} className={`${campo} mt-1.5`} />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">E-mail de contato</span>
            <input type="email" value={f.email_contato} onChange={set("email_contato")} disabled={!podeEditar} className={`${campo} mt-1.5`} />
          </label>
          <div className="sm:col-span-2">
            <CamposEndereco valor={endereco} onChange={setEndereco} disabled={!podeEditar} classeCampo={campo} />
          </div>
          <div className="grid gap-4 border-t border-axon-border pt-4 text-sm sm:col-span-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">{grupo.tipo_documento === "cnpj" ? "CNPJ" : "CPF"}</p>
              <p className="mt-1 text-gray-200">{mascararDocumento(grupo.documento, grupo.tipo_documento)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">E-mail de acesso</p>
              <p className="mt-1 text-gray-200">{grupo.email}</p>
            </div>
            <p className="text-xs text-gray-500 sm:col-span-2">Documento e e-mail de acesso identificam o grupo e só mudam pelo suporte.</p>
          </div>
        </div>
        {podeEditar && (
          <div className="flex items-center justify-between gap-4 border-t border-axon-border px-5 py-4">
            <p className={`text-xs ${msg?.ok ? "text-emerald-300" : "text-red-300"}`}>{msg?.texto}</p>
            <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {salvando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar
            </button>
          </div>
        )}
      </Cartao>
    </form>
  );
}
