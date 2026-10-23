// Nome e alcance de cada cargo, como aparecem para o organizador.
// O que cada um pode fazer é garantido pelo banco (RLS) e pelas rotas do servidor.

export const CARGOS: Record<string, { nome: string; alcance: string; cor: string }> = {
  admin: { nome: "Admin", alcance: "Tudo: eventos, inscrições, PDV, equipe, plano e dados da produtora.", cor: "text-axon-gold border-axon-gold/30 bg-axon-gold/10" },
  produtor: { nome: "Produtor", alcance: "Configura eventos, categorias, programação, jurados, apuração e PDV. Não gerencia a equipe.", cor: "text-sky-300 border-sky-400/30 bg-sky-400/10" },
  marketing: { nome: "Marketing", alcance: "Acompanha eventos e inscrições, marca pagamentos e confere mídias. Não altera configurações.", cor: "text-pink-300 border-pink-400/30 bg-pink-400/10" },
  assistente: { nome: "Assistente", alcance: "Acompanha eventos e inscrições, marca pagamentos e confere mídias. Não altera configurações.", cor: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  operador: { nome: "Operador", alcance: "Só o caixa e a bilheteria no celular (com o PIN do PDV).", cor: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
  jurado: { nome: "Jurado", alcance: "Só a avaliação dos eventos para os quais foi escalado.", cor: "text-rose-300 border-rose-400/30 bg-rose-400/10" },
  super_admin: { nome: "Super Admin", alcance: "Dono da plataforma ARXUM.", cor: "text-purple-300 border-purple-400/30 bg-purple-400/10" },
};

export const nomeCargo = (role: string) => CARGOS[role]?.nome ?? role;
