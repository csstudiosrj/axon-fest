"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Building2, Check, Copy, FlaskConical, Loader2, Mail, Percent, Trash2 } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { Produtoras, type LinhaProdutora } from "./Produtoras";

type Valores = Record<string, unknown>;

interface Campo {
  campo: string;
  rotulo: string;
  tipo: "numero" | "texto";
  ajuda?: string;
  sufixo?: string;
  passo?: string;
  vazioNulo?: boolean;
}

const GRUPOS: { chave: string; titulo: string; descricao: string; icone: typeof Percent; campos: Campo[] }[] = [
  {
    chave: "precos",
    titulo: "Preços e taxas",
    descricao: "Valores exibidos no site, nos Termos de Uso e usados na cobrança.",
    icone: Percent,
    campos: [
      { campo: "taxaPercentual", rotulo: "Taxa por venda online", tipo: "numero", sufixo: "%", passo: "0.1", ajuda: "Inscrições, ingressos e loja pagos pela plataforma." },
      { campo: "taxaFixa", rotulo: "Valor fixo por venda online", tipo: "numero", sufixo: "R$", passo: "0.01" },
      { campo: "caixaPercentual", rotulo: "Taxa sobre o caixa do evento", tipo: "numero", sufixo: "%", passo: "0.1", ajuda: "Cobrada em fatura mensal." },
      { campo: "caixaIsencaoAte", rotulo: "Isenção do caixa abaixo de", tipo: "numero", sufixo: "R$/mês", passo: "1" },
      { campo: "mesesStart", rotulo: "Duração do plano Start", tipo: "numero", sufixo: "meses", passo: "1" },
      { campo: "mesesGuarda", rotulo: "Modo leitura antes de apagar", tipo: "numero", sufixo: "meses", passo: "1" },
      { campo: "mensalidadePro", rotulo: "Mensalidade do Pro", tipo: "numero", sufixo: "R$", passo: "0.01", vazioNulo: true, ajuda: "Deixe vazio para exibir “Sob consulta”." },
    ],
  },
  {
    chave: "contato",
    titulo: "Contato",
    descricao: "Aparece no rodapé, na página de contato e recebe as mensagens do formulário.",
    icone: Mail,
    campos: [
      { campo: "email", rotulo: "E-mail", tipo: "texto" },
      { campo: "whatsapp", rotulo: "WhatsApp", tipo: "texto", ajuda: "Com DDD, ex.: (21) 96711-9815" },
    ],
  },
  {
    chave: "empresa",
    titulo: "Dados da empresa",
    descricao: "Usados nos Termos de Uso e na Política de Privacidade.",
    icone: Building2,
    campos: [
      { campo: "razaoSocial", rotulo: "Razão social", tipo: "texto" },
      { campo: "cnpj", rotulo: "CNPJ", tipo: "texto" },
      { campo: "endereco", rotulo: "Endereço completo", tipo: "texto" },
      { campo: "foro", rotulo: "Foro (cidade/UF)", tipo: "texto" },
      { campo: "emailPrivacidade", rotulo: "E-mail do encarregado (LGPD)", tipo: "texto" },
      { campo: "vigencia", rotulo: "Vigência dos documentos", tipo: "texto", ajuda: "Ex.: 1º de dezembro de 2026" },
    ],
  },
];

function FormularioGrupo({ grupo, inicial }: { grupo: (typeof GRUPOS)[number]; inicial: Valores }) {
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(grupo.campos.map((c) => [c.campo, inicial[c.campo] === null || inicial[c.campo] === undefined ? "" : String(inicial[c.campo])]))
  );
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    const valor = Object.fromEntries(grupo.campos.map((c) => [c.campo, c.tipo === "numero" ? (valores[c.campo] === "" && c.vazioNulo ? null : Number(valores[c.campo])) : valores[c.campo]]));
    const res = await fetch(apiUrl("/api/super/configuracoes"), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chave: grupo.chave, valor }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setMsg(res.ok ? { ok: true, texto: "Salvo. O site já mostra os novos valores." } : { ok: false, texto: json.error ?? "Falha ao salvar." });
    setSalvando(false);
  };

  const Icone = grupo.icone;
  return (
    <section className="rounded-xl border border-axon-border bg-axon-panel">
      <div className="flex items-start gap-3 border-b border-axon-border px-6 py-4">
        <Icone size={18} className="mt-0.5 text-axon-gold" />
        <div>
          <h2 className="font-semibold text-white">{grupo.titulo}</h2>
          <p className="text-xs text-gray-500">{grupo.descricao}</p>
        </div>
      </div>
      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
        {grupo.campos.map((c) => (
          <label key={c.campo} className="block">
            <span className="text-xs text-gray-400">{c.rotulo}</span>
            <div className="mt-1.5 flex items-center rounded-lg border border-axon-border bg-axon-bg focus-within:border-axon-gold">
              <input type={c.tipo === "numero" ? "number" : "text"} step={c.passo} min={c.tipo === "numero" ? 0 : undefined}
                value={valores[c.campo]} onChange={(e) => setValores({ ...valores, [c.campo]: e.target.value })}
                className="w-full bg-transparent px-3 py-2.5 text-sm text-white outline-none" />
              {c.sufixo && <span className="pr-3 text-xs text-gray-500">{c.sufixo}</span>}
            </div>
            {c.ajuda && <span className="mt-1 block text-[11px] text-gray-500">{c.ajuda}</span>}
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-axon-border px-6 py-4">
        <p className={`text-xs ${msg?.ok ? "text-emerald-300" : "text-red-300"}`}>{msg?.texto}</p>
        <button type="button" onClick={salvar} disabled={salvando}
          className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
          {salvando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar
        </button>
      </div>
    </section>
  );
}

function Demonstracao({ existente }: { existente: { id: string; nome: string; created_at: string } | null }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<"criar" | "apagar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [acessos, setAcessos] = useState<{ senha: string; logins: { papel: string; email: string }[] } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const executar = async (acao: "criar" | "apagar") => {
    if (acao === "apagar" && !window.confirm("Apagar a demonstração? Todos os eventos, grupos, notas, vendas e logins de teste serão removidos.")) return;
    setOcupado(acao);
    setErro(null);
    const res = await fetch(apiUrl("/api/super/demonstracao"), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; senha?: string; logins?: { papel: string; email: string }[] };
    if (!res.ok) setErro(json.error ?? "Falha.");
    else if (acao === "criar" && json.senha) setAcessos({ senha: json.senha, logins: json.logins ?? [] });
    else setAcessos(null);
    setOcupado(null);
    router.refresh();
  };

  const textoAcessos = acessos
    ? [`Senha de todos: ${acessos.senha}`, ...acessos.logins.map((l) => `${l.papel}: ${l.email}`)].join("\n")
    : "";

  return (
    <section className="rounded-xl border border-axon-border bg-axon-panel">
      <div className="flex items-start gap-3 border-b border-axon-border px-6 py-4">
        <FlaskConical size={18} className="mt-0.5 text-axon-gold" />
        <div>
          <h2 className="font-semibold text-white">Demonstração</h2>
          <p className="text-xs text-gray-500">
            Cria uma produtora fictícia com três festivais (dança, música e teatro), grupos, elenco, jurados, notas, caixa e logins de teste. Apague quando terminar.
          </p>
        </div>
      </div>
      <div className="space-y-4 px-6 py-5">
        {existente ? (
          <p className="text-sm text-gray-300">
            Demonstração ativa desde {new Date(existente.created_at).toLocaleString("pt-BR")}.
          </p>
        ) : (
          <p className="text-sm text-gray-400">Nenhuma demonstração no banco.</p>
        )}

        {acessos && (
          <div className="rounded-lg border border-axon-gold/30 bg-axon-gold-dim p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-sm text-axon-gold"><AlertTriangle size={14} /> Anote os acessos — a senha não será mostrada de novo.</p>
              <button type="button" onClick={() => { void navigator.clipboard.writeText(textoAcessos); setCopiado(true); }}
                className="inline-flex items-center gap-1.5 rounded-md border border-axon-border px-2.5 py-1.5 text-xs text-gray-200">
                {copiado ? <Check size={13} /> : <Copy size={13} />} Copiar
              </button>
            </div>
            <p className="mt-3 text-sm text-white">Senha de todos: <span className="font-mono">{acessos.senha}</span></p>
            <ul className="mt-2 space-y-1 text-xs">
              {acessos.logins.map((l) => (
                <li key={l.email} className="flex flex-wrap justify-between gap-2"><span className="text-gray-400">{l.papel}</span><span className="font-mono text-gray-200">{l.email}</span></li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-gray-400">Todos entram em /fest/login (cada um cai na sua área). PIN do caixa: 1234.</p>
          </div>
        )}

        {erro && <p className="text-sm text-red-300">{erro}</p>}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => executar("criar")} disabled={!!existente || !!ocupado}
            className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40">
            {ocupado === "criar" ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />}
            {ocupado === "criar" ? "Criando (pode levar um minuto)…" : "Criar demonstração"}
          </button>
          <button type="button" onClick={() => executar("apagar")} disabled={!existente || !!ocupado}
            className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-4 py-2.5 text-sm text-red-300 disabled:opacity-40">
            {ocupado === "apagar" ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Apagar demonstração
          </button>
        </div>
      </div>
    </section>
  );
}

export function PainelSuper({ configuracoes, demonstracao, produtoras }: {
  configuracoes: Record<string, Valores>;
  demonstracao: { id: string; nome: string; created_at: string } | null;
  produtoras: LinhaProdutora[];
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Super Admin</h1>
        <p className="mt-1 text-sm text-gray-400">Configurações do ARXUM Fest que valem para todas as produtoras.</p>
      </div>
      <Produtoras linhas={produtoras} />
      <Demonstracao existente={demonstracao} />
      {GRUPOS.map((g) => <FormularioGrupo key={g.chave} grupo={g} inicial={configuracoes[g.chave] ?? {}} />)}
    </div>
  );
}
