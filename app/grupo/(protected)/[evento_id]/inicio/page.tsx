import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Trophy } from "lucide-react";
import { carregarContextoGrupo, carregarElenco, situacaoEvento } from "@/lib/grupo/contexto";
import { carregarApresentacoes, pago } from "@/lib/grupo/dados";
import { maiuscula, novo } from "@/lib/perfis";
import { Cartao, brl } from "../../../_components/ui";

export const dynamic = "force-dynamic";

interface Pendencia { texto: string; href: string; grave?: boolean }

export default async function ResumoEvento({ params }: { params: Promise<{ evento_id: string }> }) {
  const { evento_id } = await params;
  const { evento, perfil, grupo, usuario } = await carregarContextoGrupo(evento_id);
  const situacao = situacaoEvento(evento.status);
  const base = `/grupo/${evento.id}`;
  const T = perfil.termos;

  const [apresentacoes, elenco] = await Promise.all([
    carregarApresentacoes(evento.id, grupo.id),
    carregarElenco(grupo.id, usuario.id),
  ]);

  const valorTotal = apresentacoes.reduce((s, a) => s + a.valor_total, 0);
  const valorPendente = apresentacoes.filter((a) => !pago(a.status_pagamento)).reduce((s, a) => s + a.valor_total, 0);
  const aguardando = elenco.filter((p) => !p.confirmado).length;
  const semTermo = elenco.filter((p) => p.confirmado && !p.termo_assinado).length;
  const obrigatorios = perfil.arquivos.filter((a) => a.obrigatorio);
  const idsElenco = new Set(apresentacoes.flatMap((a) => a.elenco));

  const pendencias: Pendencia[] = [];
  if (situacao.podeEditar && elenco.length === 0) pendencias.push({ texto: `Cadastre o ${T.elenco} do grupo.`, href: `${base}/elenco` });
  if (situacao.podeEditar && apresentacoes.length === 0) pendencias.push({ texto: `Inscreva ${T.apresentacao.genero === "f" ? "sua primeira" : "seu primeiro"} ${T.apresentacao.singular}.`, href: `${base}/apresentacoes` });
  for (const a of apresentacoes) {
    for (const arq of a.arquivos.filter((f) => f.status === "recusado")) {
      const nome = perfil.arquivos.find((x) => x.chave === arq.tipo)?.nome ?? arq.tipo;
      pendencias.push({ texto: `A produção recusou o arquivo “${nome}” de “${a.nome}”${arq.observacao ? ` (${arq.observacao})` : ""}. Envie outro.`, href: `${base}/apresentacoes#${a.id}`, grave: true });
    }
    const faltando = obrigatorios.filter((o) => !a.arquivos.some((f) => f.tipo === o.chave));
    if (faltando.length && situacao.podeEnviarArquivos) {
      pendencias.push({ texto: `Falta enviar ${faltando.map((f) => f.nome.toLowerCase()).join(", ")} de “${a.nome}”.`, href: `${base}/apresentacoes#${a.id}` });
    }
    if (a.elenco.length === 0 && situacao.podeEditar) pendencias.push({ texto: `“${a.nome}” está sem ${T.elenco}.`, href: `${base}/apresentacoes#${a.id}` });
  }
  const pendentesNoEvento = elenco.filter((p) => idsElenco.has(p.participante_id) && (!p.confirmado || !p.termo_assinado)).length;
  if (pendentesNoEvento) {
    pendencias.push({ texto: `${pendentesNoEvento} ${pendentesNoEvento === 1 ? "pessoa em cena ainda não confirmou ou não assinou o termo" : "pessoas em cena ainda não confirmaram ou não assinaram o termo"}.`, href: `${base}/elenco` });
  }
  if (valorPendente > 0) pendencias.push({ texto: `Pagamento pendente de ${brl(valorPendente)}. Siga as orientações da produção do festival.`, href: `${base}/apresentacoes` });

  const numeros = [
    { rotulo: maiuscula(T.apresentacao.plural), valor: String(apresentacoes.length), detalhe: apresentacoes.length ? `Total ${brl(valorTotal)}` : "Nenhuma inscrita" },
    { rotulo: maiuscula(T.elenco), valor: String(elenco.length), detalhe: aguardando ? `${aguardando} aguardando confirmação` : elenco.length ? "Todos confirmados" : "Ninguém cadastrado" },
    { rotulo: "Termos", valor: String(elenco.filter((p) => p.termo_assinado).length), detalhe: semTermo ? `${semTermo} sem assinatura` : "assinados" },
    { rotulo: "A pagar", valor: brl(valorPendente), detalhe: valorPendente > 0 ? "Pendente" : valorTotal > 0 ? "Tudo pago" : "Nada a pagar" },
  ];

  return (
    <div className="space-y-6">
      {evento.resultado_publicado_em && (
        <Link href={`${base}/resultado`} className="flex items-center justify-between gap-3 rounded-xl border border-axon-gold/30 bg-axon-gold/10 px-5 py-4">
          <span className="flex items-center gap-3 text-sm text-axon-gold"><Trophy size={18} /> O resultado foi publicado{evento.liberar_comentarios ? " e os comentários dos jurados estão liberados" : ""}.</span>
          <ArrowRight size={16} className="text-axon-gold" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {numeros.map((n) => (
          <Cartao key={n.rotulo} className="p-4">
            <p className="text-xs text-gray-500">{n.rotulo}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{n.valor}</p>
            <p className="mt-0.5 text-xs text-gray-400">{n.detalhe}</p>
          </Cartao>
        ))}
      </div>

      <Cartao>
        <div className="border-b border-axon-border px-5 py-4">
          <h2 className="font-semibold text-white">O que falta</h2>
          {!situacao.podeEditar && (
            <p className="mt-1 text-xs text-gray-400">
              {situacao.podeEnviarArquivos
                ? `As inscrições estão fechadas: ${T.apresentacao.plural} e ${T.elenco} só mudam pela produção. Os arquivos técnicos ainda podem ser enviados.`
                : "O festival foi finalizado. Os dados ficam disponíveis apenas para consulta."}
            </p>
          )}
        </div>
        {pendencias.length === 0 ? (
          <p className="flex items-center gap-2 px-5 py-5 text-sm text-emerald-300"><CheckCircle2 size={16} /> Tudo em dia por aqui.</p>
        ) : (
          <ul className="divide-y divide-axon-border">
            {pendencias.map((p, i) => (
              <li key={i}>
                <Link href={p.href} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm hover:bg-white/[0.03]">
                  <span className={`flex items-start gap-2.5 ${p.grave ? "text-red-300" : "text-gray-200"}`}>
                    <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${p.grave ? "text-red-400" : "text-axon-gold"}`} /> {p.texto}
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-gray-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      <div className="grid gap-3 sm:grid-cols-2">
        {situacao.podeEditar && (
          <Link href={`${base}/apresentacoes?nova=1`} className="flex items-center justify-between rounded-xl border border-axon-border bg-axon-panel px-5 py-4 text-sm text-white hover:border-axon-gold/40">
            {novo(T.apresentacao)} <ArrowRight size={15} className="text-axon-gold" />
          </Link>
        )}
        {evento.regulamento_url && (
          <a href={evento.regulamento_url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-axon-border bg-axon-panel px-5 py-4 text-sm text-white hover:border-axon-gold/40">
            <span className="flex items-center gap-2"><FileText size={15} className="text-gray-400" /> Regulamento do festival</span> <ArrowRight size={15} className="text-axon-gold" />
          </a>
        )}
      </div>

    </div>
  );
}
