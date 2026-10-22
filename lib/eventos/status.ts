// Status do evento — fonte única (painel, página pública, portal do grupo).
// Os valores gravados no banco não mudam; o banco também conhece estas regras
// (migration 20261029000000_status_eventos.sql).

export const STATUS_EVENTO = [
  "Em Montagem",
  "inscricoes_abertas",
  "inscricoes_prorrogadas",
  "inscricoes_encerradas",
  "em_andamento",
  "adiado",
  "finalizado",
  "cancelado",
] as const;

export type StatusEvento = (typeof STATUS_EVENTO)[number];

interface InfoStatus {
  rotulo: string;
  explicacao: string;
  cor: string; // classes de selo
}

export const INFO_STATUS: Record<StatusEvento, InfoStatus> = {
  "Em Montagem": {
    rotulo: "Em montagem",
    explicacao: "O evento ainda não aparece ao público e o formulário de inscrição fica bloqueado.",
    cor: "text-gray-400 bg-white/5 border-white/10",
  },
  inscricoes_abertas: {
    rotulo: "Inscrições abertas",
    explicacao: "Os grupos já podem se inscrever, cadastrar apresentações e elenco.",
    cor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  inscricoes_prorrogadas: {
    rotulo: "Inscrições prorrogadas",
    explicacao: "O evento segue aceitando inscrições em período estendido.",
    cor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
  inscricoes_encerradas: {
    rotulo: "Inscrições encerradas",
    explicacao: "Novas inscrições e mudanças nas apresentações só pela produção. Os grupos ainda enviam arquivos técnicos.",
    cor: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  },
  em_andamento: {
    rotulo: "Em andamento",
    explicacao: "O festival está acontecendo. Inscrições fechadas; arquivos técnicos ainda podem ser trocados.",
    cor: "text-axon-gold bg-axon-gold/10 border-axon-gold/20",
  },
  adiado: {
    rotulo: "Adiado",
    explicacao: "O evento foi postergado. Atualize as datas e avise os inscritos.",
    cor: "text-orange-300 bg-orange-500/10 border-orange-500/20",
  },
  finalizado: {
    rotulo: "Finalizado",
    explicacao: "Festival encerrado. Os dados ficam apenas para consulta; arquivos técnicos travados.",
    cor: "text-gray-300 bg-white/5 border-white/10",
  },
  cancelado: {
    rotulo: "Cancelado",
    explicacao: "O evento foi cancelado e não aceita inscrições.",
    cor: "text-red-400 bg-red-400/10 border-red-400/20",
  },
};

export function infoStatus(status: string | null | undefined): InfoStatus {
  return INFO_STATUS[(status ?? "") as StatusEvento] ?? INFO_STATUS["Em Montagem"];
}

// Grupos podem se inscrever e mexer nas apresentações
export const inscricoesAbertas = (s: string | null | undefined) => s === "inscricoes_abertas" || s === "inscricoes_prorrogadas";

// Visível ao público (página do evento)
export const eventoPublico = (s: string | null | undefined) => !!s && s !== "Em Montagem" && s !== "rascunho";

// Grupos ainda podem enviar/trocar arquivos técnicos
export const aceitaArquivos = (s: string | null | undefined) => s !== "finalizado" && s !== "cancelado";
