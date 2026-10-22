// Cálculo da classificação. Usado no aparelho do produtor (offline) e no
// servidor (publicação do resultado) — por isso não depende de nada externo.

export type MetodoApuracao = "media_simples" | "ponderada" | "descarta_extremos";

export const METODOS: Record<MetodoApuracao, { nome: string; descricao: string }> = {
  media_simples: {
    nome: "Média simples",
    descricao: "Média dos critérios de cada jurado e, depois, média entre os jurados.",
  },
  ponderada: {
    nome: "Critérios com peso",
    descricao: "Média ponderada pelos pesos dos critérios para cada jurado e, depois, média entre os jurados.",
  },
  descarta_extremos: {
    nome: "Descarta maior e menor",
    descricao: "Com 3 jurados ou mais, a maior e a menor nota final de jurado são descartadas antes da média.",
  },
};

export interface CriterioCalc { id: string; nome: string; peso: number; ordem: number | null }
export interface ApresentacaoCalc {
  id: string;
  nome: string;
  grupo: string;
  categoria_id: string | null;
  categoria: string;      // rótulo já montado (ex.: "Jazz › Juvenil")
  competitiva: boolean;
  tipo: string;           // solo, duo, conjunto, grupo
  desempate: number | null;
}
export interface FichaCalc {
  apresentacao_id: string;
  avaliador_id: string;
  finalizada: boolean;
  notas: Record<string, number | null>; // por critério
}

export interface LinhaClassificacao {
  apresentacao: ApresentacaoCalc;
  nota: number | null;          // nota final (null = sem fichas finalizadas)
  porJurado: Record<string, number>;
  descartados: string[];        // jurados descartados (método descarta_extremos)
  finalizadas: number;
  posicao: number | null;
  empatada: boolean;            // empate não resolvido pela produção
}

export interface GrupoClassificacao {
  chave: string;                // categoria + formação
  titulo: string;
  linhas: LinhaClassificacao[];
}

const FORMACAO_PADRAO: Record<string, string> = { solo: "Solo", duo: "Duo", conjunto: "Conjunto", grupo: "Grupo" };

const arred = (v: number) => Math.round(v * 1000) / 1000;

export function notaDoJurado(ficha: FichaCalc, criterios: CriterioCalc[], metodo: MetodoApuracao): number | null {
  let soma = 0;
  let pesos = 0;
  for (const c of criterios) {
    const n = ficha.notas[c.id];
    if (n === null || n === undefined) return null; // ficha incompleta não entra
    const peso = metodo === "ponderada" ? c.peso : 1;
    soma += n * peso;
    pesos += peso;
  }
  return pesos > 0 ? soma / pesos : null;
}

export function notaFinal(
  porJurado: Record<string, number>, metodo: MetodoApuracao
): { nota: number | null; descartados: string[] } {
  const itens = Object.entries(porJurado).sort((a, b) => a[1] - b[1]);
  if (itens.length === 0) return { nota: null, descartados: [] };
  let usados = itens;
  let descartados: string[] = [];
  if (metodo === "descarta_extremos" && itens.length >= 3) {
    descartados = [itens[0][0], itens[itens.length - 1][0]];
    usados = itens.slice(1, -1);
  }
  const nota = usados.reduce((s, [, v]) => s + v, 0) / usados.length;
  return { nota: arred(nota), descartados };
}

export function classificar(
  apresentacoes: ApresentacaoCalc[],
  fichas: FichaCalc[],
  criterios: CriterioCalc[],
  metodo: MetodoApuracao,
  formacoes: Record<string, string> = FORMACAO_PADRAO
): GrupoClassificacao[] {
  const ordenados = [...criterios].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const porApresentacao = new Map<string, FichaCalc[]>();
  for (const f of fichas) {
    if (!f.finalizada) continue;
    const lista = porApresentacao.get(f.apresentacao_id) ?? [];
    lista.push(f);
    porApresentacao.set(f.apresentacao_id, lista);
  }

  const grupos = new Map<string, GrupoClassificacao>();
  for (const a of apresentacoes) {
    if (!a.competitiva) continue;
    const porJurado: Record<string, number> = {};
    for (const f of porApresentacao.get(a.id) ?? []) {
      const n = notaDoJurado(f, ordenados, metodo);
      if (n !== null) porJurado[f.avaliador_id] = arred(n);
    }
    const { nota, descartados } = notaFinal(porJurado, metodo);
    const chave = `${a.categoria_id ?? "sem"}|${a.tipo}`;
    const grupo = grupos.get(chave) ?? {
      chave,
      titulo: `${a.categoria} · ${formacoes[a.tipo] ?? a.tipo}`,
      linhas: [],
    };
    grupo.linhas.push({
      apresentacao: a, nota, porJurado, descartados,
      finalizadas: Object.keys(porJurado).length, posicao: null, empatada: false,
    });
    grupos.set(chave, grupo);
  }

  for (const g of grupos.values()) {
    g.linhas.sort((x, y) => {
      if (x.nota === null && y.nota === null) return x.apresentacao.nome.localeCompare(y.apresentacao.nome);
      if (x.nota === null) return 1;
      if (y.nota === null) return -1;
      if (y.nota !== x.nota) return y.nota - x.nota;
      // Empate: vale a ordem definida pela produção (menor primeiro)
      return (x.apresentacao.desempate ?? Infinity) - (y.apresentacao.desempate ?? Infinity);
    });
    let posicao = 0;
    g.linhas.forEach((l, i) => {
      if (l.nota === null) return;
      const anterior = g.linhas[i - 1];
      const mesmaNota = anterior && anterior.nota === l.nota;
      const resolvido = mesmaNota && anterior.apresentacao.desempate !== null && l.apresentacao.desempate !== null
        && anterior.apresentacao.desempate !== l.apresentacao.desempate;
      if (mesmaNota && !resolvido) {
        l.posicao = anterior.posicao;
        l.empatada = true;
        anterior.empatada = true;
      } else {
        posicao = i + 1;
        l.posicao = posicao;
      }
    });
  }

  return [...grupos.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
}
