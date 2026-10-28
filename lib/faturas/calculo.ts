// Cálculo das faturas do ARXUM (puro: sem banco), com os valores de Super Admin → Planos e taxas.
//   Mensal (mês anterior): mensalidade do Pro + ingressos vendidos na bilheteria + caixa sem evento
//   Por evento (no dia seguinte ao fim): inscrições pagas + caixa (cantina e lojinha) do evento
//   Ingressos e caixa: percentual do caixa, isento abaixo do limite (contado em cada fatura)
//   Inscrição paga: percentual + valor fixo por inscrição

export interface PrecosFatura {
  taxaPercentual: number;
  taxaFixa: number;
  caixaPercentual: number;
  caixaIsencaoAte: number;
}

export interface ItemFatura { descricao: string; quantidade: number; base: number | null; valor: number }

const centavos = (v: number) => Math.round(v * 100) / 100;
const pct = (v: number) => String(v).replace(".", ",");
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Vendas do PDV (ingressos ou caixa): percentual sobre o total, isento abaixo do limite
export function itemVendas(rotulo: string, total: number, quantidade: number, p: PrecosFatura): ItemFatura | null {
  if (total <= 0) return null;
  if (total < p.caixaIsencaoAte) {
    return { descricao: `${rotulo}: ${brl(total)} vendidos (isento abaixo de ${brl(p.caixaIsencaoAte)})`, quantidade, base: centavos(total), valor: 0 };
  }
  return { descricao: `${rotulo}: ${pct(p.caixaPercentual)}% sobre ${brl(total)}`, quantidade, base: centavos(total), valor: centavos((total * p.caixaPercentual) / 100) };
}

// Inscrições pagas: percentual sobre cada uma + valor fixo por inscrição
export function itemInscricoes(valores: number[], p: PrecosFatura): ItemFatura | null {
  const pagas = valores.filter((v) => v > 0);
  if (!pagas.length) return null;
  const base = pagas.reduce((s, v) => s + v, 0);
  const valor = pagas.reduce((s, v) => s + centavos((v * p.taxaPercentual) / 100) + p.taxaFixa, 0);
  return {
    descricao: `Inscrições pagas: ${pagas.length} × (${pct(p.taxaPercentual)}% + ${brl(p.taxaFixa)}) sobre ${brl(base)}`,
    quantidade: pagas.length, base: centavos(base), valor: centavos(valor),
  };
}

export const totalItens = (itens: ItemFatura[]) => centavos(itens.reduce((s, i) => s + i.valor, 0));

// "2026-10" → mês anterior a uma data AAAA-MM-DD
export function mesAnterior(hoje: string): string {
  const [a, m] = hoje.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}

export function limitesDoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const prox = m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return {
    inicioIso: new Date(`${mes}-01T00:00:00-03:00`).toISOString(),
    fimIso: new Date(`${prox}-01T00:00:00-03:00`).toISOString(),
    primeiroDia: `${mes}-01`,
    ultimoDia: `${mes}-${String(ultimo).padStart(2, "0")}`,
  };
}

export const nomeMes = (mes: string) =>
  new Date(`${mes}-15T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export function somarDias(dia: string, dias: number): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Data de hoje no horário de Brasília (AAAA-MM-DD)
export const hojeSP = (agora = new Date()) => agora.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
