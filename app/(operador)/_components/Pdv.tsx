"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  Banknote, CheckCircle, CloudOff, CreditCard, LayoutDashboard, Lock, LogOut, Minus, Plus, QrCode, ReceiptText, RefreshCw, Trash2, Wifi, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RegistrarOffline, limparDadosOffline } from "@/lib/offline/RegistrarOffline";
import { pixCopiaECola } from "@/lib/pdv/pix";
import {
  baixarPacote, bloquearCaixa, enviarPendentes, limparAntigos, pacoteLocal, registrarVenda, vendasDoAparelho,
  type ItemVendido, type PacotePdv, type ProdutoPdv,
} from "@/lib/pdv/local";
import { confirmar } from "@/app/_components/Dialogos";

type Modo = "cantina" | "bilheteria";
type Forma = ItemVendido["forma_pagamento"];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const NOME_FORMA: Record<Forma, string> = { dinheiro: "Dinheiro", pix: "PIX", cartao: "Cartão" };
const CHAVE_EVENTO = "arxum-pdv-evento";

function lerEvento() {
  try { return localStorage.getItem(CHAVE_EVENTO) ?? ""; } catch { return ""; }
}

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

// ── Pagamentos ─────────────────────────────────────────────────────────────

function Janela({ titulo, icone, onFechar, children }: { titulo: string; icone: React.ReactNode; onFechar: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center sm:p-4" onClick={onFechar}>
      <div className="w-full max-w-sm space-y-5 rounded-t-2xl border border-axon-border bg-axon-panel p-6 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">{icone} {titulo}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PagamentoPix({ total, pix, onConfirmar, onFechar }: { total: number; pix: PacotePdv["pix"]; onConfirmar: () => void; onFechar: () => void }) {
  const [qr, setQr] = useState("");
  const codigo = useMemo(() => (pix ? pixCopiaECola(pix.chave, pix.nome, pix.cidade, total) : ""), [pix, total]);
  useEffect(() => {
    if (codigo) QRCode.toDataURL(codigo, { width: 280, margin: 2 }).then(setQr).catch(() => setQr(""));
  }, [codigo]);

  return (
    <Janela titulo="PIX" icone={<QrCode size={20} className="text-axon-gold" />} onFechar={onFechar}>
      <p className="text-center text-3xl font-bold text-axon-gold">{brl(total)}</p>
      {!pix ? (
        <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center text-sm text-yellow-300">
          A chave PIX não foi configurada. Peça ao organizador para cadastrar em PDV & Bilheteria → Configurações.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {qr
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={qr} alt="QR Code PIX" width={220} height={220} className="rounded-xl bg-white p-2" />
            : <div className="h-[220px] w-[220px] animate-pulse rounded-xl bg-axon-bg" />}
          <p className="text-center text-xs text-gray-500">Recebedor: {pix.nome}. Confira o valor no aparelho do cliente antes de confirmar.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onFechar} className="rounded-xl border border-axon-border py-3 text-sm text-gray-300">Cancelar</button>
        <button type="button" onClick={onConfirmar} disabled={!pix}
          className="flex items-center justify-center gap-2 rounded-xl bg-axon-gold py-3 text-sm font-bold text-black disabled:opacity-40">
          <CheckCircle size={16} /> Recebido
        </button>
      </div>
    </Janela>
  );
}

function PagamentoDinheiro({ total, onConfirmar, onFechar }: { total: number; onConfirmar: () => void; onFechar: () => void }) {
  const [valor, setValor] = useState("");
  const recebido = Number(valor.replace(/\./g, "").replace(",", ".")) || 0;
  const atalhos = [...new Set([Math.ceil(total), Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, 100])].filter((v) => v >= total).slice(0, 4);
  return (
    <Janela titulo="Dinheiro" icone={<Banknote size={20} className="text-yellow-400" />} onFechar={onFechar}>
      <p className="text-center text-3xl font-bold text-white">{brl(total)}</p>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-gray-400">Valor recebido</span>
        <input autoFocus inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d,.]/g, ""))} placeholder="0,00"
          className="mt-1.5 w-full rounded-xl border border-axon-border bg-axon-bg px-4 py-3 text-right text-2xl font-bold text-white outline-none focus:border-axon-gold" />
      </label>
      <div className="flex flex-wrap gap-2">
        {atalhos.map((v) => (
          <button key={v} type="button" onClick={() => setValor(String(v).replace(".", ","))} className="rounded-lg border border-axon-border px-3 py-1.5 text-sm text-gray-200">{brl(v)}</button>
        ))}
      </div>
      {recebido >= total && (
        <div className="rounded-xl border border-axon-gold/30 bg-axon-gold/10 p-4 text-center">
          <p className="text-xs text-gray-400">Troco</p>
          <p className="text-3xl font-bold text-axon-gold">{brl(recebido - total)}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onFechar} className="rounded-xl border border-axon-border py-3 text-sm text-gray-300">Cancelar</button>
        <button type="button" onClick={onConfirmar} disabled={recebido < total} className="rounded-xl bg-axon-gold py-3 text-sm font-bold text-black disabled:opacity-40">Confirmar</button>
      </div>
    </Janela>
  );
}

function PagamentoCartao({ total, onConfirmar, onFechar }: { total: number; onConfirmar: () => void; onFechar: () => void }) {
  return (
    <Janela titulo="Cartão" icone={<CreditCard size={20} className="text-sky-300" />} onFechar={onFechar}>
      <p className="text-center text-3xl font-bold text-white">{brl(total)}</p>
      <p className="text-center text-sm text-gray-400">Passe o valor na maquininha e confirme quando o pagamento for aprovado.</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onFechar} className="rounded-xl border border-axon-border py-3 text-sm text-gray-300">Cancelar</button>
        <button type="button" onClick={onConfirmar} className="flex items-center justify-center gap-2 rounded-xl bg-axon-gold py-3 text-sm font-bold text-black"><CheckCircle size={16} /> Aprovado</button>
      </div>
    </Janela>
  );
}

// ── Resumo do caixa (vendas feitas neste aparelho hoje) ─────────────────────

function Resumo({ vendas, pendentes, onFechar }: { vendas: ItemVendido[]; pendentes: number; onFechar: () => void }) {
  const hoje = new Date().toDateString();
  const doDia = vendas.filter((v) => new Date(v.created_at).toDateString() === hoje);
  const porForma = (["dinheiro", "pix", "cartao"] as Forma[]).map((f) => ({
    forma: f, total: doDia.filter((v) => v.forma_pagamento === f).reduce((s, v) => s + v.quantidade * v.preco_unitario, 0),
  }));
  const atendimentos = new Set(doDia.map((v) => v.venda_id)).size;
  return (
    <Janela titulo="Resumo de hoje" icone={<ReceiptText size={20} className="text-axon-gold" />} onFechar={onFechar}>
      <ul className="divide-y divide-axon-border rounded-xl border border-axon-border">
        {porForma.map((f) => (
          <li key={f.forma} className="flex justify-between px-4 py-3 text-sm"><span className="text-gray-300">{NOME_FORMA[f.forma]}</span><span className="font-semibold tabular-nums text-white">{brl(f.total)}</span></li>
        ))}
        <li className="flex justify-between px-4 py-3 text-sm"><span className="font-semibold text-white">Total</span><span className="font-bold tabular-nums text-axon-gold">{brl(porForma.reduce((s, f) => s + f.total, 0))}</span></li>
      </ul>
      <p className="text-xs text-gray-400">{atendimentos} {atendimentos === 1 ? "atendimento" : "atendimentos"} neste aparelho. {pendentes ? `${pendentes} item(ns) ainda não enviado(s) ao servidor.` : "Tudo enviado ao servidor."}</p>
    </Janela>
  );
}

// ── Tela ───────────────────────────────────────────────────────────────────

// gestao: admin/financeiro, que alternam entre caixa e bilheteria e voltam ao painel sem sair da conta
export function Pdv({ modo, gestao }: { modo: Modo; gestao: boolean }) {
  const router = useRouter();
  const online = useOnline();
  const [pacote, setPacote] = useState<PacotePdv | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [eventoId, setEventoId] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [setor, setSetor] = useState<"cantina" | "lojinha">("cantina");
  const [carrinho, setCarrinho] = useState<{ produto: ProdutoPdv; quantidade: number }[]>([]);
  const [pagando, setPagando] = useState<Forma | null>(null);
  const [vendaOk, setVendaOk] = useState(false);
  const [vendas, setVendas] = useState<ItemVendido[]>([]);
  const [resumo, setResumo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const recarregarVendas = useCallback(async (usuarioId: string) => setVendas(await vendasDoAparelho(usuarioId)), []);

  const sincronizar = useCallback(async (p: PacotePdv | null) => {
    if (!p || !navigator.onLine) return;
    setEnviando(true);
    await enviarPendentes(p.usuario.id).catch(() => undefined);
    await recarregarVendas(p.usuario.id);
    setEnviando(false);
  }, [recarregarVendas]);

  // Abre com o que está no aparelho e atualiza pela internet, se houver
  useEffect(() => {
    (async () => {
      const local = await pacoteLocal().catch(() => undefined);
      const eventoSalvo = lerEvento();
      if (local) {
        setPacote(local);
        setEventoId(local.eventos.some((e) => e.id === eventoSalvo) ? eventoSalvo : local.eventos[0]?.id ?? "");
        await recarregarVendas(local.usuario.id);
      }
      if (navigator.onLine) {
        try {
          const novo = await baixarPacote();
          if (local && local.usuario.id !== novo.usuario.id) {
            await bloquearCaixa();
            window.location.reload();
            return;
          }
          setPacote(novo);
          setEventoId((atual) => (novo.eventos.some((e) => e.id === (atual || eventoSalvo)) ? atual || eventoSalvo : novo.eventos[0]?.id ?? ""));
          await sincronizar(novo);
          await limparAntigos();
        } catch (e) {
          if (!local) setErro(e instanceof Error ? e.message : "Não foi possível carregar o caixa.");
        }
      } else if (!local) {
        setErro("Sem internet e sem dados neste aparelho. Abra o caixa uma vez com conexão.");
      }
    })();
  }, [recarregarVendas, sincronizar]);

  // Internet voltou: envia o que ficou guardado
  const pacoteAtual = useRef<PacotePdv | null>(null);
  useEffect(() => { pacoteAtual.current = pacote; }, [pacote]);
  useEffect(() => {
    const aoVoltar = () => void sincronizar(pacoteAtual.current);
    window.addEventListener("online", aoVoltar);
    return () => window.removeEventListener("online", aoVoltar);
  }, [sincronizar]);

  const doModo = useMemo(() => (pacote?.produtos ?? []).filter((p) => p.tipo === modo), [pacote, modo]);
  // No caixa: Cantina e Lojinha no topo (só se houver produtos dos dois)
  const temLojinha = modo === "cantina" && doModo.some((p) => p.setor === "lojinha");
  const temCantina = modo === "cantina" && doModo.some((p) => p.setor !== "lojinha");
  const setorAtual = !temLojinha ? "cantina" : !temCantina ? "lojinha" : setor;
  const produtos = useMemo(() => (modo === "cantina" ? doModo.filter((p) => (p.setor === "lojinha" ? "lojinha" : "cantina") === setorAtual) : doModo), [doModo, modo, setorAtual]);
  const categorias = useMemo(() => ["Todos", ...new Set(produtos.map((p) => p.categoria))], [produtos]);
  const visiveis = categoria === "Todos" ? produtos : produtos.filter((p) => p.categoria === categoria);
  const total = carrinho.reduce((s, i) => s + i.produto.preco * i.quantidade, 0);
  const pendentes = vendas.filter((v) => v.enviado === 0).length;

  const mudar = (p: ProdutoPdv, delta: number) =>
    setCarrinho((c) => {
      const atual = c.find((i) => i.produto.id === p.id);
      if (!atual) return delta > 0 ? [...c, { produto: p, quantidade: 1 }] : c;
      return c.map((i) => (i.produto.id === p.id ? { ...i, quantidade: i.quantidade + delta } : i)).filter((i) => i.quantidade > 0);
    });

  const escolherEvento = (id: string) => {
    setEventoId(id);
    try { localStorage.setItem(CHAVE_EVENTO, id); } catch { /* sem armazenamento: só nesta sessão */ }
  };

  const concluir = async (forma: Forma) => {
    if (!pacote || !carrinho.length) return;
    const venda = crypto.randomUUID();
    const agora = new Date().toISOString();
    await registrarVenda(carrinho.map((i) => ({
      id: crypto.randomUUID(), venda_id: venda, produto_id: i.produto.id, produto_nome: i.produto.nome,
      quantidade: i.quantidade, preco_unitario: i.produto.preco, forma_pagamento: forma,
      evento_id: eventoId || null, created_at: agora, usuario_id: pacote.usuario.id, enviado: 0 as const,
    })));
    setPagando(null);
    setCarrinho([]);
    setVendaOk(true);
    setTimeout(() => setVendaOk(false), 1600);
    await recarregarVendas(pacote.usuario.id);
    void sincronizar(pacote);
  };

  const sair = async () => {
    if (pendentes && !(await confirmar(`Há ${pendentes} item(ns) ainda não enviados. Se sair agora, eles ficam guardados neste aparelho até alguém entrar com a mesma conta. Sair mesmo assim?`))) return;
    await bloquearCaixa();
    await limparDadosOffline();
    await createClient().auth.signOut();
    router.push("/operador");
  };

  if (erro) {
    return <div className="flex min-h-screen items-center justify-center bg-axon-bg p-6 text-center text-sm text-red-300">{erro}</div>;
  }
  if (!pacote) {
    return <div className="flex min-h-screen items-center justify-center bg-axon-bg"><div className="h-8 w-8 animate-spin rounded-full border-2 border-axon-gold border-t-transparent" /></div>;
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-axon-bg text-white">
      <RegistrarOffline />
      {pagando === "pix" && <PagamentoPix total={total} pix={pacote.pix} onConfirmar={() => concluir("pix")} onFechar={() => setPagando(null)} />}
      {pagando === "dinheiro" && <PagamentoDinheiro total={total} onConfirmar={() => concluir("dinheiro")} onFechar={() => setPagando(null)} />}
      {pagando === "cartao" && <PagamentoCartao total={total} onConfirmar={() => concluir("cartao")} onFechar={() => setPagando(null)} />}
      {resumo && <Resumo vendas={vendas} pendentes={pendentes} onFechar={() => setResumo(false)} />}
      {vendaOk && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-40 mx-auto w-fit rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200">
          Venda registrada{online ? "" : " no aparelho"}
        </div>
      )}

      <header className="shrink-0 border-b border-axon-border bg-axon-panel px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {gestao ? (
            <nav className="flex rounded-lg border border-axon-border p-0.5 text-sm">
              <Link href="/caixa" className={`rounded-md px-3 py-1.5 ${modo === "cantina" ? "bg-axon-gold text-black font-semibold" : "text-gray-400"}`}>Caixa</Link>
              <Link href="/bilheteria" className={`rounded-md px-3 py-1.5 ${modo === "bilheteria" ? "bg-axon-gold text-black font-semibold" : "text-gray-400"}`}>Bilheteria</Link>
            </nav>
          ) : (
            <span className="px-1 text-sm font-semibold">{modo === "cantina" ? "Caixa" : "Bilheteria"}</span>
          )}
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => sincronizar(pacote)} disabled={!online || enviando}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${online ? "border-emerald-500/30 text-emerald-300" : "border-axon-gold/40 text-axon-gold"}`}>
              {enviando ? <RefreshCw size={12} className="animate-spin" /> : online ? <Wifi size={12} /> : <CloudOff size={12} />}
              {online ? (pendentes ? `${pendentes} a enviar` : "Online") : `Offline${pendentes ? ` · ${pendentes}` : ""}`}
            </button>
            <button type="button" onClick={() => setResumo(true)} title="Resumo de hoje" className="rounded-lg p-2 text-gray-400 hover:text-white"><ReceiptText size={17} /></button>
            <button type="button" onClick={async () => { await bloquearCaixa(); window.location.reload(); }} title="Bloquear (pede o PIN)" className="rounded-lg p-2 text-gray-400 hover:text-white"><Lock size={17} /></button>
            {gestao
              ? <Link href="/pdv" title="Voltar ao painel" className="rounded-lg p-2 text-gray-400 hover:text-white"><LayoutDashboard size={17} /></Link>
              : <button type="button" onClick={sair} title="Sair" className="rounded-lg p-2 text-gray-400 hover:text-red-300"><LogOut size={17} /></button>}
          </div>
        </div>
        <select value={eventoId} onChange={(e) => escolherEvento(e.target.value)} aria-label="Evento"
          className="mt-2 w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2 text-sm text-white outline-none">
          <option value="">Sem evento (venda avulsa)</option>
          {pacote.eventos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </header>

      {temLojinha && temCantina && (
        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-axon-border px-3 py-2">
          {(["cantina", "lojinha"] as const).map((s) => (
            <button key={s} type="button" onClick={() => { setSetor(s); setCategoria("Todos"); }}
              className={`rounded-lg border py-2 text-sm ${setorAtual === s ? "border-axon-gold bg-axon-gold/10 font-semibold text-axon-gold" : "border-axon-border text-gray-400"}`}>
              {s === "cantina" ? "Cantina" : "Lojinha"}
            </button>
          ))}
        </div>
      )}
      {categorias.length > 2 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-axon-border px-3 py-2">
          {categorias.map((c) => (
            <button key={c} type="button" onClick={() => setCategoria(c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${categoria === c ? "border-axon-gold bg-axon-gold text-black font-semibold" : "border-axon-border text-gray-400"}`}>{c}</button>
          ))}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-3">
        {produtos.length === 0 ? (
          <p className="mt-12 text-center text-sm text-gray-400">Nenhum produto ativo para {modo === "cantina" ? "o caixa" : "a bilheteria"}. O organizador cadastra em PDV & Bilheteria.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {visiveis.map((p) => {
              const q = carrinho.find((i) => i.produto.id === p.id)?.quantidade ?? 0;
              return (
                <button key={p.id} type="button" onClick={() => mudar(p, 1)}
                  className={`relative flex min-h-24 flex-col justify-between rounded-xl border p-3 text-left active:scale-[0.98] ${q ? "border-axon-gold bg-axon-gold/10" : "border-axon-border bg-axon-panel"}`}>
                  <span className="text-sm font-medium leading-snug">{p.nome}</span>
                  <span className="mt-2 text-base font-bold text-axon-gold">{brl(p.preco)}</span>
                  {q > 0 && <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-axon-gold px-1.5 text-xs font-bold text-black">{q}</span>}
                </button>
              );
            })}
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-axon-border bg-axon-panel p-3">
        {carrinho.length > 0 && (
          <ul className="mb-3 max-h-32 space-y-1.5 overflow-y-auto">
            {carrinho.map((i) => (
              <li key={i.produto.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{i.produto.nome}</span>
                <button type="button" onClick={() => mudar(i.produto, -1)} aria-label="Menos" className="rounded-md border border-axon-border p-1"><Minus size={13} /></button>
                <span className="w-6 text-center tabular-nums">{i.quantidade}</span>
                <button type="button" onClick={() => mudar(i.produto, 1)} aria-label="Mais" className="rounded-md border border-axon-border p-1"><Plus size={13} /></button>
                <span className="w-20 text-right tabular-nums text-gray-300">{brl(i.produto.preco * i.quantidade)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-400">Total</span>
          <span className="flex items-center gap-3">
            {carrinho.length > 0 && <button type="button" onClick={() => setCarrinho([])} aria-label="Limpar" className="text-gray-500 hover:text-red-300"><Trash2 size={16} /></button>}
            <span className="text-2xl font-bold tabular-nums">{brl(total)}</span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["dinheiro", "pix", "cartao"] as Forma[]).map((f) => (
            <button key={f} type="button" disabled={!carrinho.length} onClick={() => setPagando(f)}
              className="flex flex-col items-center gap-1 rounded-xl bg-axon-gold py-3 text-sm font-bold text-black disabled:opacity-30">
              {f === "dinheiro" ? <Banknote size={18} /> : f === "pix" ? <QrCode size={18} /> : <CreditCard size={18} />}
              {NOME_FORMA[f]}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
