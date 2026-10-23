import { redirect } from "next/navigation";

// Endereço antigo do assistente de configuração: tudo agora fica em Configurações
export default function CadastroAntigo() {
  redirect("/configuracoes");
}
