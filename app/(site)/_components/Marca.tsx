import Link from "next/link";

// Símbolo ARXUM (Manual de Marca §01) na cor do produto Fest
export function Simbolo({ size = 26, cor = "var(--color-arx-fest)" }: { size?: number; cor?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <polyline points="6,27 12,9 17,20 22,13 28,27" fill="none" stroke={cor} strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="20" r="2.3" fill={cor} />
    </svg>
  );
}

// Logotipo do produto: ARXUM na cor do Fest + "Fest" em branco (Syne só no logotipo)
export function Marca({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label="ARXUM Fest — início">
      <Simbolo />
      <span className="font-logo text-[19px] font-extrabold leading-none tracking-[-0.03em]">
        <span className="text-arx-fest">ARXUM</span> <span className="text-white">Fest</span>
      </span>
    </Link>
  );
}
