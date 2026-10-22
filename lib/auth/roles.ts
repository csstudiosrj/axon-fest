// ─────────────────────────────────────────────────────────────────────────────
// Cargos do sistema — fonte única de verdade (API, layouts, login e telas).
//
// super_admin  → dono do SaaS (ARXUM). Sem produtora. Só cria/gerencia os
//                donos de festival (admin) e auxilia na gestão dos cargos deles.
// admin        → dono do festival / assinante. Gerencia os cargos da produtora.
// produtor, marketing, assistente → equipe da produtora (painel admin).
// operador     → caixa/bilheteria no celular (login + PIN da produtora).
// jurado       → painel de avaliação.
// org_admin, org_membro → portal do grupo/escola.
// ─────────────────────────────────────────────────────────────────────────────

export const ROLES = [
  "super_admin",
  "admin",
  "produtor",
  "marketing",
  "assistente",
  "operador",
  "jurado",
  "org_admin",
  "org_membro",
] as const;

export type Role = (typeof ROLES)[number];

// Nomes antigos ainda aceitos no acesso para não trancar contas existentes.
// Não são mais atribuíveis.
const ROLES_LEGADOS_ADMIN = ["produtora_admin", "produtora_staff"];
const ROLES_LEGADOS_GRUPO = ["escola_admin", "coreografo"];

export const ROLES_PAINEL_ADMIN: readonly string[] = [
  "super_admin",
  "admin",
  "produtor",
  "marketing",
  "assistente",
  ...ROLES_LEGADOS_ADMIN,
];

export const ROLES_OPERADOR: readonly string[] = [
  "operador",
  "super_admin",
  "admin",
  "produtor",
  ...ROLES_LEGADOS_ADMIN,
];

export const ROLES_GRUPO: readonly string[] = ["org_admin", "org_membro", ...ROLES_LEGADOS_GRUPO];

export const ROLES_JURADO: readonly string[] = ["jurado"];

// Quem pode atribuir (convidar, alterar, remover) cada cargo.
// super_admin não aparece como alvo: só é criado direto no banco.
export const HIERARQUIA: Record<string, readonly Role[]> = {
  super_admin: ["admin", "produtor", "marketing", "assistente", "operador", "jurado", "org_admin", "org_membro"],
  admin: ["produtor", "marketing", "assistente", "operador", "jurado", "org_admin", "org_membro"],
};

export function podeAtribuir(quem: string | null | undefined, alvo: string | null | undefined): boolean {
  if (!quem || !alvo) return false;
  return (HIERARQUIA[quem] ?? []).includes(alvo as Role);
}

export function destinoPorRole(role: string): string {
  if (ROLES_JURADO.includes(role)) return "/jurado";
  if (ROLES_GRUPO.includes(role)) return "/grupo/dashboard";
  if (role === "operador") return "/caixa";
  return "/dashboard";
}
