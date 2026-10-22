"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Abas({ abas }: { abas: { href: string; rotulo: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto">
      {abas.map((a) => {
        const ativa = pathname === a.href || pathname.startsWith(a.href + "/");
        return (
          <Link key={a.href} href={a.href}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${ativa ? "border-axon-gold text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
            {a.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
