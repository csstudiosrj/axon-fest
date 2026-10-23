import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import { genUploader } from "uploadthing/client";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { apiUrl } from "@/lib/base-path";

// O app roda com basePath (/fest): sem isso o UploadThing chamaria /api/uploadthing na raiz
const url = apiUrl("/api/uploadthing");

export const UploadButton = generateUploadButton<OurFileRouter>({ url });
export const UploadDropzone = generateUploadDropzone<OurFileRouter>({ url });
export const { uploadFiles } = genUploader<OurFileRouter>({ url });

// Erros do UploadThing chegam em inglês; os nossos (middleware) já vêm em português
export function mensagemEnvio(e: unknown, padrao = "Falha no envio do arquivo."): string {
  const msg = e instanceof Error ? e.message : "";
  if (/token|apiKey|UPLOADTHING|missing.*secret/i.test(msg)) return "O envio de arquivos está indisponível no momento (configuração do servidor). Avise o suporte ARXUM.";
  if (/size|too large|FileSizeMismatch|TooLarge/i.test(msg)) return "O arquivo é maior que o tamanho permitido.";
  if (/type|InvalidFileType|not allowed/i.test(msg)) return "Formato de arquivo não aceito.";
  if (/network|fetch|Failed to fetch|timeout/i.test(msg)) return "Sem conexão. Verifique a internet e tente de novo.";
  if (/[áàâãéêíóôõúç]|não|Sem |Usuário/i.test(msg)) return msg;
  return padrao;
}
