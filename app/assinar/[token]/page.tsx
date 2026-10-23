"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle2, FileSignature, FileText, Loader2 } from "lucide-react";
import { apiUrl, BASE_PATH } from "@/lib/base-path";
import { mascaraCpf } from "@/lib/mascaras";
import { Direitos } from "@/app/_components/Direitos";

interface Dados {
  participante: { nome: string; menor: boolean; responsavel_nome: string; responsavel_parentesco: string };
  evento: { nome: string };
  documentos: { id: string; titulo: string; html: string; arquivo: string | null; assinaturaId: string | null }[];
}

const campo = "w-full rounded-xl border border-axon-border bg-axon-bg px-4 py-3 text-sm text-white outline-none focus:border-axon-gold";

async function chamar(corpo: Record<string, unknown>) {
  const res = await fetch(apiUrl("/api/assinaturas"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? "Não foi possível concluir.");
  return json;
}

// Assinatura eletrônica dos documentos do festival (link enviado por e-mail)
export default function AssinarDocumentos({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [f, setF] = useState({ nome: "", cpf: "", parentesco: "", aceite: false });
  const [enviando, setEnviando] = useState(false);

  const carregar = () => chamar({ acao: "carregar", token }).then((r) => {
    const d = r as Dados;
    setDados(d);
    setF((x) => ({ ...x, nome: d.participante.menor && !x.nome ? d.participante.responsavel_nome : x.nome, parentesco: x.parentesco || d.participante.responsavel_parentesco }));
  }, (e: Error) => setErro(e.message));
  useEffect(() => {
    chamar({ acao: "carregar", token }).then((r) => {
      const d = r as Dados;
      setDados(d);
      setF((x) => ({ ...x, nome: d.participante.menor ? d.participante.responsavel_nome : "", parentesco: d.participante.responsavel_parentesco }));
    }, (e: Error) => setErro(e.message));
  }, [token]);

  const assinar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await chamar({ acao: "assinar", token, ...f });
      await carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
    setEnviando(false);
  };

  const pendentes = dados?.documentos.filter((d) => !d.assinaturaId) ?? [];
  const menor = dados?.participante.menor;

  return (
    <main className="min-h-screen bg-axon-bg px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2 text-center">
          <FileSignature size={34} className="mx-auto text-axon-gold" />
          <h1 className="text-2xl font-bold">Assinatura de documentos</h1>
          {dados && <p className="text-sm text-gray-400">{dados.evento.nome} · {dados.participante.nome}{menor ? " (menor de idade)" : ""}</p>}
        </header>

        {!dados && !erro && <Loader2 className="mx-auto animate-spin text-axon-gold" />}
        {erro && !dados && <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-center text-sm text-red-200">{erro}</p>}

        {dados && dados.documentos.length === 0 && <p className="rounded-xl border border-axon-border bg-axon-panel p-6 text-center text-sm text-gray-300">Não há documentos para assinar neste festival.</p>}

        {dados?.documentos.map((d) => (
          <section key={d.id} className="rounded-2xl border border-axon-border bg-axon-panel">
            <h2 className="flex items-center justify-between gap-3 border-b border-axon-border px-5 py-3.5 font-semibold">
              <span className="flex items-center gap-2"><FileText size={16} className="text-axon-gold" /> {d.titulo}</span>
              {d.assinaturaId && (
                <a href={`${BASE_PATH}/assinatura/${d.assinaturaId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-normal text-emerald-300 hover:underline">
                  <CheckCircle2 size={14} /> Assinado · ver comprovante
                </a>
              )}
            </h2>
            {!d.assinaturaId && (
              <div className="max-h-80 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-gray-300 [&_h2]:mb-2 [&_h2]:font-semibold [&_h2]:text-white [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5">
                {d.html ? <div dangerouslySetInnerHTML={{ __html: d.html }} /> : null}
                {d.arquivo && <a href={d.arquivo} target="_blank" rel="noreferrer" className="text-axon-gold underline">Abrir o documento (PDF)</a>}
              </div>
            )}
          </section>
        ))}

        {dados && pendentes.length > 0 && (
          <form onSubmit={assinar} className="space-y-4 rounded-2xl border border-axon-gold/30 bg-axon-panel p-5">
            <p className="text-sm text-gray-300">
              {menor
                ? `Como ${dados.participante.nome.split(" ")[0]} é menor de idade, quem assina é o pai, a mãe ou o responsável legal.`
                : "Para assinar, digite seu nome completo e seu CPF, iguais aos do cadastro."}
            </p>
            <label className="block space-y-1.5"><span className="text-xs text-gray-400">{menor ? "Nome completo do responsável" : "Seu nome completo"}</span>
              <input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} maxLength={160} className={campo} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5"><span className="text-xs text-gray-400">{menor ? "CPF do responsável" : "Seu CPF"}</span>
                <input required inputMode="numeric" value={f.cpf} onChange={(e) => setF({ ...f, cpf: mascaraCpf(e.target.value) })} placeholder="000.000.000-00" className={campo} /></label>
              {menor && (
                <label className="block space-y-1.5"><span className="text-xs text-gray-400">Parentesco</span>
                  <select required value={f.parentesco} onChange={(e) => setF({ ...f, parentesco: e.target.value })} className={campo}>
                    <option value="">Escolha…</option>
                    {["Mãe", "Pai", "Avó/Avô", "Tia/Tio", "Tutor(a) legal", "Outro responsável legal"].map((p) => <option key={p}>{p}</option>)}
                  </select></label>
              )}
            </div>
            <label className="flex items-start gap-3 text-sm text-gray-200">
              <input type="checkbox" checked={f.aceite} onChange={(e) => setF({ ...f, aceite: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#C5A059]" />
              <span>Li e concordo com {pendentes.length === 1 ? `o documento “${pendentes[0].titulo}”` : `os documentos acima (${pendentes.map((d) => d.titulo).join(", ")})`}{menor ? `, e autorizo ${dados.participante.nome}` : ""}.</span>
            </label>
            {erro && <p className="text-sm text-red-300">{erro}</p>}
            <button type="submit" disabled={enviando || !f.aceite} className="flex w-full items-center justify-center gap-2 rounded-xl bg-axon-gold py-3 text-sm font-bold text-black disabled:opacity-40">
              {enviando ? <Loader2 size={16} className="animate-spin" /> : <FileSignature size={16} />} Assinar eletronicamente
            </button>
            <p className="text-center text-xs text-gray-500">Ficam registrados nome, CPF, data, hora, IP e aparelho. Vale como assinatura eletrônica (Lei 14.063/2020).</p>
          </form>
        )}

        {dados && dados.documentos.length > 0 && pendentes.length === 0 && (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center text-sm text-emerald-200">Tudo assinado. Obrigado! Os comprovantes ficam nos links acima.</p>
        )}
        <Direitos className="text-center text-xs text-gray-600" />
      </div>
    </main>
  );
}
