// Demonstrações visuais da interface (dados fictícios, só para o site), montadas em HTML/CSS
// para ficarem nítidas em qualquer tela e acompanharem a identidade do produto.
"use client";

import { useState } from "react";
import { Box, Check, Clock, FileSignature, LayoutGrid, Lightbulb, Music2, QrCode, SlidersHorizontal, Wifi } from "lucide-react";

// Cada aba mostra um tipo de festival com a linguagem e os arquivos que ele usa
const FESTIVAIS = {
  danca: {
    aba: "Dança",
    evento: "Festival de Dança da Primavera · 2027",
    kpis: [["Inscrições", "214"], ["Coreografias", "168"], ["Trilhas recebidas", "152"], ["Termos assinados", "96%"]],
    legenda: "Ordem das coreografias · Palco principal · Sáb.",
    colunas: [["Trilha", Music2], ["Luz", Lightbulb]] as const,
    linhas: [
      { hora: "14:00", nome: "Raízes", grupo: "Cia. Movimento Livre", cat: "Contemporâneo · Adulto · Conjunto", a: true, b: true, termos: "14/14" },
      { hora: "14:06", nome: "Aurora", grupo: "Studio Plié", cat: "Ballet clássico · Juvenil · Solo", a: true, b: true, termos: "1/1" },
      { hora: "14:11", nome: "Engrenagem", grupo: "Escola Ritmo Urbano", cat: "Danças urbanas · Juvenil · Conjunto", a: true, b: false, termos: "18/19" },
      { hora: "14:18", nome: "Correnteza", grupo: "Núcleo Arte em Cena", cat: "Jazz · Infantil · Duo", a: false, b: false, termos: "2/2" },
    ],
  },
  musica: {
    aba: "Música",
    evento: "Mostra de Bandas da Serra · 2027",
    kpis: [["Bandas inscritas", "46"], ["Apresentações", "52"], ["Riders de som", "41"], ["Termos assinados", "92%"]],
    legenda: "Line-up · Palco Praça · Sex.",
    colunas: [["Rider de som", SlidersHorizontal], ["Mapa de palco", LayoutGrid]] as const,
    linhas: [
      { hora: "19:00", nome: "Ladeira", grupo: "Trio Ladeira", cat: "MPB · Trio", a: true, b: true, termos: "3/3" },
      { hora: "19:40", nome: "Noite Clara", grupo: "Banda Maré Alta", cat: "Pop / Rock · Banda", a: true, b: false, termos: "5/5" },
      { hora: "20:20", nome: "Canto da Serra", grupo: "Coro Vozes da Serra", cat: "Coral · Grupo", a: true, b: true, termos: "22/24" },
      { hora: "21:00", nome: "Estrada", grupo: "Duo Sereno", cat: "Sertanejo · Duo", a: false, b: false, termos: "2/2" },
    ],
  },
  teatro: {
    aba: "Teatro",
    evento: "Festival de Teatro Jovem · 2027",
    kpis: [["Companhias", "18"], ["Espetáculos", "21"], ["Riders de luz", "17"], ["Termos assinados", "100%"]],
    legenda: "Programação · Sala principal · Dom.",
    colunas: [["Rider de luz", Lightbulb], ["Cenário", Box]] as const,
    linhas: [
      { hora: "15:00", nome: "A Casa Torta", grupo: "Cia. Arte em Cena", cat: "Infantil · Elenco", a: true, b: true, termos: "8/8" },
      { hora: "16:30", nome: "Janelas", grupo: "Grupo Ponto de Fuga", cat: "Drama · Dueto", a: true, b: true, termos: "2/2" },
      { hora: "18:00", nome: "O Último Ato", grupo: "Coletivo Ribalta", cat: "Comédia · Elenco", a: true, b: false, termos: "11/11" },
      { hora: "19:30", nome: "Silêncio", grupo: "Teatro do Vão", cat: "Drama · Monólogo", a: false, b: false, termos: "1/1" },
    ],
  },
};

type Festival = keyof typeof FESTIVAIS;

function Marcador({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-arx-fest/12 text-arx-fest"><Check size={12} strokeWidth={2.5} /></span>
  ) : (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-arx-line text-arx-slate"><Clock size={11} /></span>
  );
}

export function PainelDemo() {
  const [tipo, setTipo] = useState<Festival>("danca");
  const f = FESTIVAIS[tipo];
  return (
    <div className="overflow-hidden rounded-xl border border-arx-line bg-arx-surface shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
      {/* barra da janela + tipos de festival */}
      <div className="flex items-center gap-2 border-b border-arx-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" /><span className="h-2.5 w-2.5 rounded-full bg-white/10" /><span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <div className="ml-auto flex gap-1 rounded-md bg-arx-obsidian p-0.5" role="tablist" aria-label="Tipo de festival">
          {(Object.keys(FESTIVAIS) as Festival[]).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tipo === k} onClick={() => setTipo(k)}
              className={`rounded px-2.5 py-1 text-[11px] transition-colors ${tipo === k ? "bg-arx-surface-2 text-white" : "text-arx-slate hover:text-arx-frost"}`}>
              {FESTIVAIS[k].aba}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-arx-slate">Evento</p>
            <p className="mt-1 text-[17px] font-medium tracking-[-0.01em] text-white">{f.evento}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Inscrições abertas
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-arx-line bg-arx-line sm:grid-cols-4">
          {f.kpis.map(([rotulo, valor]) => (
            <div key={rotulo} className="bg-arx-surface px-4 py-3">
              <p className="text-[11px] text-arx-slate">{rotulo}</p>
              <p className="mt-1 text-[22px] font-medium tabular-nums tracking-[-0.02em] text-white">{valor}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-[12px] font-medium text-arx-frost">{f.legenda}</p>
          <div className="hidden gap-4 text-[11px] text-arx-slate sm:flex">
            {f.colunas.map(([nome, Icone]) => <span key={nome} className="inline-flex items-center gap-1"><Icone size={12} /> {nome}</span>)}
            <span className="inline-flex items-center gap-1"><FileSignature size={12} /> Termos</span>
          </div>
        </div>

        <ul className="mt-3 divide-y divide-arx-line rounded-lg border border-arx-line">
          {f.linhas.map((a) => (
            <li key={a.hora} className="grid grid-cols-[44px_1fr] items-center gap-3 px-3 py-3 sm:grid-cols-[52px_1fr_auto] sm:px-4">
              <span className="text-[12px] tabular-nums text-arx-slate">{a.hora}</span>
              <div className="min-w-0">
                <p className="truncate text-[13px] text-white">{a.nome} <span className="text-arx-slate">— {a.grupo}</span></p>
                <p className="mt-0.5 truncate text-[11px] text-arx-slate">{a.cat}</p>
              </div>
              <div className="col-span-2 flex items-center gap-3 pl-[56px] sm:col-span-1 sm:pl-0">
                <Marcador ok={a.a} />
                <Marcador ok={a.b} />
                <span className="w-11 text-right text-[11px] tabular-nums text-arx-mist">{a.termos}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function TermoDemo() {
  return (
    <div className="rounded-xl border border-arx-line bg-arx-surface p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-arx-fest/10 text-arx-fest"><FileSignature size={17} /></span>
        <div>
          <p className="text-[14px] text-white">Autorização de participação</p>
          <p className="text-[12px] text-arx-slate">Atriz menor de idade · Cia. Arte em Cena</p>
        </div>
      </div>
      <dl className="mt-6 space-y-3 text-[13px]">
        {[
          ["Responsável", "Mariana C. Souza"],
          ["Parentesco", "Mãe"],
          ["CPF", "***.***.284-17"],
          ["Assinado em", "12/03/2027 às 19:42"],
          ["Registro", "IP e navegador gravados"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-arx-line pb-3 last:border-0 last:pb-0">
            <dt className="text-arx-slate">{k}</dt>
            <dd className="text-right text-arx-frost">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 inline-flex items-center gap-2 text-[12px] text-emerald-300">
        <Check size={14} /> Termo válido para esta edição
      </p>
    </div>
  );
}

export function CaixaDemo() {
  return (
    <div className="mx-auto w-[260px] rounded-[34px] border border-arx-line bg-arx-surface p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
      <div className="rounded-[26px] bg-arx-obsidian px-4 pb-5 pt-4">
        <div className="flex items-center justify-between text-[10px] text-arx-slate">
          <span>Caixa · Picadeiro</span>
          <span className="inline-flex items-center gap-1 text-amber-300"><Wifi size={11} /> Offline · 3 na fila</span>
        </div>
        <ul className="mt-4 space-y-2 text-[12px]">
          {[["Água 500 ml", 2, "8,00"], ["Pipoca", 1, "15,00"], ["Camiseta da trupe", 1, "60,00"]].map(([n, q, v]) => (
            <li key={String(n)} className="flex justify-between rounded-md bg-arx-surface px-3 py-2">
              <span className="text-arx-frost">{q}× {n}</span><span className="tabular-nums text-arx-mist">R$ {v}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-arx-line pt-3">
          <span className="text-[11px] text-arx-slate">Total</span>
          <span className="text-[22px] font-medium tabular-nums text-white">R$ 83,00</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
          <span className="rounded-md border border-arx-line py-2 text-center text-arx-mist">Dinheiro</span>
          <span className="rounded-md border border-arx-line py-2 text-center text-arx-mist">Cartão</span>
          <span className="inline-flex items-center justify-center gap-1 rounded-md bg-arx-fest py-2 font-semibold text-arx-obsidian"><QrCode size={12} /> PIX</span>
        </div>
      </div>
    </div>
  );
}

export function NotasDemo() {
  const criterios = [["Afinação", 8.5], ["Arranjo", 9.0], ["Presença de palco", 9.5], ["Repertório", 8.0]] as const;
  return (
    <div className="rounded-xl border border-arx-line bg-arx-surface p-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-arx-slate">Avaliação · Jurado 2</p>
      <p className="mt-1 text-[15px] text-white">Ladeira — Trio Ladeira</p>
      <div className="mt-6 space-y-4">
        {criterios.map(([nome, nota]) => (
          <div key={nome}>
            <div className="flex justify-between text-[12px]">
              <span className="text-arx-mist">{nome}</span>
              <span className="tabular-nums text-white">{nota.toFixed(1)}</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-arx-surface-2">
              <div className="h-1 rounded-full bg-arx-fest" style={{ width: `${nota * 10}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-baseline justify-between border-t border-arx-line pt-4">
        <span className="text-[12px] text-arx-slate">Média</span>
        <span className="text-[24px] font-medium tabular-nums text-white">8,75</span>
      </div>
    </div>
  );
}
