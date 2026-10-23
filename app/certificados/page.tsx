import type { Metadata } from "next";
import { BuscaCertificados } from "./BuscaCertificados";

export const metadata: Metadata = { title: "Certificados · ARXUM Fest", description: "Baixe seus certificados de participação nos festivais do ARXUM Fest." };

export default function PaginaCertificados() {
  return <BuscaCertificados />;
}
