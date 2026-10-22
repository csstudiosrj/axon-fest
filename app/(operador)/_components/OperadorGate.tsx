"use client";

import { useState, createContext, useContext } from "react";
import { Lock, Check } from "lucide-react";
import { apiUrl } from "@/lib/base-path";

// ─── Contexto do PIN ──────────────────────────────────────────────────────────

interface OperadorContextType {
  pinValidado: boolean;
  setPinValidado: (v: boolean) => void;
}

const OperadorContext = createContext<OperadorContextType>({
  pinValidado: false,
  setPinValidado: () => {},
});

export const useOperador = () => useContext(OperadorContext);

// ─── Tela de PIN ──────────────────────────────────────────────────────────────

const PIN_MIN = 4;
const PIN_MAX = 6;

function TelaPIN({ onAutenticado }: { onAutenticado: () => void }) {
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [tentando, setTentando] = useState(false);

  const falhar = (mensagem: string) => {
    setErro(mensagem);
    setTimeout(() => { setPin(""); setTentando(false); }, 800);
  };

  // Validação no servidor: o PIN da produtora não é enviado ao navegador
  const validar = async (pinDigitado: string) => {
    setTentando(true);
    setErro(null);
    try {
      const res = await fetch(apiUrl("/api/operador/pin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinDigitado }),
      });
      if (res.ok) {
        onAutenticado();
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      falhar(json.error ?? "PIN incorreto. Tente novamente.");
    } catch {
      falhar("Erro de conexão. Tente novamente.");
    }
  };

  const handleDigito = (d: string) => {
    if (tentando || pin.length >= PIN_MAX) return;
    setErro(null);
    const novo = pin + d;
    setPin(novo);
    if (novo.length === PIN_MAX) validar(novo);
  };

  const confirmar = () => {
    if (!tentando && pin.length >= PIN_MIN) validar(pin);
  };

  return (
    <div className="fixed inset-0 bg-[#0d0807] flex flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-[#1a1413] border border-[#2e2825] flex items-center justify-center">
          <Lock size={28} className="text-[#C5A059]" />
        </div>
        <h1 className="text-xl font-bold text-white">Acesso ao Operador</h1>
        <p className="text-gray-500 text-sm">Digite o PIN do PDV ({PIN_MIN} a {PIN_MAX} dígitos)</p>
      </div>

      {/* Pontos */}
      <div className="flex gap-4">
        {Array.from({ length: Math.max(PIN_MIN, pin.length) }).map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
            pin.length > i
              ? erro ? "bg-red-500 border-red-500" : "bg-[#C5A059] border-[#C5A059]"
              : "border-[#2e2825]"
          }`} />
        ))}
      </div>

      {erro && <p className="text-red-400 text-sm -mt-4 text-center">{erro}</p>}

      {/* Teclado */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {["1","2","3","4","5","6","7","8","9","⌫","0","ok"].map((d) => (
          <button
            key={d}
            onClick={() => {
              if (d === "⌫") setPin((p) => p.slice(0, -1));
              else if (d === "ok") confirmar();
              else handleDigito(d);
            }}
            disabled={tentando || (d === "ok" && pin.length < PIN_MIN)}
            aria-label={d === "⌫" ? "Apagar" : d === "ok" ? "Confirmar" : d}
            className={`h-16 rounded-2xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center ${
              d === "ok"
                ? "bg-[#C5A059] text-black"
                : d === "⌫"
                ? "bg-[#1a1413] border border-[#2e2825] text-gray-400 hover:text-white"
                : "bg-[#1a1413] border border-[#2e2825] text-white hover:border-[#C5A059] hover:text-[#C5A059]"
            } disabled:opacity-50`}
          >
            {d === "ok" ? <Check size={22} /> : d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

export default function OperadorGate({ children }: { children: React.ReactNode }) {
  const [pinValidado, setPinValidado] = useState(false);

  return (
    <OperadorContext.Provider value={{ pinValidado, setPinValidado }}>
      {pinValidado ? children : <TelaPIN onAutenticado={() => setPinValidado(true)} />}
    </OperadorContext.Provider>
  );
}
