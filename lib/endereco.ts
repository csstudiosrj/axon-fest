// Endereço brasileiro: CEP (ViaCEP) e lista de cidades por estado (IBGE).
// Consultas feitas no navegador; se o serviço falhar, a pessoa digita à mão.

import { soDigitos } from "@/lib/documentos";

export const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export const enderecoVazio: Endereco = { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" };

export async function buscarCep(cep: string): Promise<Partial<Endereco> | null> {
  const d = soDigitos(cep);
  if (d.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    if (!r.ok) return null;
    const j = (await r.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
    if (j.erro) return null;
    return { logradouro: j.logradouro ?? "", bairro: j.bairro ?? "", cidade: j.localidade ?? "", estado: j.uf ?? "" };
  } catch {
    return null;
  }
}

const cacheCidades = new Map<string, string[]>();

export async function cidadesDoEstado(uf: string): Promise<string[] | null> {
  if (!UFS.includes(uf as (typeof UFS)[number])) return null;
  if (cacheCidades.has(uf)) return cacheCidades.get(uf)!;
  try {
    const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
    if (!r.ok) return null;
    const lista = ((await r.json()) as { nome: string }[]).map((m) => m.nome);
    cacheCidades.set(uf, lista);
    return lista;
  } catch {
    return null;
  }
}

type LinhaEndereco = Partial<Record<keyof Endereco, string | null>>;

// Linha do banco → campos do formulário (CEP já formatado)
export function enderecoDe(linha: LinhaEndereco | null | undefined): Endereco {
  const d = soDigitos(linha?.cep);
  return {
    cep: d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5, 8)}` : d,
    logradouro: linha?.logradouro ?? "", numero: linha?.numero ?? "", complemento: linha?.complemento ?? "",
    bairro: linha?.bairro ?? "", cidade: linha?.cidade ?? "", estado: linha?.estado ?? "",
  };
}

// Campos do formulário → colunas do banco (vazio vira null; CEP só dígitos)
export function colunasEndereco(e: Endereco) {
  const t = (v: string) => v.trim() || null;
  return {
    cep: soDigitos(e.cep) || null, logradouro: t(e.logradouro), numero: t(e.numero), complemento: t(e.complemento),
    bairro: t(e.bairro), cidade: t(e.cidade), estado: t(e.estado),
  };
}
