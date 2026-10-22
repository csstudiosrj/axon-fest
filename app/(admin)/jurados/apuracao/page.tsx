"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Check, CloudOff, Download, Eye, EyeOff, Loader2, Lock, Plus, QrCode, RefreshCw, Trash2, Trophy, Unlock, Wifi,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiUrl } from "@/lib/base-path";
import { RegistrarOffline } from "@/lib/offline/RegistrarOffline";
import { classificar, METODOS, notaDoJurado, type MetodoApuracao } from "@/lib/apuracao/calculo";
import { perfilPorSlug } from "@/lib/perfis";
import {
  apagarRecebimento, baixarPacote, enviarRecebimento, fichasMescladas, pacoteLocal, pacotesLocais, recebimentos,
  registrarRecebimento, type CriterioA, type PacoteApuracao, type Recebimento,
} from "./dados";
import { LeitorQr } from "./LeitorQr";

type Aba = "receber" | "notas" | "classificacao" | "criterios";

const ABAS: { id: Aba; nome: string }[] = [
  { id: "receber", nome: "Receber notas" },
  { id: "notas", nome: "Notas por jurado" },
  { id: "classificacao", nome: "Classificação" },
  { id: "criterios", nome: "Critérios e método" },
];

const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 });

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const at = () => setOnline(navigator.onLine);
    at();
    window.addEventListener("online", at);
    window.addEventListener("offline", at);
    return () => { window.removeEventListener("online", at); window.removeEventListener("offline", at); };
  }, []);
  return online;
}

export default function ApuracaoPage({ searchParams }: { searchParams: Promise<{ evento?: string }> }) {
  const params = use(searchParams);
  const online = useOnline();
  const [eventos, setEventos] = useState<{ id: string; nome: string }[]>([]);
  const [eventoId, setEventoId] = useState<string>(params.evento ?? "");
  const [pacote, setPacote] = useState<PacoteApuracao | null>(null);
  const [recs, setRecs] = useState<Recebimento[]>([]);
  const [aba, setAba] = useState<Aba>("receber");
  const [carregando, setCarregando] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const mostrar = (tipo: "ok" | "erro", texto: string) => {
    setAviso({ tipo, texto });
    window.setTimeout(() => setAviso(null), 5000);
  };

  // Eventos: do servidor quando online, senão os preparados neste aparelho
  useEffect(() => {
    let vivo = true;
    (async () => {
      const locais = (await pacotesLocais()).map((p) => ({ id: p.evento.id, nome: p.evento.nome }));
      let lista = locais;
      if (navigator.onLine) {
        // Só eventos da própria produtora (eventos públicos de outras também são visíveis pelo RLS)
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data: eu } = user
          ? await supabase.from("usuarios").select("role, produtora_id").eq("id", user.id).maybeSingle()
          : { data: null };
        let consulta = supabase.from("eventos").select("id, nome").order("data_inicio", { ascending: false });
        if (eu?.role !== "super_admin") consulta = consulta.eq("produtora_id", eu?.produtora_id ?? "");
        const { data } = await consulta;
        if (data) lista = [...data, ...locais.filter((l) => !data.some((d) => d.id === l.id))];
      }
      if (!vivo) return;
      setEventos(lista);
      setEventoId((atual) => atual || lista[0]?.id || "");
    })();
    return () => { vivo = false; };
  }, []);

  const recarregar = useCallback(async (baixar: boolean) => {
    if (!eventoId) return;
    setCarregando(true);
    try {
      const p = baixar && navigator.onLine ? await baixarPacote(eventoId) : (await pacoteLocal(eventoId)) ?? (navigator.onLine ? await baixarPacote(eventoId) : null);
      setPacote(p ?? null);
      setRecs(await recebimentos(eventoId));
    } catch (e) {
      mostrar("erro", e instanceof Error ? e.message : "Falha ao carregar.");
      setPacote((await pacoteLocal(eventoId)) ?? null);
    } finally {
      setCarregando(false);
    }
  }, [eventoId]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!eventoId) return;
      const p = (await pacoteLocal(eventoId)) ?? null;
      const r = await recebimentos(eventoId);
      if (!vivo) return;
      setPacote(p);
      setRecs(r);
      if (navigator.onLine) {
        baixarPacote(eventoId).then((novo) => vivo && setPacote(novo)).catch(() => {});
      }
    })();
    return () => { vivo = false; };
  }, [eventoId]);

  // Envia recebimentos pendentes quando há internet
  const enviarPendentes = useCallback(async () => {
    if (!eventoId || !navigator.onLine) return;
    const lista = (await recebimentos(eventoId)).filter((r) => r.status !== "enviado");
    if (!lista.length) return;
    for (const r of lista) await enviarRecebimento(r);
    await recarregar(true);
  }, [eventoId, recarregar]);

  useEffect(() => {
    if (!online || !eventoId) return;
    recebimentos(eventoId)
      .then((lista) => (lista.some((r) => r.status !== "enviado") ? enviarPendentes() : undefined))
      .catch(() => {});
  }, [online, eventoId, enviarPendentes]);

  const aoLerQr = useCallback(async (r: { evento: string; jurado: string; dados: string }) => {
    setLendo(false);
    if (!pacote) return;
    if (r.evento !== pacote.evento.id) {
      mostrar("erro", "Este QR é de outro evento. Selecione o evento correto e leia de novo.");
      return;
    }
    try {
      const rec = await registrarRecebimento(pacote, r.jurado, r.dados);
      const nome = pacote.jurados.find((j) => j.id === r.jurado)?.nome ?? "Jurado";
      mostrar("ok", `${rec.fichas.length} ficha(s) de ${nome} recebida(s)${navigator.onLine ? "" : " — serão enviadas quando houver internet"}.`);
      if (navigator.onLine) await enviarRecebimento(rec);
      setRecs(await recebimentos(pacote.evento.id));
      if (navigator.onLine) await recarregar(true);
    } catch (e) {
      mostrar("erro", e instanceof Error ? e.message : "Falha ao ler as notas.");
    }
  }, [pacote, recarregar]);

  const fichas = useMemo(() => (pacote ? fichasMescladas(pacote, recs) : []), [pacote, recs]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <RegistrarOffline />
      {lendo && <LeitorQr onCompleto={aoLerQr} onFechar={() => setLendo(false)} />}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/jurados" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-white"><ArrowLeft size={13} /> Jurados</Link>
          <h1 className="mt-2 text-xl font-semibold text-white">Apuração</h1>
          <p className="mt-1 text-sm text-gray-400">Receba as notas dos jurados (inclusive sem internet), confira e publique o resultado.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${online ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>
          {online ? <Wifi size={13} /> : <CloudOff size={13} />} {online ? "Online" : "Offline — usando dados deste aparelho"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-axon-border bg-axon-panel p-4">
        <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}
          className="min-w-[240px] flex-1 rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white">
          {eventos.length === 0 && <option value="">Nenhum evento</option>}
          {eventos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <button type="button" disabled={!online || carregando || !eventoId} onClick={() => recarregar(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-axon-border px-4 py-2.5 text-sm text-gray-200 hover:text-white disabled:opacity-40">
          {carregando ? <Loader2 size={15} className="animate-spin" /> : pacote ? <RefreshCw size={15} /> : <Download size={15} />}
          {pacote ? "Atualizar dados" : "Preparar este aparelho"}
        </button>
        {pacote && <p className="text-xs text-gray-500">Dados deste aparelho de {new Date(pacote.baixado_em).toLocaleString("pt-BR")}</p>}
      </div>

      {aviso && (
        <div role="status" className={`rounded-lg px-4 py-3 text-sm ${aviso.tipo === "ok" ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200"}`}>{aviso.texto}</div>
      )}

      {!pacote ? (
        <div className="rounded-xl border border-axon-border bg-axon-panel p-8 text-sm text-gray-400">
          {online ? "Selecione um evento e prepare este aparelho para usar a apuração." : "Este evento não foi preparado neste aparelho. Conecte-se à internet e toque em “Preparar este aparelho”."}
        </div>
      ) : (
        <>
          <nav className="flex gap-1 overflow-x-auto border-b border-axon-border">
            {ABAS.map((a) => (
              <button key={a.id} type="button" onClick={() => setAba(a.id)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm ${aba === a.id ? "border-axon-gold text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
                {a.nome}
              </button>
            ))}
          </nav>

          {aba === "receber" && (
            <AbaReceber pacote={pacote} recs={recs} online={online} onLer={() => setLendo(true)}
              onReenviar={async (r) => { await enviarRecebimento(r); setRecs(await recebimentos(pacote.evento.id)); if (online) await recarregar(true); }}
              onApagar={async (r) => { await apagarRecebimento(r.id); setRecs(await recebimentos(pacote.evento.id)); }} />
          )}
          {aba === "notas" && <AbaNotas pacote={pacote} fichas={fichas} online={online} onMudou={() => recarregar(true)} mostrar={mostrar} />}
          {aba === "classificacao" && <AbaClassificacao pacote={pacote} fichas={fichas} online={online} onMudou={() => recarregar(true)} mostrar={mostrar} />}
          {aba === "criterios" && <AbaCriterios pacote={pacote} online={online} onMudou={() => recarregar(true)} mostrar={mostrar} />}
        </>
      )}
    </div>
  );
}

// ── Receber notas ──────────────────────────────────────────────────────────

function AbaReceber({ pacote, recs, online, onLer, onReenviar, onApagar }: {
  pacote: PacoteApuracao; recs: Recebimento[]; online: boolean;
  onLer: () => void; onReenviar: (r: Recebimento) => void; onApagar: (r: Recebimento) => void;
}) {
  const nome = (id: string) => pacote.jurados.find((j) => j.id === id)?.nome ?? "Jurado";
  const ordenados = [...recs].sort((a, b) => b.lido_em.localeCompare(a.lido_em));
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="rounded-xl border border-axon-border bg-axon-panel p-6">
        <h2 className="font-semibold text-white">Ler QR do jurado</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          No celular do jurado: <span className="text-gray-200">Entregar por QR</span>. Aqui, abra a câmera e aponte para a tela dele até completar todos os quadros.
          As notas são abertas com a chave do jurado e conferidas de novo pelo servidor.
        </p>
        <button type="button" onClick={onLer}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-axon-gold px-4 py-3 text-sm font-semibold text-black">
          <QrCode size={17} /> Abrir câmera
        </button>
        <div className="mt-6 border-t border-axon-border pt-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">Jurados do evento</p>
          <ul className="mt-3 space-y-2 text-sm">
            {pacote.jurados.map((j) => {
              const qtd = pacote.fichas.filter((f) => f.j === j.id && f.f).length;
              return (
                <li key={j.id} className="flex justify-between gap-4">
                  <span className="text-gray-200">{j.nome}</span>
                  <span className="tabular-nums text-gray-500">{qtd}/{pacote.apresentacoes.length} no servidor</span>
                </li>
              );
            })}
            {pacote.jurados.length === 0 && <li className="text-gray-500">Nenhum jurado designado. Designe em Eventos → Jurados.</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-axon-border bg-axon-panel">
        <h2 className="border-b border-axon-border px-6 py-4 font-semibold text-white">Recebidos neste aparelho</h2>
        {ordenados.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">Nenhum QR lido ainda.</p>
        ) : (
          <ul className="divide-y divide-axon-border">
            {ordenados.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="text-sm text-white">{nome(r.jurado)} · {r.fichas.length} ficha(s)</p>
                  <p className="text-xs text-gray-500">Lido em {new Date(r.lido_em).toLocaleString("pt-BR")}{r.mensagem ? ` · ${r.mensagem}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === "enviado" && <span className="inline-flex items-center gap-1 text-xs text-emerald-300"><Check size={13} /> No servidor</span>}
                  {r.status === "pendente" && <span className="text-xs text-amber-300">Aguardando internet</span>}
                  {r.status === "erro" && <span className="text-xs text-red-300">Erro</span>}
                  {r.status !== "enviado" && online && (
                    <button type="button" onClick={() => onReenviar(r)} className="rounded-md border border-axon-border px-2.5 py-1.5 text-xs text-gray-200">Enviar</button>
                  )}
                  {r.status === "enviado" && (
                    <button type="button" onClick={() => onApagar(r)} aria-label="Remover da lista" className="p-1.5 text-gray-500 hover:text-red-300"><Trash2 size={14} /></button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Notas por jurado ───────────────────────────────────────────────────────

function AbaNotas({ pacote, fichas, online, onMudou, mostrar }: {
  pacote: PacoteApuracao; fichas: ReturnType<typeof fichasMescladas>; online: boolean;
  onMudou: () => void; mostrar: (t: "ok" | "erro", m: string) => void;
}) {
  const metodo = pacote.evento.metodo_apuracao as MetodoApuracao;
  const mapa = new Map(fichas.map((f) => [`${f.a}:${f.j}`, f]));
  const criterios = pacote.criterios.map((c) => ({ id: c.id, nome: c.nome, peso: c.peso, ordem: c.ordem }));

  const reabrir = async (a: string, j: string) => {
    if (!window.confirm("Reabrir esta ficha? O jurado poderá alterar as notas e precisará finalizar de novo.")) return;
    const { error } = await createClient().from("avaliacoes_fichas")
      .update({ finalizada_em: null, atualizado_em: new Date().toISOString() })
      .eq("evento_id", pacote.evento.id).eq("apresentacao_id", a).eq("avaliador_id", j);
    if (error) mostrar("erro", error.message); else { mostrar("ok", "Ficha reaberta. O jurado precisa atualizar o evento no celular."); onMudou(); }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-axon-border bg-axon-panel">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-axon-border text-left text-xs uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3 font-medium">Apresentação</th>
            {pacote.jurados.map((j) => <th key={j.id} className="px-4 py-3 text-right font-medium">{j.nome}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-axon-border">
          {pacote.apresentacoes.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3">
                <p className="text-white">{a.nome}</p>
                <p className="text-xs text-gray-500">{a.grupo} · {a.categoria}</p>
              </td>
              {pacote.jurados.map((j) => {
                const f = mapa.get(`${a.id}:${j.id}`);
                const nota = f ? notaDoJurado({ apresentacao_id: a.id, avaliador_id: j.id, finalizada: !!f.f, notas: f.notas }, criterios, metodo) : null;
                return (
                  <td key={j.id} className="px-4 py-3 text-right">
                    {!f ? <span className="text-gray-600">—</span> : (
                      <div className="inline-flex items-center gap-2">
                        <span className={`tabular-nums ${f.f ? "text-white" : "text-gray-500"}`} title={f.c ?? undefined}>{fmt(nota)}</span>
                        {f.pendente && <span className="text-[10px] text-amber-300" title="Recebido por QR, ainda não enviado">QR</span>}
                        {f.f ? (
                          online && !f.pendente ? (
                            <button type="button" onClick={() => reabrir(a.id, j.id)} title="Reabrir ficha" className="text-gray-500 hover:text-axon-gold"><Lock size={13} /></button>
                          ) : <Lock size={13} className="text-gray-600" />
                        ) : <Unlock size={13} className="text-amber-300/70" aria-label="Não finalizada" />}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-axon-border px-4 py-3 text-xs text-gray-500">
        Nota exibida = média do jurado pelo método atual ({METODOS[metodo].nome}). Passe o mouse para ver o comentário. Só fichas finalizadas entram na classificação.
      </p>
    </div>
  );
}

// ── Classificação ──────────────────────────────────────────────────────────

function AbaClassificacao({ pacote, fichas, online, onMudou, mostrar }: {
  pacote: PacoteApuracao; fichas: ReturnType<typeof fichasMescladas>; online: boolean;
  onMudou: () => void; mostrar: (t: "ok" | "erro", m: string) => void;
}) {
  const [publicando, setPublicando] = useState(false);
  const metodo = pacote.evento.metodo_apuracao as MetodoApuracao;
  const grupos = useMemo(() => classificar(
    pacote.apresentacoes,
    fichas.map((f) => ({ apresentacao_id: f.a, avaliador_id: f.j, finalizada: !!f.f, notas: f.notas })),
    pacote.criterios.map((c) => ({ id: c.id, nome: c.nome, peso: c.peso, ordem: c.ordem })),
    metodo,
    perfilPorSlug(pacote.perfil).formacoes
  ), [pacote, fichas, metodo]);
  const nomeJurado = (id: string) => pacote.jurados.find((j) => j.id === id)?.nome ?? "Jurado";
  const pendentesQr = fichas.some((f) => f.pendente);
  const empates = grupos.some((g) => g.linhas.some((l) => l.empatada));

  const salvarDesempate = async (apresentacaoId: string, valor: string) => {
    const n = valor === "" ? null : Number(valor);
    const { error } = await createClient().from("apresentacoes").update({ desempate: n }).eq("id", apresentacaoId);
    if (error) mostrar("erro", error.message); else onMudou();
  };

  const publicar = async (publicar: boolean) => {
    setPublicando(true);
    try {
      const res = await fetch(apiUrl("/api/apuracao/publicar"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento_id: pacote.evento.id, publicar }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; empates?: string[] };
      if (!res.ok) mostrar("erro", json.error + (json.empates?.length ? ` ${json.empates.slice(0, 3).join("; ")}` : ""));
      else { mostrar("ok", publicar ? "Resultado publicado na página do evento." : "Resultado retirado da página do evento."); onMudou(); }
    } finally {
      setPublicando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-axon-border bg-axon-panel p-5">
        <div>
          <p className="text-sm text-white">Método: <span className="text-axon-gold">{METODOS[metodo].nome}</span></p>
          <p className="mt-1 text-xs text-gray-500">{METODOS[metodo].descricao}</p>
          {pacote.evento.resultado_publicado_em && (
            <p className="mt-2 text-xs text-emerald-300">Publicado em {new Date(pacote.evento.resultado_publicado_em).toLocaleString("pt-BR")}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {pacote.evento.resultado_publicado_em && (
            <button type="button" disabled={!online || publicando} onClick={() => publicar(false)}
              className="rounded-lg border border-axon-border px-4 py-2.5 text-sm text-gray-200 disabled:opacity-40">Retirar resultado</button>
          )}
          <button type="button" disabled={!online || publicando || pendentesQr || empates} onClick={() => publicar(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40">
            {publicando ? <Loader2 size={15} className="animate-spin" /> : <Trophy size={15} />}
            {pacote.evento.resultado_publicado_em ? "Republicar resultado" : "Publicar resultado"}
          </button>
        </div>
      </div>
      {(pendentesQr || empates || !online) && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {!online ? "Sem internet: a classificação abaixo usa os dados deste aparelho. Para publicar, conecte-se."
            : pendentesQr ? "Há notas recebidas por QR ainda não enviadas ao servidor."
            : "Há empates. Defina a ordem de desempate (1 = melhor colocado) nas linhas marcadas."}
        </p>
      )}

      {grupos.length === 0 && <p className="text-sm text-gray-500">Nenhuma apresentação em categoria competitiva.</p>}
      {grupos.map((g) => (
        <section key={g.chave} className="overflow-hidden rounded-xl border border-axon-border bg-axon-panel">
          <h3 className="border-b border-axon-border px-5 py-3 font-semibold text-white">{g.titulo}</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-axon-border">
              {g.linhas.map((l) => (
                <tr key={l.apresentacao.id} className={l.empatada ? "bg-amber-400/5" : ""}>
                  <td className="w-14 px-5 py-3 text-lg font-semibold tabular-nums text-axon-gold">{l.posicao ? `${l.posicao}º` : "—"}</td>
                  <td className="px-2 py-3">
                    <p className="text-white">{l.apresentacao.nome}</p>
                    <p className="text-xs text-gray-500">
                      {l.apresentacao.grupo} · {l.finalizadas}/{pacote.jurados.length} jurado(s)
                      {l.descartados.length > 0 && ` · descartadas: ${l.descartados.map(nomeJurado).join(", ")}`}
                    </p>
                  </td>
                  <td className="px-2 py-3 text-right">
                    {(l.empatada || l.apresentacao.desempate !== null) && (
                      <label className="inline-flex items-center gap-2 text-xs text-amber-200">
                        Desempate
                        <input type="number" min={1} defaultValue={l.apresentacao.desempate ?? ""} disabled={!online}
                          onBlur={(e) => salvarDesempate(l.apresentacao.id, e.target.value)}
                          className="w-14 rounded border border-axon-border bg-axon-bg px-2 py-1 text-right text-white" />
                      </label>
                    )}
                  </td>
                  <td className="w-24 px-5 py-3 text-right text-lg tabular-nums text-white">{fmt(l.nota)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

// ── Critérios e método ─────────────────────────────────────────────────────

function AbaCriterios({ pacote, online, onMudou, mostrar }: {
  pacote: PacoteApuracao; online: boolean; onMudou: () => void; mostrar: (t: "ok" | "erro", m: string) => void;
}) {
  const supabase = createClient();
  const [novo, setNovo] = useState({ nome: "", nota_min: 0, nota_max: 10, peso: 1 });
  const ordenados = [...pacote.criterios].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const temNotas = pacote.fichas.length > 0;
  const bloqueado = !online;

  const salvarEvento = async (mudanca: Record<string, unknown>) => {
    const { error } = await supabase.from("eventos").update(mudanca).eq("id", pacote.evento.id);
    if (error) mostrar("erro", error.message); else onMudou();
  };

  const adicionar = async () => {
    if (!novo.nome.trim()) return;
    if (novo.nota_max <= novo.nota_min) { mostrar("erro", "A nota máxima precisa ser maior que a mínima."); return; }
    const { error } = await supabase.from("criterios_avaliacao").insert({
      evento_id: pacote.evento.id, nome: novo.nome.trim(), nota_min: novo.nota_min, nota_max: novo.nota_max, peso: novo.peso,
      ordem: (ordenados[ordenados.length - 1]?.ordem ?? 0) + 1,
    });
    if (error) mostrar("erro", error.message); else { setNovo({ nome: "", nota_min: 0, nota_max: 10, peso: 1 }); onMudou(); }
  };

  const atualizar = async (c: CriterioA, mudanca: Partial<CriterioA>) => {
    const { error } = await supabase.from("criterios_avaliacao").update(mudanca).eq("id", c.id);
    if (error) mostrar("erro", error.message); else onMudou();
  };

  const mover = async (i: number, dir: -1 | 1) => {
    const a = ordenados[i], b = ordenados[i + dir];
    if (!a || !b) return;
    await supabase.from("criterios_avaliacao").update({ ordem: b.ordem ?? i + dir }).eq("id", a.id);
    await supabase.from("criterios_avaliacao").update({ ordem: a.ordem ?? i }).eq("id", b.id);
    onMudou();
  };

  const excluir = async (c: CriterioA) => {
    if (!window.confirm(`Excluir o critério “${c.nome}”?${temNotas ? " As notas já dadas nele serão apagadas." : ""}`)) return;
    const { error } = await supabase.from("criterios_avaliacao").delete().eq("id", c.id);
    if (error) mostrar("erro", error.message); else onMudou();
  };

  const campo = "rounded-lg border border-axon-border bg-axon-bg px-3 py-2 text-sm text-white disabled:opacity-50";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-axon-border bg-axon-panel">
        <h2 className="border-b border-axon-border px-6 py-4 font-semibold text-white">Critérios de avaliação</h2>
        {temNotas && (
          <p className="mx-6 mt-4 rounded-lg bg-amber-400/10 px-4 py-3 text-xs text-amber-100">
            Já existem notas. Mudanças de critério valem para os jurados depois que eles atualizarem o evento no celular.
          </p>
        )}
        <ul className="divide-y divide-axon-border">
          {ordenados.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
              <div className="flex flex-col">
                <button type="button" disabled={bloqueado || i === 0} onClick={() => mover(i, -1)} className="text-gray-500 hover:text-white disabled:opacity-30" aria-label="Subir"><ArrowUp size={14} /></button>
                <button type="button" disabled={bloqueado || i === ordenados.length - 1} onClick={() => mover(i, 1)} className="text-gray-500 hover:text-white disabled:opacity-30" aria-label="Descer"><ArrowDown size={14} /></button>
              </div>
              <input defaultValue={c.nome} disabled={bloqueado} onBlur={(e) => e.target.value.trim() && e.target.value !== c.nome && atualizar(c, { nome: e.target.value.trim() })} className={`${campo} min-w-[160px] flex-1`} />
              <label className="text-xs text-gray-500">de <input type="number" defaultValue={c.nota_min} disabled={bloqueado} onBlur={(e) => atualizar(c, { nota_min: Number(e.target.value) })} className={`${campo} w-16`} /></label>
              <label className="text-xs text-gray-500">a <input type="number" defaultValue={c.nota_max} disabled={bloqueado} onBlur={(e) => atualizar(c, { nota_max: Number(e.target.value) })} className={`${campo} w-16`} /></label>
              <label className="text-xs text-gray-500">peso <input type="number" step="0.5" min="0.5" defaultValue={c.peso} disabled={bloqueado} onBlur={(e) => Number(e.target.value) > 0 && atualizar(c, { peso: Number(e.target.value) })} className={`${campo} w-16`} /></label>
              <button type="button" disabled={bloqueado} onClick={() => excluir(c)} className="p-1.5 text-gray-500 hover:text-red-300 disabled:opacity-30" aria-label="Excluir"><Trash2 size={15} /></button>
            </li>
          ))}
          {ordenados.length === 0 && <li className="px-6 py-6 text-sm text-gray-500">Nenhum critério cadastrado.</li>}
        </ul>
        <div className="flex flex-wrap items-end gap-3 border-t border-axon-border px-6 py-4">
          <input placeholder="Novo critério (ex.: Técnica)" value={novo.nome} disabled={bloqueado} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} className={`${campo} min-w-[180px] flex-1`} />
          <label className="text-xs text-gray-500">de <input type="number" value={novo.nota_min} disabled={bloqueado} onChange={(e) => setNovo({ ...novo, nota_min: Number(e.target.value) })} className={`${campo} w-16`} /></label>
          <label className="text-xs text-gray-500">a <input type="number" value={novo.nota_max} disabled={bloqueado} onChange={(e) => setNovo({ ...novo, nota_max: Number(e.target.value) })} className={`${campo} w-16`} /></label>
          <label className="text-xs text-gray-500">peso <input type="number" step="0.5" min="0.5" value={novo.peso} disabled={bloqueado} onChange={(e) => setNovo({ ...novo, peso: Number(e.target.value) })} className={`${campo} w-16`} /></label>
          <button type="button" disabled={bloqueado || !novo.nome.trim()} onClick={adicionar}
            className="inline-flex items-center gap-1.5 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"><Plus size={15} /> Adicionar</button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-axon-border bg-axon-panel p-6">
          <h2 className="font-semibold text-white">Método de apuração</h2>
          <div className="mt-4 space-y-2">
            {(Object.keys(METODOS) as MetodoApuracao[]).map((m) => (
              <label key={m} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${pacote.evento.metodo_apuracao === m ? "border-axon-gold/60 bg-axon-gold-dim" : "border-axon-border"}`}>
                <input type="radio" name="metodo" checked={pacote.evento.metodo_apuracao === m} disabled={bloqueado}
                  onChange={() => salvarEvento({ metodo_apuracao: m })} className="mt-1 accent-[#C5A059]" />
                <span>
                  <span className="block text-sm text-white">{METODOS[m].nome}</span>
                  <span className="block text-xs text-gray-500">{METODOS[m].descricao}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-axon-border bg-axon-panel p-6">
          <h2 className="font-semibold text-white">Comentários dos jurados</h2>
          <p className="mt-2 text-xs text-gray-500">Se liberado, cada grupo vê os comentários das próprias apresentações depois que o resultado for publicado. O nome do jurado não aparece.</p>
          <button type="button" disabled={bloqueado} onClick={() => salvarEvento({ liberar_comentarios: !pacote.evento.liberar_comentarios })}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-axon-border px-4 py-2.5 text-sm text-gray-200 disabled:opacity-40">
            {pacote.evento.liberar_comentarios ? <><Eye size={15} className="text-emerald-300" /> Liberados para os grupos</> : <><EyeOff size={15} /> Só para a produção</>}
          </button>
        </div>
      </div>
    </div>
  );
}
