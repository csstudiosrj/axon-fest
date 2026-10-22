import Link from "next/link";
import { ShieldCheck, Lock, FileSignature, Users } from "lucide-react";
import { obterConfiguracoes } from "@/lib/site/configuracoes";
import { CaixaDemo, NotasDemo, PainelDemo, TermoDemo } from "./_components/Demos";
import {
  BotaoPrimario, BotaoSecundario, CabecalhoSecao, Container, LinkSeta, Paragrafo, Rotulo, Titulo,
} from "./_components/ui";

const ETAPAS = [
  { n: "01", titulo: "Monte o evento", texto: "Categorias por estilo, faixa etária e formação, locais, valores, critérios de avaliação e regulamento." },
  { n: "02", titulo: "Publique a página", texto: "Página do festival com a sua marca: cores, logo, tipografia e a terminologia que o seu público usa." },
  { n: "03", titulo: "Receba as inscrições", texto: "Grupos cadastram elenco e apresentações, enviam trilhas e mapas de luz; participantes assinam os termos." },
  { n: "04", titulo: "Execute e apure", texto: "Ordem de apresentação, caixa e bilheteria no celular, notas dos jurados e classificação por categoria." },
];

const SEGMENTOS = [
  "Festivais de dança", "Mostras de teatro", "Competições de música", "Circuitos escolares", "Festivais de circo", "Mostras de artes integradas",
];

export default async function Inicio() {
  const { taxaTexto: TAXA_TEXTO } = await obterConfiguracoes();
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-arx-line">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(216,228,240,0.035)_1px,transparent_1px)] bg-[size:120px_100%]" />
        <Container className="relative pb-20 pt-16 sm:pb-28 sm:pt-24">
          <div className="max-w-[860px]">
            <Rotulo>Gestão de festivais e mostras artísticas</Rotulo>
            <Titulo as="h1" className="mt-6 text-[40px] leading-[1.02] sm:text-[64px] lg:text-[76px]">
              Do edital ao resultado, o festival inteiro em um só lugar.
            </Titulo>
            <Paragrafo className="mt-7 max-w-[620px] sm:text-[19px]">
              Inscrições, elenco, trilhas, mapas de luz, termos, jurados, bilheteria e caixa — com a identidade do seu
              festival e sem planilha paralela.
            </Paragrafo>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <BotaoPrimario href="/criar-conta">Começar grátis</BotaoPrimario>
              <BotaoSecundario href="/funcionalidades">Conhecer as funcionalidades</BotaoSecundario>
            </div>
            <p className="mt-5 text-[13px] text-arx-slate">
              Grátis para criar e montar o evento. Você só paga quando vender inscrições.
            </p>
          </div>

          <div className="mt-16 sm:mt-20">
            <PainelDemo />
          </div>
        </Container>
      </section>

      {/* ── Segmentos ────────────────────────────────────────────────────── */}
      <section className="border-b border-arx-line">
        <Container className="flex flex-col gap-6 py-10 lg:flex-row lg:items-center lg:justify-between">
          <Rotulo className="shrink-0">Feito para</Rotulo>
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-[15px] text-arx-mist">
            {SEGMENTOS.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </Container>
      </section>

      {/* ── Fluxo ────────────────────────────────────────────────────────── */}
      <section className="border-b border-arx-line">
        <Container className="py-24 sm:py-32">
          <CabecalhoSecao
            rotulo="Como funciona"
            titulo="Quatro etapas. Uma plataforma."
            texto="O ARXUM Fest acompanha o festival do primeiro rascunho à divulgação do resultado. Cada etapa alimenta a seguinte — nada se perde entre formulário, e-mail e WhatsApp."
          />
          <ol className="mt-16 grid gap-px overflow-hidden rounded-xl border border-arx-line bg-arx-line sm:grid-cols-2 lg:grid-cols-4">
            {ETAPAS.map((e) => (
              <li key={e.n} className="bg-arx-obsidian p-7">
                <span className="text-[13px] font-medium tabular-nums text-arx-fest">{e.n}</span>
                <h3 className="mt-8 text-[19px] font-medium tracking-[-0.02em] text-white">{e.titulo}</h3>
                <p className="mt-3 text-[15px] leading-[1.65] text-arx-mist">{e.texto}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ── Inscrições e termos ──────────────────────────────────────────── */}
      <section className="border-b border-arx-line">
        <Container className="grid items-center gap-14 py-24 sm:py-32 lg:grid-cols-2 lg:gap-20">
          <div>
            <CabecalhoSecao
              rotulo="Inscrições e elenco"
              titulo="Cada participante confirmado. Cada termo assinado."
              texto="O grupo cadastra o elenco uma vez e reaproveita em todas as edições. Cada pessoa confirma o vínculo pelo próprio e-mail e assina o termo online. Para menores, o responsável legal assina com nome, CPF e parentesco — com data, hora e registro de acesso."
            />
            <ul className="mt-8 space-y-3 text-[15px] text-arx-frost">
              <li className="flex gap-3"><span className="mt-2 h-1 w-3 shrink-0 bg-arx-fest" />Painel de pendências por grupo: quem falta confirmar, quem falta assinar.</li>
              <li className="flex gap-3"><span className="mt-2 h-1 w-3 shrink-0 bg-arx-fest" />Termo de imagem e autorização de menor configuráveis por evento.</li>
              <li className="flex gap-3"><span className="mt-2 h-1 w-3 shrink-0 bg-arx-fest" />Bloqueio de participante por produtora, quando necessário.</li>
            </ul>
          </div>
          <TermoDemo />
        </Container>
      </section>

      {/* ── Jurados ──────────────────────────────────────────────────────── */}
      <section className="border-b border-arx-line">
        <Container className="grid items-center gap-14 py-24 sm:py-32 lg:grid-cols-2 lg:gap-20">
          <div className="lg:order-2">
            <CabecalhoSecao
              rotulo="Jurados e apuração"
              titulo="Notas por critério, mesmo sem internet."
              texto="O jurado baixa o evento no celular e avalia critério a critério, com comentário, mesmo em teatro ou ginásio sem sinal. As notas chegam à produção pela internet ou por QR code criptografado lido na hora, e a classificação por categoria sai pronta para publicar."
            />
          </div>
          <div className="lg:order-1"><NotasDemo /></div>
        </Container>
      </section>

      {/* ── Caixa ────────────────────────────────────────────────────────── */}
      <section className="border-b border-arx-line">
        <Container className="grid items-center gap-14 py-24 sm:py-32 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <CabecalhoSecao
              rotulo="Caixa e bilheteria"
              titulo="O caixa do foyer cabe no celular."
              texto="Operadores entram com login próprio e o PIN do PDV. Se a internet do teatro cair, as vendas continuam e sincronizam sozinhas quando a conexão voltar. PIX com QR Code gerado na hora, dinheiro e cartão no mesmo fechamento."
            />
            <div className="mt-8"><LinkSeta href="/funcionalidades#pdv">Ver tudo sobre o PDV</LinkSeta></div>
          </div>
          <CaixaDemo />
        </Container>
      </section>

      {/* ── Segurança ────────────────────────────────────────────────────── */}
      <section className="border-b border-arx-line bg-arx-surface/40">
        <Container className="py-24 sm:py-32">
          <CabecalhoSecao
            rotulo="Segurança e privacidade"
            titulo="Dados de crianças e adolescentes exigem seriedade."
            texto="Festivais lidam com nomes, documentos e datas de nascimento de menores. O ARXUM Fest foi construído para proteger essas informações desde a base de dados."
          />
          <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-arx-line bg-arx-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icone: Lock, titulo: "Isolamento por produtora", texto: "Cada festival enxerga apenas os próprios dados. A regra vale no banco, não só na tela." },
              { icone: Users, titulo: "Acesso por função", texto: "Produção, equipe, jurados, grupos e operadores de caixa: cada perfil vê só o que precisa." },
              { icone: FileSignature, titulo: "Assinaturas rastreáveis", texto: "Termos com data, hora, IP e navegador registrados. CPF exibido sempre mascarado." },
              { icone: ShieldCheck, titulo: "Convites verificados", texto: "Novos acessos só por convite de quem tem permissão, com senha criada pela própria pessoa." },
            ].map(({ icone: Icone, titulo, texto }) => (
              <div key={titulo} className="bg-arx-obsidian p-7">
                <Icone size={20} strokeWidth={1.6} className="text-arx-fest" />
                <h3 className="mt-6 text-[16px] font-medium text-white">{titulo}</h3>
                <p className="mt-2 text-[14px] leading-[1.65] text-arx-mist">{texto}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Preço ────────────────────────────────────────────────────────── */}
      <section className="border-b border-arx-line">
        <Container className="grid gap-12 py-24 sm:py-32 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <Rotulo>Preço</Rotulo>
            <Titulo className="mt-4 text-[32px] leading-[1.08] sm:text-[52px]">
              Grátis para criar.<br />
              <span className="text-arx-fest">{TAXA_TEXTO}</span> quando você vender.
            </Titulo>
            <Paragrafo className="mt-6 max-w-[560px]">
              Monte o evento, personalize a página e convide a equipe sem pagar nada. Em cada venda feita pelo sistema —
              inscrição, ingresso ou produto — a taxa de serviço é de {TAXA_TEXTO}, e você decide se absorve ou repassa.
            </Paragrafo>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <BotaoPrimario href="/criar-conta">Criar conta grátis</BotaoPrimario>
            <BotaoSecundario href="/precos">Ver planos</BotaoSecundario>
          </div>
        </Container>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section>
        <Container className="py-24 text-center sm:py-32">
          <Titulo className="mx-auto max-w-[760px] text-[32px] leading-[1.08] sm:text-[48px]">
            Sua próxima edição merece uma operação à altura do palco.
          </Titulo>
          <Paragrafo className="mx-auto mt-6 max-w-[560px]">
            Crie a conta, monte o evento e veja tudo funcionando antes de abrir as inscrições.
          </Paragrafo>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <BotaoPrimario href="/criar-conta">Começar grátis</BotaoPrimario>
            <BotaoSecundario href="/contato">Falar com a equipe</BotaoSecundario>
          </div>
          <p className="mt-6 text-[13px] text-arx-slate">
            Já usa o ARXUM Fest? <Link href="/login" className="text-arx-mist underline-offset-4 hover:text-white hover:underline">Entrar</Link>
          </p>
        </Container>
      </section>
    </>
  );
}
