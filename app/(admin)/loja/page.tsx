"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Package,
  TrendingUp,
  Truck,
  Check,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { UploadButton } from "@/utils/uploadthing";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  estoque: number | null;
  tem_variacao: boolean;
  ativo: boolean;
  mostrar_checkout: boolean;
  imagem_url: string | null;
  exibir_imagem: boolean;
  exibir_loja_publica: boolean;
}

interface Variacao {
  id: string;
  produto_id: string;
  nome: string;
  estoque: number | null;
  produtos?: { produtora_id: string }; // join pode trazer este campo
}

interface PedidoItem {
  id: string;
  escola_id: string;          // grupo que comprou (nome antigo da coluna)
  coreografia_id: string | null;
  produto_id: string;
  variacao_id: string | null;
  quantidade: number;
  preco_unitario: number;
  status: string;
  produtora_id: string | null;
}

interface Escola {
  id: string;
  nome: string;
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function maskPreco(v: string) {
  const nums = v.replace(/\D/g, "");
  if (!nums) return "";
  const float = parseInt(nums, 10) / 100;
  return float.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ModalProdutoProps {
  produto?: Produto;
  variacoes?: Variacao[];
  onClose: () => void;
  onSaved: () => void;
  produtoraId: string;
}

function ModalProduto({ produto, variacoes = [], onClose, onSaved, produtoraId }: ModalProdutoProps) {
  const supabase = createClient();

  const [nome, setNome] = useState(produto?.nome ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [preco, setPreco] = useState(
    produto ? produto.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : ""
  );
  const [estoque, setEstoque] = useState(produto?.estoque != null ? String(produto.estoque) : "");
  const [temVariacao, setTemVariacao] = useState(produto?.tem_variacao ?? false);
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);
  const [mostrarCheckout, setMostrarCheckout] = useState(produto?.mostrar_checkout ?? false);
  const [exibirLojaPublica, setExibirLojaPublica] = useState(produto?.exibir_loja_publica ?? true);
  const [exibirImagem, setExibirImagem] = useState(produto?.exibir_imagem ?? false);
  const [imagemUrl, setImagemUrl] = useState<string | null>(produto?.imagem_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [varsLocais, setVarsLocais] = useState<{ id?: string; nome: string; estoque: string }[]>(
    variacoes.length
      ? variacoes.map((v) => ({ id: v.id, nome: v.nome, estoque: v.estoque != null ? String(v.estoque) : "" }))
      : [{ nome: "", estoque: "" }]
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function addVariacao() {
    setVarsLocais((p) => [...p, { nome: "", estoque: "" }]);
  }

  function removeVariacao(i: number) {
    setVarsLocais((p) => p.filter((_, idx) => idx !== i));
  }

  function updateVariacao(i: number, campo: "nome" | "estoque", valor: string) {
    setVarsLocais((p) => p.map((v, idx) => (idx === i ? { ...v, [campo]: valor } : v)));
  }

  async function salvar() {
    setErro(null);
    if (!nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }
    const precoNum = parseFloat(preco.replace(/\./g, "").replace(",", "."));
    if (isNaN(precoNum)) {
      setErro("Preço inválido.");
      return;
    }

    setSalvando(true);

    const payload = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      preco: precoNum,
      estoque: estoque ? parseInt(estoque, 10) : null,
      tem_variacao: temVariacao,
      ativo,
      mostrar_checkout: mostrarCheckout,
      exibir_loja_publica: exibirLojaPublica,
      exibir_imagem: exibirImagem,
      imagem_url: exibirImagem ? imagemUrl : null,
    };

    let produtoId = produto?.id;

    if (produto) {
      const { error } = await supabase
        .from("produtos")
        .update(payload)
        .eq("id", produto.id)
        .eq("produtora_id", produtoraId);
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("produtos")
        .insert({ ...payload, produtora_id: produtoraId })
        .select("id")
        .single();
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
      produtoId = data.id;
    }

    if (temVariacao && produtoId) {
      for (const v of varsLocais) {
        if (!v.nome.trim()) continue;
        const vPayload = {
          produto_id: produtoId,
          nome: v.nome.trim(),
          estoque: v.estoque ? parseInt(v.estoque, 10) : null,
        };
        if (v.id) {
          await supabase.from("produto_variacoes").update(vPayload).eq("id", v.id);
        } else {
          await supabase.from("produto_variacoes").insert(vPayload);
        }
      }
    }

    setSalvando(false);
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-axon-panel border border-axon-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-axon-border shrink-0">
          <h2 className="text-base font-semibold text-white">
            {produto ? "Editar Produto" : "Novo Produto"}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pacote de Fotos Oficial"
              className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-axon-gold transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              placeholder="Descrição breve do produto..."
              className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-axon-gold transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Preço (R$) *</label>
              <input
                type="text"
                inputMode="numeric"
                value={preco}
                onChange={(e) => setPreco(maskPreco(e.target.value))}
                placeholder="0,00"
                className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-axon-gold transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Estoque (vazio = ilimitado)</label>
              <input
                type="number"
                value={estoque}
                onChange={(e) => setEstoque(e.target.value)}
                placeholder="—"
                className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-axon-gold transition-colors"
              />
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-neutral-300">Tem variações (ex: tamanhos)</span>
              <button onClick={() => setTemVariacao((p) => !p)} className="text-axon-gold" aria-label="Toggle variações">
                {temVariacao ? <ToggleRight size={26} /> : <ToggleLeft size={26} className="text-neutral-600" />}
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-neutral-300">Mostrar no checkout de inscrição</span>
              <button onClick={() => setMostrarCheckout((p) => !p)} className="text-axon-gold" aria-label="Toggle checkout">
                {mostrarCheckout ? <ToggleRight size={26} /> : <ToggleLeft size={26} className="text-neutral-600" />}
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-neutral-300">Produto ativo</span>
              <button onClick={() => setAtivo((p) => !p)} className="text-axon-gold" aria-label="Toggle ativo">
                {ativo ? <ToggleRight size={26} /> : <ToggleLeft size={26} className="text-neutral-600" />}
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-neutral-300">Exibir na página pública do festival</span>
              <button onClick={() => setExibirLojaPublica((p) => !p)} className="text-axon-gold" aria-label="Toggle loja pública">
                {exibirLojaPublica ? <ToggleRight size={26} /> : <ToggleLeft size={26} className="text-neutral-600" />}
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-neutral-300">Exibir foto do produto</span>
              <button onClick={() => setExibirImagem((p) => !p)} className="text-axon-gold" aria-label="Toggle exibir foto">
                {exibirImagem ? <ToggleRight size={26} /> : <ToggleLeft size={26} className="text-neutral-600" />}
              </button>
            </label>
          </div>

          {exibirImagem && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-500">
                Dimensão Recomendada: 800x800px (Proporção 1:1, Quadrado) para evitar quebra de layout.
              </p>
              {!imagemUrl ? (
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    setImagemUrl(res[0].url);
                    setUploading(false);
                  }}
                  onUploadError={(error) => {
                    setErro(`Erro no upload: ${error.message}`);
                    setUploading(false);
                  }}
                  onUploadBegin={() => setUploading(true)}
                />
              ) : (
                <div className="relative inline-block">
                  <img
                    src={imagemUrl}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border border-axon-border"
                  />
                  <button
                    onClick={() => setImagemUrl(null)}
                    className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5 text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {temVariacao && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-400">Variações</p>
              {varsLocais.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={v.nome}
                    onChange={(e) => updateVariacao(i, "nome", e.target.value)}
                    placeholder="Ex: P, M, G, GG"
                    className="flex-1 bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-axon-gold transition-colors"
                  />
                  <input
                    type="number"
                    value={v.estoque}
                    onChange={(e) => updateVariacao(i, "estoque", e.target.value)}
                    placeholder="Qtd"
                    className="w-20 bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-axon-gold transition-colors"
                  />
                  <button onClick={() => removeVariacao(i)} className="text-neutral-600 hover:text-red-400 transition-colors" aria-label="Remover variação">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button onClick={addVariacao} className="text-xs text-axon-gold hover:opacity-80 transition-opacity flex items-center gap-1">
                <Plus size={13} /> Adicionar variação
              </button>
            </div>
          )}

          {erro && (
            <p className="flex items-start gap-2 text-xs text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {erro}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-axon-border shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-axon-border text-sm text-neutral-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando || uploading}
            className="flex-1 px-4 py-2 rounded-lg bg-axon-gold text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {(salvando || uploading) && <Loader2 size={14} className="animate-spin" />}
            {produto ? "Salvar alterações" : "Criar produto"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LojaPage() {
  const supabase = createClient();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"produtos" | "entregas">("produtos");
  const [modalProduto, setModalProduto] = useState<Produto | null | "novo">(null);
  const [salvandoToggle, setSalvandoToggle] = useState<string | null>(null);
  const [filtroEntrega, setFiltroEntrega] = useState<"todos" | "pendente" | "entregue">("todos");
  const [produtoraId, setProdutoraId] = useState("");

  const carregar = useCallback(async () => {
    if (!produtoraId) return;
    setCarregando(true);

    const [{ data: prods }, { data: rawVars }, { data: rawPeds }, { data: escs }] = await Promise.all([
      supabase.from("produtos").select("*").eq("produtora_id", produtoraId).order("created_at"),
      supabase
        .from("produto_variacoes")
        .select("*, produtos!inner(produtora_id)")
        .eq("produtos.produtora_id", produtoraId)
        .order("nome"),
      supabase
        .from("pedido_itens")
        .select("*, produtos!inner(produtora_id)")
        .eq("produtos.produtora_id", produtoraId)
        .order("created_at", { ascending: false }),
      supabase.from("grupos").select("id, nome").eq("produtora_id", produtoraId).order("nome"),
    ]);

    setProdutos((prods as Produto[]) ?? []);
    setVariacoes((rawVars as Variacao[]) ?? []);
    setPedidos((rawPeds as PedidoItem[]) ?? []);
    setEscolas((escs as Escola[]) ?? []);
    setCarregando(false);
  }, [supabase, produtoraId]);

  useEffect(() => {
    async function obterProdutora() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("produtora_id")
        .eq("id", user.id)
        .single();
      if (usuario?.produtora_id) {
        setProdutoraId(usuario.produtora_id);
      }
    }
    obterProdutora();
  }, [supabase]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function toggleField(id: string, campo: "ativo" | "mostrar_checkout", valor: boolean) {
    setSalvandoToggle(id + campo);
    const { error } = await supabase
      .from("produtos")
      .update(campo === "ativo" ? { ativo: valor } : { mostrar_checkout: valor })
      .eq("id", id)
      .eq("produtora_id", produtoraId);
    if (!error) {
      setProdutos((p) => p.map((pr) => (pr.id === id ? { ...pr, [campo]: valor } : pr)));
    }
    setSalvandoToggle(null);
  }

  async function excluirProduto(id: string) {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("id", id)
      .eq("produtora_id", produtoraId);
    if (!error) {
      setProdutos((p) => p.filter((pr) => pr.id !== id));
    }
  }

  async function alterarStatusPedido(id: string, status: "pendente" | "entregue") {
    const { error } = await supabase
      .from("pedido_itens")
      .update({ status })
      .eq("id", id)
      .eq("produtora_id", produtoraId);
    if (!error) {
      setPedidos((p) => p.map((pe) => (pe.id === id ? { ...pe, status } : pe)));
    }
  }

  const totalReceita = pedidos.reduce((s, p) => s + p.preco_unitario * p.quantidade, 0);
  const totalEntregues = pedidos.filter((p) => p.status === "entregue").length;
  const totalPendentes = pedidos.filter((p) => p.status === "pendente").length;

  const pedidosFiltrados = pedidos.filter((p) =>
    filtroEntrega === "todos" ? true : p.status === filtroEntrega
  );

  const pedidosPorEscola = escolas
    .map((e) => ({
      escola: e,
      itens: pedidosFiltrados.filter((p) => p.escola_id === e.id),
    }))
    .filter((g) => g.itens.length > 0);

  return (
    <>
      {modalProduto && (
        <ModalProduto
          produto={modalProduto === "novo" ? undefined : modalProduto}
          variacoes={
            modalProduto !== "novo"
              ? variacoes.filter((v) => v.produto_id === (modalProduto as Produto).id)
              : []
          }
          onClose={() => setModalProduto(null)}
          onSaved={carregar}
          produtoraId={produtoraId}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Loja e Upsell</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Cadastre produtos e acompanhe pedidos por escola.
            </p>
          </div>
          <button
            onClick={() => setModalProduto("novo")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-axon-border text-xs text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus size={14} /> Novo Produto
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-axon-panel border border-axon-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={14} className="text-neutral-500" />
              <p className="text-xs text-neutral-500">Produtos</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-white">{produtos.length}</p>
          </div>

          <div className="bg-axon-panel border border-axon-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-axon-gold" />
              <p className="text-xs text-neutral-500">Receita projetada</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-axon-gold">{moeda(totalReceita)}</p>
          </div>

          <div className="bg-axon-panel border border-axon-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck size={14} className="text-neutral-500" />
              <p className="text-xs text-neutral-500">A entregar</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-white">{totalPendentes}</p>
          </div>

          <div className="bg-axon-panel border border-axon-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check size={14} className="text-axon-green" />
              <p className="text-xs text-neutral-500">Entregues</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-axon-green">{totalEntregues}</p>
          </div>
        </div>

        <div className="flex border-b border-axon-border">
          {[
            { id: "produtos", label: "Produtos" },
            { id: "entregas", label: "Relatório de Entregas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id as "produtos" | "entregas")}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                abaAtiva === tab.id
                  ? "border-axon-gold text-axon-gold"
                  : "border-transparent text-neutral-500 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-neutral-600" />
          </div>
        ) : (
          <>
            {abaAtiva === "produtos" && (
              <div className="space-y-3">
                {produtos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
                    <ShoppingBag size={36} className="mb-3 opacity-30" />
                    <p className="text-sm">Nenhum produto cadastrado.</p>
                  </div>
                ) : (
                  produtos.map((p) => {
                    const varsP = variacoes.filter((v) => v.produto_id === p.id);
                    return (
                      <div key={p.id} className="bg-axon-panel border border-axon-border rounded-xl px-5 py-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-white">{p.nome}</p>
                              {!p.ativo && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500">
                                  Inativo
                                </span>
                              )}
                              {p.mostrar_checkout && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-axon-gold-dim text-axon-gold border border-axon-gold/20">
                                  No checkout
                                </span>
                              )}
                              {p.exibir_loja_publica ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-axon-green-dim text-axon-green border border-axon-green/20">
                                  Público
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500">
                                  Oculto na Loja
                                </span>
                              )}
                              {p.exibir_imagem && p.imagem_url && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-400/20">
                                  Com Foto
                                </span>
                              )}
                            </div>
                            {p.descricao && (
                              <p className="text-xs text-neutral-500 mt-0.5">{p.descricao}</p>
                            )}
                            {varsP.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap mt-2">
                                {varsP.map((v) => (
                                  <span
                                    key={v.id}
                                    className="text-xs px-2 py-0.5 rounded bg-axon-bg border border-axon-border text-neutral-400"
                                  >
                                    {v.nome}
                                    {v.estoque != null && (
                                      <span className="ml-1 text-neutral-600">({v.estoque})</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <p className="text-sm font-bold text-white tabular-nums">{moeda(p.preco)}</p>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleField(p.id, "ativo", !p.ativo)}
                                disabled={salvandoToggle === p.id + "ativo"}
                                className="text-neutral-500 hover:text-white transition-colors"
                                aria-label={p.ativo ? "Desativar" : "Ativar"}
                                title={p.ativo ? "Desativar produto" : "Ativar produto"}
                              >
                                {salvandoToggle === p.id + "ativo" ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : p.ativo ? (
                                  <ToggleRight size={22} className="text-axon-green" />
                                ) : (
                                  <ToggleLeft size={22} className="text-neutral-600" />
                                )}
                              </button>

                              <button
                                onClick={() => setModalProduto(p)}
                                className="text-neutral-500 hover:text-white transition-colors"
                                aria-label="Editar produto"
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                onClick={() => excluirProduto(p.id)}
                                className="text-neutral-500 hover:text-red-400 transition-colors"
                                aria-label="Excluir produto"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {abaAtiva === "entregas" && (
              <div className="space-y-5">
                <div className="flex gap-2">
                  {(["todos", "pendente", "entregue"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFiltroEntrega(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        filtroEntrega === f
                          ? "border-axon-gold bg-axon-gold-dim text-axon-gold"
                          : "border-axon-border text-neutral-500 hover:text-white"
                      }`}
                    >
                      {f === "todos" ? "Todos" : f === "pendente" ? "Pendentes" : "Entregues"}
                    </button>
                  ))}
                </div>

                {pedidosPorEscola.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
                    <Truck size={36} className="mb-3 opacity-30" />
                    <p className="text-sm">Nenhum pedido encontrado.</p>
                  </div>
                ) : (
                  pedidosPorEscola.map(({ escola, itens }) => (
                    <div key={escola.id} className="bg-axon-panel border border-axon-border rounded-xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-axon-border">
                        <p className="text-sm font-semibold text-white">{escola.nome}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {itens.length} item{itens.length !== 1 ? "ns" : ""}
                        </p>
                      </div>

                      <div className="divide-y divide-axon-border/50">
                        {itens.map((item) => {
                          const prod = produtos.find((p) => p.id === item.produto_id);
                          const vari = variacoes.find((v) => v.id === item.variacao_id);
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white">
                                  {prod?.nome ?? "Produto removido"}
                                  {vari && (
                                    <span className="ml-2 text-xs text-neutral-500">[{vari.nome}]</span>
                                  )}
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  Qtd: {item.quantidade} &middot; {moeda(item.preco_unitario * item.quantidade)}
                                </p>
                              </div>

                              <button
                                onClick={() =>
                                  alterarStatusPedido(item.id, item.status === "entregue" ? "pendente" : "entregue")
                                }
                                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                                  item.status === "entregue"
                                    ? "border-axon-green/30 text-axon-green bg-axon-green-dim"
                                    : "border-axon-border text-neutral-500 hover:text-white"
                                }`}
                              >
                                {item.status === "entregue" ? "Entregue" : "Marcar entregue"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}