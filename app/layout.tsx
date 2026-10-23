import type { Metadata } from "next";
import "./globals.css";
import { Dialogos, GuardaNavegacao } from "./_components/Dialogos";

export const metadata: Metadata = {
  title: "ARXUM Fest",
  description: "Sistema de Gestão de Festivais Artísticos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Dialogos />
        <GuardaNavegacao />
      </body>
    </html>
  );
}