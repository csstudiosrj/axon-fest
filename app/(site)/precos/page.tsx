import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PRECOS, TAXA_TEXTO } from "@/lib/site/conteudo";
import { BotaoPrimario, BotaoSecundario, CabecalhoSecao, Container, Paragrafo, Rotulo, Titulo } from "../_components/ui";
import { SimuladorTaxa } from "./SimuladorTaxa";

export const metadata: Metadata = {
  title: "Preços",
  description: `Grátis para criar. Taxa de ${TAXA_TEXTO} só nas vendas feitas pelo sistema — e você decide se absorve ou repassa.`,
};

const T = TAXA_TEXTO;

const PLANOS = [
  {
    nome: "Start",
    preco: "Grátis",
    detalhe: `por ${PRECOS.mesesStart} meses`,
    descricao: "Para tirar a primeira edição do papel sem custo fixo.",
    itens: [
      "Todos os módulos liberados",
      "Eventos, equipe e jurados sem limite",
      "Página pública com a sua marca",
      "Caixa e bilheteria no celular",
      `Taxa de ${T} por venda feita pelo sistema`,
    ],
    nota: `Após ${PRECOS.mesesStart} meses, a conta fica em modo leitura por mais ${PRECOS.mesesGuarda} meses para você assinar o Pro. Depois disso, os dados são apagados.`,
    cta: { href: "/criar-conta", label: "Começar grátis" },
    destaque: false,
  },
  {
    nome: "Pro",
    preco: PRECOS.mensalidadePro
      ? PRECOS.mensalidadePro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Sob consulta",
    detalhe: PRECOS.mensalidadePro ? "por mês" : "assinatura mensal",
    descricao: "Para festivais que voltam todo ano e precisam do histórico.",
    itens: [
      "Tudo do Start, sem prazo",
      "Dados e histórico de todas as edições guardados",
      "Grupos e participantes reaproveitados a cada ano",
      "Atendimento prioritário",
      `Taxa de ${T} por venda feita pelo sistema`,
    ],
    nota: "Sem fidelidade: cancele quando quiser.",
    cta: { href: "/contato?assunto=pro", label: "Falar sobre o Pro" },
    destaque: true,
  },
];

const PERGUNTAS = [
  {
    p: "Quando a taxa é cobrada?",
    r: `Em cada venda paga online pela plataforma — inscrição, ingresso ou produto: ${T} por venda. Inscrições gratuitas, montagem do evento, convites e vendas em dinheiro ou PIX direto no caixa do evento não têm taxa.`,
  },
  {
    p: "Quem paga a taxa: o festival ou o inscrito?",
    r: "Você escolhe por evento. Repassando, a taxa aparece somada ao valor para quem compra; absorvendo, ela é descontada do repasse ao festival. A tarifa do meio de pagamento (PIX, cartão, parcelamento) segue a mesma escolha.",
  },
  {
    p: "Como o dinheiro chega até o festival?",
    r: "As inscrições são pagas pela plataforma e o valor é dividido automaticamente: a parte do festival vai para a conta da produtora e a taxa de serviço fica com a ARXUM. O pagamento online está em fase final de integração.",
  },
  {
    p: `O que acontece depois dos ${PRECOS.mesesStart} meses do Start?`,
    r: `A conta entra em modo leitura: você continua vendo tudo, mas não cria nem altera dados. Nesse período de ${PRECOS.mesesGuarda} meses é só assinar o Pro para seguir de onde parou. Sem assinatura, os dados são apagados ao fim do prazo — e avisamos por e-mail antes.`,
  },
  {
    p: "Preciso de cartão de crédito para começar?",
    r: "Não. A conta Start é criada só com nome, e-mail e senha.",
  },
  {
    p: "Os dados dos participantes ficam protegidos?",
    r: "Sim. Cada produtora acessa apenas os próprios dados, cada perfil vê só o que precisa e as assinaturas de termos ficam registradas com data, hora e origem.",
  },
];

export default function Precos() {
  return (
    <>
      <section className="border-b border-arx-line">
        <Container className="pb-16 pt-16 sm:pb-20 sm:pt-24">
          <Rotulo>Preços</Rotulo>
          <Titulo as="h1" className="mt-6 max-w-[860px] text-[40px] leading-[1.04] sm:text-[60px]">
            Sem mensalidade para começar. <span className="text-arx-fest">{T}</span> só quando você vender.
          </Titulo>
          <Paragrafo className="mt-7 max-w-[600px] sm:text-[19px]">
            Monte e publique o evento sem custo fixo. A taxa de serviço incide apenas sobre o que é vendido pelo
            sistema: inscrições, ingressos e produtos da loja.
          </Paragrafo>
        </Container>
      </section>

      <section className="border-b border-arx-line">
        <Container className="grid gap-6 py-16 sm:py-24 lg:grid-cols-2">
          {PLANOS.map((p) => (
            <article key={p.nome}
              className={`flex flex-col rounded-xl border p-8 sm:p-10 ${p.destaque ? "border-arx-fest/35 bg-arx-surface" : "border-arx-line bg-arx-obsidian"}`}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[15px] font-semibold uppercase tracking-[0.18em] text-white">{p.nome}</h2>
                {p.destaque && (
                  <span className="rounded-full bg-arx-fest/12 px-2.5 py-1 text-[11px] font-medium text-arx-fest">Para quem repete edições</span>
                )}
              </div>
              <p className="mt-8 text-[44px] font-medium leading-none tracking-[-0.03em] text-white">{p.preco}</p>
              <p className="mt-2 text-[14px] text-arx-slate">{p.detalhe}</p>
              <p className="mt-6 text-[16px] leading-[1.6] text-arx-mist">{p.descricao}</p>
              <ul className="mt-8 space-y-3 border-t border-arx-line pt-8">
                {p.itens.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] text-arx-frost">
                    <Check size={17} className="mt-0.5 shrink-0 text-arx-fest" />{item}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[13px] leading-[1.6] text-arx-slate">{p.nota}</p>
              <div className="mt-auto pt-8">
                {p.destaque
                  ? <BotaoPrimario href={p.cta.href} className="w-full">{p.cta.label}</BotaoPrimario>
                  : <BotaoSecundario href={p.cta.href} className="w-full">{p.cta.label}</BotaoSecundario>}
              </div>
            </article>
          ))}
        </Container>
      </section>

      <section className="border-b border-arx-line">
        <Container className="grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20">
          <CabecalhoSecao
            rotulo="Taxa de serviço"
            titulo="Absorver ou repassar: a decisão é do festival."
            texto={`A taxa é de ${T} por venda paga online, independentemente do valor. Defina por evento se ela entra no preço para quem compra ou se sai do valor que o festival recebe.`}
          />
          <SimuladorTaxa percentual={PRECOS.taxaPercentual} fixa={PRECOS.taxaFixa} />
        </Container>
      </section>

      <section>
        <Container className="grid gap-12 py-20 sm:py-28 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <CabecalhoSecao rotulo="Perguntas frequentes" titulo="Antes de começar" />
          <div className="divide-y divide-arx-line border-y border-arx-line">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-medium text-white">
                  {q.p}
                  <span className="text-[20px] font-light text-arx-slate transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 max-w-[640px] text-[15px] leading-[1.7] text-arx-mist">{q.r}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
