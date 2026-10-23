import { redirect } from "next/navigation";

// Endereço antigo: todos (produção, equipe, jurados, operadores e grupos) entram pelo login único
export default async function LoginGrupoAntigo({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  redirect(erro ? `/login?erro=${encodeURIComponent(erro)}` : "/login");
}
