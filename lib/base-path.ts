// basePath do Next (ver next.config.ts). Links e fetch manuais precisam dele:
// o Next só aplica o basePath automaticamente em <Link>, router e redirect().
export const BASE_PATH = "/fest";

export function apiUrl(path: `/${string}`): string {
  return `${BASE_PATH}${path}`;
}

// URL absoluta para links enviados por e-mail.
// NEXT_PUBLIC_APP_URL deve ser só a origem (ex.: https://arxum-fest.vercel.app),
// mas aceitamos também com /fest no final para não quebrar configs antigas.
export function urlAbsoluta(path: `/${string}`): string {
  const origem = (process.env.NEXT_PUBLIC_APP_URL ?? "https://arxum.com.br")
    .replace(/\/+$/, "")
    .replace(new RegExp(`${BASE_PATH}$`), "");
  return `${origem}${BASE_PATH}${path}`;
}
