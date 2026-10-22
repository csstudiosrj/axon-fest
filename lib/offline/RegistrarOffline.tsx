"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/base-path";

// Registra o service worker e pede que ele guarde a tela atual e todos os
// arquivos já carregados — assim ela abre depois mesmo sem internet.
export function RegistrarOffline() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelado = false;

    navigator.serviceWorker
      .register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` })
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        if (cancelado || !reg.active) return;
        const arquivos = performance
          .getEntriesByType("resource")
          .map((e) => e.name)
          .filter((u) => u.includes(`${BASE_PATH}/_next/static/`));
        reg.active.postMessage({ tipo: "guardar", pagina: location.href, arquivos });
      })
      .catch(() => {});

    return () => { cancelado = true; };
  }, []);

  return null;
}

export async function limparDadosOffline() {
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration(`${BASE_PATH}/`);
    reg?.active?.postMessage({ tipo: "limpar" });
  }
}
