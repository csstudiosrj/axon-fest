import type { Metadata } from "next";
import { Check } from "lucide-react";
import { obterConfiguracoes } from "@/lib/site/configuracoes";
import { Container, Paragrafo, Rotulo, Titulo } from "../_components/ui";
import { FormCriarConta } from "./FormCriarConta";

export const metadata: Metadata = {
  title: "Começar grátis",
  description: "Crie a conta do seu festival no ARXUM Fest. Sem cartão de crédito.",
};

export default async function CriarConta() {
  const { precos: PRECOS, taxaTexto: TAXA_TEXTO } = await obterConfiguracoes();
  return (
    <section>
      <Container className="grid gap-14 py-16 sm:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <div>
          <Rotulo>Plano Start · grátis</Rotulo>
          <Titulo as="h1" className="mt-6 text-[40px] leading-[1.04] sm:text-[56px]">Crie a conta do seu festival.</Titulo>
          <Paragrafo className="mt-6">
            Sem cartão de crédito. Configure o evento, personalize a página e convide a equipe — você só paga quando
            vender inscrições online.
          </Paragrafo>
          <ul className="mt-10 space-y-4">
            {[
              "Todos os módulos liberados desde o primeiro dia",
              `${PRECOS.mesesStart} meses de uso no plano Start`,
              `Taxa de ${TAXA_TEXTO} apenas sobre vendas feitas pelo sistema`,
              "Equipe, jurados e operadores convidados por e-mail",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-[15px] text-arx-frost">
                <Check size={17} className="mt-0.5 shrink-0 text-arx-fest" />{item}
              </li>
            ))}
          </ul>
        </div>
        <FormCriarConta />
      </Container>
    </section>
  );
}
