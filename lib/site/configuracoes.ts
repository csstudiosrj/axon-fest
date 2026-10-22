import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Valores comerciais e institucionais editáveis no painel do super admin
// (tabela configuracoes_sistema). Cache de 5 min, renovado ao salvar.

export interface Precos {
  taxaPercentual: number;
  taxaFixa: number;
  caixaPercentual: number;
  caixaIsencaoAte: number;
  mesesStart: number;
  mesesGuarda: number;
  mensalidadePro: number | null;
}
export interface Contato { email: string; whatsapp: string }
export interface Empresa {
  razaoSocial: string; cnpj: string; endereco: string; foro: string; emailPrivacidade: string; vigencia: string;
}
export interface Configuracoes {
  precos: Precos;
  contato: Contato & { whatsappLink: string };
  empresa: Empresa;
  taxaTexto: string;   // "2% + R$ 0,99"
}

export const TAG_CONFIGURACOES = "configuracoes";

const carregar = unstable_cache(
  async () => {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON!, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.from("configuracoes_sistema").select("chave, valor");
    if (error) throw new Error(`Configurações do sistema indisponíveis: ${error.message}`);
    return Object.fromEntries((data ?? []).map((l) => [l.chave as string, l.valor])) as Record<string, unknown>;
  },
  ["configuracoes-sistema"],
  { tags: [TAG_CONFIGURACOES], revalidate: 300 }
);

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export async function obterConfiguracoes(): Promise<Configuracoes> {
  const c = await carregar();
  const precos = c.precos as Precos | undefined;
  const contato = c.contato as Contato | undefined;
  const empresa = c.empresa as Empresa | undefined;
  if (!precos || !contato || !empresa) throw new Error("Configurações do sistema não cadastradas.");
  return {
    precos,
    contato: { ...contato, whatsappLink: `https://wa.me/55${contato.whatsapp.replace(/\D/g, "")}` },
    empresa,
    taxaTexto: `${precos.taxaPercentual}% + ${brl(precos.taxaFixa)}`,
  };
}

// Texto para campos da empresa ainda não preenchidos
export const ouPendente = (v: string | null | undefined) => (v && v.trim() ? v : "[a definir]");
