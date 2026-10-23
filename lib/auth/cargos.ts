// Nome e alcance de cada cargo, como aparecem para o organizador.
// O que cada um pode fazer está em lib/auth/permissoes.ts e é garantido pelo
// banco (RLS) e pelas rotas do servidor.

export const CARGOS: Record<string, { nome: string; alcance: string; cor: string }> = {
  admin: { nome: "Admin", alcance: "Tudo: eventos, inscrições e pagamentos, PDV, equipe, plano e dados da produtora.", cor: "text-axon-gold border-axon-gold/30 bg-axon-gold/10" },
  produtor: { nome: "Produção", alcance: "Eventos, categorias, programação, mídias, jurados, apuração e termos. Não vê valores nem pagamentos.", cor: "text-sky-300 border-sky-400/30 bg-sky-400/10" },
  financeiro: { nome: "Financeiro", alcance: "Inscrições e pagamentos, PDV (produtos, vendas e PIX) e caixa. Não altera o evento.", cor: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  marketing: { nome: "Marketing", alcance: "Página pública do evento (textos, cores, imagens, Instagram), termos e lista de inscritos sem valores.", cor: "text-pink-300 border-pink-400/30 bg-pink-400/10" },
  operador: { nome: "Operador", alcance: "Só o PDV no celular, com o PIN: o caixa (cantina e lojinha) ou a bilheteria, nunca os dois. Entra por /fest/operador.", cor: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
  jurado: { nome: "Jurado", alcance: "Só a avaliação dos eventos para os quais foi escalado.", cor: "text-rose-300 border-rose-400/30 bg-rose-400/10" },
  super_admin: { nome: "Super Admin", alcance: "Dono da plataforma ARXUM Fest.", cor: "text-purple-300 border-purple-400/30 bg-purple-400/10" },
  org_admin: { nome: "Diretor(a)", alcance: "Responsável pelo grupo: inscrições, pagamentos, coreógrafos, elenco e arquivos.", cor: "text-axon-gold border-axon-gold/30 bg-axon-gold/10" },
  org_membro: { nome: "Coreógrafo(a)", alcance: "Cadastra as próprias coreografias, o elenco delas e envia as músicas. Não vê valores.", cor: "text-sky-300 border-sky-400/30 bg-sky-400/10" },
  // nomes antigos
  assistente: { nome: "Financeiro", alcance: "Inscrições e pagamentos, PDV e caixa.", cor: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  produtora_admin: { nome: "Admin", alcance: "Tudo.", cor: "text-axon-gold border-axon-gold/30 bg-axon-gold/10" },
  produtora_staff: { nome: "Produção", alcance: "Eventos e produção.", cor: "text-sky-300 border-sky-400/30 bg-sky-400/10" },
};

export const CARGOS_EQUIPE = ["admin", "produtor", "financeiro", "marketing", "operador", "jurado"] as const;

export const nomeCargo = (role: string) => CARGOS[role]?.nome ?? role;
