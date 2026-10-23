import "server-only";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { perfilPorSlug, type SlugPerfil } from "@/lib/perfis";
import { modeloTermo } from "@/lib/termos";

// ─────────────────────────────────────────────────────────────────────────────
// Demonstração: cria uma produtora fictícia completa para testar o sistema de
// ponta a ponta (três festivais de tipos diferentes, grupos, elenco, jurados,
// notas, PDV e logins de teste) — e apaga tudo depois.
// Os dados ficam marcados por produtoras.demonstracao = true.
// ─────────────────────────────────────────────────────────────────────────────

type Admin = ReturnType<typeof createAdminClient>;

const DOMINIO = "demo.arxum.com.br";

const FESTIVAIS: { slug: SlugPerfil; nome: string; cidade: string; categorias: string[]; grupos: string[]; obras: string[]; pessoas: string[] }[] = [
  {
    slug: "danca", nome: "Festival de Dança — Demonstração", cidade: "Niterói",
    categorias: ["Jazz", "Ballet Clássico", "Dança Contemporânea"],
    grupos: ["Escola Movimento Livre", "Studio Plié", "Cia. Ritmo Urbano"],
    obras: ["Raízes", "Aurora", "Engrenagem", "Correnteza", "Maré", "Vento Sul"],
    pessoas: ["Ana Ribeiro", "Bruno Costa", "Carla Mendes", "Diego Alves", "Elisa Prado", "Fábio Lima", "Gabriela Rocha", "Heitor Nunes", "Isabela Duarte"],
  },
  {
    slug: "musica", nome: "Mostra de Música — Demonstração", cidade: "Petrópolis",
    categorias: ["MPB", "Pop / Rock", "Coral"],
    grupos: ["Banda Maré Alta", "Coro Vozes da Serra", "Trio Ladeira"],
    obras: ["Ladeira", "Canto da Serra", "Noite Clara", "Estrada", "Sereno"],
    pessoas: ["João Vieira", "Laura Pires", "Marcos Teles", "Nina Faria", "Otávio Reis", "Paula Brito"],
  },
  {
    slug: "teatro", nome: "Festival de Teatro — Demonstração", cidade: "Rio de Janeiro",
    categorias: ["Comédia", "Drama", "Teatro Infantil"],
    grupos: ["Cia. Arte em Cena", "Grupo Ponto de Fuga"],
    obras: ["O Último Ato", "Janelas", "A Casa Torta", "Silêncio"],
    pessoas: ["Rafael Souza", "Sofia Martins", "Tiago Moraes", "Úrsula Campos", "Vitor Lopes"],
  },
];

const JURADOS = ["Helena Duarte", "Ricardo Amaral", "Marina Lopes"];

// CPF fictício com dígitos verificadores válidos (passa na validação do sistema)
function cpfAleatorio() {
  const d = Array.from({ length: 9 }, () => randomInt(0, 10));
  for (const n of [10, 11]) {
    const soma = d.reduce((s, v, i) => s + v * (n - i), 0);
    const r = (soma * 10) % 11;
    d.push(r === 10 ? 0 : r);
  }
  return d.join("");
}

async function criarUsuario(admin: Admin, email: string, senha: string, dados: Omit<TablesInsert<"usuarios">, "id" | "email">) {
  const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
  if (error || !data.user) throw new Error(`Usuário ${email}: ${error?.message}`);
  const { error: e2 } = await admin.from("usuarios").insert({ id: data.user.id, email, ativo: true, ...dados });
  if (e2) throw new Error(`usuarios ${email}: ${e2.message}`);
  return data.user.id;
}

function checar<T>(r: { data: T; error: { message: string } | null }, onde: string): NonNullable<T> {
  if (r.error || r.data === null || r.data === undefined) throw new Error(`${onde}: ${r.error?.message ?? "sem dados"}`);
  return r.data as NonNullable<T>;
}

export async function demonstracaoAtual(admin: Admin) {
  const { data } = await admin.from("produtoras").select("id").eq("demonstracao", true).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function criarDemonstracao(admin: Admin) {
  if (await demonstracaoAtual(admin)) throw new Error("Já existe uma demonstração. Apague antes de criar outra.");

  const senha = `Demo-${randomBytes(4).toString("hex")}`;
  const sufixo = randomBytes(3).toString("hex");
  const logins: { papel: string; email: string }[] = [];

  const produtora = checar(await admin.from("produtoras")
    .insert({ nome: "Produtora Demonstração", email: `contato@${DOMINIO}`, demonstracao: true, ativo: true })
    .select("id").single(), "produtora");
  const pid = produtora.id as string;

  try {
    const perfis = checar(await admin.from("perfis_festival").select("id, slug"), "perfis") as { id: string; slug: string }[];
    const perfilId = (slug: string) => perfis.find((p) => p.slug === slug)?.id ?? null;

    await admin.from("tenant_config").insert({ produtora_id: pid, perfil_id: perfilId("danca"), nome_organizacao: "Produtora Demonstração", configurado_em: new Date().toISOString(),
      termo_legal_texto: "Texto de exemplo da demonstração. Declaro que participo do festival por livre vontade e que estou apto(a) às atividades." });

    // Equipe
    for (const [papel, role, nome] of [["Dono do festival", "admin", "Demo Admin"], ["Produtor", "produtor", "Demo Produtor"], ["Operador de caixa", "operador", "Demo Operador"]] as const) {
      const email = `${role}.${sufixo}@${DOMINIO}`;
      await criarUsuario(admin, email, senha, { nome, role, produtora_id: pid });
      logins.push({ papel, email });
    }
    const jurados: string[] = [];
    for (const [i, nome] of JURADOS.entries()) {
      const email = `jurado${i + 1}.${sufixo}@${DOMINIO}`;
      jurados.push(await criarUsuario(admin, email, senha, { nome, role: "jurado", produtora_id: pid, mini_bio: "Jurado(a) da demonstração." }));
      logins.push({ papel: `Jurado ${i + 1}`, email });
    }

    // PDV
    await admin.from("pdv_config").insert({ produtora_id: pid, pin_admin: "1234", pix_nome: "Produtora Demonstração", pix_cidade: "Rio de Janeiro" });
    const produtosPdv = checar(await admin.from("pdv_produtos").insert(
      ([["Água 500 ml", 5, "cantina", "Bebidas"], ["Refrigerante", 7, "cantina", "Bebidas"], ["Pão de queijo", 6, "cantina", "Salgados"],
        ["Camiseta oficial", 60, "cantina", "Lembranças"], ["Ingresso inteira", 40, "bilheteria", "Ingressos"], ["Meia-entrada", 20, "bilheteria", "Ingressos"]] as [string, number, "cantina" | "bilheteria", string][])
        .map(([nome, preco, tipo, categoria], i) => ({ nome, preco, tipo, categoria, produtora_id: pid, ativo: true, ordem: i }))
    ).select("id, nome, preco"), "pdv_produtos") as { id: string; nome: string; preco: number }[];

    let grupoLogin = 0;
    for (const [fi, f] of FESTIVAIS.entries()) {
      const perfil = perfilPorSlug(f.slug);
      const inicio = new Date(Date.now() + (30 + fi * 14) * 86400000).toISOString().slice(0, 10);
      const evento = checar(await admin.from("eventos").insert({
        nome: f.nome, produtora_id: pid, perfil_id: perfilId(f.slug), status: "inscricoes_abertas",
        data_inicio: inicio, data_fim: inicio, local: `Teatro Municipal de ${f.cidade}`, formato: "competitivo",
        tipo_premiacao: "apenas_trofeus_e_medalhas", slug: `demo-${f.slug}-${sufixo}`,
        descricao: `Evento fictício criado para demonstração do ARXUM Fest (${perfil.nome}).`,
      }).select("id").single(), "evento") as { id: string };

      await admin.from("termos_documentos").insert({
        evento_id: evento.id, produtora_id: pid, tipo: "regulamento", titulo: "Regulamento", ativo: true, formato: "html",
        conteudo: modeloTermo("regulamento", { festival: f.nome, produtora: "Produtora Demonstração", documento: null, cidade: f.cidade }),
      });

      const categorias = checar(await admin.from("categorias").insert(
        f.categorias.map((nome) => ({ evento_id: evento.id, nome, produtora_id: pid, valor_solo: 80, valor_duo: 120, valor_conjunto: 200, competitiva: true }))
      ).select("id"), "categorias") as { id: string }[];

      await admin.from("criterios_avaliacao").insert(
        (f.slug === "musica" ? ["Afinação", "Arranjo", "Presença de palco"] : f.slug === "teatro" ? ["Interpretação", "Direção", "Encenação"] : ["Técnica", "Coreografia", "Interpretação"])
          .map((nome, i) => ({ evento_id: evento.id, nome, ordem: i + 1, nota_min: 0, nota_max: 10, peso: i === 0 ? 2 : 1 }))
      );
      await admin.from("evento_jurados").insert(jurados.map((j) => ({ evento_id: evento.id, jurado_id: j })));
      await admin.from("evento_produtos").insert(produtosPdv.map((p) => ({ evento_id: evento.id, produto_id: p.id, ativo_evento: true })));

      // Grupos, logins dos grupos e elenco
      const pessoas = [...f.pessoas];
      let ordem = 1;
      for (const [gi, nomeGrupo] of f.grupos.entries()) {
        const grupo = checar(await admin.from("grupos").insert({
          nome: nomeGrupo, email: `grupo${++grupoLogin}.${sufixo}@${DOMINIO}`, responsavel: pessoas[0],
          documento: cpfAleatorio(), tipo_documento: "cpf", cidade: f.cidade, estado: "RJ",
          origem_produtora_id: pid, produtora_id: pid,
        }).select("id, email").single(), "grupo") as { id: string; email: string };
        await criarUsuario(admin, grupo.email, senha, { nome: `Responsável — ${nomeGrupo}`, role: "org_admin", organizacao_id: grupo.id });
        logins.push({ papel: `${perfil.termos.grupo.singular[0].toUpperCase()}${perfil.termos.grupo.singular.slice(1)}: ${nomeGrupo}`, email: grupo.email });
        await admin.from("inscricoes_grupo_evento").insert({ grupo_id: grupo.id, evento_id: evento.id, status: "ativo", origem: "demonstracao" });

        const elenco = pessoas.splice(0, Math.max(2, Math.ceil(f.pessoas.length / f.grupos.length)));
        const participantes = checar(await admin.from("participantes").insert(elenco.map((nome, pi) => ({
          nome, data_nascimento: `${pi % 2 ? 2010 : 1998}-0${(pi % 9) + 1}-15`, documento: cpfAleatorio(), tipo_documento: "cpf",
          produtora_id: pid, origem_produtora_id: pid, email_contato: `${nome.split(" ")[0].toLowerCase()}.${sufixo}@${DOMINIO}`,
          termo_assinado: pi % 3 !== 0,
        }))).select("id"), "participantes") as { id: string }[];
        await admin.from("grupo_participante").insert(participantes.map((p, pi) => ({
          grupo_id: grupo.id, participante_id: p.id, funcao: perfil.funcoes[pi === 0 ? 0 : pi % 2 ? 0 : 1].valor, confirmado: pi % 4 !== 3, status: "ativo",
        })));

        // Apresentações do grupo
        const obras = f.obras.filter((_, oi) => oi % f.grupos.length === gi);
        for (const [oi, nomeObra] of obras.entries()) {
          const tipo = (["solo", "duo", "conjunto"] as const)[(gi + oi) % 3];
          const ap = checar(await admin.from("apresentacoes").insert({
            evento_id: evento.id, grupo_id: grupo.id, produtora_id: pid, nome: nomeObra, categoria_id_old: "demo", tipo,
            categoria_id: categorias[(gi + oi) % categorias.length].id, ordem_apresentacao: ordem++, data_apresentacao: inicio,
            quantidade_bailarinos: tipo === "solo" ? 1 : tipo === "duo" ? 2 : participantes.length,
            valor_total: tipo === "solo" ? 80 : tipo === "duo" ? 120 : 200,
          }).select("id").single(), "apresentacao") as { id: string };
          await admin.from("apresentacao_elenco").insert(participantes.slice(0, tipo === "solo" ? 1 : tipo === "duo" ? 2 : participantes.length).map((p) => ({ apresentacao_id: ap.id, participante_id: p.id })));

          // Notas: no 1º festival, dois jurados já finalizaram; o terceiro fica pendente
          if (fi === 0) {
            const { data: crits } = await admin.from("criterios_avaliacao").select("id").eq("evento_id", evento.id).order("ordem");
            for (const j of jurados.slice(0, 2)) {
              const agora = new Date().toISOString();
              await admin.from("avaliacoes_fichas").insert({ evento_id: evento.id, apresentacao_id: ap.id, avaliador_id: j, finalizada_em: agora, atualizado_em: agora, comentario: "Avaliação de demonstração." });
              await admin.from("avaliacoes").insert((crits ?? []).map((c) => ({
                evento_id: evento.id, apresentacao_id: ap.id, avaliador_id: j, criterio_id: c.id, produtora_id: pid,
                nota: Math.round((6 + randomInt(0, 40) / 10) * 10) / 10, sincronizado: true, atualizado_em: agora,
              })));
            }
          }
        }
      }

      // Vendas de caixa no 1º festival
      if (fi === 0) {
        // 12 atendimentos de 1 a 2 itens, como o caixa registra
        await admin.from("pdv_vendas").insert(Array.from({ length: 12 }, (_, i) => {
          const venda = randomUUID();
          const forma = ["dinheiro", "pix", "cartao"][i % 3];
          return [produtosPdv[i % produtosPdv.length], ...(i % 2 ? [produtosPdv[(i + 1) % produtosPdv.length]] : [])].map((p, k) => {
            const q = 1 + ((i + k) % 3);
            return {
              produtora_id: pid, evento_id: evento.id, venda_id: venda, produto_id: p.id, produto_nome: p.nome, quantidade: q,
              preco_unitario: p.preco, total: p.preco * q, forma_pagamento: forma, operador_nome: "Demo Operador", sincronizado: true, itens: [],
            };
          });
        }).flat());
      }
    }
  } catch (e) {
    await apagarDemonstracao(admin).catch(() => {});
    throw e;
  }

  return { senha, logins };
}

export async function apagarDemonstracao(admin: Admin) {
  const pid = await demonstracaoAtual(admin);
  if (!pid) return { apagada: false };

  const { data: grupos } = await admin.from("grupos").select("id").eq("origem_produtora_id", pid);
  const gids = (grupos ?? []).map((g) => g.id as string);
  const { data: usuarios } = await admin.from("usuarios").select("id").or(
    `produtora_id.eq.${pid}${gids.length ? `,organizacao_id.in.(${gids.join(",")})` : ""}`
  );

  // Ordem: dados de evento → catálogo da produtora → pessoas → logins → produtora
  await admin.from("eventos").delete().eq("produtora_id", pid);
  for (const t of ["pdv_vendas", "pdv_produtos", "pdv_config", "posts_marketing", "produtos", "termos_documentos", "tenant_estilos_ativos", "tenant_config", "participantes_bloqueados"] as const) {
    await admin.from(t).delete().eq("produtora_id", pid);
  }
  await admin.from("participantes").delete().or(`produtora_id.eq.${pid},origem_produtora_id.eq.${pid}`);
  if (gids.length) await admin.from("grupos").delete().in("id", gids);
  for (const u of usuarios ?? []) await admin.auth.admin.deleteUser(u.id as string);
  const { error } = await admin.from("produtoras").delete().eq("id", pid);
  if (error) throw new Error(`Não foi possível apagar a produtora de demonstração: ${error.message}`);
  return { apagada: true };
}
