import { preencherCertificado, type DadosCertificado, type ModeloCertificado } from "@/lib/certificados";

// Folha do certificado (A4 deitado). Usada na prévia do painel e na página pública.
export function FolhaCertificado({ modelo, dados, codigo, urlValidacao }: { modelo: ModeloCertificado; dados: DadosCertificado; codigo?: string; urlValidacao?: string }) {
  return (
    <div className="@container mx-auto w-full max-w-[1123px]">
    <div className="folha-certificado relative aspect-[297/210] w-full overflow-hidden bg-white text-gray-900 shadow-2xl print:shadow-none"
      style={modelo.fundo_url ? { backgroundImage: `url(${modelo.fundo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
      {!modelo.fundo_url && <div className="absolute inset-[3%] border-[3px]" style={{ borderColor: modelo.cor }} />}
      <div className="absolute inset-[8%] flex flex-col items-center justify-between text-center">
        <div className="space-y-[2%]">
          <p className="text-[1.6cqw] uppercase tracking-[0.3em]" style={{ color: modelo.cor }}>{dados.produtora}</p>
          <h1 className="font-serif text-[4.2cqw] font-bold leading-tight" style={{ color: modelo.cor }}>{modelo.titulo}</h1>
        </div>
        <p className="max-w-[85%] text-[2.1cqw] leading-relaxed">{preencherCertificado(modelo.texto, dados)}</p>
        <div className="flex w-full flex-wrap items-end justify-center gap-[6%]">
          {modelo.assinaturas.map((a) => (
            <div key={a.nome + a.cargo} className="min-w-[22%] border-t border-gray-500 pt-[0.6cqw] text-[1.4cqw]">
              <p className="font-semibold">{a.nome}</p>
              <p className="text-gray-600">{a.cargo}</p>
            </div>
          ))}
        </div>
      </div>
      {codigo && (
        <p className="absolute bottom-[2.5%] left-0 right-0 text-center text-[1cqw] text-gray-500">
          Código de autenticidade {codigo}{urlValidacao ? ` · confira em ${urlValidacao}` : ""}
        </p>
      )}
    </div>
    </div>
  );
}
