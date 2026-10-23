// Vagas do evento e das categorias (o banco trava; aqui só se calcula o que mostrar).
// Ocupação vem da função ocupacao_evento (a categoria principal soma as subcategorias).

export interface Ocupacao {
  total: number;
  categorias: Record<string, number>;
}

export interface CategoriaVagas {
  id: string;
  categoria_pai_id: string | null;
  vagas: number | null;
}

export function lerOcupacao(valor: unknown): Ocupacao {
  const o = (valor ?? {}) as Partial<Ocupacao>;
  return { total: Number(o.total ?? 0), categorias: o.categorias ?? {} };
}

// Vagas restantes numa categoria folha: o menor saldo entre ela, a principal e o evento
export function restantesCategoria(cat: CategoriaVagas, todas: CategoriaVagas[], ocupacao: Ocupacao, vagasEvento: number | null): number | null {
  const saldos: number[] = [];
  if (vagasEvento != null) saldos.push(vagasEvento - ocupacao.total);
  for (const c of [cat, todas.find((x) => x.id === cat.categoria_pai_id)]) {
    if (c?.vagas != null) saldos.push(c.vagas - (ocupacao.categorias[c.id] ?? 0));
  }
  return saldos.length ? Math.max(0, Math.min(...saldos)) : null;
}

// Situação geral do evento para a página pública e o formulário de inscrição
export function situacaoVagas(todas: CategoriaVagas[], ocupacao: Ocupacao, vagasEvento: number | null) {
  const pais = new Set(todas.map((c) => c.categoria_pai_id).filter(Boolean));
  const folhas = todas.filter((c) => !pais.has(c.id));
  const porFolha = folhas.map((c) => restantesCategoria(c, todas, ocupacao, vagasEvento));
  const restamEvento = vagasEvento != null ? Math.max(0, vagasEvento - ocupacao.total) : null;
  const esgotado = restamEvento === 0 || (porFolha.length > 0 && porFolha.every((r) => r === 0));
  return { restamEvento, esgotado };
}
