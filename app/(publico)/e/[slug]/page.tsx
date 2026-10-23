import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { limparHtml } from "@/lib/termos-html";
import type { Metadata } from "next";
import {
  MapPin,
  Calendar,
  Clock,
  Trophy,
  Users,
  FileText,
  ChevronDown,
  Star,
  Award,
  Ticket,
  Globe,
  ArrowRight,
  Building2,
  Info,
  Lock,
  CheckCircle2,
  ShoppingBag,
  Download,
  Shield,
  Instagram,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type EventoStatus =
  | "adiado"
  | "rascunho"
  | "inscricoes_abertas"
  | "inscricoes_encerradas"
  | "em_andamento"
  | "finalizado"
  | "cancelado";

type EventoFormato = "competitivo" | "mostra" | "misto" | null;

type TipoPremiacao =
  | "sem_premiacao"
  | "com_premiacao_trofeú"
  | "com_premiacao_dinheiro"
  | null;

type FonteFamilia = "sans" | "serif" | "mono" | "montserrat" | null;

interface Evento {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  local: string | null;
  status: EventoStatus;
  logo_url: string | null;
  banner_url: string | null;
  formato: EventoFormato;
  tipo_premiacao: TipoPremiacao;
  multilocal: boolean | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  fonte_familia: FonteFamilia;
  tema_escuro: boolean;
  exibir_loja_publica: boolean | null;
  exibir_feed_instagram: boolean | null;
  instagram_handle: string | null;
  regulamento_url: string | null;
  termo_imagem_url: string | null;
  autorizacao_menor_url: string | null;
}

interface JuradoPublico {
  id: string;
  nome: string;
  foto_url: string | null;
  especialidade: string | null;
  mini_bio: string | null;
}

interface LocalEvento {
  id: string;
  nome: string;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
}

interface TermoDocumento {
  id: string;
  titulo: string;
  conteudo: string | null;
  tipo: string | null;
}

interface CategoriaPremiacao {
  id: string;
  nome: string;
  premio_dinheiro_1: number | null;
  premio_dinheiro_2: number | null;
  premio_dinheiro_3: number | null;
}

interface ProdutoLoja {
  id: string;
  preco_evento: number | null;
  estoque_evento: number | null;
  nome: string;
  preco: number;
  descricao: string | null;
  imagem_url: string | null;
  exibir_imagem: boolean;
  exibir_loja_publica: boolean;
}

interface EventoRow {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  local: string | null;
  status: string;
  logo_url: string | null;
  banner_url: string | null;
  formato: string | null;
  tipo_premiacao: string | null;
  multilocal: boolean | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  fonte_familia: string | null;
  tema_escuro: boolean | null;
  exibir_loja_publica: boolean | null;
  exibir_feed_instagram: boolean | null;
  instagram_handle: string | null;
  regulamento_url: string | null;
  termo_imagem_url: string | null;
  autorizacao_menor_url: string | null;
}

interface JuradoPublicoRow {
  jurado_id: string;
  nome: string | null;
  foto_url: string | null;
  especialidade: string | null;
  mini_bio: string | null;
}

interface LocalEventoRow {
  id: string;
  nome_local: string;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
}

interface TermoDocumentoRow {
  id: string;
  titulo: string;
  conteudo: string | null;
  tipo: string | null;
}

interface CategoriaPremiacaoRow {
  id: string;
  nome: string;
  premio_dinheiro_1: number | null;
  premio_dinheiro_2: number | null;
  premio_dinheiro_3: number | null;
}

interface EventoProdutoRow {
  id: string;
  preco_evento: number | null;
  estoque_evento: number | null;
  ativo_evento: boolean;
  produtos: ProdutoPdvRow | ProdutoPdvRow[];
}

interface ProdutoPdvRow {
  id: string;
  nome: string;
  preco: number;
  descricao: string | null;
  ativo: boolean;
}

interface ResultadoGrupo {
  titulo: string;
  linhas: { posicao: number | null; apresentacao: string; grupo: string | null; nota: number | null }[];
}

interface DadosEventoPublico {
  evento: Evento;
  jurados: JuradoPublico[];
  locais: LocalEvento[];
  termos: TermoDocumento[];
  categoriasPremiacao: CategoriaPremiacao[];
  produtosLoja: ProdutoLoja[];
  resultado: ResultadoGrupo[];
}

function formatarData(iso: string | null): string {
  if (!iso) return "";
  const [datePart] = iso.split("T");
  if (!datePart) return "";
  const [year, month, day] = datePart.split("-");
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${day} de ${meses[parseInt(month, 10) - 1]} de ${year}`;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function corTextoContraste(hex: string | null): string {
  if (!hex) return "#ffffff";
  const h = hex.replace("#", "");

  if (h.length !== 6) return "#ffffff";

  const r = Number.parseInt(h.substring(0, 2), 16);
  const g = Number.parseInt(h.substring(2, 4), 16);
  const b = Number.parseInt(h.substring(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) return "#ffffff";

  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.5 ? "#111111" : "#ffffff";
}

function normalizarStatus(status: string): EventoStatus {
  switch (status) {
    case "inscricoes_abertas":
    case "inscricoes_encerradas":
    case "em_andamento":
    case "finalizado":
    case "cancelado":
    case "rascunho":
    case "adiado":
      return status;
    // Prorrogadas seguem aceitando inscrições como abertas
    case "inscricoes_prorrogadas":
      return "inscricoes_abertas";
    default:
      return "rascunho";
  }
}

function normalizarFormato(formato: string | null): EventoFormato {
  switch (formato) {
    case "competitivo":
    case "mostra":
    case "misto":
      return formato;
    default:
      return null;
  }
}

function normalizarTipoPremiacao(tipo: string | null): TipoPremiacao {
  switch (tipo) {
    case "sem_premiacao":
    case "com_premiacao_trofeú":
    case "com_premiacao_dinheiro":
      return tipo;
    default:
      return null;
  }
}

function normalizarFonteFamilia(fonte: string | null): FonteFamilia {
  switch (fonte) {
    case "sans":
    case "serif":
    case "mono":
    case "montserrat":
      return fonte;
    default:
      return null;
  }
}

function getFontClass(fonte: FonteFamilia) {
  if (fonte === "serif") return "font-serif";
  if (fonte === "mono") return "font-mono";
  if (fonte === "montserrat") return "font-[Montserrat,sans-serif]";
  return "font-sans";
}

function normalizarEvento(row: EventoRow): Evento {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    data_inicio: row.data_inicio,
    data_fim: row.data_fim,
    local: row.local,
    status: normalizarStatus(row.status),
    logo_url: row.logo_url,
    banner_url: row.banner_url,
    formato: normalizarFormato(row.formato),
    tipo_premiacao: normalizarTipoPremiacao(row.tipo_premiacao),
    multilocal: row.multilocal,
    cor_primaria: row.cor_primaria,
    cor_secundaria: row.cor_secundaria,
    fonte_familia: normalizarFonteFamilia(row.fonte_familia),
    tema_escuro: row.tema_escuro ?? true,
    exibir_loja_publica: row.exibir_loja_publica,
    exibir_feed_instagram: row.exibir_feed_instagram,
    instagram_handle: row.instagram_handle,
    regulamento_url: row.regulamento_url,
    termo_imagem_url: row.termo_imagem_url,
    autorizacao_menor_url: row.autorizacao_menor_url,
  };
}

function statusLabel(status: Evento["status"]): {
  texto: string;
  cor: string;
  icone: ReactNode;
} {
  switch (status) {
    case "inscricoes_abertas":
      return {
        texto: "Inscrições Abertas",
        cor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icone: <CheckCircle2 size={13} />,
      };
    case "em_andamento":
      return {
        texto: "Em Andamento",
        cor: "bg-sky-500/20 text-sky-400 border-sky-500/30",
        icone: <Clock size={13} />,
      };
    case "inscricoes_encerradas":
      return {
        texto: "Inscrições Encerradas",
        cor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        icone: <Lock size={13} />,
      };
    case "finalizado":
      return {
        texto: "Finalizado",
        cor: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        icone: <CheckCircle2 size={13} />,
      };
    case "adiado":
      return {
        texto: "Adiado",
        cor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        icone: <Clock size={13} />,
      };
    case "cancelado":
      return {
        texto: "Cancelado",
        cor: "bg-red-500/20 text-red-400 border-red-500/30",
        icone: <Info size={13} />,
      };
    default:
      return {
        texto: "Em Breve",
        cor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        icone: <Clock size={13} />,
      };
  }
}

function getThemeClasses(temaEscuro: boolean) {
  if (temaEscuro) {
    return {
      pageBg: "#0e0d0b",
      pageClass: "bg-[#0e0d0b] text-white",
      heading: "text-white",
      text: "text-gray-300",
      softText: "text-gray-400",
      faintText: "text-gray-500",
      card: "bg-white/[0.03] border-white/10",
      cardHover: "hover:bg-white/[0.05]",
      cardSoft: "bg-white/[0.04] border-white/10",
      badgeSurface: "bg-white/[0.06]",
      footerBorder: "border-white/[0.07]",
      disabledButton: "border-white/10 bg-white/10 text-gray-500",
      accordionSummaryHover: "hover:bg-white/[0.04]",
      prose: "text-gray-300",
      juradoName: "text-white",
      juradoBio: "text-gray-400",
      infoLabel: "text-gray-500",
      inputSurface: "bg-white/[0.03]",
      instagramTile: "bg-white/[0.04]",
      overlayTo: "#0e0d0b",
    };
  }

  return {
    pageBg: "#fcfbf9",
    pageClass: "bg-[#fcfbf9] text-zinc-900",
    heading: "text-zinc-900",
    text: "text-zinc-700",
    softText: "text-zinc-600",
    faintText: "text-zinc-500",
    card: "bg-white border-zinc-200",
    cardHover: "hover:bg-zinc-50",
    cardSoft: "bg-white border-zinc-200",
    badgeSurface: "bg-zinc-100",
    footerBorder: "border-zinc-200",
    disabledButton: "border-zinc-200 bg-zinc-100 text-zinc-500",
    accordionSummaryHover: "hover:bg-zinc-50",
    prose: "text-zinc-700",
    juradoName: "text-zinc-900",
    juradoBio: "text-zinc-600",
    infoLabel: "text-zinc-500",
    inputSurface: "bg-white",
    instagramTile: "bg-zinc-50",
    overlayTo: "#fcfbf9",
  };
}

function SectionHeader({
  titulo,
  corPrimaria,
  headingClass,
}: {
  titulo: string;
  corPrimaria: string;
  headingClass: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="h-6 w-1 rounded-full" style={{ background: corPrimaria }} />
      <h2 className={`text-lg font-bold ${headingClass}`}>{titulo}</h2>
    </div>
  );
}

function AccordionItem({
  titulo,
  conteudo,
  corPrimaria,
  tema,
}: {
  titulo: string;
  conteudo: string;
  corPrimaria: string | null;
  tema: ReturnType<typeof getThemeClasses>;
}) {
  const cor = corPrimaria ?? "#d4af37";

  return (
    <details className={`group overflow-hidden rounded-xl border backdrop-blur-sm ${tema.card}`}>
      <summary
        className={`flex cursor-pointer list-none items-center justify-between px-6 py-4 select-none transition-colors ${tema.accordionSummaryHover}`}
      >
        <span className={`text-sm font-semibold ${tema.heading}`}>{titulo}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 ${tema.softText} transition-transform duration-300 group-open:rotate-180`}
        />
      </summary>
      <div
        className={`max-w-none px-6 pt-2 pb-5 text-sm leading-relaxed [&_h2]:mb-3 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:font-semibold [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 ${tema.prose}`}
        style={{ borderTop: `1px solid ${cor}22` }}
        dangerouslySetInnerHTML={{ __html: conteudo }}
      />
    </details>
  );
}

function AvatarJurado({
  jurado,
  corPrimaria,
  tema,
}: {
  jurado: JuradoPublico;
  corPrimaria: string | null;
  tema: ReturnType<typeof getThemeClasses>;
}) {
  const cor = corPrimaria ?? "#d4af37";
  const iniciais = (jurado.nome ?? "Jurado")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="group flex flex-col items-center gap-3 text-center">
      <div
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-transparent transition-all duration-300"
        style={{ borderColor: `${cor}44` }}
      >
        {jurado.foto_url ? (
          <img
            src={jurado.foto_url}
            alt={jurado.nome}
            className="h-full w-full object-cover"
            loading="lazy"
            width={80}
            height={80}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-lg font-bold"
            style={{
              background: `linear-gradient(135deg, ${cor}33, ${cor}11)`,
              color: cor,
              border: `1.5px solid ${cor}44`,
            }}
          >
            {iniciais}
          </div>
        )}
      </div>
      <div>
        <p className={`text-sm leading-tight font-semibold ${tema.juradoName}`}>{jurado.nome}</p>
        {jurado.especialidade && (
          <p className={`mx-auto mt-0.5 max-w-[180px] text-xs leading-snug ${tema.softText}`}>
            {jurado.especialidade}
          </p>
        )}
        {jurado.mini_bio && (
          <p className={`mx-auto mt-2 max-w-[220px] text-[11px] leading-relaxed ${tema.juradoBio}`}>
            {jurado.mini_bio}
          </p>
        )}
      </div>
    </div>
  );
}

function CardLocal({
  local,
  tema,
}: {
  local: LocalEvento;
  tema: ReturnType<typeof getThemeClasses>;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 backdrop-blur-sm transition-colors ${tema.card} ${tema.cardHover}`}
    >
      <div className={`shrink-0 rounded-lg p-2 ${tema.badgeSurface}`}>
        <Building2 size={16} className={tema.softText} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${tema.heading}`}>{local.nome}</p>
        {local.endereco && <p className={`mt-0.5 text-xs ${tema.softText}`}>{local.endereco}</p>}
        {(local.cidade || local.estado) && (
          <p className={`mt-0.5 text-xs ${tema.faintText}`}>
            {[local.cidade, local.estado].filter(Boolean).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function CardPremiacao({
  categorias,
  corPrimaria,
  corSecundaria,
  tema,
}: {
  categorias: CategoriaPremiacao[];
  corPrimaria: string | null;
  corSecundaria: string | null;
  tema: ReturnType<typeof getThemeClasses>;
}) {
  const cor = corPrimaria ?? "#d4af37";
  const corSec = corSecundaria ?? "#b8860b";
  const maiorPremio = Math.max(
    0,
    ...categorias.flatMap((categoria) => [
      categoria.premio_dinheiro_1 ?? 0,
      categoria.premio_dinheiro_2 ?? 0,
      categoria.premio_dinheiro_3 ?? 0,
    ])
  );

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-6"
      style={{
        background: `linear-gradient(135deg, ${cor}18 0%, ${corSec}0d 100%)`,
        borderColor: `${cor}44`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 80% 50%, ${cor}, transparent 60%)`,
        }}
      />
      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="rounded-xl p-2.5"
            style={{ background: `${cor}22`, border: `1px solid ${cor}33` }}
          >
            <Trophy size={20} style={{ color: cor }} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: cor }}>
              Premiação em Destaque
            </p>
            <p className={`text-lg leading-tight font-bold ${tema.heading}`}>
              Prêmio de até <span style={{ color: cor }}>{formatarMoeda(maiorPremio)}</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((cat) => {
            const maxCat = Math.max(
              cat.premio_dinheiro_1 ?? 0,
              cat.premio_dinheiro_2 ?? 0,
              cat.premio_dinheiro_3 ?? 0
            );

            if (maxCat === 0) return null;

            return (
              <div
                key={cat.id}
                className="rounded-xl border p-3"
                style={{
                  background: `${cor}0d`,
                  borderColor: `${cor}22`,
                }}
              >
                <p className={`mb-2 text-xs font-medium ${tema.softText}`}>{cat.nome}</p>
                <div className="space-y-1">
                  {cat.premio_dinheiro_1 != null && cat.premio_dinheiro_1 > 0 && (
                    <div className="flex items-center gap-2">
                      <Award size={11} style={{ color: cor }} />
                      <span className={`text-xs font-bold ${tema.heading}`}>
                        {formatarMoeda(cat.premio_dinheiro_1)}
                      </span>
                      <span className={`text-xs ${tema.faintText}`}>1 lugar</span>
                    </div>
                  )}
                  {cat.premio_dinheiro_2 != null && cat.premio_dinheiro_2 > 0 && (
                    <div className="flex items-center gap-2">
                      <Award size={11} className={tema.softText} />
                      <span className={`text-xs font-bold ${tema.heading}`}>
                        {formatarMoeda(cat.premio_dinheiro_2)}
                      </span>
                      <span className={`text-xs ${tema.faintText}`}>2 lugar</span>
                    </div>
                  )}
                  {cat.premio_dinheiro_3 != null && cat.premio_dinheiro_3 > 0 && (
                    <div className="flex items-center gap-2">
                      <Award size={11} className={tema.faintText} />
                      <span className={`text-xs font-bold ${tema.heading}`}>
                        {formatarMoeda(cat.premio_dinheiro_3)}
                      </span>
                      <span className={`text-xs ${tema.faintText}`}>3 lugar</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BotaoInscricao({
  status,
  eventoId,
  corPrimaria,
  tema,
}: {
  status: Evento["status"];
  eventoId: string;
  corPrimaria: string | null;
  tema: ReturnType<typeof getThemeClasses>;
}) {
  const cor = corPrimaria ?? "#d4af37";
  const textoCor = corTextoContraste(corPrimaria);
  const aberto = status === "inscricoes_abertas";

  if (aberto) {
    return (
      <Link
        href={`/inscricao/${eventoId}`}
        className="inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-bold shadow-lg transition-all duration-200 active:scale-95"
        style={{
          background: cor,
          color: textoCor,
          boxShadow: `0 4px 24px ${cor}44`,
        }}
      >
        <Ticket size={17} />
        Realizar Inscrição
        <ArrowRight size={15} />
      </Link>
    );
  }

  const labelBloqueio =
    status === "inscricoes_encerradas" || status === "finalizado"
      ? "Inscrições Encerradas"
      : "Inscrições Bloqueadas";

  return (
    <button
      disabled
      className={`inline-flex cursor-not-allowed select-none items-center gap-2.5 rounded-xl border px-8 py-3.5 text-sm font-bold ${tema.disabledButton}`}
    >
      <Lock size={15} />
      {labelBloqueio}
    </button>
  );
}

async function fetchDadosEvento(slug: string): Promise<DadosEventoPublico | null> {
  const supabase = await createClient();

  const { data: eventoData, error } = await supabase
    .from("eventos")
    .select(
      "id, nome, descricao, data_inicio, data_fim, local, status, logo_url, banner_url, formato, tipo_premiacao, multilocal, cor_primaria, cor_secundaria, fonte_familia, tema_escuro, exibir_loja_publica, exibir_feed_instagram, instagram_handle, regulamento_url, termo_imagem_url, autorizacao_menor_url"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !eventoData) return null;

  const ev = normalizarEvento(eventoData as EventoRow);
  const competitivo = ev.formato === "competitivo" || ev.formato === "misto";

  const [juradosRes, locaisRes, termosRes, categoriasRes, produtosRes] = await Promise.all([
    competitivo
      ? supabase
          // View pública: só nome, foto, especialidade e bio (sem cachê/contato)
          .from("jurados_publicos")
          .select("jurado_id, nome, foto_url, especialidade, mini_bio")
          .eq("evento_id", ev.id)
      : Promise.resolve({ data: null, error: null }),
    ev.multilocal
      ? supabase
          .from("locais_evento")
          .select("id, nome_local, endereco, cidade, estado")
          .eq("evento_id", ev.id)
          .order("nome_local")
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("termos_documentos")
      .select("id, titulo, conteudo, tipo")
      .eq("evento_id", ev.id)
      .eq("ativo", true)
      .order("criado_em"),
    ev.tipo_premiacao === "com_premiacao_dinheiro"
      ? supabase
          .from("categorias")
          .select("id, nome, premio_dinheiro_1, premio_dinheiro_2, premio_dinheiro_3")
          .eq("evento_id", ev.id)
          .or("premio_dinheiro_1.gt.0,premio_dinheiro_2.gt.0,premio_dinheiro_3.gt.0")
      : Promise.resolve({ data: null, error: null }),
    // Vitrine: produtos do PDV marcados para este evento (PDV & Bilheteria → produto)
    supabase
      .from("evento_produtos")
      .select("id, preco_evento, estoque_evento, ativo_evento, produtos:pdv_produtos!inner(id, nome, preco, descricao, ativo)")
      .eq("evento_id", ev.id)
      .eq("ativo_evento", true),
  ]);

  const juradosRows = (juradosRes.data ?? []) as JuradoPublicoRow[];
  const jurados: JuradoPublico[] = competitivo
    ? juradosRows.map(
        (row) =>
          ({
            id: row.jurado_id,
            nome: row.nome?.trim() || "Jurado(a)",
            foto_url: row.foto_url,
            especialidade: row.especialidade,
            mini_bio: row.mini_bio,
          }) satisfies JuradoPublico
      )
    : [];

  const locais: LocalEvento[] = ev.multilocal
    ? ((locaisRes.data ?? []) as LocalEventoRow[]).map(
        (local) =>
          ({
            id: local.id,
            nome: local.nome_local,
            endereco: local.endereco,
            cidade: local.cidade,
            estado: local.estado,
          }) satisfies LocalEvento
      )
    : [];

  const termos: TermoDocumento[] = ((termosRes.data ?? []) as TermoDocumentoRow[]).map(
    (termo) =>
      ({
        id: termo.id,
        titulo: termo.titulo,
        conteudo: limparHtml(termo.conteudo),
        tipo: termo.tipo,
      }) satisfies TermoDocumento
  );

  const categoriasPremiacao: CategoriaPremiacao[] =
    ev.tipo_premiacao === "com_premiacao_dinheiro"
      ? ((categoriasRes.data ?? []) as CategoriaPremiacaoRow[]).map(
          (categoria) =>
            ({
              id: categoria.id,
              nome: categoria.nome,
              premio_dinheiro_1: categoria.premio_dinheiro_1,
              premio_dinheiro_2: categoria.premio_dinheiro_2,
              premio_dinheiro_3: categoria.premio_dinheiro_3,
            }) satisfies CategoriaPremiacao
        )
      : [];

  const produtosLoja: ProdutoLoja[] = [];
  if (produtosRes.data) {
    for (const item of produtosRes.data as EventoProdutoRow[]) {
      const produtoData = Array.isArray(item.produtos) ? item.produtos[0] : item.produtos;
      if (produtoData && produtoData.ativo !== false) {
        produtosLoja.push({
          id: item.id,
          preco_evento: item.preco_evento,
          estoque_evento: item.estoque_evento,
          nome: produtoData.nome,
          preco: produtoData.preco,
          descricao: produtoData.descricao,
          imagem_url: null,
          exibir_imagem: false,
          exibir_loja_publica: true,
        });
      }
    }
  }

  // Resultado oficial (só existe depois que a produção publica)
  const { data: resultadoRows } = await supabase
    .from("resultados_publicados")
    .select("grupo_titulo, ordem_grupo, posicao, apresentacao_nome, grupo_nome, nota")
    .eq("evento_id", ev.id)
    .order("ordem_grupo")
    .order("posicao", { nullsFirst: false });
  const resultado: ResultadoGrupo[] = [];
  for (const r of (resultadoRows ?? []) as { grupo_titulo: string; posicao: number | null; apresentacao_nome: string; grupo_nome: string | null; nota: number | null }[]) {
    let g = resultado.find((x) => x.titulo === r.grupo_titulo);
    if (!g) { g = { titulo: r.grupo_titulo, linhas: [] }; resultado.push(g); }
    g.linhas.push({ posicao: r.posicao, apresentacao: r.apresentacao_nome, grupo: r.grupo_nome, nota: r.nota === null ? null : Number(r.nota) });
  }

  return { evento: ev, jurados, locais, termos, categoriasPremiacao, produtosLoja, resultado };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dados = await fetchDadosEvento(slug);

  if (!dados) {
    return {
      title: "Festival não encontrado",
      description: "Nenhum festival ativo foi encontrado neste endereço.",
    };
  }

  return {
    title: dados.evento.nome,
    description:
      dados.evento.descricao?.slice(0, 160) ??
      `Inscrições abertas para ${dados.evento.nome}.`,
    openGraph: {
      title: dados.evento.nome,
      description:
        dados.evento.descricao?.slice(0, 160) ??
        `Inscrições abertas para ${dados.evento.nome}.`,
      images: dados.evento.banner_url ? [{ url: dados.evento.banner_url }] : [],
    },
  };
}

export default async function PaginaPublicaFestivalPage({ params }: PageProps) {
  const { slug } = await params;
  const dados = await fetchDadosEvento(slug);

  if (!dados) {
    notFound();
  }

  const { evento, jurados, locais, termos, categoriasPremiacao, produtosLoja, resultado } = dados;
  const corPrimaria = evento.cor_primaria ?? "#d4af37";
  const corSecundaria = evento.cor_secundaria ?? "#b8860b";
  const fonteFamilia = evento.fonte_familia;
  const fontClass = getFontClass(fonteFamilia);
  const statusInfo = statusLabel(evento.status);
  const competitivo = evento.formato === "competitivo" || evento.formato === "misto";
  const temPremiacao =
    evento.tipo_premiacao === "com_premiacao_dinheiro" && categoriasPremiacao.length > 0;
  const tema = getThemeClasses(evento.tema_escuro ?? true);

  return (
    <main
      className={`min-h-screen antialiased ${fontClass} ${tema.pageClass}`}
      style={
        {
          "--cor-primaria": corPrimaria,
          "--cor-secundaria": corSecundaria,
          backgroundColor: tema.pageBg,
        } as CSSProperties
      }
    >
      <section className="relative w-full overflow-hidden">
        <div className="relative h-64 w-full sm:h-80 md:h-96 lg:h-[480px]">
          {evento.banner_url ? (
            <img
              src={evento.banner_url}
              alt={`Banner de ${evento.nome}`}
              className="absolute inset-0 h-full w-full object-cover"
              width={1440}
              height={480}
              loading="eager"
            />
          ) : (
            <div
              className="absolute inset-0 h-full w-full"
              style={{
                background: `linear-gradient(135deg, ${corPrimaria}22 0%, ${tema.overlayTo} 60%, ${corSecundaria}11 100%)`,
              }}
            />
          )}

          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, ${corPrimaria}11 40%, ${tema.overlayTo} 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.18) 40%, ${tema.overlayTo} 100%)`,
            }}
          />

          <div className="absolute top-5 left-5 sm:top-6 sm:left-8">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md ${statusInfo.cor}`}
            >
              {statusInfo.icone}
              {statusInfo.texto}
            </span>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-20 max-w-5xl px-5 pb-0 sm:-mt-28 sm:px-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
            <div
              className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 shadow-2xl sm:h-28 sm:w-28"
              style={{ borderColor: `${corPrimaria}55` }}
            >
              {evento.logo_url ? (
                <img
                  src={evento.logo_url}
                  alt={`Logo de ${evento.nome}`}
                  className="h-full w-full object-cover"
                  width={112}
                  height={112}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${corPrimaria}33, ${corSecundaria}22)`,
                  }}
                >
                  <Star size={32} style={{ color: corPrimaria }} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-2">
              <h1 className={`text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl md:text-4xl ${tema.heading}`}>
                {evento.nome}
              </h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {(evento.data_inicio || evento.data_fim) && (
                  <span className={`inline-flex items-center gap-1.5 text-xs ${tema.softText}`}>
                    <Calendar size={13} style={{ color: corPrimaria }} />
                    {evento.data_inicio && formatarData(evento.data_inicio)}
                    {evento.data_fim &&
                      evento.data_fim !== evento.data_inicio &&
                      ` até ${formatarData(evento.data_fim)}`}
                  </span>
                )}
                {evento.local && !evento.multilocal && (
                  <span className={`inline-flex items-center gap-1.5 text-xs ${tema.softText}`}>
                    <MapPin size={13} style={{ color: corPrimaria }} />
                    {evento.local}
                  </span>
                )}
                {evento.multilocal && (
                  <span className={`inline-flex items-center gap-1.5 text-xs ${tema.softText}`}>
                    <Globe size={13} style={{ color: corPrimaria }} />
                    Multilocal
                  </span>
                )}
                {competitivo && (
                  <span className={`inline-flex items-center gap-1.5 text-xs ${tema.softText}`}>
                    <Trophy size={13} style={{ color: corPrimaria }} />
                    {evento.formato === "misto" ? "Festival Misto" : "Festival Competitivo"}
                  </span>
                )}
                {evento.formato === "mostra" && (
                  <span className={`inline-flex items-center gap-1.5 text-xs ${tema.softText}`}>
                    <FileText size={13} style={{ color: corPrimaria }} />
                    Mostra
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-14 px-5 py-10 sm:px-8">
        <div
          className="flex flex-col items-start justify-between gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center"
          style={{
            background: `linear-gradient(135deg, ${corPrimaria}11 0%, ${corSecundaria}08 100%)`,
            borderColor: `${corPrimaria}33`,
          }}
        >
          <div>
            <h2 className="mb-0.5 text-base font-bold" style={{ color: corPrimaria }}>
              {evento.status === "inscricoes_abertas"
                ? "Inscrições abertas"
                : "Acompanhe este festival"}
            </h2>
            <p className={`text-sm ${tema.softText}`}>
              {evento.status === "inscricoes_abertas"
                ? "Garanta a participação do seu grupo: a inscrição é feita online, por aqui."
                : "As inscrições para este festival estão indisponíveis no momento."}
            </p>
          </div>
          <BotaoInscricao
            status={evento.status}
            eventoId={evento.id}
            corPrimaria={evento.cor_primaria}
            tema={tema}
          />
        </div>

        {evento.descricao && (
          <section aria-labelledby="secao-sobre">
            <SectionHeader
              titulo="Sobre o Festival"
              corPrimaria={corPrimaria}
              headingClass={tema.heading}
            />
            <div className={`rounded-2xl border p-6 backdrop-blur-sm ${tema.card}`} style={{ borderColor: `${corPrimaria}22` }}>
              <p className={`text-sm leading-relaxed whitespace-pre-line ${tema.text}`}>
                {evento.descricao}
              </p>
            </div>
          </section>
        )}

        {resultado.length > 0 && (
          <section aria-labelledby="secao-resultado">
            <SectionHeader titulo="Resultado" corPrimaria={corPrimaria} headingClass={tema.heading} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {resultado.map((g) => (
                <div key={g.titulo} className={`rounded-2xl border p-5 ${tema.card}`} style={{ borderColor: `${corPrimaria}22` }}>
                  <h3 className={`text-sm font-semibold ${tema.heading}`}>{g.titulo}</h3>
                  <ol className="mt-3 space-y-2">
                    {g.linhas.map((l, i) => (
                      <li key={i} className="flex items-baseline gap-3 text-sm">
                        <span className="w-8 shrink-0 font-semibold tabular-nums" style={{ color: corPrimaria }}>{l.posicao ? `${l.posicao}º` : "—"}</span>
                        <span className="min-w-0 flex-1">
                          <span className={tema.heading}>{l.apresentacao}</span>
                          {l.grupo && <span className={`block text-xs ${tema.softText}`}>{l.grupo}</span>}
                        </span>
                        <span className={`tabular-nums ${tema.text}`}>{l.nota?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}

        {temPremiacao && (
          <section aria-labelledby="secao-premiacao">
            <SectionHeader
              titulo="Premiação"
              corPrimaria={corPrimaria}
              headingClass={tema.heading}
            />
            <CardPremiacao
              categorias={categoriasPremiacao}
              corPrimaria={evento.cor_primaria}
              corSecundaria={evento.cor_secundaria}
              tema={tema}
            />
          </section>
        )}

        {competitivo && jurados.length > 0 && (
          <section aria-labelledby="secao-jurados">
            <SectionHeader
              titulo="Corpo de Jurados"
              corPrimaria={corPrimaria}
              headingClass={tema.heading}
            />
            <div className={`rounded-2xl border p-6 ${tema.card}`} style={{ borderColor: `${corPrimaria}22` }}>
              <div className="mb-5 flex items-center gap-2">
                <Users size={15} style={{ color: corPrimaria }} />
                <span className={`text-xs ${tema.softText}`}>
                  {jurados.length} jurado{jurados.length !== 1 ? "s" : ""} escalado
                  {jurados.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {jurados.map((jurado) => (
                  <div
                    key={jurado.id}
                    className={`rounded-2xl border p-5 text-center ${tema.cardSoft}`}
                    style={{ borderColor: `${corPrimaria}18` }}
                  >
                    <AvatarJurado jurado={jurado} corPrimaria={evento.cor_primaria} tema={tema} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {evento.multilocal && locais.length > 0 && (
          <section aria-labelledby="secao-locais">
            <SectionHeader
              titulo="Locais do Festival"
              corPrimaria={corPrimaria}
              headingClass={tema.heading}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {locais.map((local) => (
                <CardLocal key={local.id} local={local} tema={tema} />
              ))}
            </div>
          </section>
        )}

        {produtosLoja.length > 0 && (
          <section aria-labelledby="secao-loja">
            <SectionHeader
              titulo="Loja do Festival"
              corPrimaria={corPrimaria}
              headingClass={tema.heading}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {produtosLoja.map((produto) => {
                const preco = produto.preco_evento ?? produto.preco;
                return (
                  <div
                    key={produto.id}
                    className={`rounded-2xl border overflow-hidden ${tema.card}`}
                    style={{ borderColor: `${corPrimaria}22` }}
                  >
                    {produto.exibir_imagem && produto.imagem_url ? (
                      <img
                        src={produto.imagem_url}
                        alt={produto.nome}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="p-5 pb-0">
                        <div
                          className="mb-4 inline-flex rounded-xl p-3"
                          style={{ background: `${corPrimaria}16` }}
                        >
                          <ShoppingBag size={18} style={{ color: corPrimaria }} />
                        </div>
                      </div>
                    )}
                    <div className={`p-5 ${produto.exibir_imagem && produto.imagem_url ? '' : 'pt-0'}`}>
                      <h3 className={`text-base font-bold ${tema.heading}`}>{produto.nome}</h3>
                      <p className="mt-2 text-sm font-semibold" style={{ color: corPrimaria }}>
                        {formatarMoeda(preco)}
                      </p>
                      {produto.descricao && (
                        <p className={`mt-2 text-sm leading-relaxed ${tema.text}`}>
                          {produto.descricao}
                        </p>
                      )}
                      <p
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold"
                        style={{ borderColor: `${corPrimaria}40`, color: corPrimaria }}
                      >
                        <ShoppingBag size={13} />
                        À venda no evento
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section aria-labelledby="secao-menores">
          <SectionHeader
            titulo="Autorização para Menores"
            corPrimaria={corPrimaria}
            headingClass={tema.heading}
          />
          <div
            className="rounded-2xl border p-6"
            style={{
              background: `linear-gradient(135deg, ${corPrimaria}12 0%, transparent 100%)`,
              borderColor: `${corPrimaria}28`,
            }}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl p-3" style={{ background: `${corPrimaria}18` }}>
                    <Shield size={18} style={{ color: corPrimaria }} />
                  </div>
                  <h3 className={`text-base font-bold ${tema.heading}`}>
                    Termo de participação e uso de imagem
                  </h3>
                </div>
                <p className={`text-sm leading-relaxed ${tema.text}`}>
                  Quando o grupo cadastra um participante menor de idade, o responsável legal recebe um link por e-mail para assinar digitalmente o termo de participação e uso de imagem. Não é preciso imprimir nada.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {evento.autorizacao_menor_url && (
                  <a
                    href={evento.autorizacao_menor_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${tema.cardSoft}`}
                  >
                    <Download size={15} />
                    Baixar autorização
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {evento.exibir_feed_instagram && evento.instagram_handle && (
          <section aria-labelledby="secao-instagram">
            <SectionHeader
              titulo="Festival no Instagram"
              corPrimaria={corPrimaria}
              headingClass={tema.heading}
            />
            <div className={`rounded-2xl border p-6 ${tema.card}`} style={{ borderColor: `${corPrimaria}22` }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Instagram size={16} style={{ color: corPrimaria }} />
                    <p className={`text-sm font-semibold ${tema.heading}`}>
                      @{evento.instagram_handle}
                    </p>
                  </div>
                  <p className={`mt-1 text-sm ${tema.softText}`}>
                    Acompanhe bastidores, agenda, destaques e conteúdos em tempo real.
                  </p>
                </div>
                <a
                  href={`https://instagram.com/${evento.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${tema.cardSoft}`}
                >
                  Ver perfil
                  <ArrowRight size={14} />
                </a>
              </div>

            </div>
          </section>
        )}

        {termos.length > 0 && (
          <section aria-labelledby="secao-regulamento">
            <SectionHeader
              titulo="Regulamento e Diretrizes"
              corPrimaria={corPrimaria}
              headingClass={tema.heading}
            />
            <div className="space-y-2">
              {termos.map((termo) => (
                <AccordionItem
                  key={termo.id}
                  titulo={termo.titulo}
                  conteudo={termo.conteudo || "Conteúdo não disponível."}
                  corPrimaria={evento.cor_primaria}
                  tema={tema}
                />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="secao-info">
          <SectionHeader
            titulo="Informações do Evento"
            corPrimaria={corPrimaria}
            headingClass={tema.heading}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evento.data_inicio && (
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 ${tema.card}`}
                style={{ borderColor: `${corPrimaria}22` }}
              >
                <div className="shrink-0 rounded-lg p-2" style={{ background: `${corPrimaria}18` }}>
                  <Calendar size={16} style={{ color: corPrimaria }} />
                </div>
                <div>
                  <p className={`mb-0.5 text-xs font-semibold tracking-wide uppercase ${tema.infoLabel}`}>
                    Data de Início
                  </p>
                  <p className={`text-sm font-medium ${tema.heading}`}>
                    {formatarData(evento.data_inicio)}
                  </p>
                </div>
              </div>
            )}

            {evento.data_fim && (
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 ${tema.card}`}
                style={{ borderColor: `${corPrimaria}22` }}
              >
                <div className="shrink-0 rounded-lg p-2" style={{ background: `${corPrimaria}18` }}>
                  <Clock size={16} style={{ color: corPrimaria }} />
                </div>
                <div>
                  <p className={`mb-0.5 text-xs font-semibold tracking-wide uppercase ${tema.infoLabel}`}>
                    Data de Encerramento
                  </p>
                  <p className={`text-sm font-medium ${tema.heading}`}>
                    {formatarData(evento.data_fim)}
                  </p>
                </div>
              </div>
            )}

            {evento.local && (
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 ${tema.card}`}
                style={{ borderColor: `${corPrimaria}22` }}
              >
                <div className="shrink-0 rounded-lg p-2" style={{ background: `${corPrimaria}18` }}>
                  <MapPin size={16} style={{ color: corPrimaria }} />
                </div>
                <div>
                  <p className={`mb-0.5 text-xs font-semibold tracking-wide uppercase ${tema.infoLabel}`}>
                    Local
                  </p>
                  <p className={`text-sm font-medium ${tema.heading}`}>{evento.local}</p>
                </div>
              </div>
            )}

            {evento.formato && (
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 ${tema.card}`}
                style={{ borderColor: `${corPrimaria}22` }}
              >
                <div className="shrink-0 rounded-lg p-2" style={{ background: `${corPrimaria}18` }}>
                  <FileText size={16} style={{ color: corPrimaria }} />
                </div>
                <div>
                  <p className={`mb-0.5 text-xs font-semibold tracking-wide uppercase ${tema.infoLabel}`}>
                    Formato
                  </p>
                  <p className={`text-sm font-medium capitalize ${tema.heading}`}>
                    {evento.formato === "competitivo"
                      ? "Competitivo"
                      : evento.formato === "mostra"
                        ? "Mostra"
                        : "Misto"}
                  </p>
                </div>
              </div>
            )}

            {evento.tipo_premiacao && evento.tipo_premiacao !== "sem_premiacao" && (
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 ${tema.card}`}
                style={{ borderColor: `${corPrimaria}22` }}
              >
                <div className="shrink-0 rounded-lg p-2" style={{ background: `${corPrimaria}18` }}>
                  <Trophy size={16} style={{ color: corPrimaria }} />
                </div>
                <div>
                  <p className={`mb-0.5 text-xs font-semibold tracking-wide uppercase ${tema.infoLabel}`}>
                    Premiação
                  </p>
                  <p className={`text-sm font-medium ${tema.heading}`}>
                    {evento.tipo_premiacao === "com_premiacao_dinheiro"
                      ? "Prêmio em Dinheiro"
                      : "Troféu e Certificado"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <div
          className="flex flex-col items-center rounded-2xl border px-6 py-12 text-center"
          style={{
            background: `linear-gradient(135deg, ${corPrimaria}0d 0%, transparent 60%)`,
            borderColor: `${corPrimaria}22`,
          }}
        >
          <div className="mb-4 rounded-2xl p-4" style={{ background: `${corPrimaria}18` }}>
            <Ticket size={28} style={{ color: corPrimaria }} />
          </div>
          <h2 className={`mb-2 text-xl font-bold ${tema.heading}`}>Pronto para participar?</h2>
          <p className={`mb-7 max-w-md text-sm ${tema.softText}`}>
            Faça sua inscrição agora, selecione as categorias que deseja concorrer e aguarde a
            confirmação da equipe organizadora.
          </p>
          <BotaoInscricao
            status={evento.status}
            eventoId={evento.id}
            corPrimaria={evento.cor_primaria}
            tema={tema}
          />
        </div>

        <footer className={`border-t pt-6 text-center ${tema.footerBorder}`}>
          <p className={`text-xs ${tema.faintText}`}>
            Portal de inscrições operado pela plataforma de gestão de festivais.
          </p>
        </footer>
      </div>
    </main>
  );
}