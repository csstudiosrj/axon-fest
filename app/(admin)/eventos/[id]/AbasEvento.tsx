"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AbasEvento({ base, abas }: { base: string; abas: { caminho: string; nome: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto">
      {abas.map((a) => {
        const href = `${base}${a.caminho}`;
        const ativa = a.caminho === "" ? pathname === base : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={a.caminho} href={href}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm ${ativa ? "border-axon-gold text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
            {a.nome}
          </Link>
        );
      })}
    </nav>
  );
}
