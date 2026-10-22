"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV } from "@/lib/site/conteudo";
import { Marca } from "./Marca";

export function Cabecalho() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  const ativo = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-arx-line bg-arx-obsidian/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-8">
        <Marca />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`text-[14px] transition-colors ${ativo(item.href) ? "text-white" : "text-arx-mist hover:text-white"}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link href="/login" className="text-[14px] text-arx-mist transition-colors hover:text-white">Entrar</Link>
          <Link href="/criar-conta"
            className="inline-flex h-9 items-center rounded-md bg-arx-fest px-4 text-[13px] font-semibold text-arx-obsidian transition-colors hover:bg-[#e2c255]">
            Começar grátis
          </Link>
        </div>

        <button type="button" onClick={() => setAberto((v) => !v)}
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center text-arx-frost md:hidden"
          aria-expanded={aberto} aria-controls="menu-movel" aria-label={aberto ? "Fechar menu" : "Abrir menu"}>
          {aberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {aberto && (
        <nav id="menu-movel" className="border-t border-arx-line bg-arx-obsidian md:hidden" aria-label="Principal (celular)">
          <div className="flex flex-col px-4 py-4">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setAberto(false)}
                className={`py-3 text-[16px] ${ativo(item.href) ? "text-white" : "text-arx-mist"}`}>
                {item.label}
              </Link>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-arx-line pt-5">
              <Link href="/login" onClick={() => setAberto(false)}
                className="inline-flex h-11 items-center justify-center rounded-md border border-arx-line text-[14px] text-arx-frost">
                Entrar
              </Link>
              <Link href="/criar-conta" onClick={() => setAberto(false)}
                className="inline-flex h-11 items-center justify-center rounded-md bg-arx-fest text-[14px] font-semibold text-arx-obsidian">
                Começar grátis
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
