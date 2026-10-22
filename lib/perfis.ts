// ─────────────────────────────────────────────────────────────────────────────
// Vocabulário e configuração técnica por TIPO DE FESTIVAL (perfis_festival.slug).
// O tipo é escolhido no evento; todas as telas do evento falam a língua dele.
// Para criar um tipo novo: cadastre em perfis_festival e adicione aqui.
// ─────────────────────────────────────────────────────────────────────────────

export type SlugPerfil = "danca" | "musica" | "teatro" | "circo" | "talentos_estudantil" | "multidisciplinar";

interface Termo {
  singular: string;
  plural: string;
  genero: "m" | "f";
}

export interface ArquivoTecnico {
  chave: string;
  nome: string;
  descricao: string;
  tipos: ("audio" | "pdf" | "imagem")[];
  obrigatorio: boolean;
}

export interface Perfil {
  slug: SlugPerfil;
  nome: string;
  termos: {
    grupo: Termo;            // quem se inscreve (escola, banda, companhia…)
    participante: Termo;     // integrante do elenco
    apresentacao: Termo;     // o que sobe ao palco
    elenco: string;          // coletivo de participantes
  };
  formacoes: Record<"solo" | "duo" | "conjunto" | "grupo", string>;
  funcoes: { valor: string; nome: string }[];
  arquivos: ArquivoTecnico[];
}

const t = (singular: string, plural: string, genero: "m" | "f"): Termo => ({ singular, plural, genero });

const A = {
  trilha: { chave: "trilha", nome: "Trilha sonora", descricao: "Áudio que será executado na apresentação.", tipos: ["audio"], obrigatorio: true },
  mapaLuz: { chave: "mapa_luz", nome: "Mapa de luz", descricao: "Desenho ou roteiro da iluminação.", tipos: ["pdf", "imagem"], obrigatorio: false },
  mapaPalco: { chave: "mapa_palco", nome: "Mapa de palco", descricao: "Posições, marcações e entradas/saídas (stage plot).", tipos: ["pdf", "imagem"], obrigatorio: false },
  cenario: { chave: "cenario", nome: "Cenário", descricao: "Elementos de cena, montagem e desmontagem.", tipos: ["pdf", "imagem"], obrigatorio: false },
  riderSom: { chave: "rider_som", nome: "Rider de som", descricao: "Input list, microfones, retornos e backline.", tipos: ["pdf", "imagem"], obrigatorio: true },
  riderLuz: { chave: "rider_luz", nome: "Rider de luz", descricao: "Necessidades de iluminação e efeitos.", tipos: ["pdf", "imagem"], obrigatorio: false },
  base: { chave: "base", nome: "Base / playback", descricao: "Áudio de apoio, quando houver.", tipos: ["audio"], obrigatorio: false },
  roteiro: { chave: "roteiro_tecnico", nome: "Roteiro técnico", descricao: "Deixas de luz, som e cena.", tipos: ["pdf"], obrigatorio: false },
  riderTecnico: { chave: "rider_tecnico", nome: "Rider técnico de aparelhos", descricao: "Aéreos, pontos de ancoragem, alturas e segurança.", tipos: ["pdf", "imagem"], obrigatorio: true },
} satisfies Record<string, ArquivoTecnico>;

const PRODUCAO = { valor: "producao", nome: "Produção" };
const TECNICO = { valor: "tecnico", nome: "Técnico(a)" };

export const PERFIS: Record<SlugPerfil, Perfil> = {
  danca: {
    slug: "danca",
    nome: "Dança",
    termos: {
      grupo: t("escola", "escolas", "f"),
      participante: t("bailarino(a)", "bailarinos", "m"),
      apresentacao: t("coreografia", "coreografias", "f"),
      elenco: "elenco",
    },
    formacoes: { solo: "Solo", duo: "Duo", conjunto: "Conjunto", grupo: "Grupo" },
    funcoes: [
      { valor: "bailarino", nome: "Bailarino(a)" },
      { valor: "coreografo", nome: "Coreógrafo(a)" },
      { valor: "diretor", nome: "Diretor(a)" },
      { valor: "ensaiador", nome: "Ensaiador(a)" },
      { valor: "professor", nome: "Professor(a)" },
      { valor: "figurinista", nome: "Figurinista" },
      TECNICO, PRODUCAO,
    ],
    arquivos: [A.trilha, A.mapaLuz, A.mapaPalco, A.cenario],
  },
  musica: {
    slug: "musica",
    nome: "Música",
    termos: {
      grupo: t("banda", "bandas", "f"),
      participante: t("músico(a)", "músicos", "m"),
      apresentacao: t("apresentação", "apresentações", "f"),
      elenco: "formação",
    },
    formacoes: { solo: "Solo", duo: "Duo", conjunto: "Trio / Conjunto", grupo: "Banda" },
    funcoes: [
      { valor: "musico", nome: "Músico(a)" },
      { valor: "cantor", nome: "Cantor(a)" },
      { valor: "produtor_musical", nome: "Produtor(a) musical" },
      { valor: "diretor_musical", nome: "Diretor(a) musical" },
      { valor: "roadie", nome: "Roadie" },
      { valor: "tecnico_som", nome: "Técnico(a) de som" },
      { valor: "tecnico_luz", nome: "Técnico(a) de luz" },
      PRODUCAO,
    ],
    arquivos: [A.riderSom, A.riderLuz, A.mapaPalco, A.base],
  },
  teatro: {
    slug: "teatro",
    nome: "Teatro",
    termos: {
      grupo: t("companhia", "companhias", "f"),
      participante: t("ator/atriz", "atores", "m"),
      apresentacao: t("espetáculo", "espetáculos", "m"),
      elenco: "elenco",
    },
    formacoes: { solo: "Monólogo", duo: "Dueto", conjunto: "Elenco", grupo: "Elenco" },
    funcoes: [
      { valor: "ator", nome: "Ator/Atriz" },
      { valor: "diretor", nome: "Diretor(a)" },
      { valor: "assistente_direcao", nome: "Assistente de direção" },
      { valor: "dramaturgo", nome: "Dramaturgo(a)" },
      { valor: "cenografo", nome: "Cenógrafo(a)" },
      { valor: "figurinista", nome: "Figurinista" },
      { valor: "iluminador", nome: "Iluminador(a)" },
      { valor: "sonoplasta", nome: "Sonoplasta" },
      { valor: "contrarregra", nome: "Contrarregra" },
      PRODUCAO,
    ],
    arquivos: [A.riderLuz, A.trilha, A.mapaPalco, A.cenario, A.roteiro].map((a) => (a.chave === "trilha" ? { ...a, nome: "Trilha / sonoplastia", obrigatorio: false } : a)),
  },
  circo: {
    slug: "circo",
    nome: "Circo & Artes Físicas",
    termos: {
      grupo: t("trupe", "trupes", "f"),
      participante: t("artista", "artistas", "m"),
      apresentacao: t("número", "números", "m"),
      elenco: "elenco",
    },
    formacoes: { solo: "Solo", duo: "Duo", conjunto: "Trupe", grupo: "Trupe" },
    funcoes: [
      { valor: "artista", nome: "Artista circense" },
      { valor: "diretor", nome: "Diretor(a)" },
      { valor: "coreografo", nome: "Coreógrafo(a)" },
      { valor: "rigger", nome: "Rigger (técnico de aéreos)" },
      TECNICO, PRODUCAO,
    ],
    arquivos: [A.riderTecnico, A.trilha, A.mapaLuz, A.mapaPalco],
  },
  talentos_estudantil: {
    slug: "talentos_estudantil",
    nome: "Talentos Estudantil",
    termos: {
      grupo: t("escola", "escolas", "f"),
      participante: t("aluno(a)", "alunos", "m"),
      apresentacao: t("apresentação", "apresentações", "f"),
      elenco: "participantes",
    },
    formacoes: { solo: "Individual", duo: "Dupla", conjunto: "Grupo", grupo: "Turma" },
    funcoes: [
      { valor: "aluno", nome: "Aluno(a)" },
      { valor: "professor", nome: "Professor(a) responsável" },
      { valor: "diretor", nome: "Diretor(a)" },
      TECNICO, PRODUCAO,
    ],
    arquivos: [{ ...A.trilha, obrigatorio: false }, A.roteiro],
  },
  multidisciplinar: {
    slug: "multidisciplinar",
    nome: "Multidisciplinar",
    termos: {
      grupo: t("grupo", "grupos", "m"),
      participante: t("artista", "artistas", "m"),
      apresentacao: t("apresentação", "apresentações", "f"),
      elenco: "elenco",
    },
    formacoes: { solo: "Solo", duo: "Duo", conjunto: "Conjunto", grupo: "Grupo" },
    funcoes: [
      { valor: "artista", nome: "Artista" },
      { valor: "bailarino", nome: "Bailarino(a)" },
      { valor: "musico", nome: "Músico(a)" },
      { valor: "ator", nome: "Ator/Atriz" },
      { valor: "diretor", nome: "Diretor(a)" },
      { valor: "coreografo", nome: "Coreógrafo(a)" },
      TECNICO, PRODUCAO,
    ],
    arquivos: [{ ...A.trilha, obrigatorio: false }, A.riderSom, A.riderLuz, A.mapaPalco, A.cenario].map((a) => ({ ...a, obrigatorio: false })),
  },
};

export const PERFIL_PADRAO: SlugPerfil = "multidisciplinar";

export function perfilPorSlug(slug: string | null | undefined): Perfil {
  return PERFIS[(slug as SlugPerfil) ?? PERFIL_PADRAO] ?? PERFIS[PERFIL_PADRAO];
}

// ── Ajudantes de texto ──────────────────────────────────────────────────────

export const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// "Nova coreografia", "Novo espetáculo"
export function novo(termo: Termo) {
  return `${termo.genero === "f" ? "Nova" : "Novo"} ${termo.singular}`;
}

// "1 coreografia", "3 coreografias"
export function contar(n: number, termo: Termo) {
  return `${n} ${n === 1 ? termo.singular : termo.plural}`;
}

export function nomeFuncao(perfil: Perfil, valor: string | null | undefined) {
  if (!valor) return "";
  const todas = Object.values(PERFIS).flatMap((p) => p.funcoes);
  return perfil.funcoes.find((f) => f.valor === valor)?.nome ?? todas.find((f) => f.valor === valor)?.nome ?? maiuscula(valor);
}

// Tipos aceitos pelo upload de cada arquivo técnico
export const MIME_ARQUIVO: Record<ArquivoTecnico["tipos"][number], string> = {
  audio: "audio/*",
  pdf: "application/pdf",
  imagem: "image/*",
};
