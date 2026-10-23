// Máscaras aplicadas enquanto a pessoa digita. O banco guarda só os dígitos
// (use soDigitos de lib/documentos antes de gravar).

import { soDigitos } from "@/lib/documentos";

export function mascaraCpf(valor: string | null | undefined): string {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function mascaraCnpj(valor: string | null | undefined): string {
  const d = soDigitos(valor).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

// CPF até 11 dígitos; a partir do 12º vira CNPJ
export function mascaraCpfCnpj(valor: string | null | undefined): string {
  return soDigitos(valor).length <= 11 ? mascaraCpf(valor) : mascaraCnpj(valor);
}

// (21) 99999-9999 ou (21) 3333-4444
export function mascaraTelefone(valor: string | null | undefined): string {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

export function mascaraCep(valor: string | null | undefined): string {
  const d = soDigitos(valor).slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function cnpjValido(valor: string | null | undefined): boolean {
  const d = soDigitos(valor);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((s, p, i) => s + Number(d[i]) * p, 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

export const telefoneValido = (valor: string | null | undefined) => [10, 11].includes(soDigitos(valor).length);

// Duração "m:ss" enquanto digita: os 2 últimos dígitos são os segundos (330 → 3:30)
export function mascaraTempo(valor: string | null | undefined): string {
  const d = soDigitos(valor).replace(/^0+(?=\d{3})/, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, -2)}:${d.slice(-2)}`;
}

// "3:30" → 210 segundos; "3" → 180 (só minutos); vazio → null; segundos ≥ 60 → NaN
export function segundosDe(valor: string): number | null {
  const t = valor.trim();
  if (!t) return null;
  if (!t.includes(":")) return Number(soDigitos(t)) * 60;
  const [m, s] = t.split(":");
  const seg = Number(s || 0);
  return seg >= 60 ? NaN : Number(m || 0) * 60 + seg;
}

// 210 → "3:30"
export function formatarTempo(segundos: number | null | undefined): string {
  if (segundos == null) return "";
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}
