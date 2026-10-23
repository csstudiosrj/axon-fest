import { inicioDe } from "@/lib/auth/permissoes";

// ─────────────────────────────────────────────────────────────────────────────
// Cargos do sistema — fonte única de verdade (API, layouts, login e telas).
//
// super_admin  → dono do SaaS (ARXUM). Sem produtora. Só cria/gerencia os
//                donos de festival (admin) e auxilia na gestão dos cargos deles.
// admin        → dono do festival / assinante. Gerencia os cargos da produtora.
// produtor (Produção), financeiro, marketing → equipe da produtora (painel admin);
//                cada um vê só as telas da sua área (lib/auth/permissoes.ts).
// operador     → caixa/bilheteria no celular (login + PIN da produtora).
// jurado       → painel de avaliação.
// org_admin, org_membro → portal do grupo/escola.
// ─────────────────────────────────────────────────────────────────────────────

export const ROLES = [
  "super_admin",
  "admin",
  "produtor",
  "financeiro",
  "marketing",
  "operador",
  "jurado",
  "org_admin",
  "org_membro",
] as const;

export type Role = (typeof ROLES)[number];

// Nomes antigos ainda aceitos no acesso para não trancar contas existentes.
// Não são mais atribuíveis.
const ROLES_LEGADOS_ADMIN = ["produtora_admin", "produtora_staff", "assistente"];
const ROLES_LEGADOS_GRUPO = ["escola_admin", "coreografo"];

export const ROLES_PAINEL_ADMIN: readonly string[] = [
  "super_admin",
  "admin",
  "produtor",
  "financeiro",
  "marketing",
  ...ROLES_LEGADOS_ADMIN,
];

export const ROLES_OPERADOR: readonly string[] = [
  "operador",
  "admin",
  "financeiro",
  "produtora_admin",
  "assistente",
];

export const ROLES_GRUPO: readonly string[] = ["org_admin", "org_membro", ...ROLES_LEGADOS_GRUPO];

export const ROLES_JURADO: readonly string[] = ["jurado"];

// Quem pode atribuir (convidar, alterar, remover) cada cargo.
// super_admin não aparece como alvo: só é criado direto no banco.
// A produtora não convida grupos nem participantes: eles entram pela página do festival.
export const HIERARQUIA: Record<string, readonly Role[]> = {
  super_admin: ["admin", "produtor", "financeiro", "marketing", "operador", "jurado", "org_admin", "org_membro"],
  admin: ["produtor", "financeiro", "marketing", "operador", "jurado"],
};

export function podeAtribuir(quem: string | null | undefined, alvo: string | null | undefined): boolean {
  if (!quem || !alvo) return false;
  return (HIERARQUIA[quem] ?? []).includes(alvo as Role);
}

export function destinoPorRole(role: string): string {
  return inicioDe(role);
}
