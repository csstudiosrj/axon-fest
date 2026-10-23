"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSignature, Loader2, Mail, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { cpfValido, formatarCpf, idadeEm } from "@/lib/documentos";
import { maiuscula, nomeFuncao, perfilPorSlug } from "@/lib/perfis";
import type { IntegranteElenco } from "@/lib/grupo/contexto";
import { Cartao, Selo, Vazio } from "../../../_components/ui";
import { confirmar } from "@/app/_components/Dialogos";

const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold";

async function chamar(corpo: Record<string, unknown>) {
  const res = await fetch(apiUrl("/api/grupo/elenco"), {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; existe?: boolean; jaTinhaCadastro?: boolean; temConta?: boolean; emailEnviado?: boolean; emailMascarado?: string | null };
  if (!res.ok) throw new Error(json.error ?? "Não foi possível concluir.");
  return json;
}

interface Form { documento: string; nome: string; nome_artistico: string; data_nascimento: string; email: string; funcao: string }

function Formulario({ perfilSlug, eventoId, editando, onFechar, onFeito }: {
  perfilSlug: string;
  eventoId: string;
  editando: IntegranteElenco | null;
  onFechar: () => void;
  onFeito: (mensagem: string) => void;
}) {
  const perfil = perfilPorSlug(perfilSlug);
  const [f, setF] = useState<Form>({
    documento: "",
    nome: editando?.nome ?? "",
    nome_artistico: editando?.nome_artistico ?? "",
    data_nascimento: editando?.data_nascimento ?? "",
    email: editando?.email ?? "",
    funcao: editando?.funcao ?? perfil.funcoes[0]?.valor ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Cadastro novo: 1º o CPF (se já existir no ARXUM Fest, vira convite); 2º os dados
  const [etapa, setEtapa] = useState<"cpf" | "dados">(editando ? "dados" : "cpf");
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: k === "documento" ? formatarCpf(e.target.value) : e.target.value });

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!editando && !cpfValido(f.documento)) return setErro("CPF inválido. Confira os números.");
    setSalvando(true);
    try {
      if (!editando && etapa === "cpf") {
        const r = await chamar({ acao: "verificar", evento_id: eventoId, documento: f.documento, funcao: f.funcao });
        if (r.existe) {
          onFeito(`Esta pessoa já tem cadastro no ARXUM Fest. Convite enviado para o e-mail dela${r.emailMascarado ? ` (${r.emailMascarado})` : ""}: ela confirma se faz parte do grupo e os dados aparecem aqui.`);
          return;
        }
        setEtapa("dados");
        setSalvando(false);
        return;
      }
      if (editando) {
        await chamar({ acao: "editar", evento_id: eventoId, vinculo_id: editando.vinculo_id, ...f });
        onFeito("Cadastro atualizado.");
      } else {
        const r = await chamar({ acao: "adicionar", evento_id: eventoId, ...f });
        onFeito(r.jaTinhaCadastro
          ? "Esta pessoa já tinha cadastro no ARXUM Fest. Enviamos o convite para o e-mail que ela cadastrou; os dados aparecem aqui quando ela confirmar."
          : r.temConta ? `Este e-mail já é de uma conta do ARXUM Fest: ligamos o cadastro a essa pessoa. Ela recebe em ${f.email} o link para confirmar e assinar o termo.`
          : r.emailEnviado ? `Cadastro feito. A pessoa recebe em ${f.email} o link para confirmar o cadastro e assinar o termo.` : "Cadastrado(a), mas o e-mail não pôde ser enviado agora. Use “Reenviar convite” em instantes.");
      }
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onFechar}>
      <form onSubmit={salvar} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-axon-border bg-axon-panel sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-axon-border px-5 py-4">
          <h2 className="font-semibold text-white">{editando ? "Editar cadastro" : `Adicionar ao ${perfil.termos.elenco}`}</h2>
          <button type="button" onClick={onFechar} className="text-gray-400 hover:text-white" aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          {!editando && (
            <label className="block">
              <span className="text-xs text-gray-400">CPF</span>
              <input required autoFocus inputMode="numeric" value={f.documento} onChange={set("documento")} disabled={etapa === "dados"} placeholder="000.000.000-00" className={`${campo} mt-1.5`} />
              <span className="mt-1 block text-[11px] text-gray-500">
                {etapa === "cpf" ? "Primeiro procuramos o CPF no ARXUM Fest. Se a pessoa já tiver cadastro, ela recebe um convite no e-mail dela." : "CPF sem cadastro: preencha os dados. A pessoa confirma o cadastro pelo e-mail."}
              </span>
            </label>
          )}
          {etapa === "cpf" && (
            <label className="block">
              <span className="text-xs text-gray-400">Função no grupo</span>
              <select value={f.funcao} onChange={set("funcao")} className={`${campo} mt-1.5`}>
                {perfil.funcoes.map((fn) => <option key={fn.valor} value={fn.valor}>{fn.nome}</option>)}
              </select>
            </label>
          )}
          {etapa === "dados" && (<>
          <label className="block">
            <span className="text-xs text-gray-400">Nome completo</span>
            <input required minLength={3} value={f.nome} onChange={set("nome")} className={`${campo} mt-1.5`} />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">Nome artístico (opcional)</span>
            <input value={f.nome_artistico} onChange={set("nome_artistico")} className={`${campo} mt-1.5`} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-gray-400">Data de nascimento</span>
              <input required type="date" value={f.data_nascimento} onChange={set("data_nascimento")} className={`${campo} mt-1.5`} />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Função</span>
              <select value={f.funcao} onChange={set("funcao")} className={`${campo} mt-1.5`}>
                {perfil.funcoes.map((fn) => <option key={fn.valor} value={fn.valor}>{fn.nome}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-gray-400">E-mail</span>
            <input required type="email" value={f.email} onChange={set("email")} className={`${campo} mt-1.5`} />
            <span className="mt-1 block text-[11px] text-gray-500">A pessoa confirma a participação e assina o termo por este e-mail. Para menores, use o e-mail do responsável.</span>
          </label>
          </>)}
          {erro && <p className="text-sm text-red-300">{erro}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-axon-border px-5 py-4">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white">Cancelar</button>
          <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {salvando && <Loader2 size={15} className="animate-spin" />} {editando ? "Salvar" : etapa === "cpf" ? "Continuar" : "Cadastrar e enviar confirmação"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Elenco({ eventoId, perfilSlug, integrantes, dataEvento , podeRemover }: {
  podeRemover: boolean;
  eventoId: string;
  perfilSlug: string;
  integrantes: IntegranteElenco[];
  dataEvento: string | null;
}) {
  const router = useRouter();
  const perfil = perfilPorSlug(perfilSlug);
  const [form, setForm] = useState<{ editando: IntegranteElenco | null } | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const acao = async (p: IntegranteElenco, corpo: Record<string, unknown>, sucesso: string) => {
    setOcupado(p.vinculo_id);
    setAviso(null);
    try {
      await chamar({ evento_id: eventoId, vinculo_id: p.vinculo_id, ...corpo });
      setAviso({ ok: true, texto: sucesso });
      router.refresh();
    } catch (e) {
      setAviso({ ok: false, texto: (e as Error).message });
    }
    setOcupado(null);
  };

  // Diretor: manda o link de assinatura dos documentos deste festival para quem está no elenco e ainda não assinou
  const pedirAssinaturas = async () => {
    if (!(await confirmar({ titulo: "Pedir assinaturas", mensagem: "Enviar por e-mail o link para assinar os documentos deste festival (uso de imagem e, para menores, a autorização do responsável) a quem está no elenco das apresentações e ainda não assinou?", botao: "Enviar" }))) return;
    setOcupado("assinaturas");
    setAviso(null);
    const res = await fetch(apiUrl("/api/assinaturas"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "pedir", evento_id: eventoId }) });
    const json = (await res.json().catch(() => ({}))) as { enviados?: number; semEmail?: number; error?: string };
    setAviso(res.ok
      ? { ok: true, texto: json.enviados ? `${json.enviados} e-mail(s) enviado(s).${json.semEmail ? ` ${json.semEmail} pessoa(s) sem e-mail.` : ""}` : "Ninguém com assinatura pendente neste festival (ou a produção ainda não publicou os documentos)." }
      : { ok: false, texto: json.error ?? "Não foi possível enviar." });
    setOcupado(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{maiuscula(perfil.termos.elenco)} do grupo</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">
            Vale para todos os festivais do grupo. Cada pessoa recebe um e-mail para confirmar a participação e assinar o termo (menores, com o responsável).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {podeRemover && (
            <button type="button" onClick={pedirAssinaturas} disabled={ocupado === "assinaturas"}
              className="inline-flex items-center gap-2 rounded-lg border border-axon-border px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 disabled:opacity-50">
              <FileSignature size={15} /> Pedir assinaturas
            </button>
          )}
          <button type="button" onClick={() => setForm({ editando: null })}
            className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2.5 text-sm font-semibold text-black">
            <Plus size={15} /> Adicionar pessoa
          </button>
        </div>
      </div>

      {aviso && <p className={`rounded-lg border px-4 py-3 text-sm ${aviso.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>{aviso.texto}</p>}

      <Cartao>
        {integrantes.length === 0 ? (
          <Vazio icone={<UserRound size={22} />} titulo="Ninguém cadastrado ainda"
            texto={`Adicione ${perfil.termos.participante.plural}, direção e equipe técnica. Depois, escolha quem está em cada ${perfil.termos.apresentacao.singular}.`} />
        ) : (
          <ul className="divide-y divide-axon-border">
            {integrantes.map((p) => {
              const idade = idadeEm(p.data_nascimento, dataEvento);
              return (
                <li key={p.vinculo_id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {p.nome ?? <span className="text-gray-400">Convite enviado · CPF final {p.documento_final ?? "—"}</span>}
                      {p.nome_artistico && <span className="ml-2 text-sm text-gray-400">“{p.nome_artistico}”</span>}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {p.confirmado ? <Selo tom="verde">Confirmado</Selo> : <Selo tom="ouro">Aguardando confirmação</Selo>}
                      {p.confirmado && (p.termo_assinado ? <Selo tom="verde">Termo assinado</Selo> : <Selo tom="vermelho">Termo pendente</Selo>)}
                      {idade !== null && idade < 18 && <Selo tom="azul">Menor de idade</Selo>}
                      {p.email && <span className="truncate text-xs text-gray-500">{p.email}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <select aria-label="Função" value={p.funcao ?? ""} disabled={ocupado === p.vinculo_id}
                      onChange={(e) => acao(p, { acao: "funcao", funcao: e.target.value }, "Função atualizada.")}
                      className="rounded-lg border border-axon-border bg-axon-bg px-2.5 py-1.5 text-xs text-white outline-none">
                      {!p.funcao && <option value="">Sem função</option>}
                      {p.funcao && !perfil.funcoes.some((f) => f.valor === p.funcao) && <option value={p.funcao}>{nomeFuncao(perfil, p.funcao)}</option>}
                      {perfil.funcoes.map((f) => <option key={f.valor} value={f.valor}>{f.nome}</option>)}
                    </select>
                    {!p.confirmado && (
                      <button type="button" disabled={ocupado === p.vinculo_id} title="Reenviar convite"
                        onClick={() => acao(p, { acao: "reenviar" }, "Convite reenviado.")}
                        className="inline-flex items-center gap-1 rounded-lg border border-axon-border px-2.5 py-1.5 text-xs text-gray-300 hover:text-white">
                        <Mail size={13} /> Reenviar
                      </button>
                    )}
                    {p.editavel && (
                      <button type="button" onClick={() => setForm({ editando: p })} title="Editar" className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"><Pencil size={14} /></button>
                    )}
                    {podeRemover && <button type="button" disabled={ocupado === p.vinculo_id} title="Remover do grupo"
                      onClick={async () => (await confirmar("Remover esta pessoa do grupo? Ela também sai das apresentações com inscrições abertas.")) && acao(p, { acao: "remover" }, "Removido(a) do grupo.")}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-400/10 hover:text-red-300">
                      {ocupado === p.vinculo_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>

      {form && (
        <Formulario perfilSlug={perfilSlug} eventoId={eventoId} editando={form.editando}
          onFechar={() => setForm(null)}
          onFeito={(m) => { setForm(null); setAviso({ ok: true, texto: m }); router.refresh(); }} />
      )}
    </div>
  );
}
