// Estrutura fixa do site (menus e links da família ARXUM).
// Valores, taxas e contatos ficam no banco: lib/site/configuracoes.ts

// Outros produtos da família ARXUM (fora do basePath /fest: links absolutos)
export const PRODUTOS_ARXUM = [
  { nome: "Crew", href: "https://www.arxum.com.br/crew", cor: "#8b5cf6" },
  { nome: "Edu", href: "https://www.arxum.com.br/edu", cor: "#0d9488" },
  { nome: "Studio", href: "https://www.arxum.com.br/studio", cor: "#3b82f6" },
  { nome: "Suite", href: "https://www.arxum.com.br/suite", cor: "#ef4444" },
];

export const NAV = [
  { label: "Funcionalidades", href: "/funcionalidades" },
  { label: "Para quem é", href: "/para-quem" },
  { label: "Preços", href: "/precos" },
  { label: "Contato", href: "/contato" },
] as const;

