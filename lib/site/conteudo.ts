// Dados institucionais e comerciais usados no site. Mude aqui e vale para todas as páginas.

export const CONTATO = {
  email: "fest@arxum.com.br",
  whatsapp: "(21) 96711-9815",
  whatsappLink: "https://wa.me/5521967119815",
};

export const PRECOS = {
  // Taxa de serviço por venda feita no sistema (inscrição, ingresso, loja): % líquido + valor fixo.
  // O festival escolhe absorver ou repassar. Tarifas do meio de pagamento são à parte.
  taxaPercentual: 2,
  taxaFixa: 0.99,
  // Período de uso do plano Start e prazo de guarda dos dados depois dele (meses)
  mesesStart: 3,
  mesesGuarda: 3,
  // Mensalidade do Pro: null enquanto não estiver definida (exibe "Sob consulta")
  mensalidadePro: null as number | null,
};

// Outros produtos da família ARXUM (fora do basePath /fest: links absolutos)
export const PRODUTOS_ARXUM = [
  { nome: "Calc", href: "https://www.arxum.com.br/calculadoras", cor: "#1db954" },
  { nome: "Crew", href: "https://www.arxum.com.br/crew", cor: "#7c3aed" },
  { nome: "Suite", href: "https://www.arxum.com.br/suite", cor: "#dc2626" },
];

export const NAV = [
  { label: "Funcionalidades", href: "/funcionalidades" },
  { label: "Para quem é", href: "/para-quem" },
  { label: "Preços", href: "/precos" },
  { label: "Contato", href: "/contato" },
] as const;

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// "2% + R$ 0,99"
export const TAXA_TEXTO = `${PRECOS.taxaPercentual}% + ${brl(PRECOS.taxaFixa)}`;

// Dados da empresa exibidos nos documentos legais (preencher antes do lançamento)
export const EMPRESA = {
  razaoSocial: "[RAZÃO SOCIAL]",
  cnpj: "[CNPJ]",
  endereco: "[ENDEREÇO COMPLETO]",
  foro: "Rio de Janeiro/RJ",
  emailPrivacidade: "privacidade@arxum.com.br",
  vigencia: "[DATA DE VIGÊNCIA]",
};
