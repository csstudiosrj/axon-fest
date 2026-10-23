import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { ROLES_GRUPO } from "@/lib/auth/roles";
import { cpfValido, soDigitos } from "@/lib/documentos";
import { enviarConfirmacaoVinculo } from "@/lib/grupo/vinculo";
import { perfilPorSlug } from "@/lib/perfis";
import { inscricoesAbertas } from "@/lib/eventos/status";

// Elenco do grupo: verificar CPF, adicionar, editar, trocar função, reenviar convite e remover.
// Cadastro único: CPF que já existe no ARXUM Fest vira convite por e-mail (a
// pessoa confirma se faz parte do grupo); CPF novo é cadastrado e a pessoa
// confirma pelo e-mail. Fica registrado por qual grupo e produtora ela chegou.
// Feito no servidor porque a mesma pessoa pode já ter cadastro (outro grupo ou
// outra produtora): o grupo vincula pelo CPF sem ver os dados dela, e a pessoa
// confirma pelo e-mail que ela mesma cadastrou.

type Admin = ReturnType<typeof createAdminClient>;

interface Corpo {
  acao?: "verificar" | "adicionar" | "editar" | "funcao" | "reenviar" | "remover";
  evento_id?: string;
  vinculo_id?: string;
  nome?: string;
  nome_artistico?: string;
  data_nascimento?: string;
  documento?: string;
  email?: string;
  funcao?: string;
}

const erro = (mensagem: string, status = 400) => NextResponse.json({ error: mensagem }, { status });

function texto(v: unknown, max = 160): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function dataValida(v: string | null): v is string {
  if (!v || !DATA.test(v)) return false;
  const d = new Date(`${v}T12:00:00`);
  return !Number.isNaN(d.getTime()) && d < new Date() && d.getFullYear() > 1900;
}

// Perfil (vocabulário) do evento — só de evento em que o grupo está inscrito
async function perfilDoEventoDoGrupo(admin: Admin, grupoId: string, eventoId: string | undefined) {
  if (!eventoId) return perfilPorSlug(null);
  const { data: inscricao } = await admin.from("inscricoes_grupo_evento").select("id")
    .eq("grupo_id", grupoId).eq("evento_id", eventoId).maybeSingle();
  if (!inscricao) return perfilPorSlug(null);
  const { data } = await admin.from("eventos").select("perfis_festival:perfil_id ( slug )").eq("id", eventoId).maybeSingle();
  const p = data?.perfis_festival as { slug?: string } | { slug?: string }[] | null | undefined;
  return perfilPorSlug(Array.isArray(p) ? p[0]?.slug : p?.slug);
}

async function enviarSemFalhar(admin: Admin, token: string, perfil: ReturnType<typeof perfilPorSlug>) {
  try {
    await enviarConfirmacaoVinculo(admin, token, perfil);
    return true;
  } catch (e) {
    console.error("[api/grupo/elenco] e-mail", e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const usuario = await getUsuarioAtual();
    if (!usuario) return erro("Não autenticado.", 401);
    if (!ROLES_GRUPO.includes(usuario.role) || !usuario.organizacao_id) return erro("Sem permissão.", 403);
    const grupoId = usuario.organizacao_id;

    const body = (await req.json().catch(() => ({}))) as Corpo;
    const admin = createAdminClient();
    const perfil = await perfilDoEventoDoGrupo(admin, grupoId, body.evento_id);
    const funcoesValidas = new Set(perfil.funcoes.map((f) => f.valor));
    const funcao = texto(body.funcao, 60);
    if (funcao && !funcoesValidas.has(funcao)) return erro("Função inválida para este tipo de festival.");

    // ── Verificar CPF / adicionar pessoa ao elenco ──────────────────────────
    if (body.acao === "verificar" || body.acao === "adicionar") {
      const documento = soDigitos(body.documento);
      if (!cpfValido(documento)) return erro("CPF inválido.");

      const { data: existente } = await admin.from("participantes").select("id, email_contato").eq("documento", documento).maybeSingle();
      // CPF novo: a tela pede os dados para o cadastro
      if (body.acao === "verificar" && !existente) return NextResponse.json({ existe: false });

      let participanteId: string;
      let jaTinhaCadastro = false;
      if (existente) {
        jaTinhaCadastro = true;
        participanteId = existente.id as string;
        const { data: vinculo } = await admin.from("grupo_participante").select("id, status")
          .eq("grupo_id", grupoId).eq("participante_id", participanteId).maybeSingle();
        if (vinculo && (vinculo.status ?? "ativo") === "ativo") return erro("Esta pessoa já está no elenco do grupo.", 409);
        if (vinculo) await admin.from("grupo_participante").delete().eq("id", vinculo.id);
      } else {
        const nome = texto(body.nome);
        const email = texto(body.email, 320)?.toLowerCase() ?? null;
        const nascimento = texto(body.data_nascimento, 10);
        if (!nome || nome.length < 3) return erro("Informe o nome completo.");
        if (!email || !EMAIL.test(email)) return erro("Informe um e-mail válido: é por ele que a pessoa confirma a participação.");
        if (!dataValida(nascimento)) return erro("Data de nascimento inválida.");

        // Origem: produtora do festival em que o grupo está agora (ou a de origem do grupo) e o próprio grupo
        let origem: string | null = null;
        if (body.evento_id) {
          const { data: ev } = await admin.from("eventos").select("produtora_id").eq("id", body.evento_id).maybeSingle();
          const { data: insc } = await admin.from("inscricoes_grupo_evento").select("id").eq("grupo_id", grupoId).eq("evento_id", body.evento_id).maybeSingle();
          if (ev && insc) origem = (ev.produtora_id as string | null) ?? null;
        }
        if (!origem) {
          const { data: g } = await admin.from("grupos").select("origem_produtora_id").eq("id", grupoId).maybeSingle();
          origem = g?.origem_produtora_id ?? null;
        }

        const { data: novo, error } = await admin.from("participantes").insert({
          nome,
          nome_artistico: texto(body.nome_artistico),
          data_nascimento: nascimento,
          documento,
          tipo_documento: "cpf",
          email_contato: email,
          origem_produtora_id: origem,
          origem_grupo_id: grupoId,
          criado_por: usuario.id,
        }).select("id").single();
        if (error || !novo) {
          console.error("[api/grupo/elenco] participante", error);
          return erro("Não foi possível salvar o cadastro.", 500);
        }
        participanteId = novo.id as string;
      }

      const token = crypto.randomUUID();
      const { error: vErr } = await admin.from("grupo_participante").insert({
        grupo_id: grupoId, participante_id: participanteId, funcao, confirmado: false, status: "ativo", token_confirmacao: token,
      });
      if (vErr) {
        console.error("[api/grupo/elenco] vinculo", vErr);
        return erro("Não foi possível adicionar ao elenco.", 500);
      }

      const enviado = await enviarSemFalhar(admin, token, perfil);
      const emailMascarado = jaTinhaCadastro && existente?.email_contato
        ? (existente.email_contato as string).replace(/^(.)[^@]*(@.)[^.]*(.*)$/, "$1***$2***$3") : null;
      return NextResponse.json({ success: true, existe: jaTinhaCadastro, jaTinhaCadastro, emailEnviado: enviado, emailMascarado });
    }

    // As demais ações atuam sobre um vínculo deste grupo
    const { data: vinculo } = await admin.from("grupo_participante")
      .select("id, participante_id, confirmado, token_confirmacao")
      .eq("id", body.vinculo_id ?? "").eq("grupo_id", grupoId).maybeSingle();
    if (!vinculo) return erro("Integrante não encontrado.", 404);

    if (body.acao === "funcao") {
      await admin.from("grupo_participante").update({ funcao }).eq("id", vinculo.id);
      return NextResponse.json({ success: true });
    }

    if (body.acao === "reenviar") {
      if (vinculo.confirmado) return erro("Esta pessoa já confirmou.");
      let token = vinculo.token_confirmacao as string | null;
      if (!token) {
        token = crypto.randomUUID();
        await admin.from("grupo_participante").update({ token_confirmacao: token }).eq("id", vinculo.id);
      }
      const enviado = await enviarSemFalhar(admin, token, perfil);
      if (!enviado) return erro("Não foi possível enviar o e-mail agora. Tente de novo em instantes.", 502);
      return NextResponse.json({ success: true });
    }

    if (body.acao === "editar") {
      const { data: p } = await admin.from("participantes").select("id, criado_por, termo_assinado").eq("id", vinculo.participante_id).maybeSingle();
      // Quem cadastrou, ou o(a) diretor(a) quando o cadastro foi feito por alguém do grupo
      let pode = !!p && p.criado_por === usuario.id;
      if (p && !pode && usuario.role !== "org_membro" && p.criado_por) {
        const { data: autor } = await admin.from("usuarios").select("organizacao_id").eq("id", p.criado_por).maybeSingle();
        pode = autor?.organizacao_id === grupoId;
      }
      if (!p || !pode) return erro("Só quem fez o cadastro (ou o diretor do grupo) pode editá-lo.", 403);
      if (p.termo_assinado) return erro("O termo já foi assinado: peça à produção para corrigir os dados.", 409);
      const nome = texto(body.nome);
      const email = texto(body.email, 320)?.toLowerCase() ?? null;
      const nascimento = texto(body.data_nascimento, 10);
      if (!nome || nome.length < 3) return erro("Informe o nome completo.");
      if (!email || !EMAIL.test(email)) return erro("Informe um e-mail válido.");
      if (!dataValida(nascimento)) return erro("Data de nascimento inválida.");
      await admin.from("participantes").update({
        nome, email_contato: email, data_nascimento: nascimento, nome_artistico: texto(body.nome_artistico),
      }).eq("id", p.id);
      await admin.from("grupo_participante").update({ funcao }).eq("id", vinculo.id);
      return NextResponse.json({ success: true });
    }

    if (body.acao === "remover") {
      if (usuario.role === "org_membro") return erro("Só o diretor do grupo remove integrantes.", 403);
      // Tira das apresentações do grupo em eventos ainda abertos; se a pessoa
      // estiver em apresentação de evento fechado, quem remove é a produção.
      const { data: aps } = await admin.from("apresentacoes").select("id, eventos ( status )").eq("grupo_id", grupoId);
      const status = (a: { eventos?: unknown }) => {
        const e = a.eventos as { status?: string } | { status?: string }[] | null;
        return Array.isArray(e) ? e[0]?.status : e?.status;
      };
      const abertas = (aps ?? []).filter((a) => inscricoesAbertas(status(a))).map((a) => a.id as string);
      const fechadas = (aps ?? []).filter((a) => !inscricoesAbertas(status(a))).map((a) => a.id as string);
      if (fechadas.length) {
        const { count } = await admin.from("apresentacao_elenco").select("apresentacao_id", { count: "exact", head: true })
          .eq("participante_id", vinculo.participante_id).in("apresentacao_id", fechadas);
        if ((count ?? 0) > 0) return erro("Esta pessoa está em uma apresentação de evento com inscrições fechadas. Fale com a produção.", 409);
      }
      if (abertas.length) {
        await admin.from("apresentacao_elenco").delete().eq("participante_id", vinculo.participante_id).in("apresentacao_id", abertas);
      }
      await admin.from("grupo_participante").delete().eq("id", vinculo.id);

      // Cadastro feito por este grupo e sem nenhum outro uso: apaga (LGPD)
      const pid = vinculo.participante_id as string;
      const [{ data: p }, { count: outros }, { count: emCena }] = await Promise.all([
        admin.from("participantes").select("criado_por, termo_assinado").eq("id", pid).maybeSingle(),
        admin.from("grupo_participante").select("id", { count: "exact", head: true }).eq("participante_id", pid),
        admin.from("apresentacao_elenco").select("apresentacao_id", { count: "exact", head: true }).eq("participante_id", pid),
      ]);
      if (p?.criado_por === usuario.id && !p.termo_assinado && !outros && !emCena) {
        await admin.from("participantes").delete().eq("id", pid);
      }
      return NextResponse.json({ success: true });
    }

    return erro("Ação inválida.");
  } catch (e) {
    console.error("[api/grupo/elenco]", e);
    return erro("Erro interno do servidor.", 500);
  }
}
