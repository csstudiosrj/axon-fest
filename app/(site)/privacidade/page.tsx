import type { Metadata } from "next";
import Link from "next/link";
import { EMPRESA, PRECOS } from "@/lib/site/conteudo";
import { DocumentoLegal, type SecaoLegal } from "../_components/DocumentoLegal";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o ARXUM Fest coleta, usa, protege e exclui dados pessoais, inclusive de crianças e adolescentes.",
};

const SECOES: SecaoLegal[] = [
  {
    id: "papeis",
    titulo: "Quem é responsável pelos dados",
    conteudo: (
      <>
        <p>A LGPD (Lei nº 13.709/2018) diferencia quem decide sobre os dados (<strong>controlador</strong>) de quem os trata em nome de outro (<strong>operador</strong>):</p>
        <ul>
          <li><strong>Dados de inscrições, grupos, participantes, jurados e compradores de um evento:</strong> a controladora é a <strong>Produtora</strong> do evento. A ARXUM atua como <strong>operadora</strong>, tratando esses dados apenas para executar a Plataforma conforme as instruções da Produtora.</li>
          <li><strong>Dados das contas de Produtoras e de navegação no site:</strong> a controladora é a <strong>ARXUM</strong> ({EMPRESA.razaoSocial}, CNPJ {EMPRESA.cnpj}).</li>
        </ul>
        <p>Pedidos sobre dados de um evento podem ser feitos diretamente à Produtora ou à ARXUM, que os encaminhará.</p>
      </>
    ),
  },
  {
    id: "dados",
    titulo: "Quais dados tratamos",
    conteudo: (
      <ul>
        <li><strong>Conta:</strong> nome, e-mail, telefone, cargo, foto e mini bio (jurados), senha (armazenada apenas de forma criptografada).</li>
        <li><strong>Grupos:</strong> nome, CPF ou CNPJ, responsável, e-mail, telefone, cidade e estado.</li>
        <li><strong>Participantes:</strong> nome, data de nascimento, documento, e-mail, função no grupo e, para menores, nome, CPF e parentesco do responsável legal.</li>
        <li><strong>Assinaturas de termos:</strong> data, hora, endereço IP e navegador usados na assinatura.</li>
        <li><strong>Apresentações:</strong> trilhas sonoras, mapas de luz, elenco e observações.</li>
        <li><strong>Avaliações:</strong> notas e comentários de jurados.</li>
        <li><strong>Vendas:</strong> itens, valores, forma de pagamento e operador. Dados completos de cartão são tratados exclusivamente pela instituição de pagamento; a ARXUM não os recebe.</li>
        <li><strong>Uso técnico:</strong> registros de acesso (IP, data e hora), exigidos pelo Marco Civil da Internet.</li>
      </ul>
    ),
  },
  {
    id: "finalidades",
    titulo: "Para que usamos e com qual base legal",
    conteudo: (
      <ul>
        <li><strong>Executar o contrato</strong> com a Produtora e permitir inscrições, avaliações e vendas (LGPD, art. 7º, V).</li>
        <li><strong>Cumprir obrigações legais</strong>, como guarda de registros de acesso e de documentos fiscais (art. 7º, II).</li>
        <li><strong>Comprovar autorizações</strong> e se defender em processos, por meio do registro das assinaturas (art. 7º, VI).</li>
        <li><strong>Segurança e prevenção a fraudes</strong>, inclusive limitação de tentativas de acesso (art. 7º, IX).</li>
        <li><strong>Comunicações sobre a conta</strong>, como confirmação de e-mail, convites e avisos de fim de plano.</li>
      </ul>
    ),
  },
  {
    id: "menores",
    titulo: "Crianças e adolescentes",
    conteudo: (
      <>
        <p>Muitos festivais envolvem menores de idade. Nesses casos, o tratamento é feito no melhor interesse da criança e do adolescente (LGPD, art. 14):</p>
        <ul>
          <li>a participação de menores depende do <strong>consentimento específico do responsável legal</strong>, colhido pela Plataforma com nome, CPF e parentesco;</li>
          <li>coletamos apenas os dados necessários à inscrição e à segurança do evento;</li>
          <li>dados de menores nunca são exibidos em páginas públicas; o CPF aparece sempre mascarado;</li>
          <li>o responsável pode pedir, a qualquer momento, acesso, correção ou exclusão dos dados.</li>
        </ul>
      </>
    ),
  },
  {
    id: "compartilhamento",
    titulo: "Com quem compartilhamos",
    conteudo: (
      <>
        <p>Os dados de um evento são visíveis apenas para a Produtora organizadora e para as pessoas que ela autoriza, cada uma limitada à sua função. Grupos veem apenas o próprio grupo; jurados, apenas os eventos para os quais foram designados.</p>
        <p>Usamos fornecedores que tratam dados em nosso nome, sob contrato e com medidas de segurança:</p>
        <ul>
          <li>hospedagem e banco de dados (Vercel e Supabase);</li>
          <li>envio de e-mails (Resend);</li>
          <li>armazenamento de arquivos (UploadThing);</li>
          <li>processamento de pagamentos (instituição de pagamento parceira).</li>
        </ul>
        <p>Alguns desses fornecedores mantêm servidores fora do Brasil. Nesses casos, a transferência internacional ocorre com cláusulas contratuais e garantias compatíveis com a LGPD (art. 33).</p>
        <p>Não vendemos dados pessoais. Autoridades só recebem dados mediante obrigação legal ou ordem judicial.</p>
      </>
    ),
  },
  {
    id: "seguranca",
    titulo: "Como protegemos",
    conteudo: (
      <ul>
        <li>Isolamento entre produtoras aplicado diretamente no banco de dados.</li>
        <li>Acesso por função, com o mínimo necessário para cada perfil.</li>
        <li>Conexões criptografadas (HTTPS) e senhas armazenadas com criptografia.</li>
        <li>Notas de jurados transferidas entre aparelhos sem internet apenas em formato criptografado.</li>
        <li>Convites e confirmações por links de uso único.</li>
      </ul>
    ),
  },
  {
    id: "retencao",
    titulo: "Por quanto tempo guardamos",
    conteudo: (
      <>
        <p><strong>Plano Start:</strong> durante os {PRECOS.mesesStart} meses de uso e mais {PRECOS.mesesGuarda} meses em modo leitura. Sem assinatura do Pro, os dados da Produtora e de seus eventos são excluídos ao fim desse prazo.</p>
        <p><strong>Plano Pro:</strong> enquanto a assinatura estiver ativa; após o cancelamento, aplica-se o mesmo ciclo do Start.</p>
        <p>Cadastros de Grupos e Participantes que também estejam ligados a eventos de outras Produtoras permanecem disponíveis para essas Produtoras.</p>
        <p>Mantemos por prazo maior apenas o que a lei exige: registros de acesso por 6 meses (Marco Civil da Internet, art. 15) e informações de vendas e faturamento pelo prazo fiscal aplicável.</p>
        <p>Dados guardados apenas em aparelhos usados offline (caixa, jurados, mídias) devem ser sincronizados e apagados do aparelho ao fim do evento.</p>
      </>
    ),
  },
  {
    id: "direitos",
    titulo: "Seus direitos",
    conteudo: (
      <>
        <p>Você pode pedir, gratuitamente: confirmação de que tratamos seus dados, acesso, correção, anonimização ou exclusão de dados desnecessários, portabilidade, informação sobre compartilhamentos e revogação do consentimento (LGPD, art. 18).</p>
        <p>Envie o pedido para <a href={`mailto:${EMPRESA.emailPrivacidade}`}>{EMPRESA.emailPrivacidade}</a>. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
      </>
    ),
  },
  {
    id: "cookies",
    titulo: "Cookies e armazenamento no aparelho",
    conteudo: (
      <>
        <p>Usamos apenas cookies essenciais, para manter você conectado com segurança. Não usamos cookies de publicidade nem rastreadores de terceiros.</p>
        <p>Os módulos offline guardam dados no armazenamento do navegador do aparelho (IndexedDB) para funcionar sem internet. Esses dados são apagados ao sair da conta ou ao limpar os dados do navegador.</p>
      </>
    ),
  },
  {
    id: "encarregado",
    titulo: "Encarregado e contato",
    conteudo: (
      <p>Encarregado pelo tratamento de dados (DPO): <a href={`mailto:${EMPRESA.emailPrivacidade}`}>{EMPRESA.emailPrivacidade}</a>. Endereço: {EMPRESA.endereco}. Esta Política complementa os <Link href="/termos-de-uso">Termos de Uso</Link> e pode ser atualizada; mudanças relevantes serão comunicadas com antecedência.</p>
    ),
  },
];

export default function Privacidade() {
  return (
    <DocumentoLegal
      rotulo="Documentos legais"
      titulo="Política de Privacidade"
      vigencia={EMPRESA.vigencia}
      intro={<p>Esta Política explica quais dados pessoais o ARXUM Fest trata, por que, com quem compartilha, por quanto tempo guarda e como você exerce seus direitos. Ela vale para o site, os painéis e os aplicativos usados em eventos.</p>}
      secoes={SECOES}
    />
  );
}
