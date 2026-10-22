import type { Metadata } from "next";
import Link from "next/link";
import { brl, obterConfiguracoes, ouPendente, type Configuracoes } from "@/lib/site/configuracoes";
import { DocumentoLegal, type SecaoLegal } from "../_components/DocumentoLegal";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Condições de uso da plataforma ARXUM Fest por produtoras, equipes, grupos, participantes, jurados e compradores.",
};

function secoes({ precos: PRECOS, contato: CONTATO, empresa: EMPRESA, taxaTexto: TAXA_TEXTO }: Configuracoes): SecaoLegal[] {
  return [
  {
    id: "definicoes",
    titulo: "Definições",
    conteudo: (
      <ul>
        <li><strong>Plataforma:</strong> o sistema ARXUM Fest, acessível em arxum.com.br/fest, incluindo páginas públicas, painéis e aplicações para celular.</li>
        <li><strong>ARXUM:</strong> {ouPendente(EMPRESA.razaoSocial)}, inscrita no CNPJ sob o nº {ouPendente(EMPRESA.cnpj)}, com sede em {ouPendente(EMPRESA.endereco)}.</li>
        <li><strong>Produtora:</strong> pessoa física ou jurídica que cria uma conta para organizar festivais, mostras ou eventos na Plataforma.</li>
        <li><strong>Equipe:</strong> pessoas convidadas pela Produtora para operar a conta (administradores, produtores, marketing, assistentes, operadores de caixa e jurados).</li>
        <li><strong>Grupo:</strong> escola, companhia, banda ou coletivo que se inscreve em eventos de uma Produtora.</li>
        <li><strong>Participante:</strong> pessoa vinculada a um Grupo (artista, técnico, coreógrafo etc.).</li>
        <li><strong>Comprador:</strong> quem paga, pela Plataforma, por inscrições, ingressos ou produtos.</li>
        <li><strong>Venda:</strong> cada transação paga online por meio da Plataforma.</li>
      </ul>
    ),
  },
  {
    id: "aceite",
    titulo: "Aceite e capacidade",
    conteudo: (
      <>
        <p>Ao criar uma conta, aceitar um convite ou concluir uma compra, você declara ter lido e concordado com estes Termos e com a <Link href="/privacidade">Política de Privacidade</Link>.</p>
        <p>Para criar conta é necessário ter 18 anos ou mais. Participantes menores de idade só podem ser cadastrados com a autorização do responsável legal, colhida pela própria Plataforma.</p>
        <p>Quem aceita estes Termos em nome de uma empresa declara ter poderes para representá-la.</p>
      </>
    ),
  },
  {
    id: "contas",
    titulo: "Contas e acessos",
    conteudo: (
      <>
        <p>Cada pessoa usa o próprio login. É proibido compartilhar senhas, PINs de caixa ou chaves de transferência de notas.</p>
        <p>A Produtora é responsável pelos acessos que concede à sua Equipe e deve removê-los quando a pessoa deixar de atuar no evento.</p>
        <p>Comunique imediatamente a ARXUM em caso de suspeita de uso indevido da conta.</p>
      </>
    ),
  },
  {
    id: "planos",
    titulo: "Planos Start e Pro",
    conteudo: (
      <>
        <p><strong>Start (gratuito):</strong> acesso a todos os módulos por {PRECOS.mesesStart} meses contados da criação da conta. Encerrado esse prazo sem assinatura do Pro:</p>
        <ol>
          <li>a conta passa a <strong>modo leitura</strong> por mais {PRECOS.mesesGuarda} meses — os dados podem ser consultados, mas não criados ou alterados, e novas vendas ficam suspensas;</li>
          <li>ao fim desse período, os dados da Produtora são <strong>excluídos de forma definitiva</strong>, ressalvadas as informações que a ARXUM deva manter por obrigação legal (veja a Política de Privacidade).</li>
        </ol>
        <p>A ARXUM avisará por e-mail antes de cada mudança de situação da conta.</p>
        <p><strong>Pro (assinatura mensal):</strong> mantém a conta ativa e os dados guardados enquanto a assinatura estiver em dia. O valor vigente é informado antes da contratação. A assinatura pode ser cancelada a qualquer momento, sem multa; após o cancelamento, aplica-se o ciclo de modo leitura e exclusão descrito acima.</p>
      </>
    ),
  },
  {
    id: "pagamentos",
    titulo: "Vendas, taxas e repasses",
    conteudo: (
      <>
        <p>As Vendas são processadas por instituição de pagamento parceira, que divide automaticamente cada valor entre a Produtora e a ARXUM (split de pagamento). A ARXUM não guarda o dinheiro da Produtora.</p>
        <p><strong>Taxa de serviço:</strong> {TAXA_TEXTO} por Venda, líquidos para a ARXUM, independentemente do valor praticado pela Produtora.</p>
        <p><strong>Tarifas do meio de pagamento</strong> (PIX, cartão, parcelamento) são cobradas pela instituição parceira e informadas no momento da configuração do recebimento.</p>
        <p>Para cada evento, a Produtora escolhe se a taxa de serviço e as tarifas são <strong>repassadas ao Comprador</strong> (somadas ao preço) ou <strong>absorvidas</strong> (descontadas do repasse).</p>
        <p>Os prazos de repasse seguem as regras da instituição de pagamento. A Produtora deve manter dados cadastrais e bancários corretos e completar a verificação de identidade exigida pela instituição.</p>
        <p><strong>Vendas no caixa do evento</strong> (dinheiro, maquininha própria ou PIX direto para a Produtora) não passam pela instituição de pagamento. Sobre o total registrado no caixa em cada mês incide taxa de {PRECOS.caixaPercentual}%, cobrada em fatura mensal. Nos meses em que o total for inferior a {brl(PRECOS.caixaIsencaoAte)}, não há cobrança.</p>
      </>
    ),
  },
  {
    id: "cancelamentos",
    titulo: "Cancelamentos, reembolsos e contestações",
    conteudo: (
      <>
        <p>A política de cancelamento e reembolso de cada evento é definida pela Produtora, que deve publicá-la na página do evento e cumpri-la, observado o Código de Defesa do Consumidor.</p>
        <p>Em reembolsos, a taxa de serviço da ARXUM e as tarifas do meio de pagamento não são devolvidas à Produtora, salvo falha da Plataforma.</p>
        <p>Contestações (chargebacks) são debitadas da Produtora conforme as regras da instituição de pagamento. A Produtora deve fornecer comprovantes de entrega do serviço quando solicitada.</p>
        <p>Se o evento for cancelado ou adiado, a Produtora é a única responsável pelo atendimento e pelo reembolso aos Compradores.</p>
      </>
    ),
  },
  {
    id: "responsabilidades-produtora",
    titulo: "Responsabilidades da Produtora",
    conteudo: (
      <ul>
        <li>Realizar o evento conforme anunciado e responder a Grupos, Participantes e Compradores.</li>
        <li>Publicar regulamento, valores, critérios de avaliação e política de reembolso claros.</li>
        <li>Tratar os dados pessoais recebidos pela Plataforma apenas para a organização do evento, na condição de <strong>controladora</strong> desses dados (Lei nº 13.709/2018 — LGPD).</li>
        <li>Garantir que termos de imagem e autorizações de menores sejam adequados ao evento.</li>
        <li>Obter as licenças, alvarás e autorizações exigidas para o evento, inclusive de direitos autorais das trilhas executadas.</li>
        <li>Emitir os documentos fiscais devidos sobre as próprias vendas.</li>
      </ul>
    ),
  },
  {
    id: "responsabilidades-usuarios",
    titulo: "Grupos, Participantes e jurados",
    conteudo: (
      <>
        <p>Grupos são responsáveis pela veracidade das informações e pelos arquivos que enviam (trilhas, mapas de luz, imagens), declarando ter os direitos necessários para seu uso no evento.</p>
        <p>Participantes e responsáveis legais assinam termos digitalmente. A assinatura registra nome, documento, data, hora, endereço IP e navegador, com o mesmo valor de uma assinatura eletrônica simples (MP nº 2.200-2/2001, art. 10, §2º).</p>
        <p>Jurados se comprometem a avaliar com imparcialidade, a manter sigilo sobre as notas até a divulgação oficial e a não compartilhar o dispositivo ou as chaves de transferência de notas.</p>
      </>
    ),
  },
  {
    id: "uso-proibido",
    titulo: "Usos proibidos",
    conteudo: (
      <ul>
        <li>Publicar eventos falsos, enganosos ou que violem a lei.</li>
        <li>Usar dados de Participantes para fins alheios ao evento, como venda de cadastros ou publicidade não autorizada.</li>
        <li>Tentar acessar dados de outras Produtoras, burlar limites técnicos, fazer engenharia reversa ou sobrecarregar a Plataforma.</li>
        <li>Enviar conteúdo ilícito, ofensivo ou que viole direitos de terceiros.</li>
      </ul>
    ),
  },
  {
    id: "disponibilidade",
    titulo: "Disponibilidade e funcionamento offline",
    conteudo: (
      <>
        <p>A ARXUM trabalha para manter a Plataforma disponível de forma contínua, mas podem ocorrer interrupções por manutenção, falhas de terceiros ou de conexão.</p>
        <p>Os módulos de caixa, avaliação de jurados e mídias funcionam sem internet a partir de dados baixados previamente no aparelho. A Produtora deve preparar os aparelhos antes do evento e sincronizá-los ao fim; dados mantidos apenas no aparelho podem se perder se ele for danificado, reiniciado de fábrica ou tiver os dados do navegador apagados antes da sincronização.</p>
      </>
    ),
  },
  {
    id: "propriedade",
    titulo: "Propriedade intelectual",
    conteudo: (
      <>
        <p>A Plataforma, sua marca, código e interfaces pertencem à ARXUM. Este contrato concede uma licença de uso pessoal, não exclusiva e intransferível enquanto a conta estiver ativa.</p>
        <p>Os conteúdos enviados pelos usuários continuam sendo de seus titulares. A ARXUM os utiliza apenas para operar a Plataforma e, no caso de páginas públicas de eventos, para exibi-los conforme configurado pela Produtora.</p>
      </>
    ),
  },
  {
    id: "limitacao",
    titulo: "Limitação de responsabilidade",
    conteudo: (
      <>
        <p>A ARXUM fornece a ferramenta e não organiza, produz ou garante a realização dos eventos. Não responde por atos da Produtora, de Grupos ou de terceiros, nem por decisões de jurados.</p>
        <p>Nos limites da lei, a responsabilidade total da ARXUM perante a Produtora fica limitada ao valor das taxas de serviço pagas por ela nos 12 meses anteriores ao fato.</p>
      </>
    ),
  },
  {
    id: "suspensao",
    titulo: "Suspensão e encerramento",
    conteudo: (
      <>
        <p>A ARXUM pode suspender ou encerrar contas que violem estes Termos, com aviso prévio sempre que possível. Em caso de fraude ou risco a terceiros, a suspensão pode ser imediata.</p>
        <p>A Produtora pode encerrar a conta a qualquer momento pelo e-mail <a href={`mailto:${CONTATO.email}`}>{CONTATO.email}</a>.</p>
      </>
    ),
  },
  {
    id: "alteracoes",
    titulo: "Alterações destes Termos",
    conteudo: (
      <p>Mudanças relevantes serão comunicadas por e-mail e na Plataforma com pelo menos 30 dias de antecedência. Alterações de taxa não se aplicam a vendas de eventos já publicados.</p>
    ),
  },
  {
    id: "foro",
    titulo: "Lei aplicável e foro",
    conteudo: (
      <p>Estes Termos seguem a legislação brasileira. Fica eleito o foro da comarca de {EMPRESA.foro} para dirimir controvérsias, ressalvado o direito do consumidor de ajuizar ação em seu domicílio.</p>
    ),
  },
];
}

export default async function TermosDeUso() {
  const config = await obterConfiguracoes();
  const EMPRESA = config.empresa;
  return (
    <DocumentoLegal
      rotulo="Documentos legais"
      titulo="Termos de Uso"
      vigencia={ouPendente(EMPRESA.vigencia)}
      intro={<p>Estes Termos regulam o uso do ARXUM Fest por produtoras de eventos, suas equipes, grupos inscritos, participantes, jurados e compradores. Leia com atenção: eles explicam o que a plataforma oferece, o que cabe a cada parte e como funcionam taxas e repasses.</p>}
      secoes={secoes(config)}
    />
  );
}
