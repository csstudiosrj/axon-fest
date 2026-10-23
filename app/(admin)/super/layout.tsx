import { exigirArea } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

// Ambiente do dono da plataforma: só super admin
export default async function LayoutSuper({ children }: { children: React.ReactNode }) {
  await exigirArea(["super_admin"], { login: "/login", area: "/super" });
  return <div className="mx-auto max-w-6xl space-y-6">{children}</div>;
}
