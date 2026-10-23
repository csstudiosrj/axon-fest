import "server-only";
import { redirect } from "next/navigation";
import { destinoPorRole } from "@/lib/auth/roles";
import { inicioDe, pode, type Area } from "@/lib/auth/permissoes";
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
    const destino = destinoPorRole(usuario.role, usuario.setor_pdv);
    if (destino.startsWith(opcoes.area)) redirect(`${opcoes.login}?erro=sem-acesso`);
    redirect(destino);
  }

  return usuario;
}

// Garante que o usuário do painel tenha acesso à área; senão vai para a tela inicial do cargo
export async function exigirAcesso(area: Area): Promise<UsuarioAtual> {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  if (!pode(usuario.role, area)) redirect(inicioDe(usuario.role, usuario.setor_pdv));
  return usuario;
}
