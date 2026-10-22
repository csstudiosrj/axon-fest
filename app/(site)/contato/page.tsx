import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { CONTATO } from "@/lib/site/conteudo";
import { Container, Paragrafo, Rotulo, Titulo } from "../_components/ui";
import { FormContato } from "./FormContato";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a equipe do ARXUM Fest por e-mail, WhatsApp ou pelo formulário.",
};

const ASSUNTOS_VALIDOS = ["conhecer", "pro", "suporte", "outro"];

export default async function Contato({ searchParams }: { searchParams: Promise<{ assunto?: string }> }) {
  const { assunto } = await searchParams;
  const assuntoInicial = assunto && ASSUNTOS_VALIDOS.includes(assunto) ? assunto : "conhecer";

  return (
    <section>
      <Container className="grid gap-14 py-16 sm:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div>
          <Rotulo>Contato</Rotulo>
          <Titulo as="h1" className="mt-6 text-[40px] leading-[1.04] sm:text-[56px]">Vamos conversar sobre o seu festival.</Titulo>
          <Paragrafo className="mt-6">
            Dúvidas, demonstração, plano Pro ou suporte: escreva para a gente. Respondemos em até um dia útil.
          </Paragrafo>

          <ul className="mt-12 divide-y divide-arx-line border-y border-arx-line">
            <li>
              <a href={CONTATO.whatsappLink} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-5">
                <MessageCircle size={20} strokeWidth={1.6} className="text-arx-fest" />
                <span>
                  <span className="block text-[13px] text-arx-slate">WhatsApp</span>
                  <span className="block text-[16px] text-white group-hover:text-arx-fest">{CONTATO.whatsapp}</span>
                </span>
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTATO.email}`} className="group flex items-center gap-4 py-5">
                <Mail size={20} strokeWidth={1.6} className="text-arx-fest" />
                <span>
                  <span className="block text-[13px] text-arx-slate">E-mail</span>
                  <span className="block text-[16px] text-white group-hover:text-arx-fest">{CONTATO.email}</span>
                </span>
              </a>
            </li>
          </ul>
        </div>

        <FormContato assuntoInicial={assuntoInicial} />
      </Container>
    </section>
  );
}
