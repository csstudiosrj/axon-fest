import type { Metadata } from "next";
import { exigirArea } from "@/lib/auth/guards";
import { ROLES_JURADO } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "ARXUM Fest — Painel do Jurado",
};

export default async function JuradoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await exigirArea(ROLES_JURADO, { login: "/login", area: "/jurado" });

  return (
    <div className="min-h-screen bg-axon-bg text-white flex flex-col items-center justify-center">
      {children}
    </div>
  );
}
