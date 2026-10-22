"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  FileSignature,
  Users,
  Save,
  CheckCircle,
  Shield,
  Info,
  Download,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  AlertTriangle,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { UploadButton } from "@/utils/uploadthing";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Documento {
  id: string;
  tipo: "regulamento" | "uso_imagem" | "autorizacao_menores";
  titulo: string;
  conteudo: string | null;
  versao: number;
  ativo: boolean;
  atualizado_em: string;
  evento_id: string;
  produtora_id: string;
  exibir_publico: boolean;
  formato: "html" | "pdf";
  arquivo_url: string | null;
}

interface ParticipanteStatus {
  id: string;
  nome: string;
  termo_assinado: boolean;
  escola_nome: string;
}

interface Evento {
  id: string;
  nome: string;
}

interface SupabaseParticipanteRow {
  id: string;
  nome: string;
  termo_assinado: boolean | null;
  escola: { nome: string } | { nome: string }[] | null;
}

// ─── Cliente Supabase Global ─────────────────────────────────────────────────

const supabase = createClient();

// ─── Badge de Status ──────────────────────────────────────────────────────────

function BadgeStatus({ assinado }: { assinado: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        assinado
          ? "bg-axon-green/10 text-axon-green border border-axon-green/30"
          : "bg-red-500/10 text-red-400 border border-red-500/30"
      }`}
    >
      {assinado ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
      {assinado ? "Assinado" : "Pendente"}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, visivel }: { msg: string; visivel: boolean }) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-axon-green text-black px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg z-50 transition-all duration-300 ${
        visivel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Check size={16} />
      {msg}
    </div>
  );
}

// ─── Editor de Documento (Rico) ────────────────────────────────────────────────

function DocumentoEditor({
  tipo,
  documento,
  onSalvar,
  salvando,
  eventoId,
  produtoraId,
}: {
  tipo: Documento["tipo"];
  documento: Documento | null;
  onSalvar: (payload: Partial<Documento>) => Promise<void>;
  salvando: boolean;
  eventoId: string;
  produtoraId: string;
}) {
  const [exibirPublico, setExibirPublico] = useState(
    documento?.exibir_publico ?? (tipo === "regulamento" ? true : true)
  );
  const [formato, setFormato] = useState<"html" | "pdf">(
    documento?.formato ?? "html"
  );
  const [conteudoHtml, setConteudoHtml] = useState(
    documento?.conteudo ?? ""
  );
  const [arquivoUrl, setArquivoUrl] = useState(documento?.arquivo_url ?? null);
  const [uploading, setUploading] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (documento) {
      setConteudoHtml(documento.conteudo ?? "");
      setFormato(documento.formato ?? "html");
      setArquivoUrl(documento.arquivo_url ?? null);
      setExibirPublico(
        tipo === "regulamento" ? true : (documento.exibir_publico ?? true)
      );
    } else {
      setConteudoHtml("");
      setFormato("html");
      setArquivoUrl(null);
      setExibirPublico(tipo === "regulamento" ? true : true);
    }
  }, [documento, tipo]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== conteudoHtml) {
      editorRef.current.innerHTML = conteudoHtml;
    }
  }, [conteudoHtml]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setConteudoHtml(editorRef.current.innerHTML);
    }
  }, []);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleCarregarModelo = () => {
    let modelo = "";
    if (tipo === "regulamento") {
      modelo = `<h2>Regulamento Oficial do Festival [NOME DO FESTIVAL]</h2>
<p><strong>Preâmbulo</strong></p>
<p>O [NOME DO FESTIVAL], doravante denominado EVENTO, é organizado por [NOME DA PRODUTORA], inscrita no CNPJ sob o nº [CNPJ], com sede em [CIDADE/ESTADO], e tem por objetivo fomentar a produção artística e cultural por meio de competição de dança, música ou teatro, sem qualquer subordinação a sorteios ou modalidades de captação de recursos que dependam de autorização do Poder Público.</p>
<p><strong>CLÁUSULA PRIMEIRA - DO OBJETO</strong></p>
<p>O presente Regulamento estabelece as normas e condições de participação no EVENTO, visando garantir a isonomia entre os participantes, a transparência nas avaliações e a observância aos princípios legais.</p>
<p><strong>CLÁUSULA SEGUNDA - DAS INSCRIÇÕES</strong></p>
<p>2.1 Podem inscrever-se grupos, companhias, escolas de dança, academias e artistas independentes, respeitando os limites de faixa etária definidos na ficha técnica.<br>
2.2 As inscrições serão efetuadas exclusivamente pela plataforma oficial, mediante preenchimento completo da ficha de inscrição, upload dos arquivos de áudio e, quando couber, comprovante de pagamento.<br>
2.3 O ato de inscrição implica a aceitação integral deste Regulamento e a declaração de titularidade ou autorização para uso das obras musicais e coreográficas apresentadas, isentando a organização de eventuais reclamações de terceiros relativas a direitos autorais.</p>
<p><strong>CLÁUSULA TERCEIRA - DA CURADORIA E JÚRI</strong></p>
<p>3.1 O corpo de jurados será composto por profissionais de notório saber nas áreas de dança, música e expressão corporal, cuja indicação e identidade serão divulgadas pela Organização.<br>
3.2 As decisões do júri são soberanas, irrecorríveis e pautadas em critérios de originalidade, técnica, figurino, interpretação e conceito artístico, não cabendo qualquer recurso administrativo ou judicial contra seus vereditos.</p>
<p><strong>CLÁUSULA QUARTA - DAS PREMIAÇÕES</strong></p>
<p>4.1 Os prêmios serão entregues conforme divulgação prévia no site oficial.<br>
4.2 Sobre os valores em dinheiro eventualmente concedidos, incidirão os tributos federais e estaduais previstos em lei, sendo a Organização autorizada a proceder as retenções e recolhimentos exigidos.<br>
4.3 A constatação de fraude, plágio ou qualquer conduta que viole o espírito artístico do EVENTO acarretará a desclassificação sumária do participante e a perda de qualquer premiação já concedida.</p>
<p><strong>CLÁUSULA QUINTA - DAS DISPOSIÇÕES GERAIS</strong></p>
<p>5.1 A Organização reserva-se o direito de transmitir, gravar e divulgar as apresentações por qualquer meio (televisão, rádio, internet, streaming) sem que isso gere direito a remuneração adicional aos participantes.<br>
5.2 Fica eleito o foro da comarca de [CIDADE/ESTADO] para dirimir quaisquer dúvidas ou controvérsias decorrentes deste Regulamento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.<br>
5.3 A participação no EVENTO representa concordância tácita do participante com todos os termos e condições aqui estipulados.</p>`;
    } else if (tipo === "uso_imagem") {
      modelo = `<h2>Termo de Cessão de Uso de Imagem e Voz</h2>
<p><strong>Preâmbulo</strong></p>
<p>Pelo presente instrumento particular, de um lado [NOME DO RESPONSÁVEL OU PARTICIPANTE MAIOR], portador do CPF nº [CPF], doravante denominado CEDENTE, e de outro lado [NOME DA PRODUTORA], pessoa jurídica de direito privado inscrita no CNPJ sob o nº [CNPJ], com sede em [CIDADE/ESTADO], doravante denominada CESSIONÁRIA, resolvem celebrar este TERMO DE CESSÃO DE USO DE IMAGEM E VOZ, que será regido pelas cláusulas seguintes.</p>
<p><strong>CLÁUSULA PRIMEIRA - DO OBJETO</strong></p>
<p>O CEDENTE autoriza, de forma ampla, gratuita e irrevogável, a captação, fixação e utilização de sua imagem corporal, fisionomia, espectro vocal e nome artístico pela CESSIONÁRIA, nos eventos relacionados ao [NOME DO FESTIVAL] e em todas as ações de divulgação dele decorrentes.</p>
<p><strong>CLÁUSULA SEGUNDA - DOS MEIOS DE VEICULAÇÃO</strong></p>
<p>A presente autorização compreende a veiculação em redes sociais da CESSIONÁRIA (Instagram, YouTube, Facebook, TikTok, etc.), sites institucionais, materiais gráficos promocionais de edições futuras, transmissões ao vivo via streaming e em mídias analógicas e digitais, em território nacional e internacional, sem limitação de tempo ou número de exibições.</p>
<p><strong>CLÁUSULA TERCEIRA - DA GRATUIDADE E VIGÊNCIA</strong></p>
<p>O CEDENTE declara expressamente que a cessão ora concedida se dá em caráter de total gratuidade, não fazendo jus a qualquer contraprestação financeira, cachê, royalties, indenização ou remuneração presente ou futura, seja a que título for. Esta cessão tem vigência por prazo indeterminado, em âmbito global, de forma irrevogável e irretratável, não podendo ser revogada mesmo após o término do vínculo do CEDENTE com o EVENTO.</p>
<p><strong>CLÁUSULA QUARTA - DO FORO</strong></p>
<p>As partes elegem o foro da comarca de [CIDADE/ESTADO] para dirimir quaisquer controvérsias oriundas deste instrumento, com exclusão de qualquer outro, por mais privilegiado que seja.</p>`;
    } else if (tipo === "autorizacao_menores") {
      modelo = `<h2>Autorização para Menores de Idade e Responsabilidade Médica</h2>
<p><strong>Preâmbulo</strong></p>
<p>Eu, [NOME DO RESPONSÁVEL LEGAL], portador do CPF nº [CPF], RG nº [RG], residente e domiciliado em [ENDEREÇO], na qualidade de representante legal do menor [NOME DO MENOR], inscrito no CPF nº [CPF DO MENOR] ou portador da certidão de nascimento nº [CERTIDÃO], autorizo a participação do referido menor no evento [NOME DO FESTIVAL], organizado por [NOME DA PRODUTORA], e concordo com os termos a seguir.</p>
<p><strong>CLÁUSULA PRIMEIRA - DA PARTICIPAÇÃO</strong></p>
<p>Autorizo o trânsito do menor nas dependências do EVENTO (coxias, palcos, camarins, áreas de ensaio e alimentação) durante os horários determinados pela organização, bem como a participação nos ensaios e apresentações oficiais, desde que acompanhado por profissional da equipe designada ou por mim, quando possível.</p>
<p><strong>CLÁUSULA SEGUNDA - DO ESTADO DE SAÚDE</strong></p>
<p>Declaro, sob as penas da lei (art. 299 do Código Penal), que o menor se encontra em plenas condições de saúde física e mental para a prática de atividades performáticas, não havendo contraindicações médicas conhecidas que o impeçam de participar das coreografias e demais atividades previstas.</p>
<p><strong>CLÁUSULA TERCEIRA - DA RESPONSABILIDADE MÉDICA DE EMERGÊNCIA</strong></p>
<p>Em caso de acidente ou mal súbito durante o EVENTO, outorgo à comissão organizadora plenos poderes de representação para autorizar intervenções médicas, atendimento hospitalar, procedimentos cirúrgicos ou socorros de urgência e emergência que se fizerem necessários, eximindo a produtora de responsabilidade pelos custos decorrentes de tratamentos não cobertos por apólices de seguro eventualmente contratadas.</p>
<p><strong>CLÁUSULA QUARTA - DO USO DE IMAGEM</strong></p>
<p>Autorizo, de forma gratuita, a captação e divulgação de fotos e filmagens do menor exclusivamente no escopo de divulgação do [NOME DO FESTIVAL], conforme termos de cessão de imagem próprios, cuja concordância se confirma por este instrumento.</p>`;
    }
    setConteudoHtml(modelo);
  };

  const handleBaixarPdf = () => {
    const content = conteudoHtml;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${tipo === "regulamento" ? "Regulamento" : tipo === "uso_imagem" ? "Uso de Imagem" : "Autorização de Menores"}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              h2 { margin-top: 0; }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const handleSalvar = async () => {
    const payload = {
      tipo,
      titulo:
        tipo === "regulamento"
          ? "Regulamento do Festival"
          : tipo === "uso_imagem"
          ? "Termo de Uso de Imagem"
          : "Autorização para Menores de Idade",
      conteudo: formato === "html" ? conteudoHtml : null,
      formato,
      arquivo_url: formato === "pdf" ? arquivoUrl : null,
      exibir_publico: tipo === "regulamento" ? true : exibirPublico,
      evento_id: eventoId,
      produtora_id: produtoraId,
      ativo: true,
    };
    await onSalvar(payload);
  };

  return (
    <div className="space-y-6">
      {/* Info Legal */}
      <div className="bg-axon-bg border border-axon-border rounded-xl p-4 flex items-start gap-3">
        <Shield size={20} className="text-axon-green mt-0.5 shrink-0" />
        <p className="text-sm text-gray-300">
          A assinatura digital tem validade jurídica (MP 2.200-2/2001). O sistema
          registra IP, Data, Hora e o Aceite do usuário no momento da inscrição.
        </p>
      </div>

      {/* Toggles de Configuração */}
      <div className="space-y-3">
        {tipo !== "regulamento" && (
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-neutral-300">Exibir na Página Pública</span>
            <button
              onClick={() => setExibirPublico((p) => !p)}
              className="text-axon-gold"
              aria-label="Toggle exibição pública"
            >
              {exibirPublico ? (
                <ToggleRight size={26} />
              ) : (
                <ToggleLeft size={26} className="text-neutral-600" />
              )}
            </button>
          </label>
        )}

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-neutral-300">Formato do Documento</span>
          <button
            onClick={() => setFormato((f) => (f === "html" ? "pdf" : "html"))}
            className="text-axon-gold"
          >
            {formato === "html" ? (
              <ToggleRight size={26} />
            ) : (
              <ToggleLeft size={26} className="text-neutral-600" />
            )}
          </button>
        </label>
        <p className="text-xs text-neutral-500">
          {formato === "html"
            ? "Criar no Editor"
            : "Fazer Upload de PDF"}
        </p>
      </div>

      {/* Conteúdo conforme formato */}
      {formato === "html" ? (
        <>
          {/* Barra de Ferramentas */}
          <div className="flex items-center gap-1 p-2 bg-axon-bg border border-axon-border rounded-lg flex-wrap">
            <button
              onClick={() => execCommand("bold")}
              className="p-2 hover:bg-axon-panel rounded text-neutral-400 hover:text-white"
              title="Negrito"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => execCommand("italic")}
              className="p-2 hover:bg-axon-panel rounded text-neutral-400 hover:text-white"
              title="Itálico"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => execCommand("underline")}
              className="p-2 hover:bg-axon-panel rounded text-neutral-400 hover:text-white"
              title="Sublinhado"
            >
              <Underline size={16} />
            </button>
            <div className="w-px h-6 bg-axon-border mx-1" />
            <button
              onClick={() => execCommand("insertUnorderedList")}
              className="p-2 hover:bg-axon-panel rounded text-neutral-400 hover:text-white"
              title="Lista"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => execCommand("justifyLeft")}
              className="p-2 hover:bg-axon-panel rounded text-neutral-400 hover:text-white"
              title="Alinhar à esquerda"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => execCommand("justifyCenter")}
              className="p-2 hover:bg-axon-panel rounded text-neutral-400 hover:text-white"
              title="Centralizar"
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={() => execCommand("justifyRight")}
              className="p-2 hover:bg-axon-panel rounded text-neutral-400 hover:text-white"
              title="Alinhar à direita"
            >
              <AlignRight size={16} />
            </button>
          </div>

          {/* Editor (corrigido: sem placeholder) */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="min-h-[300px] bg-axon-bg border border-axon-border rounded-xl p-4 text-gray-300 focus:outline-none focus:border-axon-green text-sm leading-relaxed"
            suppressContentEditableWarning
          />

          {/* Botões auxiliares */}
          <div className="flex gap-3">
            <button
              onClick={handleCarregarModelo}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-axon-border text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <FileText size={14} />
              Carregar Modelo Padrão
            </button>
            <button
              onClick={handleBaixarPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-axon-border text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <Download size={14} />
              Baixar como PDF
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-neutral-500">
            Faça o upload do documento em PDF. O arquivo ficará disponível para
            download e visualização pública (se ativado).
          </p>
          {!arquivoUrl ? (
            <UploadButton
              endpoint="imageUploader"
              appearance={{
                button:
                  "ut-ready:bg-axon-panel ut-ready:border ut-ready:border-axon-border ut-ready:text-white ut-ready:hover:bg-axon-gold/20 ut-uploading:bg-axon-panel/80 w-full overflow-hidden truncate px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer",
                allowedContent: "hidden",
              }}
              content={{
                button({ ready }) {
                  if (uploading) return "Enviando PDF...";
                  return ready ? "Selecionar PDF" : "Preparando...";
                },
              }}
              onClientUploadComplete={(res) => {
                setArquivoUrl(res?.[0]?.ufsUrl ?? res?.[0]?.url ?? null);
                setUploading(false);
              }}
              onUploadError={(error) => {
                alert(`Erro no upload: ${error.message}`);
                setUploading(false);
              }}
              onUploadBegin={() => setUploading(true)}
            />
          ) : (
            <div className="flex items-center gap-3 bg-axon-bg border border-axon-border rounded-lg p-3">
              <FileText size={16} className="text-axon-green" />
              <a
                href={arquivoUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-axon-green underline truncate"
              >
                {arquivoUrl}
              </a>
              <button
                onClick={() => setArquivoUrl(null)}
                className="ml-auto text-neutral-500 hover:text-red-400 transition-colors"
              >
                <CheckCircle size={14} /> Remover
              </button>
            </div>
          )}
        </div>
      )}

      {/* Botão Salvar */}
      <button
        onClick={handleSalvar}
        disabled={salvando || uploading}
        className="flex items-center gap-2 bg-axon-green text-black px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#00c866] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Save size={16} />
        {salvando ? "Salvando..." : "Salvar Documento"}
      </button>
    </div>
  );
}

// ─── Aba Status de Assinaturas ────────────────────────────────────────────────

function StatusAssinaturas({
  eventoId,
  produtoraId,
}: {
  eventoId: string;
  produtoraId: string;
}) {
  const [participantes, setParticipantes] = useState<ParticipanteStatus[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!eventoId) return;
    setCarregando(true);
    supabase
      .from("participantes")
      .select("id, nome: nome_completo, termo_assinado, escola:escolas(nome)")
      .eq("festival_id", eventoId)
      .eq("produtora_id", produtoraId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data as unknown as SupabaseParticipanteRow[]) ?? [];
        const status: ParticipanteStatus[] = rows.map((p) => {
          const escolaData = Array.isArray(p.escola) ? p.escola[0] : p.escola;
          const escola_nome = escolaData?.nome ?? "—";
          return {
            id: p.id,
            nome: p.nome,
            termo_assinado: p.termo_assinado ?? false,
            escola_nome,
          };
        });
        setParticipantes(status);
        setCarregando(false);
      });
  }, [eventoId, produtoraId]);

  const filtrados = participantes.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.escola_nome.toLowerCase().includes(busca.toLowerCase())
  );

  const total = participantes.length;
  const assinados = participantes.filter((p) => p.termo_assinado).length;
  const pendentes = total - assinados;

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", valor: total, cor: "text-white" },
          { label: "Assinados", valor: assinados, cor: "text-axon-green" },
          { label: "Pendentes", valor: pendentes, cor: "text-red-400" },
        ].map(({ label, valor, cor }) => (
          <div
            key={label}
            className="bg-axon-bg border border-axon-border rounded-xl p-4 text-center"
          >
            <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <input
        type="text"
        placeholder="Buscar participante ou escola..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-axon-green placeholder:text-gray-600"
      />

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-neutral-600" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
          <Users size={36} className="opacity-30" />
          <p className="text-sm">
            {participantes.length === 0
              ? "Nenhum participante inscrito neste evento."
              : "Nenhum resultado encontrado."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-axon-bg border border-axon-border rounded-xl px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.nome}</p>
                <p className="text-xs text-gray-500">{p.escola_nome}</p>
              </div>
              <div className="shrink-0 ml-4">
                <BadgeStatus assinado={p.termo_assinado} />
              </div>
            </div>
          ))}
        </div>
      )}

      {pendentes > 0 && (
        <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-500/80">
            <strong className="text-yellow-400">{pendentes} participante{pendentes > 1 ? "s" : ""}</strong>{" "}
            com termo pendente. É possível liberar a credencial somente após a assinatura.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function TermosPage() {
  const [produtoraId, setProdutoraId] = useState<string>("");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<string>("");
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<"regulamento" | "uso_imagem" | "autorizacao_menores" | "status">("regulamento");
  const [salvando, setSalvando] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisivel, setToastVisivel] = useState(false);
  const [carregandoPagina, setCarregandoPagina] = useState(true);

  // Buscar produtora do usuário
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("produtora_id")
        .eq("id", user.id)
        .single();
      if (usuario?.produtora_id) {
        setProdutoraId(usuario.produtora_id);
      }
    })();
  }, []);

  // Buscar eventos da produtora
  useEffect(() => {
    if (!produtoraId) return;
    supabase
      .from("eventos")
      .select("id, nome")
      .eq("produtora_id", produtoraId)
      .order("data_inicio", { ascending: false })
      .then(({ data }) => {
        if (data) setEventos(data as Evento[]);
        setCarregandoPagina(false);
      });
  }, [produtoraId]);

  // Carregar documentos do evento selecionado
  useEffect(() => {
    if (!produtoraId || !eventoSelecionadoId) return;
    supabase
      .from("termos_documentos")
      .select("*")
      .eq("produtora_id", produtoraId)
      .eq("evento_id", eventoSelecionadoId)
      .order("created_at")
      .then(({ data }) => {
        setDocumentos((data as Documento[]) ?? []);
      });
  }, [produtoraId, eventoSelecionadoId]);

  const mostrarToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisivel(true);
    setTimeout(() => setToastVisivel(false), 2500);
  };

  const onSalvarDocumento = async (payload: Partial<Documento>) => {
    if (!eventoSelecionadoId || !produtoraId) return;
    setSalvando(true);

    const existente = documentos.find(
      (d) => d.tipo === payload.tipo && d.evento_id === eventoSelecionadoId
    );

    const dataPayload = {
      ...payload,
      evento_id: eventoSelecionadoId,
      produtora_id: produtoraId,
      atualizado_em: new Date().toISOString(),
      ativo: true,
    };

    let savedRecord: Documento | null = null;

    if (existente) {
      const { data, error } = await supabase
        .from("termos_documentos")
        .update({
          ...dataPayload,
          versao: existente.versao + 1,
        })
        .eq("id", existente.id)
        .select()
        .single();
      if (!error && data) savedRecord = data as Documento;
    } else {
      const { data, error } = await supabase
        .from("termos_documentos")
        .insert({
          ...dataPayload,
          versao: 1,
        })
        .select()
        .single();
      if (!error && data) savedRecord = data as Documento;
    }

    setSalvando(false);

    if (savedRecord) {
      mostrarToast("Documento salvo com sucesso!");
      setDocumentos((prev) => {
        const others = prev.filter(
          (d) => !(d.tipo === savedRecord.tipo && d.evento_id === eventoSelecionadoId)
        );
        return [...others, savedRecord];
      });
    } else {
      alert("Erro ao salvar documento. Tente novamente.");
    }
  };

  const getDocumentoByTipo = (tipo: Documento["tipo"]) =>
    documentos.find((d) => d.tipo === tipo) ?? null;

  const abas = [
    { id: "regulamento" as const, label: "Regulamento", icon: FileText },
    { id: "uso_imagem" as const, label: "Uso de Imagem", icon: FileSignature },
    { id: "autorizacao_menores" as const, label: "Autorização de Menores", icon: FileSignature },
    { id: "status" as const, label: "Status de Assinaturas", icon: Users },
  ];

  if (!produtoraId || carregandoPagina) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-neutral-600" />
      </div>
    );
  }

  return (
    <>
      <Toast msg={toastMsg} visivel={toastVisivel} />

      <div className="max-w-5xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Termos & Contratos</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Gestão dos documentos jurídicos vinculados ao evento — blindagem legal do festival.
          </p>
        </div>

        {/* Seletor de Evento */}
        <div>
          <label className="text-sm text-neutral-400 mb-2 block">Selecione o evento</label>
          <select
            value={eventoSelecionadoId}
            onChange={(e) => setEventoSelecionadoId(e.target.value)}
            className="w-full md:w-80 bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-axon-gold"
          >
            <option value="" disabled>
              Escolha um evento...
            </option>
            {eventos.map((evento) => (
              <option key={evento.id} value={evento.id}>
                {evento.nome}
              </option>
            ))}
          </select>
          {eventos.length === 0 && (
            <p className="text-xs text-neutral-600 mt-2">
              Nenhum evento cadastrado para sua produtora.
            </p>
          )}
        </div>

        {/* Card principal */}
        {eventoSelecionadoId ? (
          <div className="bg-axon-panel border border-axon-border rounded-2xl overflow-hidden">
            {/* Abas */}
            <div className="flex border-b border-axon-border px-4 overflow-x-auto">
              {abas.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setAbaAtiva(id)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    abaAtiva === id
                      ? "border-axon-green text-axon-green"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {id === "status" && (
                    <span className="ml-1 bg-red-500/20 text-red-400 text-xs font-bold px-1.5 py-0.5 rounded-full border border-red-500/30">
                      {documentos.length === 0 ? 0 : "?"}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              {abaAtiva === "status" ? (
                <StatusAssinaturas
                  eventoId={eventoSelecionadoId}
                  produtoraId={produtoraId}
                />
              ) : (
                <DocumentoEditor
                  tipo={abaAtiva}
                  documento={getDocumentoByTipo(abaAtiva)}
                  onSalvar={onSalvarDocumento}
                  salvando={salvando}
                  eventoId={eventoSelecionadoId}
                  produtoraId={produtoraId}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-axon-panel border border-axon-border rounded-2xl p-12 text-center">
            <Info size={36} className="mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-500 text-sm">
              Selecione um evento para começar a configurar os termos e acompanhar as assinaturas.
            </p>
          </div>
        )}
      </div>
    </>
  );
}