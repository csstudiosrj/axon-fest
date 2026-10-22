// Validação de documentos brasileiros (usado no navegador e no servidor)

export const soDigitos = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");

export function cpfValido(valor: string | null | undefined): boolean {
  const d = soDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

export function formatarCpf(valor: string): string {
  const d = soDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

// Idade em anos completos na data de referência (AAAA-MM-DD)
export function idadeEm(nascimento: string | null | undefined, referencia?: string | null): number | null {
  if (!nascimento) return null;
  const [a, m, d] = nascimento.split("-").map(Number);
  const ref = referencia ? new Date(`${referencia}T12:00:00`) : new Date();
  let idade = ref.getFullYear() - a;
  if (ref.getMonth() + 1 < m || (ref.getMonth() + 1 === m && ref.getDate() < d)) idade--;
  return idade;
}
