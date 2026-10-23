// ─────────────────────────────────────────────────────────────────────────────
// O que cada cargo da produtora enxerga no painel. Fonte única para o menu,
// as abas do evento e a proteção das páginas. O banco (RLS e gatilhos) aplica
// as mesmas regras nas gravações (migration 20261101000000_portal_unico.sql).
//
//   Admin ........ tudo
//   Produção ..... eventos, categorias, programação, mídias, jurados, apuração, termos
//   Financeiro ... inscrições e pagamentos, PDV (produtos, vendas, PIX), caixa
//   Marketing .... página pública do evento, termos, inscritos (sem valores)
//   Operador ..... caixa e bilheteria
//   Jurado ....... avaliação
// ─────────────────────────────────────────────────────────────────────────────

export const AREAS = [
  "dashboard", "eventos", "evento_dados", "evento_pagina", "evento_categorias", "evento_inscricoes", "evento_programacao",
  "evento_jurados", "pagamentos", "valores", "midias", "jurados", "apuracao", "pdv", "caixa", "termos", "equipe",
  "configuracoes", "plano", "super",
] as const;
export type Area = (typeof AREAS)[number];

const PRODUCAO: Area[] = ["dashboard", "eventos", "evento_dados", "evento_pagina", "evento_categorias", "evento_programacao", "evento_jurados", "midias", "jurados", "apuracao", "termos"];
const FINANCEIRO: Area[] = ["dashboard", "eventos", "evento_inscricoes", "pagamentos", "valores", "pdv", "caixa"];
const MARKETING: Area[] = ["dashboard", "eventos", "evento_pagina", "evento_inscricoes", "termos"];

const PERMISSOES: Record<string, readonly Area[]> = {
  admin: AREAS.filter((a) => a !== "super"),
  produtor: PRODUCAO,
  financeiro: FINANCEIRO,
  marketing: MARKETING,
  operador: ["caixa"],
  super_admin: ["super"],
};

// Nomes antigos continuam funcionando com o cargo equivalente
const EQUIVALENTE: Record<string, string> = { produtora_admin: "admin", produtora_staff: "produtor", assistente: "financeiro" };

export const cargoEfetivo = (role: string | null | undefined) => (role ? EQUIVALENTE[role] ?? role : "");

export function pode(role: string | null | undefined, area: Area): boolean {
  return (PERMISSOES[cargoEfetivo(role)] ?? []).includes(area);
}

export function areasDe(role: string | null | undefined): readonly Area[] {
  return PERMISSOES[cargoEfetivo(role)] ?? [];
}

// Primeira tela de cada cargo (para onde vai quem abre uma tela sem acesso)
export function inicioDe(role: string | null | undefined): string {
  const r = cargoEfetivo(role);
  if (r === "super_admin") return "/super";
  if (r === "operador") return "/caixa";
  if (r === "jurado") return "/jurado";
  if (["org_admin", "org_membro", "escola_admin", "coreografo"].includes(r)) return "/grupo/dashboard";
  return "/dashboard";
}
