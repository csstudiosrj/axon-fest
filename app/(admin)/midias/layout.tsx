import { exigirAcesso } from "@/lib/auth/guards";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await exigirAcesso("midias");
  return children;
}
