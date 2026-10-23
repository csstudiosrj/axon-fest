import "server-only";
import sanitizeHtml from "sanitize-html";

// Limpa o HTML dos documentos antes de exibir (só formatação básica e links)

const PERMITIDO: sanitizeHtml.IOptions = {
  allowedTags: ["h2", "h3", "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "blockquote"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: { a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }) },
};

export function limparHtml(html: string | null | undefined): string {
  const texto = html ?? "";
  // Texto puro (sem tags) vira parágrafos
  const comTags = /<[a-z][\s\S]*>/i.test(texto) ? texto : texto.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
  return sanitizeHtml(comTags, PERMITIDO);
}

// Só o texto (para resumos e meta description)
export function textoPuro(html: string | null | undefined): string {
  return sanitizeHtml((html ?? "").replace(/<\/(p|h2|h3|li)>/gi, " "), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}
