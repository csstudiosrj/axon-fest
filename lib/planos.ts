// Situação do plano da produtora e taxa do caixa (usado no painel e no super admin)

export interface PlanoProdutora {
  plano: "start" | "pro";
  plano_inicio: string;
  pro_ate: string | null;
}

export interface ParametrosPlano {
  mesesStart: number;
  mesesGuarda: number;
  caixaPercentual: number;
  caixaIsencaoAte: number;
}

export type Fase = "pro" | "start" | "leitura" | "expirado";

function somarMeses(iso: string, meses: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + meses);
  return d;
}

const DIA = 86400000;

export function situacaoPlano(p: PlanoProdutora, c: ParametrosPlano, agora = new Date()) {
  const proAtivo = p.plano === "pro" && (!p.pro_ate || new Date(p.pro_ate) > agora);
  // Pro vencido volta ao ciclo do Start a partir do fim do Pro
  const base = p.plano === "pro" && p.pro_ate && !proAtivo ? p.pro_ate : p.plano_inicio;
  const fimStart = p.plano === "pro" && p.pro_ate && !proAtivo ? new Date(base) : somarMeses(base, c.mesesStart);
  const fimLeitura = somarMeses(fimStart.toISOString(), c.mesesGuarda);

  const fase: Fase = proAtivo ? "pro" : agora < fimStart ? "start" : agora < fimLeitura ? "leitura" : "expirado";
  const ate = fase === "pro" ? (p.pro_ate ? new Date(p.pro_ate) : null) : fase === "start" ? fimStart : fase === "leitura" ? fimLeitura : null;
  return {
    fase,
    fimStart,
    fimLeitura,
    ate,
    diasRestantes: ate ? Math.max(0, Math.ceil((ate.getTime() - agora.getTime()) / DIA)) : null,
  };
}

export const NOME_FASE: Record<Fase, string> = {
  pro: "Pro",
  start: "Start (gratuito)",
  leitura: "Modo leitura",
  expirado: "Expirado",
};

// Taxa do caixa no mês: percentual sobre o vendido, isento abaixo do limite
export function taxaCaixa(totalMes: number, c: ParametrosPlano) {
  const isento = totalMes < c.caixaIsencaoAte;
  return { isento, taxa: isento ? 0 : Math.round(totalMes * c.caixaPercentual) / 100 };
}

// Primeiro dia do mês (horário de Brasília) para somar as vendas
export function inicioDoMes(agora = new Date()) {
  const sp = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return new Date(Date.UTC(sp.getFullYear(), sp.getMonth(), 1, 3)); // 00:00 em Brasília
}
