// Documentos de cada evento (regulamento, uso de imagem, autorização de menores).
// O conteúdo é HTML simples escrito no editor do painel e sempre passa por
// limparHtml (lib/termos-html.ts) antes de aparecer em qualquer página.

import { mascaraCpfCnpj } from "./mascaras";

export const TIPOS_TERMO = [
  { tipo: "regulamento", nome: "Regulamento", descricao: "Regras de participação, avaliação e premiação." },
  { tipo: "uso_imagem", nome: "Uso de imagem", descricao: "Cessão de imagem e voz para divulgação." },
  { tipo: "autorizacao_menores", nome: "Autorização de menores", descricao: "Autorização do responsável e declaração de saúde." },
] as const;

export type TipoTermo = (typeof TIPOS_TERMO)[number]["tipo"];

const MODELOS: Record<TipoTermo, string> = {
  regulamento: `<h2>Regulamento Oficial — [NOME DO FESTIVAL]</h2>
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
5.3 A participação no EVENTO representa concordância tácita do participante com todos os termos e condições aqui estipulados.</p>`,
  uso_imagem: `<h2>Termo de Cessão de Uso de Imagem e Voz</h2>
<p><strong>Preâmbulo</strong></p>
<p>Pelo presente instrumento particular, de um lado [NOME DO RESPONSÁVEL OU PARTICIPANTE MAIOR], portador do CPF nº [CPF], doravante denominado CEDENTE, e de outro lado [NOME DA PRODUTORA], pessoa jurídica de direito privado inscrita no CNPJ sob o nº [CNPJ], com sede em [CIDADE/ESTADO], doravante denominada CESSIONÁRIA, resolvem celebrar este TERMO DE CESSÃO DE USO DE IMAGEM E VOZ, que será regido pelas cláusulas seguintes.</p>
<p><strong>CLÁUSULA PRIMEIRA - DO OBJETO</strong></p>
<p>O CEDENTE autoriza, de forma ampla, gratuita e irrevogável, a captação, fixação e utilização de sua imagem corporal, fisionomia, espectro vocal e nome artístico pela CESSIONÁRIA, nos eventos relacionados ao [NOME DO FESTIVAL] e em todas as ações de divulgação dele decorrentes.</p>
<p><strong>CLÁUSULA SEGUNDA - DOS MEIOS DE VEICULAÇÃO</strong></p>
<p>A presente autorização compreende a veiculação em redes sociais da CESSIONÁRIA (Instagram, YouTube, Facebook, TikTok, etc.), sites institucionais, materiais gráficos promocionais de edições futuras, transmissões ao vivo via streaming e em mídias analógicas e digitais, em território nacional e internacional, sem limitação de tempo ou número de exibições.</p>
<p><strong>CLÁUSULA TERCEIRA - DA GRATUIDADE E VIGÊNCIA</strong></p>
<p>O CEDENTE declara expressamente que a cessão ora concedida se dá em caráter de total gratuidade, não fazendo jus a qualquer contraprestação financeira, cachê, royalties, indenização ou remuneração presente ou futura, seja a que título for. Esta cessão tem vigência por prazo indeterminado, em âmbito global, de forma irrevogável e irretratável, não podendo ser revogada mesmo após o término do vínculo do CEDENTE com o EVENTO.</p>
<p><strong>CLÁUSULA QUARTA - DO FORO</strong></p>
<p>As partes elegem o foro da comarca de [CIDADE/ESTADO] para dirimir quaisquer controvérsias oriundas deste instrumento, com exclusão de qualquer outro, por mais privilegiado que seja.</p>`,
  autorizacao_menores: `<h2>Autorização para Menores de Idade e Responsabilidade Médica</h2>
<p><strong>Preâmbulo</strong></p>
<p>Eu, [NOME DO RESPONSÁVEL LEGAL], portador do CPF nº [CPF], RG nº [RG], residente e domiciliado em [ENDEREÇO], na qualidade de representante legal do menor [NOME DO MENOR], inscrito no CPF nº [CPF DO MENOR] ou portador da certidão de nascimento nº [CERTIDÃO], autorizo a participação do referido menor no evento [NOME DO FESTIVAL], organizado por [NOME DA PRODUTORA], e concordo com os termos a seguir.</p>
<p><strong>CLÁUSULA PRIMEIRA - DA PARTICIPAÇÃO</strong></p>
<p>Autorizo o trânsito do menor nas dependências do EVENTO (coxias, palcos, camarins, áreas de ensaio e alimentação) durante os horários determinados pela organização, bem como a participação nos ensaios e apresentações oficiais, desde que acompanhado por profissional da equipe designada ou por mim, quando possível.</p>
<p><strong>CLÁUSULA SEGUNDA - DO ESTADO DE SAÚDE</strong></p>
<p>Declaro, sob as penas da lei (art. 299 do Código Penal), que o menor se encontra em plenas condições de saúde física e mental para a prática de atividades performáticas, não havendo contraindicações médicas conhecidas que o impeçam de participar das coreografias e demais atividades previstas.</p>
<p><strong>CLÁUSULA TERCEIRA - DA RESPONSABILIDADE MÉDICA DE EMERGÊNCIA</strong></p>
<p>Em caso de acidente ou mal súbito durante o EVENTO, outorgo à comissão organizadora plenos poderes de representação para autorizar intervenções médicas, atendimento hospitalar, procedimentos cirúrgicos ou socorros de urgência e emergência que se fizerem necessários, eximindo a produtora de responsabilidade pelos custos decorrentes de tratamentos não cobertos por apólices de seguro eventualmente contratadas.</p>
<p><strong>CLÁUSULA QUARTA - DO USO DE IMAGEM</strong></p>
<p>Autorizo, de forma gratuita, a captação e divulgação de fotos e filmagens do menor exclusivamente no escopo de divulgação do [NOME DO FESTIVAL], conforme termos de cessão de imagem próprios, cuja concordância se confirma por este instrumento.</p>`,
};

// Modelo já preenchido com os dados que o sistema conhece; o que faltar fica entre colchetes
export function modeloTermo(tipo: TipoTermo, dados: { festival: string; produtora: string; documento: string | null; cidade: string | null }) {
  const trocas: Record<string, string | null> = {
    "[NOME DO FESTIVAL]": dados.festival,
    "[NOME DA PRODUTORA]": dados.produtora,
    "[CNPJ]": dados.documento,
    "[CIDADE/ESTADO]": dados.cidade,
  };
  let html = MODELOS[tipo];
  for (const [chave, valor] of Object.entries(trocas)) if (valor) html = html.split(chave).join(valor);
  return html;
}

export interface DadosProdutoraTermo { nome: string; documento: string | null; cidade: string | null; estado: string | null }

// "Cidade/UF" para os modelos (null se a produtora ainda não informou)
export function cidadeUf(p: { cidade: string | null; estado: string | null }): string | null {
  return [p.cidade, p.estado].filter(Boolean).join("/") || null;
}

// Texto base do termo de participação (texto simples), montado com os dados da produtora.
// Aparece pré-preenchido em Configurações e vale enquanto a produtora não salvar um texto próprio.
export function termoParticipacaoBase(p: DadosProdutoraTermo): string {
  const doc = p.documento ? (p.documento.replace(/\D/g, "").length === 14 ? `, inscrita no CNPJ ${mascaraCpfCnpj(p.documento)}` : `, CPF ${mascaraCpfCnpj(p.documento)}`) : "";
  const sede = cidadeUf(p);
  return `TERMO DE PARTICIPAÇÃO

Eu, participante identificado(a) neste cadastro (ou seu responsável legal, quando menor de 18 anos), declaro que:

1. Participo por livre e espontânea vontade dos festivais, mostras e atividades organizados por ${p.nome}${doc}${sede ? `, com sede em ${sede}` : ""}, como integrante do grupo que me cadastrou.

2. Estou em boas condições de saúde e apto(a) à prática das atividades artísticas e físicas envolvidas, assumindo a responsabilidade por informar à organização qualquer restrição médica.

3. Conheço e respeitarei o regulamento de cada festival de que participar, publicado na página oficial do evento.

4. Autorizo o uso dos meus dados cadastrais (nome, CPF, data de nascimento e contato) exclusivamente para inscrição, credenciamento, comunicação, certificados e cumprimento de obrigações legais, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

5. Estou ciente de que posso pedir a correção ou a exclusão dos meus dados a qualquer momento, pelos canais da organização, ressalvados os registros que a lei obriga a guardar.

Esta declaração é assinada eletronicamente, com registro de data, hora e endereço IP, e tem validade nos termos da legislação brasileira.`;
}
