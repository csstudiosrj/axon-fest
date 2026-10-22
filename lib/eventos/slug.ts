// Endereço público do evento: /e/<slug>

export function slugificar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Slug novo e único na prática: nome + sufixo curto aleatório
export function novoSlug(nome: string) {
  const sufixo = Math.random().toString(36).slice(2, 6);
  return `${slugificar(nome) || "evento"}-${sufixo}`;
}
