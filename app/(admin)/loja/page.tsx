import { redirect } from "next/navigation";

// Os produtos (cantina, lojinha e ingressos) e a vitrine na página do evento
// ficam em PDV & Bilheteria. Venda online volta quando o pagamento online existir.
export default function LojaAntiga() {
  redirect("/pdv");
}
