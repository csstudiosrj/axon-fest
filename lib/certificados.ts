// Certificados de participação: um por pessoa e por apresentação em que ela fez check-in.
// O modelo (título, texto, cor, fundo e assinaturas) é editado pela produção em cada evento.

export const CAMPOS_CERTIFICADO = [
  { chave: "{nome}", descricao: "nome da pessoa" },
  { chave: "{coreografia}", descricao: "nome da apresentação" },
  { chave: "{categoria}", descricao: "categoria" },
  { chave: "{grupo}", descricao: "grupo" },
  { chave: "{evento}", descricao: "nome do festival" },
  { chave: "{data}", descricao: "data do festival" },
  { chave: "{local}", descricao: "local do festival" },
  { chave: "{produtora}", descricao: "produtora" },
] as const;

export const TEXTO_PADRAO_CERTIFICADO =
  "Certificamos que {nome} participou do {evento}, realizado em {data}{local}, apresentando “{coreografia}” na categoria {categoria}, pelo grupo {grupo}.";

export interface AssinaturaCertificado { nome: string; cargo: string }

export interface ModeloCertificado {
  titulo: string;
  texto: string;
  cor: string;
  fundo_url: string | null;
  assinaturas: AssinaturaCertificado[];
}

export interface DadosCertificado {
  nome: string;
  coreografia: string;
  categoria: string;
  grupo: string;
  evento: string;
  data: string;
  local: string;
  produtora: string;
}

export const MODELO_PADRAO: ModeloCertificado = {
  titulo: "Certificado de Participação",
  texto: TEXTO_PADRAO_CERTIFICADO,
  cor: "#C5A059",
  fundo_url: null,
  assinaturas: [],
};

export function preencherCertificado(texto: string, d: DadosCertificado): string {
  return texto
    .replaceAll("{nome}", d.nome)
    .replaceAll("{coreografia}", d.coreografia)
    .replaceAll("{categoria}", d.categoria)
    .replaceAll("{grupo}", d.grupo)
    .replaceAll("{evento}", d.evento)
    .replaceAll("{data}", d.data)
    // "{local}" no texto padrão vem logo depois da data: ", em Rio de Janeiro"
    .replaceAll("{local}", d.local ? (texto.includes("{data}{local}") ? `, em ${d.local}` : d.local) : "")
    .replaceAll("{produtora}", d.produtora);
}

// "12 a 14 de março de 2027" / "12 de março de 2027"
export function periodoPorExtenso(inicio: string | null, fim: string | null): string {
  if (!inicio) return "";
  const f = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", o);
  if (!fim || fim === inicio) return f(inicio, { day: "numeric", month: "long", year: "numeric" });
  const mesmoMes = inicio.slice(0, 7) === fim.slice(0, 7);
  return mesmoMes
    ? `${f(inicio, { day: "numeric" })} a ${f(fim, { day: "numeric", month: "long", year: "numeric" })}`
    : `${f(inicio, { day: "numeric", month: "long" })} a ${f(fim, { day: "numeric", month: "long", year: "numeric" })}`;
}

// Código curto de autenticidade (sem letras que confundem: 0/O, 1/I)
export function novoCodigo(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const s = [...bytes].map((b) => letras[b % letras.length]).join("");
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

export function lerModelo(linha: { titulo: string; texto: string; cor: string; fundo_url: string | null; assinaturas: unknown } | null): ModeloCertificado {
  if (!linha) return MODELO_PADRAO;
  const assinaturas = Array.isArray(linha.assinaturas)
    ? (linha.assinaturas as AssinaturaCertificado[]).filter((a) => a && typeof a.nome === "string").slice(0, 3)
    : [];
  return { titulo: linha.titulo, texto: linha.texto, cor: linha.cor, fundo_url: linha.fundo_url, assinaturas };
}
