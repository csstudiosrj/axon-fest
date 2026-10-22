import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { Cabecalho } from "./_components/Cabecalho";
import { Rodape } from "./_components/Rodape";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
// Syne é exclusiva do logotipo (Manual de Marca); títulos usam DM Sans
const syne = Syne({ subsets: ["latin"], weight: ["800"], variable: "--font-syne", display: "swap" });

// Valores e contatos vêm do banco (configuracoes_sistema), com cache de 5 min
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "ARXUM Fest — Gestão de festivais e mostras artísticas",
    template: "%s · ARXUM Fest",
  },
  description:
    "Inscrições, elenco, trilhas, jurados, bilheteria e caixa do seu festival em um só lugar. Grátis para criar; você só paga quando vender inscrições.",
  openGraph: {
    siteName: "ARXUM Fest",
    locale: "pt_BR",
    type: "website",
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${syne.variable} min-h-screen bg-arx-obsidian font-site text-arx-frost antialiased`}>
      <Cabecalho />
      <main>{children}</main>
      <Rodape />
    </div>
  );
}
