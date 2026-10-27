import Link from "next/link";

// Símbolo do ARXUM Fest: ingresso com estrela (Manual de Marca §01)
export function Simbolo({ size = 26, cor = "var(--color-arx-fest)" }: { size?: number; cor?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5a1.5 1.5 0 0 1 1.5-1.5h13a1.5 1.5 0 0 1 1.5 1.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5Z"
        fill={cor} fillOpacity="0.12" stroke={cor} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m12 9 .9 1.85 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3Z" fill={cor} />
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
