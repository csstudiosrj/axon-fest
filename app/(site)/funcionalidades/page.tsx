import type { Metadata } from "next";
import {
  CalendarDays, ClipboardList, FileSignature, Gavel, Megaphone, Music2, Palette, ShoppingBag, Ticket, UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BotaoPrimario, BotaoSecundario, CabecalhoSecao, Container, EmBreve, Paragrafo, Rotulo, Titulo } from "../_components/ui";

export const metadata: Metadata = {
  title: "Funcionalidades",
  description: "Eventos, inscrições, elenco, termos, trilhas, jurados, loja, caixa e página pública: tudo o que o ARXUM Fest faz pelo seu festival.",
};

interface Modulo {
  id: string;
  icone: LucideIcon;
  titulo: string;
  resumo: string;
  itens: string[];
  emBreve?: boolean;
}

const MODULOS: Modulo[] = [
  {
    id: "eventos",
    icone: CalendarDays,
    titulo: "Eventos e programação",
    resumo: "Estruture cada edição com as regras do seu festival.",
    itens: [
      "Formatos competitivo, mostra ou misto",
      "Categorias e subcategorias por estilo, faixa etária, gênero e formação (solo, duo, conjunto)",
      "Valores por formação, tempo mínimo e máximo de apresentação",
      "Vários palcos e locais no mesmo evento",
      "Ordem de apresentação por dia e por palco",
      "Premiação com troféus ou em dinheiro por colocação",
    ],
  },
  {
    id: "inscricoes",
    icone: ClipboardList,
    titulo: "Inscrições de grupos",
    resumo: "Escolas, companhias e grupos se inscrevem sozinhos, no seu link.",
    itens: [
      "Cadastro do grupo por CPF ou CNPJ, reaproveitado entre edições",
      "Portal do grupo para acompanhar inscrições e pendências",
      "Apresentações com categoria, elenco e observações",
      "Painel da produção com o status de cada grupo",
    ],
  },
  {
    id: "elenco",
    icone: UsersRound,
    titulo: "Elenco e participantes",
    resumo: "Cada pessoa com cadastro único e vínculo confirmado.",
    itens: [
      "Função de cada participante no grupo (bailarino, músico, técnico, coreógrafo…)",
      "Confirmação de vínculo pelo e-mail do próprio participante",
      "Bloqueio de participante por produtora",
      "Cadastro único, reaproveitado entre grupos e eventos",
    ],
  },
  {
    id: "termos",
    icone: FileSignature,
    titulo: "Termos e autorizações",
    resumo: "Assinatura online com validade e rastreabilidade.",
    itens: [
      "Termo de participação, cessão de imagem e regulamento por evento",
      "Autorização de menor assinada pelo responsável legal (nome, CPF e parentesco)",
      "Envio do link de assinatura direto para o responsável",
      "Registro de data, hora, IP e navegador de cada assinatura",
    ],
  },
  {
    id: "midias",
    icone: Music2,
    titulo: "Trilhas e mapas de luz",
    resumo: "Os arquivos técnicos de cada apresentação, no lugar certo.",
    itens: [
      "Envio da trilha sonora pelo próprio grupo",
      "Mapa de luz em imagem ou PDF",
      "Status de recebimento por apresentação",
      "Central de mídias para a equipe técnica",
    ],
  },
  {
    id: "jurados",
    icone: Gavel,
    titulo: "Jurados e apuração",
    resumo: "Avaliação pelo celular e resultado sem redigitar notas.",
    emBreve: true,
    itens: [
      "Cadastro de jurados com foto, mini bio e especialidade",
      "Designação de jurados por evento e controle de cachê",
      "Notas por critério com comentário opcional",
      "Classificação automática por categoria",
    ],
  },
  {
    id: "pdv",
    icone: Ticket,
    titulo: "Caixa e bilheteria (PDV)",
    resumo: "Venda no foyer e na portaria, mesmo sem internet.",
    itens: [
      "Login individual de operador + PIN do PDV",
      "Funciona offline e sincroniza quando a conexão volta",
      "PIX com QR Code, dinheiro e cartão",
      "Catálogo de produtos por evento e relatório de vendas",
    ],
  },
  {
    id: "loja",
    icone: ShoppingBag,
    titulo: "Loja e adicionais",
    resumo: "Venda camisetas, fotos, vídeos e kits para os grupos.",
    itens: [
      "Produtos com variações (tamanho, cor) e estoque",
      "Exibição opcional na página pública do evento",
      "Pedidos por grupo e por apresentação",
    ],
  },
  {
    id: "marca",
    icone: Palette,
    titulo: "Página pública com a sua marca",
    resumo: "O seu festival na frente — a plataforma, nos bastidores.",
    itens: [
      "Logo, banner, cores, tipografia e tema claro ou escuro",
      "Terminologia própria: escola, companhia ou grupo; bailarino, artista ou participante",
      "Jurados, locais, premiação e regulamento na página do evento",
      "Feed do Instagram do festival",
    ],
  },
  {
    id: "marketing",
    icone: Megaphone,
    titulo: "Equipe e comunicação",
    resumo: "Cada pessoa com o acesso certo.",
    itens: [
      "Cargos: administrador, produtor, marketing, assistente, operador e jurado",
      "Convites por e-mail com senha criada pela própria pessoa",
      "Agenda de publicações para redes sociais",
    ],
  },
];

export default function Funcionalidades() {
  return (
    <>
      <section className="border-b border-arx-line">
        <Container className="pb-16 pt-16 sm:pb-24 sm:pt-24">
          <Rotulo>Funcionalidades</Rotulo>
          <Titulo as="h1" className="mt-6 max-w-[880px] text-[40px] leading-[1.04] sm:text-[60px]">
            Tudo o que um festival precisa, do primeiro rascunho ao último aplauso.
          </Titulo>
          <Paragrafo className="mt-7 max-w-[620px] sm:text-[19px]">
            Dez módulos que conversam entre si. Você liga o que usa e a informação flui de uma etapa para a outra.
          </Paragrafo>

          <nav aria-label="Módulos" className="mt-12 flex flex-wrap gap-2">
            {MODULOS.map((m) => (
              <a key={m.id} href={`#${m.id}`}
                className="rounded-full border border-arx-line px-3.5 py-1.5 text-[13px] text-arx-mist transition-colors hover:border-white/20 hover:text-white">
                {m.titulo}
              </a>
            ))}
          </nav>
        </Container>
      </section>

      <section>
        <Container className="py-8 sm:py-12">
          {MODULOS.map((m, i) => {
            const Icone = m.icone;
            return (
              <article key={m.id} id={m.id}
                className="grid scroll-mt-24 gap-8 border-b border-arx-line py-14 last:border-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
                <div>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-medium tabular-nums text-arx-slate">{String(i + 1).padStart(2, "0")}</span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-arx-fest/20 bg-arx-fest/10 text-arx-fest">
                      <Icone size={17} strokeWidth={1.7} />
                    </span>
                  </div>
                  <h2 className="mt-6 text-[26px] font-medium leading-[1.15] tracking-[-0.025em] text-white sm:text-[30px]">
                    {m.titulo}{m.emBreve && <EmBreve />}
                  </h2>
                  <p className="mt-3 text-[16px] leading-[1.65] text-arx-mist">{m.resumo}</p>
                </div>
                <ul className="grid content-start gap-px overflow-hidden rounded-lg border border-arx-line bg-arx-line sm:grid-cols-2">
                  {m.itens.map((item) => (
                    <li key={item} className="bg-arx-obsidian px-5 py-4 text-[15px] leading-[1.55] text-arx-frost">{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </Container>
      </section>

      <section className="border-t border-arx-line">
        <Container className="flex flex-col gap-10 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
          <CabecalhoSecao
            rotulo="Comece agora"
            titulo="Monte o seu evento de graça."
            texto="Crie a conta, configure categorias e página e convide a equipe. Você só paga quando vender inscrições."
          />
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <BotaoPrimario href="/criar-conta">Começar grátis</BotaoPrimario>
            <BotaoSecundario href="/precos">Ver preços</BotaoSecundario>
          </div>
        </Container>
      </section>
    </>
  );
}
