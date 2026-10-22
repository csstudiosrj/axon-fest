import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { exigirArea } from "@/lib/auth/guards";
import { ROLES_JURADO } from "@/lib/auth/roles";
import { RegistrarOffline } from "@/lib/offline/RegistrarOffline";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Avaliação · ARXUM Fest",
};

export const viewport: Viewport = {
  themeColor: "#07090c",
  width: "device-width",
  initialScale: 1,
};

export default async function JuradoLayout({ children }: { children: React.ReactNode }) {
  await exigirArea(ROLES_JURADO, { login: "/login", area: "/jurado" });

  return (
    <div className={`${dmSans.variable} min-h-dvh bg-arx-obsidian font-site text-arx-frost antialiased`}>
      <RegistrarOffline />
      {children}
    </div>
  );
}
