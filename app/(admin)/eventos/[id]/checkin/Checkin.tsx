"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, QrCode, Search } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { Aviso, Cartao, dataBR } from "../_ui";

export interface ApresentacaoCheckin {
  id: string;
  nome: string;
  ordem: number | null;
  data: string | null;
  grupo: string;
  categoria: string;
  pessoas: { id: string; nome: string; presente: boolean }[];
}

// Check-in no dia: a produção marca quem se apresentou. O grupo mostra o QR da
// apresentação (no portal) e a câmera do celular abre esta tela já nela.
export function Checkin({ apresentacoes, destaque, termoApresentacao }: { apresentacoes: ApresentacaoCheckin[]; destaque: string | null; termoApresentacao: string }) {
  const router = useRouter();
  const [lista, setLista] = useState(apresentacoes);
  // Dados novos do servidor (router.refresh) substituem a lista local
  const [base, setBase] = useState(apresentacoes);
  if (base !== apresentacoes) {
    setBase(apresentacoes);
    setLista(apresentacoes);
  }
  const [busca, setBusca] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    if (destaque) document.getElementById(`ap-${destaque}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [destaque]);

  const termo = busca.trim().toLowerCase();
  const filtradas = useMemo(() => (termo
    ? lista.filter((a) => [a.nome, a.grupo, a.categoria, ...a.pessoas.map((p) => p.nome)].some((t) => t.toLowerCase().includes(termo)))
    : lista), [lista, termo]);
  const total = lista.reduce((s, a) => s + a.pessoas.length, 0);
  const presentes = lista.reduce((s, a) => s + a.pessoas.filter((p) => p.presente).length, 0);

  const marcar = async (apId: string, corpo: { participante_id?: string; todos?: boolean; presente: boolean }) => {
    setOcupado(apId + (corpo.participante_id ?? "todos"));
    setErro(null);
    // Atualiza na hora; se falhar, volta
    const antes = lista;
    setLista((l) => l.map((a) => (a.id !== apId ? a : { ...a, pessoas: a.pessoas.map((p) => (corpo.todos || p.id === corpo.participante_id ? { ...p, presente: corpo.presente } : p)) })));
    const res = await fetch(apiUrl("/api/checkin"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apresentacao_id: apId, ...corpo }) });
    if (!res.ok) {
      setLista(antes);
      setErro(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Não foi possível registrar.");
    } else router.refresh();
    setOcupado(null);
  };

  return (
    <div className="space-y-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Check-in" descricao={`Marque quem se apresentou em cada ${termoApresentacao}. Só quem tem check-in recebe o certificado daquela ${termoApresentacao}.`}
        acao={<span className="rounded-full border border-axon-border px-3 py-1 text-sm tabular-nums text-gray-200">{presentes} de {total} presentes</span>}>
        <div className="space-y-3 px-5 py-4">
          <p className="flex items-start gap-2 rounded-lg border border-axon-border bg-axon-bg px-3 py-2 text-xs text-gray-400">
            <QrCode size={14} className="mt-0.5 shrink-0 text-axon-gold" />
            Mais rápido: no portal, cada grupo tem o QR Code de cada {termoApresentacao}. Aponte a câmera do celular (logado no painel) e esta tela abre direto nela.
          </p>
          <label className="relative block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={`Buscar ${termoApresentacao}, grupo ou pessoa`}
              className="w-full rounded-lg border border-axon-border bg-axon-bg py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-axon-gold" />
          </label>
        </div>
      </Cartao>

      {filtradas.length === 0 && <p className="rounded-xl border border-dashed border-axon-border px-6 py-10 text-center text-sm text-gray-400">Nada encontrado.</p>}
      {filtradas.map((a) => {
        const todos = a.pessoas.length > 0 && a.pessoas.every((p) => p.presente);
        return (
          <section key={a.id} id={`ap-${a.id}`} className={`scroll-mt-20 rounded-xl border bg-axon-panel ${a.id === destaque ? "border-axon-gold" : "border-axon-border"}`}>
            <div className="flex flex-wrap items-center gap-3 border-b border-axon-border px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{a.ordem ? `${a.ordem}. ` : ""}{a.nome}</p>
                <p className="text-xs text-gray-500">{a.grupo}{a.categoria ? ` · ${a.categoria}` : ""}{a.data ? ` · ${dataBR(a.data)}` : ""}</p>
              </div>
              {a.pessoas.length > 0 && (
                <button type="button" disabled={!!ocupado} onClick={() => marcar(a.id, { todos: true, presente: !todos })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${todos ? "border border-axon-border text-gray-300" : "bg-axon-gold text-black"}`}>
                  {todos ? "Desmarcar todos" : "Todos presentes"}
                </button>
              )}
            </div>
            {a.pessoas.length === 0 ? (
              <p className="px-5 py-3 text-xs text-gray-500">Sem elenco cadastrado nesta {termoApresentacao}.</p>
            ) : (
              <ul className="grid gap-1 p-2 sm:grid-cols-2">
                {a.pessoas.map((p) => (
                  <li key={p.id}>
                    <button type="button" disabled={!!ocupado} onClick={() => marcar(a.id, { participante_id: p.id, presente: !p.presente })}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${p.presente ? "bg-emerald-400/10 text-emerald-200" : "text-gray-300 hover:bg-white/5"}`}>
                      {ocupado === a.id + p.id ? <Loader2 size={16} className="animate-spin" /> : p.presente ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} className="text-gray-600" />}
                      <span className="truncate">{p.nome}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
