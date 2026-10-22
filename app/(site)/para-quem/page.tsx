import type { Metadata } from "next";
import { BotaoPrimario, BotaoSecundario, CabecalhoSecao, Container, Paragrafo, Rotulo, Titulo } from "../_components/ui";

export const metadata: Metadata = {
  title: "Para quem é",
  description: "Festivais de dança, teatro, música, circo e circuitos escolares. Produção, grupos, jurados, operadores e responsáveis — cada um com a sua experiência.",
};

const SEGMENTOS = [
  {
    titulo: "Festivais e mostras de dança",
    texto: "Categorias por estilo, faixa etária e formação; trilha e mapa de luz por coreografia; jurados por critério técnico e artístico.",
  },
  {
    titulo: "Teatro e artes cênicas",
    texto: "Mostras competitivas ou não, com elenco por espetáculo, tempo máximo de cena por categoria e termos de imagem.",
  },
  {
    titulo: "Música, corais e bandas",
    texto: "Inscrição por formação (solo, duo, conjunto), ordem de passagem por palco e avaliação por banca de jurados.",
  },
  {
    titulo: "Circuitos escolares e universitários",
    texto: "Várias escolas, muitos menores de idade: autorização do responsável online e acesso restrito por perfil.",
  },
  {
    titulo: "Circo e artes integradas",
    texto: "Formatos mistos, vários locais no mesmo evento e programação que mistura competição e mostra.",
  },
  {
    titulo: "Produtoras com vários eventos",
    texto: "Uma conta para todas as edições e cidades, com a equipe e os jurados reaproveitados de um evento para o outro.",
  },
];

const PERFIS = [
  { quem: "Produção", oque: "Monta o evento, acompanha inscrições, pagamentos e pendências e publica o resultado." },
  { quem: "Equipe", oque: "Produtores, marketing e assistentes, cada um com acesso só ao que precisa." },
  { quem: "Grupos e escolas", oque: "Inscrevem apresentações, cadastram o elenco e enviam trilhas pelo portal do grupo." },
  { quem: "Participantes", oque: "Confirmam o vínculo e assinam o termo pelo link recebido por e-mail." },
  { quem: "Responsáveis", oque: "Autorizam a participação de menores de idade sem papel nem cartório." },
  { quem: "Jurados", oque: "Avaliam pelo celular os eventos para os quais foram designados." },
  { quem: "Operadores de caixa", oque: "Vendem no foyer e na bilheteria, com ou sem internet." },
];

export default function ParaQuem() {
  return (
    <>
      <section className="border-b border-arx-line">
        <Container className="pb-16 pt-16 sm:pb-24 sm:pt-24">
          <Rotulo>Para quem é</Rotulo>
          <Titulo as="h1" className="mt-6 max-w-[880px] text-[40px] leading-[1.04] sm:text-[60px]">
            Para quem leva arte ao palco — e para todo mundo que faz isso acontecer.
          </Titulo>
          <Paragrafo className="mt-7 max-w-[640px] sm:text-[19px]">
            Do festival regional de dança ao circuito estudantil com dezenas de escolas: o ARXUM Fest se adapta às
            regras e ao vocabulário de cada formato.
          </Paragrafo>
        </Container>
      </section>

      <section className="border-b border-arx-line">
        <Container className="py-20 sm:py-28">
          <ul className="grid gap-px overflow-hidden rounded-xl border border-arx-line bg-arx-line md:grid-cols-2 lg:grid-cols-3">
            {SEGMENTOS.map((s) => (
              <li key={s.titulo} className="bg-arx-obsidian p-8">
                <span className="block h-px w-8 bg-arx-fest" />
                <h2 className="mt-6 text-[20px] font-medium tracking-[-0.02em] text-white">{s.titulo}</h2>
                <p className="mt-3 text-[15px] leading-[1.65] text-arx-mist">{s.texto}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-b border-arx-line">
        <Container className="grid gap-12 py-20 sm:py-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <CabecalhoSecao
            rotulo="Uma experiência para cada perfil"
            titulo="Todos na mesma plataforma. Cada um no seu lugar."
            texto="Quem organiza, quem se apresenta, quem avalia e quem vende. Cada perfil entra pela própria porta e vê só o que lhe diz respeito."
          />
          <dl className="divide-y divide-arx-line border-y border-arx-line">
            {PERFIS.map((p) => (
              <div key={p.quem} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
                <dt className="text-[15px] font-medium text-white">{p.quem}</dt>
                <dd className="text-[15px] leading-[1.6] text-arx-mist">{p.oque}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section>
        <Container className="flex flex-col gap-10 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
          <CabecalhoSecao
            rotulo="Seu formato é diferente?"
            titulo="Conte como funciona o seu festival."
            texto="Se o seu evento tem regras próprias, fale com a equipe. A gente mostra como configurar."
          />
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <BotaoPrimario href="/criar-conta">Começar grátis</BotaoPrimario>
            <BotaoSecundario href="/contato">Falar com a equipe</BotaoSecundario>
          </div>
        </Container>
      </section>
    </>
  );
}
