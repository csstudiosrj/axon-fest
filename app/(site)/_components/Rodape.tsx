import Link from "next/link";
import { NAV, PRODUTOS_ARXUM } from "@/lib/site/conteudo";
import { obterConfiguracoes } from "@/lib/site/configuracoes";
import { Marca } from "./Marca";

export async function Rodape() {
  const { contato: CONTATO } = await obterConfiguracoes();
  return (
    <footer className="border-t border-arx-line bg-arx-obsidian">
      <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-4 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-[320px]">
          <Marca />
          <p className="mt-5 text-[14px] leading-[1.7] text-arx-mist">
            Gestão de festivais e mostras artísticas: inscrições, elenco, trilhas, jurados, bilheteria e caixa em um só lugar.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-arx-slate">Produto</p>
          <ul className="mt-5 space-y-3 text-[14px]">
            {NAV.filter((i) => i.href !== "/contato").map((item) => (
              <li key={item.href}><Link href={item.href} className="text-arx-mist hover:text-white">{item.label}</Link></li>
            ))}
            <li><Link href="/login" className="text-arx-mist hover:text-white">Entrar</Link></li>
            <li><Link href="/certificados" className="text-arx-mist hover:text-white">Certificados</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-arx-slate">Contato</p>
          <ul className="mt-5 space-y-3 text-[14px]">
            <li><a href={`mailto:${CONTATO.email}`} className="text-arx-mist hover:text-white">{CONTATO.email}</a></li>
            <li><a href={CONTATO.whatsappLink} target="_blank" rel="noopener noreferrer" className="text-arx-mist hover:text-white">WhatsApp {CONTATO.whatsapp}</a></li>
            <li><Link href="/contato" className="text-arx-mist hover:text-white">Fale com a equipe</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-arx-slate">Família ARXUM</p>
          <ul className="mt-5 space-y-3 text-[14px]">
            {PRODUTOS_ARXUM.map((p) => (
              <li key={p.nome}>
                <a href={p.href} className="group inline-flex items-center gap-2 text-arx-mist hover:text-white">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.cor }} aria-hidden="true" />
                  ARXUM {p.nome}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-arx-line">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-4 py-6 text-[12px] text-arx-slate sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} ARXUM Fest, todos os direitos reservados ao{" "}
            <a href="https://arxum.com.br" target="_blank" rel="noopener noreferrer" className="text-arx-mist hover:text-white">ARXUM group</a>
            <Link href="/termos-de-uso" className="ml-4 text-arx-mist hover:text-white">Termos de Uso</Link>
            <Link href="/privacidade" className="ml-4 text-arx-mist hover:text-white">Privacidade</Link>
          </p>
          <p>
            Desenvolvido por{" "}
            <a href="https://csstudios.site" target="_blank" rel="noopener noreferrer" className="text-arx-mist hover:text-white">CS Studios</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
