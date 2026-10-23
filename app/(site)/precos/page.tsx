import type { Metadata } from "next";
import { Check } from "lucide-react";
import { brl, obterCatalogo, obterConfiguracoes, preencherTexto, type Configuracoes, type ItemCatalogoPublico } from "@/lib/site/configuracoes";
import { BotaoPrimario, BotaoSecundario, CabecalhoSecao, Container, Paragrafo, Rotulo, Titulo } from "../_components/ui";
import { SimuladorTaxa } from "./SimuladorTaxa";

export async function generateMetadata(): Promise<Metadata> {
  const { taxaTexto } = await obterConfiguracoes();
  return {
    title: "Preços",
    description: `Grátis para criar. Taxa de ${taxaTexto} só nas vendas feitas pelo sistema — e você decide se absorve ou repassa.`,
  };
}

const PERIODO: Record<string, string> = { mensal: "por mês", anual: "por ano", unico: "pagamento único", gratis: "" };

// Cartão do catálogo (preço, itens e botão) com os valores atuais das taxas
function cartao(i: ItemCatalogoPublico, c: Configuracoes) {
  const preco = i.periodo === "gratis" || i.preco === 0 ? "Grátis" : i.preco === null ? "Sob consulta" : brl(i.preco);
  return {
    nome: i.nome, preco, destaque: i.destaque,
    detalhe: preencherTexto(i.detalhe || (i.preco ? PERIODO[i.periodo] ?? "" : ""), c),
    descricao: i.descricao ? preencherTexto(i.descricao, c) : "",
    itens: i.itens.map((t) => preencherTexto(t, c)),
    nota: i.nota ? preencherTexto(i.nota, c) : "",
    cta: { href: i.cta_link || "/contato", label: i.cta_texto || "Falar com a gente" },
  };
}

function conteudo({ precos: PRECOS, taxaTexto: T }: Configuracoes) {
const PERGUNTAS = [
  {
    p: "Quando a taxa é cobrada?",
    r: `Em cada venda paga online pela plataforma — inscrição, ingresso ou produto: ${T} por venda. Vendas registradas no caixa do evento (dinheiro, maquininha própria ou PIX direto para o festival) têm ${PRECOS.caixaPercentual}% cobrados em fatura mensal, com isenção nos meses em que o caixa vender menos de ${brl(PRECOS.caixaIsencaoAte)}. Inscrições gratuitas, montagem do evento e convites não têm taxa.`,
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

return { PERGUNTAS };
}

export default async function Precos() {
  const config = await obterConfiguracoes();
  const { precos: PRECOS, taxaTexto: T } = config;
  const { PERGUNTAS } = conteudo(config);
  const catalogo = await obterCatalogo();
  const PLANOS = catalogo.filter((i) => i.tipo === "plano").map((i) => cartao(i, config));
  const PACOTES = catalogo.filter((i) => i.tipo === "pacote").map((i) => cartao(i, config));
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
            sistema: inscrições, ingressos e produtos.
          </Paragrafo>
        </Container>
      </section>

      <section className="border-b border-arx-line">
        <Container className={`grid gap-6 py-16 sm:py-24 ${PLANOS.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {PLANOS.map((p) => (
            <article key={p.nome}
              className={`flex flex-col rounded-xl border p-8 sm:p-10 ${p.destaque ? "border-arx-fest/35 bg-arx-surface" : "border-arx-line bg-arx-obsidian"}`}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[15px] font-semibold uppercase tracking-[0.18em] text-white">{p.nome}</h2>
                {p.destaque && (
                  <span className="rounded-full bg-arx-fest/12 px-2.5 py-1 text-[11px] font-medium text-arx-fest">Recomendado</span>
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
              {p.nota && <p className="mt-8 text-[13px] leading-[1.6] text-arx-slate">{p.nota}</p>}
              <div className="mt-auto pt-8">
                {p.destaque
                  ? <BotaoPrimario href={p.cta.href} className="w-full">{p.cta.label}</BotaoPrimario>
                  : <BotaoSecundario href={p.cta.href} className="w-full">{p.cta.label}</BotaoSecundario>}
              </div>
            </article>
          ))}
        </Container>
      </section>

      {PACOTES.length > 0 && (
        <section className="border-b border-arx-line">
          <Container className="py-16 sm:py-20">
            <CabecalhoSecao rotulo="Pacotes" titulo="Extras para o seu festival." />
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {PACOTES.map((p) => (
                <article key={p.nome} className="flex flex-col rounded-xl border border-arx-line bg-arx-obsidian p-6">
                  <h3 className="text-[15px] font-semibold text-white">{p.nome}</h3>
                  <p className="mt-3 text-[28px] font-medium tracking-[-0.02em] text-white">{p.preco} <span className="text-[13px] font-normal text-arx-slate">{p.detalhe}</span></p>
                  {p.descricao && <p className="mt-3 text-[14px] leading-[1.6] text-arx-mist">{p.descricao}</p>}
                  {p.itens.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {p.itens.map((item) => <li key={item} className="flex gap-2 text-[14px] text-arx-frost"><Check size={15} className="mt-0.5 shrink-0 text-arx-fest" />{item}</li>)}
                    </ul>
                  )}
                  <div className="mt-auto pt-6"><BotaoSecundario href={p.cta.href} className="w-full">{p.cta.label}</BotaoSecundario></div>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}

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
