import { redirect } from "next/navigation";
import { exigirAcesso } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ConfigProdutora } from "./ConfigProdutora";

export const dynamic = "force-dynamic";

export default async function PaginaConfiguracoes() {
  const usuario = await exigirAcesso("configuracoes");
  if (!usuario.produtora_id) {
    return <p className="mx-auto max-w-3xl text-sm text-gray-400">Sua conta não está ligada a uma produtora; os dados de cada produtora ficam no Super Admin.</p>;
  }
  const supabase = await createClient();
  const [{ data: produtora }, { data: config }, { data: pdv }] = await Promise.all([
    supabase.from("produtoras").select("id, nome, documento, email, telefone, logo_url, cep, logradouro, numero, complemento, bairro, cidade, estado").eq("id", usuario.produtora_id).maybeSingle(),
    supabase.from("tenant_config").select("termo_legal_texto").eq("produtora_id", usuario.produtora_id).limit(1).maybeSingle(),
    supabase.from("pdv_config").select("pix_chave").eq("produtora_id", usuario.produtora_id).maybeSingle(),
  ]);
  if (!produtora) redirect("/dashboard");

  return (
    <ConfigProdutora
      produtora={produtora}
      termo={config?.termo_legal_texto ?? ""}
      temPix={!!pdv?.pix_chave}
      podeEditar={["admin", "produtora_admin"].includes(usuario.role)}
    />
  );
}
