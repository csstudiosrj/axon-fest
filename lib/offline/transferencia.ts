// Transferência de notas sem internet: jurado → produtor por QR code.
//
// Pacote: JSON → compactado (deflate) → AES-256-GCM com a chave da designação
// do jurado (evento_jurados.chave_transferencia) → base64 → dividido em quadros.
// Cada quadro é um QR exibido em sequência ("QR animado"); o leitor junta tudo.
//
// Formato do quadro:  AF1|<msg>|<i>|<n>|<evento_id>|<jurado_id>|<dados>
// O cabeçalho vai em claro (só identifica a chave a usar); notas e comentários
// vão criptografados e autenticados (o GCM recusa qualquer alteração).

const PREFIXO = "AF1";
const TAM_QUADRO = 700; // caracteres de dados por QR

export interface FichaTransferida {
  a: string;            // id da apresentação
  n: (number | null)[]; // notas na ordem de PacoteNotas.k
  c?: string;           // comentário
  f: string;            // finalizada em (ISO)
  u: string;            // atualizada em (ISO)
}

export interface PacoteNotas {
  v: 1;
  e: string;            // evento_id
  j: string;            // jurado_id
  t: string;            // gerado em (ISO)
  k: string[];          // ids dos critérios (ordem das notas)
  fichas: FichaTransferida[];
}

// ── base64 ──────────────────────────────────────────────────────────────────
export function paraBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function deBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

// ── compressão (nativa do navegador, com alternativa sem compressão) ────────
async function processar(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const resp = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await resp.arrayBuffer());
}

async function compactar(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") return Uint8Array.of(0, ...bytes);
  const c = await processar(bytes, new CompressionStream("deflate-raw"));
  return Uint8Array.of(1, ...c);
}

async function descompactar(bytes: Uint8Array): Promise<Uint8Array> {
  if (bytes[0] === 0) return bytes.subarray(1);
  return processar(bytes.subarray(1), new DecompressionStream("deflate-raw"));
}

// ── criptografia ────────────────────────────────────────────────────────────
async function chaveAes(chaveB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", deBase64(chaveB64) as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function dadosAdicionais(evento: string, jurado: string) {
  // Amarra o conteúdo ao evento e ao jurado do cabeçalho
  return new TextEncoder().encode(`${PREFIXO}:${evento}:${jurado}`);
}

export async function criptografarPacote(pacote: PacoteNotas, chaveB64: string): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(pacote));
  const compacto = await compactar(json);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: dadosAdicionais(pacote.e, pacote.j) },
      await chaveAes(chaveB64),
      compacto as BufferSource
    )
  );
  const tudo = new Uint8Array(iv.length + cifrado.length);
  tudo.set(iv);
  tudo.set(cifrado, iv.length);
  return paraBase64(tudo);
}

export async function descriptografarPacote(
  dadosB64: string, chaveB64: string, evento: string, jurado: string
): Promise<PacoteNotas> {
  const tudo = deBase64(dadosB64);
  const iv = tudo.subarray(0, 12);
  const cifrado = tudo.subarray(12);
  const aberto = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource, additionalData: dadosAdicionais(evento, jurado) as BufferSource },
      await chaveAes(chaveB64),
      cifrado as BufferSource
    )
  );
  const pacote = JSON.parse(new TextDecoder().decode(await descompactar(aberto))) as PacoteNotas;
  if (pacote.v !== 1 || pacote.e !== evento || pacote.j !== jurado) throw new Error("Pacote inconsistente.");
  return pacote;
}

// ── quadros QR ──────────────────────────────────────────────────────────────
export function montarQuadros(dadosB64: string, evento: string, jurado: string): string[] {
  const msg = Math.random().toString(36).slice(2, 8);
  const partes: string[] = [];
  for (let i = 0; i < dadosB64.length; i += TAM_QUADRO) partes.push(dadosB64.slice(i, i + TAM_QUADRO));
  return partes.map((p, i) => [PREFIXO, msg, i + 1, partes.length, evento, jurado, p].join("|"));
}

export interface QuadroLido {
  msg: string;
  i: number;
  n: number;
  evento: string;
  jurado: string;
  dados: string;
}

export function lerQuadro(texto: string): QuadroLido | null {
  const p = texto.split("|");
  if (p.length !== 7 || p[0] !== PREFIXO) return null;
  const i = Number(p[2]);
  const n = Number(p[3]);
  if (!Number.isInteger(i) || !Number.isInteger(n) || i < 1 || i > n || n > 500) return null;
  return { msg: p[1], i, n, evento: p[4], jurado: p[5], dados: p[6] };
}

// Junta quadros de uma mesma mensagem, em qualquer ordem e com repetições
export class MontadorQuadros {
  private msg: string | null = null;
  private partes = new Map<number, string>();
  total = 0;
  evento = "";
  jurado = "";

  adicionar(q: QuadroLido): void {
    if (this.msg !== q.msg) {
      this.msg = q.msg;
      this.partes.clear();
      this.total = q.n;
      this.evento = q.evento;
      this.jurado = q.jurado;
    }
    this.partes.set(q.i, q.dados);
  }

  get recebidos() { return this.partes.size; }
  get completo() { return this.total > 0 && this.partes.size === this.total; }

  resultado(): string {
    return Array.from({ length: this.total }, (_, k) => this.partes.get(k + 1) ?? "").join("");
  }
}
