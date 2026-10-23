import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";

// Rota pública: o acesso é autorizado só pelo token do vínculo (UUID aleatório
// enviado por e-mail). Por isso nada além do necessário é devolvido ao navegador.

function mascararCpf(cpf: string | null | undefined): string | null {
  const d = (cpf ?? "").replace(/\D/g, "");
  if (d.length !== 11) return d ? "***" : null;
  return `***.***.${d.slice(6, 9)}-${d.slice(9)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo de idade — fuso horário America/Sao_Paulo para evitar
// falso-positivo de maioridade em servidores UTC externos.
// ─────────────────────────────────────────────────────────────────────────────
function calcularIdade(dataNascimento: string | null | undefined): number {
  if (!dataNascimento) return 0;
  const partes = dataNascimento.split("-");
  if (partes.length !== 3) return 0;
  const anoNasc = parseInt(partes[0], 10);
  const mesNasc = parseInt(partes[1], 10);
  const diaNasc = parseInt(partes[2], 10);

  // Data atual no horário de Brasília
  const agora = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth() + 1;
  const diaAtual = agora.getDate();

  let idade = anoAtual - anoNasc;
  if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
    idade--;
  }
  return idade;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler POST principal
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Cliente administrativo com service role key — bypass de RLS
  const supabase = createAdminClient();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const userAgent = request.headers.get("user-agent") ?? "desconhecido";

  try {
    const body = await request.json();
    const { token, action } = body as { token?: string; action?: string };

    if (!token || !action || typeof token !== "string" || !/^[0-9a-f-]{32,36}$/i.test(token)) {
      return NextResponse.json(
        { error: "Token e ação são obrigatórios." },
        { status: 400 }
      );
    }

    // ── Buscar o vínculo ativo pelo token
    const { data: vinculo, error: vinculoError } = await supabase
      .from("grupo_participante")
      .select("id, confirmado, grupo_id, participante_id")
      .eq("token_confirmacao", token)
      .single();

    if (vinculoError || !vinculo) {
      return NextResponse.json(
        { error: "Link inválido ou já utilizado." },
        { status: 404 }
      );
    }

    // ── Buscar participante
    const { data: participante, error: partError } = await supabase
      .from("participantes")
      .select(
        "id, nome, data_nascimento, email_contato, termo_assinado, responsavel_nome, responsavel_cpf"
      )
      .eq("id", vinculo.participante_id)
      .single();

    if (partError || !participante) {
      return NextResponse.json(
        { error: "Participante não encontrado." },
        { status: 404 }
      );
    }

    // ── Buscar grupo
    const { data: grupo } = await supabase
      .from("grupos")
      .select("id, nome, origem_produtora_id")
      .eq("id", vinculo.grupo_id)
      .single();

    // ── Buscar configuração do tenant
    let tenantConfig = null;
    if (grupo?.origem_produtora_id) {
      const { data: config } = await supabase
        .from("tenant_config")
        .select("termo_participante, termo_legal_texto")
        .eq("produtora_id", grupo.origem_produtora_id)
        .limit(1)
        .maybeSingle();
      tenantConfig = config;
    }

    const idade = calcularIdade(participante.data_nascimento);

    // ══════════════════════════════════════════════════════════════════════════
    // Ação: carregar_dados (somente leitura)
    // ══════════════════════════════════════════════════════════════════════════
    if (action === "carregar_dados") {
      return NextResponse.json({
        vinculo: {
          id: vinculo.id,
          confirmado: vinculo.confirmado,
          grupo_id: vinculo.grupo_id,
          participante_id: vinculo.participante_id,
        },
        participante: {
          id: participante.id,
          nome: participante.nome,
          data_nascimento: participante.data_nascimento,
          email_contato: participante.email_contato,
          termo_assinado: participante.termo_assinado,
          responsavel_nome: participante.responsavel_nome,
          responsavel_cpf: mascararCpf(participante.responsavel_cpf),
        },
        grupo: {
          id: grupo?.id ?? "",
          nome: grupo?.nome ?? "",
          origem_produtora_id: grupo?.origem_produtora_id ?? null,
        },
        tenantConfig,
        idade,
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Ação: confirmar_presenca
    // ══════════════════════════════════════════════════════════════════════════
    if (action === "confirmar_presenca") {
      // Idempotente: se já confirmado, retorna sucesso sem nova escrita
      if (vinculo.confirmado) {
        return NextResponse.json({ success: true });
      }

      const { error: confirmarError } = await supabase
        .from("grupo_participante")
        .update({ confirmado: true, status: "ativo" })
        .eq("id", vinculo.id);

      if (confirmarError) {
        return NextResponse.json(
          { error: "Erro ao confirmar presença." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Ação: assinar_adulto
    // ══════════════════════════════════════════════════════════════════════════
    if (action === "assinar_adulto") {
      const { nome_assinatura } = body as { nome_assinatura?: string };

      if (!nome_assinatura || typeof nome_assinatura !== "string") {
        return NextResponse.json(
          { error: "Nome de assinatura inválido." },
          { status: 400 }
        );
      }

      if (
        nome_assinatura.trim().toLowerCase() !==
        participante.nome.trim().toLowerCase()
      ) {
        return NextResponse.json(
          {
            error:
              "A assinatura deve ser idêntica ao nome completo cadastrado.",
          },
          { status: 400 }
        );
      }

      if (participante.termo_assinado) {
        return NextResponse.json(
          { error: "Termo já assinado." },
          { status: 400 }
        );
      }

      const agoraISO = new Date().toISOString();

      // Atualiza participante
      const { error: updateParticipanteError } = await supabase
        .from("participantes")
        .update({
          termo_assinado: true,
          termo_assinado_em: agoraISO,
          termo_assinado_ip: ip,
          termo_assinado_user_agent: userAgent,
        })
        .eq("id", participante.id);

      if (updateParticipanteError) {
        return NextResponse.json(
          { error: "Erro ao registrar assinatura." },
          { status: 500 }
        );
      }

      // Invalida o token após assinatura bem-sucedida
      const { error: nullTokenError } = await supabase
        .from("grupo_participante")
        .update({ token_confirmacao: null })
        .eq("id", vinculo.id);

      if (nullTokenError) {
        return NextResponse.json(
          { error: "Erro ao invalidar token após assinatura." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Ação: assinar_responsavel
    // ══════════════════════════════════════════════════════════════════════════
    if (action === "assinar_responsavel") {
      const { respNome, respCPF, respParentesco, respAssinatura } = body as {
        respNome?: string;
        respCPF?: string;
        respParentesco?: string;
        respAssinatura?: string;
      };

      if (!respNome || !respCPF || !respParentesco || !respAssinatura) {
        return NextResponse.json(
          { error: "Todos os campos do responsável são obrigatórios." },
          { status: 400 }
        );
      }

      // Garante que o participante é realmente menor de idade
      if (idade >= 18) {
        return NextResponse.json(
          {
            error:
              "O participante é maior de idade; autorização de responsável não é necessária.",
          },
          { status: 400 }
        );
      }

      // Valida que a assinatura corresponde ao nome do responsável
      if (
        respAssinatura.trim().toLowerCase() !== respNome.trim().toLowerCase()
      ) {
        return NextResponse.json(
          {
            error:
              "A assinatura deve ser idêntica ao nome completo do responsável.",
          },
          { status: 400 }
        );
      }

      if (participante.termo_assinado) {
        return NextResponse.json(
          { error: "Termo já assinado." },
          { status: 400 }
        );
      }

      const agoraISO = new Date().toISOString();

      // Atualiza participante — inclui responsavel_parentesco
      const { error: updateParticipanteError } = await supabase
        .from("participantes")
        .update({
          responsavel_nome: respNome.trim(),
          responsavel_cpf: respCPF.replace(/\D/g, ""), // CPF limpo (somente dígitos)
          responsavel_parentesco: respParentesco.trim(),
          termo_assinado: true,
          termo_assinado_em: agoraISO,
          termo_assinado_ip: ip,
          termo_assinado_user_agent: userAgent,
        })
        .eq("id", participante.id);

      if (updateParticipanteError) {
        return NextResponse.json(
          { error: "Erro ao registrar responsável." },
          { status: 500 }
        );
      }

      // Invalida o token após assinatura bem-sucedida
      const { error: nullTokenError } = await supabase
        .from("grupo_participante")
        .update({ token_confirmacao: null })
        .eq("id", vinculo.id);

      if (nullTokenError) {
        return NextResponse.json(
          { error: "Erro ao invalidar token após assinatura." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Ação: enviar_email_responsavel
    // ══════════════════════════════════════════════════════════════════════════
    if (action === "enviar_email_responsavel") {
      const { emailResponsavel } = body as { emailResponsavel?: string };

      if (
        !emailResponsavel ||
        typeof emailResponsavel !== "string" ||
        !emailResponsavel.includes("@")
      ) {
        return NextResponse.json(
          { error: "E-mail inválido." },
          { status: 400 }
        );
      }

      if (participante.termo_assinado) {
        return NextResponse.json({ error: "Termo já assinado." }, { status: 400 });
      }
      if (idade >= 18) {
        return NextResponse.json(
          { error: "O participante é maior de idade; autorização de responsável não é necessária." },
          { status: 400 }
        );
      }

      // O token NÃO é invalidado aqui — o link continua válido para o
      // responsável acessar via ?responsavel=true e assinar.
      try {
        await enviarEmail({
          para: emailResponsavel.trim(),
          assunto: `Autorização de participação — ${participante.nome}`,
          html: emailComBotao({
            titulo: "Autorização de participação",
            paragrafos: [
              `Você recebeu uma solicitação de autorização para que <strong>${escapeHtml(participante.nome)}</strong> participe do grupo <strong>${escapeHtml(grupo?.nome)}</strong> no ARXUM Fest.`,
              "Clique no botão abaixo para ler o termo e assinar a autorização:",
            ],
            botaoTexto: "Assinar autorização",
            botaoUrl: urlAbsoluta(`/confirmar-participacao/${encodeURIComponent(token)}?responsavel=true`),
            rodape: "Se você não reconhece esta solicitação, ignore este e-mail.",
          }),
        });
      } catch (e) {
        console.error("[api/confirmar-participacao] email", e);
        return NextResponse.json({ error: "Falha no envio do e-mail." }, { status: 502 });
      }

      return NextResponse.json({ success: true });
    }

    // ── Ação desconhecida
    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (err: unknown) {
    console.error("[api/confirmar-participacao]", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}