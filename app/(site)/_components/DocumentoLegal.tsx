import type { ReactNode } from "react";
import { Container, Rotulo, Titulo } from "./ui";

export interface SecaoLegal {
  id: string;
  titulo: string;
  conteudo: ReactNode;
}

// Layout de documento longo: índice fixo à esquerda (desktop) e seções numeradas
export function DocumentoLegal({ rotulo, titulo, vigencia, intro, secoes }: {
  rotulo: string;
  titulo: string;
  vigencia: string;
  intro: ReactNode;
  secoes: SecaoLegal[];
}) {
  return (
    <section>
      <Container className="py-16 sm:py-24">
        <Rotulo>{rotulo}</Rotulo>
        <Titulo as="h1" className="mt-6 text-[40px] leading-[1.04] sm:text-[56px]">{titulo}</Titulo>
        <p className="mt-4 text-[13px] text-arx-slate">Vigente a partir de {vigencia}</p>

        <div className="mt-14 grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
          <nav aria-label="Índice" className="lg:sticky lg:top-24 lg:self-start">
            <ol className="space-y-2 border-l border-arx-line text-[13px]">
              {secoes.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-4 text-arx-mist hover:border-arx-fest hover:text-white">
                    {i + 1}. {s.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="legal max-w-[720px] text-[15px] leading-[1.75] text-arx-mist">
            <div className="text-[16px] text-arx-frost">{intro}</div>
            {secoes.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-arx-line pt-10 mt-10">
                <h2 className="text-[20px] font-medium tracking-[-0.015em] text-white">{i + 1}. {s.titulo}</h2>
                <div className="mt-4 space-y-4 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-arx-frost [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-arx-fest [&_a]:underline-offset-4 hover:[&_a]:underline">
                  {s.conteudo}
                </div>
              </section>
            ))}
          </article>
        </div>
      </Container>
    </section>
  );
}
