// Estrutura fixa do site (menus e links da família ARXUM).
// Valores, taxas e contatos ficam no banco: lib/site/configuracoes.ts

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

