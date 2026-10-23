import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual, type UsuarioAtual } from "@/lib/auth/session";
import { HIERARQUIA, ROLES_GRUPO, podeAtribuir } from "@/lib/auth/roles";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";

// ─────────────────────────────────────────────────────────────────────────────
// Gestão de usuários da produtora (convite, cadastro direto, troca de cargo,
// remoção). Toda escrita usa service role, então TODA regra de acesso é
// verificada aqui antes:
//   • quem chama precisa estar logado, ativo e ter cargo gestor (HIERARQUIA);
//   • admin só age dentro da própria produtora; super_admin informa a produtora;
//   • o cargo atual do alvo e o cargo novo precisam ser atribuíveis por quem chama;
//   • ninguém altera/remove a si mesmo; super_admin nunca é criado por aqui.
// ─────────────────────────────────────────────────────────────────────────────

type Admin = ReturnType<typeof createAdminClient>;

const ACOES = ["verificar_email", "invite", "add", "update", "remove", "perfil", "ativo", "reenviar"] as const;
type Acao = (typeof ACOES)[number];

interface Corpo {
  action?: Acao;
  email?: string;
  role?: string;
  password?: string;
  userId?: string;
  grupo_id?: string | null;
  produtora_id?: string | null;
  nome?: string | null;
  telefone?: string | null;
  foto_url?: string | null;
  mini_bio?: string | null;
  especialidade?: string | null;
  ativo?: boolean;
}

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

function texto(valor: unknown, max = 500): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim();
  return t ? t.slice(0, max) : null;
}

function mascararNome(nome: string | null): string {
  if (!nome?.trim()) return "Convidado (Pendente)";
  return nome
    .trim()
    .split(/\s+/)
    .map((parte) => `${Array.from(parte)[0] ?? "*"}***`)
    .join(" ");
}

// Produtora em que a ação acontece: a do próprio admin, ou a informada pelo super_admin
async function resolverProdutora(
  admin: Admin,
  caller: UsuarioAtual,
  produtoraInformada: string | null | undefined
): Promise<string | NextResponse> {
  if (caller.role === "super_admin") {
    if (!produtoraInformada) return erro("Informe a produtora (produtora_id).", 400);
    const { data } = await admin.from("produtoras").select("id").eq("id", produtoraInformada).maybeSingle();
    if (!data) return erro("Produtora não encontrada.", 404);
    return produtoraInformada;
  }
  if (!caller.produtora_id) return erro("Seu usuário não está vinculado a uma produtora.", 403);
  return caller.produtora_id;
}

// Carrega o alvo e confirma que quem chama pode mexer nele
interface Alvo { id: string; role: string; produtora_id: string | null; origem: boolean }

// Carrega o alvo e confirma que quem chama pode mexer nele.
// Jurado é único no ARXUM Fest: a produtora alcança os jurados ligados a ela
// (produtora_jurados); "origem" = é a produtora por onde ele chegou.
async function carregarAlvo(admin: Admin, caller: UsuarioAtual, userId: string | undefined): Promise<Alvo | NextResponse> {
  if (!userId) return erro("userId ausente.", 400);
  if (userId === caller.id) return erro("Você não pode alterar o seu próprio acesso.", 403);

  const { data: alvo } = await admin
    .from("usuarios")
    .select("id, role, produtora_id")
    .eq("id", userId)
    .maybeSingle();

  if (!alvo) return erro("Usuário alvo não encontrado.", 404);

  const origem = !!alvo.produtora_id && alvo.produtora_id === caller.produtora_id;
  let alcanca = origem;
  if (!alcanca && alvo.role === "jurado" && caller.produtora_id) {
    const { data: link } = await admin.from("produtora_jurados").select("id")
      .eq("produtora_id", caller.produtora_id).eq("jurado_id", alvo.id).maybeSingle();
    alcanca = !!link;
  }
  if (caller.role !== "super_admin" && !alcanca) {
    return erro("Usuário não pertence à sua organização.", 403);
  }
  if (!podeAtribuir(caller.role, alvo.role)) {
    return erro("Sem permissão para gerenciar este usuário.", 403);
  }
  return { ...(alvo as { id: string; role: string; produtora_id: string | null }), origem: origem || caller.role === "super_admin" };
}

// Jurado de outra produtora: só a produtora de origem altera a conta dele
function exigirOrigem(alvo: Alvo): NextResponse | null {
  if (alvo.role === "jurado" && !alvo.origem) {
    return erro("Este jurado chegou ao ARXUM Fest por outra produtora: o perfil e o acesso dele são cuidados por ela. Você pode tirá-lo da sua equipe.", 403);
  }
  return null;
}

async function convidarJuradoExistente(admin: Admin, caller: UsuarioAtual, produtoraId: string, jurado: { id: string; email: string; nome: string | null }) {
  const { data: link } = await admin.from("produtora_jurados").select("id, status")
    .eq("produtora_id", produtoraId).eq("jurado_id", jurado.id).maybeSingle();
  if (link?.status === "aceito") return erro("Este jurado já está na sua equipe.", 409);
  await admin.from("produtora_jurados").upsert(
    { produtora_id: produtoraId, jurado_id: jurado.id, status: "pendente", convidado_por: caller.id, respondido_em: null },
    { onConflict: "produtora_id,jurado_id" }
  );
  const { data: produtora } = await admin.from("produtoras").select("nome").eq("id", produtoraId).maybeSingle();
  try {
    await enviarEmail({
      para: jurado.email,
      assunto: `${produtora?.nome ?? "Uma produtora"} convidou você para ser jurado(a)`,
      html: emailComBotao({
        titulo: jurado.nome ? `Olá, ${escapeHtml(jurado.nome.split(" ")[0])}!` : "Olá!",
        paragrafos: [
          `<strong>${escapeHtml(produtora?.nome ?? "Uma produtora")}</strong> convidou você para ser jurado(a) nos festivais dela no ARXUM Fest.`,
          "Entre com o seu login de sempre e aceite (ou recuse) o convite na sua área de jurado.",
        ],
        botaoTexto: "Ver convite",
        botaoUrl: urlAbsoluta("/jurado"),
      }),
    });
  } catch {
    // o convite fica pendente na área do jurado mesmo sem o e-mail
  }
  return NextResponse.json({ success: true, convitePendente: true, userId: jurado.id });
}

async function enviarConvite(
  admin: Admin,
  email: string,
  role: string,
  produtoraId: string,
  nome: string | null
): Promise<{ userId: string } | NextResponse> {
  // generateLink não manda e-mail: geramos o link e enviamos pelo Resend, com
  // o fluxo token_hash → /auth/confirmar → /definir-senha (compatível com SSR/PKCE).
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { role, produtora_id: produtoraId, nome } },
  });

  if (error || !data.user) {
    const jaExiste = error?.message?.toLowerCase().includes("already");
    return erro(jaExiste ? "Este e-mail já possui conta no sistema." : error?.message ?? "Erro ao convidar.", jaExiste ? 409 : 400);
  }

  const link = urlAbsoluta(
    `/auth/confirmar?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=invite&next=/definir-senha`
  );

  try {
    await enviarEmail({
      para: email,
      assunto: "Você foi convidado(a) para o ARXUM Fest",
      html: emailComBotao({
        titulo: nome ? `Olá, ${escapeHtml(nome)}!` : "Olá!",
        paragrafos: [
          "Você recebeu um convite para acessar o <strong>ARXUM Fest</strong>.",
          "Clique no botão abaixo para criar sua senha e entrar.",
        ],
        botaoTexto: "Aceitar convite",
        botaoUrl: link,
        rodape: "Se você não esperava este convite, ignore este e-mail.",
      }),
    });
  } catch (e) {
    // Desfaz a conta criada para que o convite possa ser reenviado
    await admin.auth.admin.deleteUser(data.user.id);
    return erro(`Falha ao enviar o e-mail de convite: ${e instanceof Error ? e.message : "erro desconhecido"}`, 502);
  }

  return { userId: data.user.id };
}

export async function POST(req: NextRequest) {
  try {
    const caller = await getUsuarioAtual();
    if (!caller) return erro("Não autenticado.", 401);
    if (!HIERARQUIA[caller.role]) return erro("Sem permissão para gerenciar usuários.", 403);

    const body = (await req.json()) as Corpo;
    const action = body.action;
    if (!action || !ACOES.includes(action)) return erro("Ação inválida.", 400);

    const admin = createAdminClient();
    const email = texto(body.email, 320)?.toLowerCase() ?? null;

    // ── VERIFICAR E-MAIL (usado no cadastro de jurados) ──
    // Responde só o necessário, sem expor dados de outras produtoras.
    if (action === "verificar_email") {
      if (!email) return erro("E-mail ausente.", 400);
      const { data: existente } = await admin
        .from("usuarios")
        .select("id, nome, role, produtora_id")
        .eq("email", email)
        .maybeSingle();

      if (!existente) return NextResponse.json({ existe: false });

      const mesmaProdutora = !!existente.produtora_id && existente.produtora_id === caller.produtora_id;
      return NextResponse.json({
        existe: true,
        id: mesmaProdutora || !existente.produtora_id ? existente.id : null,
        role: existente.role,
        nome_mascarado: mascararNome(existente.nome),
        mesma_produtora: mesmaProdutora,
        sem_produtora: !existente.produtora_id,
      });
    }

    // ── REMOVER ──
    if (action === "remove") {
      const alvo = await carregarAlvo(admin, caller, body.userId);
      if (alvo instanceof NextResponse) return alvo;

      // Jurado: tira da equipe desta produtora; a conta só é apagada se ele não
      // estiver em nenhuma outra produtora
      if (alvo.role === "jurado" && caller.produtora_id) {
        const { data: eventos } = await admin.from("eventos").select("id").eq("produtora_id", caller.produtora_id);
        const ids = (eventos ?? []).map((e) => e.id);
        if (ids.length) {
          const { count } = await admin.from("evento_jurados").select("id", { count: "exact", head: true }).eq("jurado_id", alvo.id).in("evento_id", ids);
          if (count) return erro("Este jurado está escalado em eventos seus. Tire-o dos eventos (aba Jurados) antes.", 409);
        }
        await admin.from("produtora_jurados").delete().eq("produtora_id", caller.produtora_id).eq("jurado_id", alvo.id);
        const { data: outros } = await admin.from("produtora_jurados").select("produtora_id").eq("jurado_id", alvo.id).eq("status", "aceito").limit(1);
        if (outros?.length) {
          if (alvo.origem) await admin.from("usuarios").update({ produtora_id: outros[0].produtora_id }).eq("id", alvo.id);
          return NextResponse.json({ success: true, desvinculado: true });
        }
        if (!alvo.origem) return NextResponse.json({ success: true, desvinculado: true });
      }

      const { error: deleteError } = await admin.from("usuarios").delete().eq("id", alvo.id);

      if (deleteError) {
        // 23503 = registros vinculados (notas, vendas…): desativa em vez de apagar
        if (deleteError.code === "23503") {
          await admin.from("usuarios").update({ ativo: false }).eq("id", alvo.id);
          await admin.auth.admin.updateUserById(alvo.id, { ban_duration: "876000h" });
          return NextResponse.json({ success: true, desativado: true });
        }
        return erro(deleteError.message, 400);
      }

      const { error: deleteAuthError } = await admin.auth.admin.deleteUser(alvo.id);
      if (deleteAuthError && !deleteAuthError.message.toLowerCase().includes("not found")) {
        return erro(deleteAuthError.message, 400);
      }
      return NextResponse.json({ success: true });
    }

    // ── PERFIL PÚBLICO (nome, telefone, foto, especialidade, mini bio) ──
    if (action === "perfil") {
      const alvo = await carregarAlvo(admin, caller, body.userId);
      if (alvo instanceof NextResponse) return alvo;
      const semOrigem = exigirOrigem(alvo);
      if (semOrigem) return semOrigem;
      const { error: perfilError } = await admin.from("usuarios").update({
        nome: texto(body.nome, 200),
        telefone: texto(body.telefone, 20)?.replace(/\D/g, "") || null,
        foto_url: texto(body.foto_url, 1000),
        especialidade: texto(body.especialidade, 80),
        mini_bio: texto(body.mini_bio, 300),
      }).eq("id", alvo.id);
      if (perfilError) return erro(perfilError.message, 400);
      return NextResponse.json({ success: true });
    }

    // ── DESATIVAR / REATIVAR ACESSO ──
    if (action === "ativo") {
      const alvo = await carregarAlvo(admin, caller, body.userId);
      if (alvo instanceof NextResponse) return alvo;
      const semOrigem = exigirOrigem(alvo);
      if (semOrigem) return semOrigem;
      const ativo = body.ativo === true;
      await admin.from("usuarios").update({ ativo }).eq("id", alvo.id);
      await admin.auth.admin.updateUserById(alvo.id, { ban_duration: ativo ? "none" : "876000h" });
      return NextResponse.json({ success: true });
    }

    // ── REENVIAR LINK DE ACESSO (quem ainda não criou a senha) ──
    if (action === "reenviar") {
      const alvo = await carregarAlvo(admin, caller, body.userId);
      if (alvo instanceof NextResponse) return alvo;
      const semOrigem = exigirOrigem(alvo);
      if (semOrigem) return semOrigem;
      const { data: conta } = await admin.auth.admin.getUserById(alvo.id);
      const emailAlvo = conta.user?.email;
      if (!emailAlvo) return erro("Conta sem e-mail.", 400);
      const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "recovery", email: emailAlvo });
      if (linkError || !link.properties?.hashed_token) return erro("Não foi possível gerar o link.", 400);
      try {
        await enviarEmail({
          para: emailAlvo,
          assunto: "Seu acesso ao ARXUM Fest",
          html: emailComBotao({
            titulo: "Olá!",
            paragrafos: ["Este é o seu link para criar a senha e acessar o <strong>ARXUM Fest</strong>.", "O link vale por 1 hora."],
            botaoTexto: "Criar senha e entrar",
            botaoUrl: urlAbsoluta(`/auth/confirmar?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=recovery&next=/definir-senha`),
          }),
        });
      } catch {
        return erro("Não foi possível enviar o e-mail agora.", 502);
      }
      return NextResponse.json({ success: true });
    }

    // ── ATUALIZAR CARGO ──
    if (action === "update") {
      if (!body.role) return erro("Cargo ausente.", 400);
      if (!podeAtribuir(caller.role, body.role)) return erro("Sem permissão para atribuir este cargo.", 403);

      const alvo = await carregarAlvo(admin, caller, body.userId);
      if (alvo instanceof NextResponse) return alvo;

      const { error: updateError } = await admin.from("usuarios").update({ role: body.role }).eq("id", alvo.id);
      if (updateError) return erro(updateError.message, 400);
      return NextResponse.json({ success: true });
    }

    // ── CONVITE e ADICIONAR ──
    const role = body.role;
    if (!email || !role) return erro("Email e cargo são obrigatórios.", 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("E-mail inválido.", 400);
    if (!podeAtribuir(caller.role, role)) {
      return erro("Você não tem permissão para criar usuários com esse cargo.", 403);
    }

    const produtoraId = await resolverProdutora(admin, caller, body.produtora_id);
    if (produtoraId instanceof NextResponse) return produtoraId;

    // Grupo opcional para cargos do portal do grupo — precisa ser da mesma produtora
    let grupoId: string | null = null;
    if (body.grupo_id && ROLES_GRUPO.includes(role)) {
      const { data: grupo } = await admin
        .from("grupos")
        .select("id, origem_produtora_id")
        .eq("id", body.grupo_id)
        .maybeSingle();
      if (!grupo || grupo.origem_produtora_id !== produtoraId) {
        return erro("Grupo não encontrado nesta produtora.", 404);
      }
      grupoId = grupo.id;
    }

    const perfil = {
      nome: texto(body.nome, 200),
      telefone: texto(body.telefone, 20)?.replace(/\D/g, "") || null,
      foto_url: texto(body.foto_url, 1000),
      mini_bio: texto(body.mini_bio, 300),
      especialidade: texto(body.especialidade, 80),
    };

    // Conta já existente: só pode ser (re)vinculada se estiver sem produtora e
    // já tiver o mesmo cargo (ex.: jurado que foi desvinculado antes).
    const { data: existente } = await admin
      .from("usuarios")
      .select("id, role, produtora_id")
      .eq("email", email)
      .maybeSingle();

    if (existente) {
      // Jurado que já existe no ARXUM Fest: a produtora não vincula sozinha, ele precisa aceitar
      if (role === "jurado" && existente.role === "jurado" && existente.produtora_id && existente.produtora_id !== produtoraId) {
        const { data: conta } = await admin.from("usuarios").select("id, email, nome").eq("id", existente.id).single();
        return convidarJuradoExistente(admin, caller, produtoraId, conta!);
      }
      if (existente.produtora_id || existente.role !== role) {
        return erro(existente.produtora_id === produtoraId ? "Esta pessoa já está na sua equipe." : "Este e-mail já pertence a outra conta. Use outro e-mail.", 409);
      }
      const { error: vinculoError } = await admin
        .from("usuarios")
        .update({ produtora_id: produtoraId, ativo: true, ...(grupoId ? { organizacao_id: grupoId } : {}),
          // só o que foi informado: não apaga a foto/bio que a pessoa já tinha
          ...Object.fromEntries(Object.entries(perfil).filter(([, v]) => v !== null)) })
        .eq("id", existente.id);
      if (vinculoError) return erro(vinculoError.message, 400);
      if (role === "jurado") {
        await admin.from("produtora_jurados").upsert({ produtora_id: produtoraId, jurado_id: existente.id, status: "aceito", convidado_por: caller.id, respondido_em: new Date().toISOString() }, { onConflict: "produtora_id,jurado_id" });
      }
      return NextResponse.json({ success: true, vinculado: true, userId: existente.id });
    }

    let newUserId: string;

    if (action === "invite") {
      const resultado = await enviarConvite(admin, email, role, produtoraId, perfil.nome);
      if (resultado instanceof NextResponse) return resultado;
      newUserId = resultado.userId;
    } else {
      if (!body.password || body.password.length < 8) {
        return erro("Senha deve ter no mínimo 8 caracteres.", 400);
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
        user_metadata: { role, produtora_id: produtoraId },
      });
      if (error) return erro(error.message, 400);
      newUserId = data.user.id;
    }

    const { error: upsertError } = await admin.from("usuarios").upsert(
      {
        id: newUserId,
        email,
        role,
        organizacao_id: grupoId, // coluna física no banco é 'organizacao_id'
        ativo: true,
        produtora_id: produtoraId,
        ...perfil,
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      return erro("Usuário criado, mas erro ao salvar dados complementares: " + upsertError.message, 500);
    }
    if (role === "jurado") {
      await admin.from("produtora_jurados").upsert({ produtora_id: produtoraId, jurado_id: newUserId, status: "aceito", convidado_por: caller.id, respondido_em: new Date().toISOString() }, { onConflict: "produtora_id,jurado_id" });
    }

    return NextResponse.json({ success: true, userId: newUserId });
  } catch (err) {
    console.error("[api/invite]", err);
    return erro("Erro interno do servidor.", 500);
  }
}
