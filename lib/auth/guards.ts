import "server-only";
import { redirect } from "next/navigation";
import { destinoPorRole } from "@/lib/auth/roles";
import { getUsuarioAtual, type UsuarioAtual } from "@/lib/auth/session";

// Garante usuário logado com um dos cargos da área. Quem está logado com outro
// cargo é mandado para a sua própria área (sem loop: se o destino for esta
// mesma área, volta ao login com erro).
export async function exigirArea(
  rolesPermitidas: readonly string[],
  opcoes: { login: string; area: string }
): Promise<UsuarioAtual> {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect(opcoes.login);

  if (!rolesPermitidas.includes(usuario.role)) {
    const destino = destinoPorRole(usuario.role);
    if (destino.startsWith(opcoes.area)) redirect(`${opcoes.login}?erro=sem-acesso`);
    redirect(destino);
  }

  return usuario;
}
