"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Campo de senha com o "olho" para mostrar/esconder o que foi digitado
export function CampoSenha({ value, onChange, className, autoComplete = "current-password", name = "password", placeholder, required = true, minLength, id, disabled, ariaLabel }: {
  value: string;
  onChange: (v: string) => void;
  className: string;
  autoComplete?: "current-password" | "new-password";
  name?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  id?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div className="relative">
      <input id={id} name={name} type={mostrar ? "text" : "password"} autoComplete={autoComplete} value={value} required={required} minLength={minLength}
        disabled={disabled} placeholder={placeholder} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)} className={`${className} pr-11`} />
      <button type="button" onClick={() => setMostrar((m) => !m)} tabIndex={-1} aria-label={mostrar ? "Esconder senha" : "Mostrar senha"} title={mostrar ? "Esconder senha" : "Mostrar senha"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:text-white">
        {mostrar ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
