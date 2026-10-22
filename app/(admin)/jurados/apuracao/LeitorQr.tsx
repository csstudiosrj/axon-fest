"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, X } from "lucide-react";
import { lerQuadro, MontadorQuadros } from "@/lib/offline/transferencia";

// Lê a sequência de QR codes do jurado pela câmera (funciona sem internet)
export function LeitorQr({ onCompleto, onFechar }: {
  onCompleto: (r: { evento: string; jurado: string; dados: string }) => void;
  onFechar: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [progresso, setProgresso] = useState<{ recebidos: number; total: number }>({ recebidos: 0, total: 0 });
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let quadroAnim = 0;
    let encerrado = false;
    const montador = new MontadorQuadros();

    const ler = () => {
      if (encerrado) return;
      const v = video.current;
      const c = canvas.current;
      if (v && c && v.readyState === v.HAVE_ENOUGH_DATA) {
        const largura = Math.min(v.videoWidth, 960);
        const altura = Math.round((v.videoHeight / v.videoWidth) * largura);
        c.width = largura;
        c.height = altura;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, largura, altura);
          const img = ctx.getImageData(0, 0, largura, altura);
          const codigo = jsQR(img.data, largura, altura, { inversionAttempts: "dontInvert" });
          const q = codigo ? lerQuadro(codigo.data) : null;
          if (q) {
            montador.adicionar(q);
            setProgresso({ recebidos: montador.recebidos, total: montador.total });
            if (montador.completo) {
              encerrado = true;
              onCompleto({ evento: montador.evento, jurado: montador.jurado, dados: montador.resultado() });
              return;
            }
          }
        }
      }
      quadroAnim = requestAnimationFrame(ler);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        stream = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
        quadroAnim = requestAnimationFrame(ler);
      })
      .catch(() => setErro("Não foi possível acessar a câmera. Autorize o uso da câmera no navegador."));

    return () => {
      encerrado = true;
      cancelAnimationFrame(quadroAnim);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCompleto]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-sm text-white"><Camera size={16} /> Aponte para o QR do jurado</p>
        <button type="button" onClick={onFechar} aria-label="Fechar" className="p-2 text-gray-300 hover:text-white"><X size={22} /></button>
      </div>
      <div className="relative mx-auto mt-4 w-full max-w-[560px] flex-1">
        <video ref={video} playsInline muted className="h-full max-h-[70vh] w-full rounded-xl bg-black object-contain" />
        <canvas ref={canvas} className="hidden" />
      </div>
      <div className="mx-auto mt-4 w-full max-w-[560px]">
        {erro ? (
          <p className="text-sm text-red-300">{erro}</p>
        ) : (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-axon-gold transition-all" style={{ width: `${progresso.total ? (progresso.recebidos / progresso.total) * 100 : 0}%` }} />
            </div>
            <p className="mt-2 text-center text-sm text-gray-300">
              {progresso.total ? `${progresso.recebidos} de ${progresso.total} quadros lidos` : "Procurando QR…"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
