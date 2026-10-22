# ARXUM Fest

Sistema de gestão de festivais (dança, música, teatro e afins) da **ARXUM**, desenvolvido pela CS Studios.
No ar em **https://www.arxum.com.br/fest**.

## O que o sistema faz

| Área | Quem usa | Onde entra |
|---|---|---|
| Painel da produtora | Dono do festival (`admin`), `produtor`, `marketing`, `assistente` | `/fest/login` |
| Caixa e bilheteria (celular) | `operador` (login + PIN do PDV) | `/fest/login` → `/fest/caixa` |
| Avaliação (funciona offline) | `jurado` | `/fest/login` → `/fest/jurado` |
| Portal do grupo/escola | `org_admin`, `org_membro` | `/fest/grupo/login` |
| Página pública do evento | Público | `/fest/e/<slug>` |
| Inscrição de grupos | Público | `/fest/inscricao/<id-do-evento>` |
| Confirmação de participante | Participante (link por e-mail) | `/fest/confirmar-participacao/<token>` |
| Administração do SaaS | `super_admin` (dono da ARXUM) | `/fest/login` |

Cargos, permissões e quem pode convidar quem: `lib/auth/roles.ts`.

## Tecnologias

- **Next.js 16** (App Router) com `basePath: /fest` — ver `lib/base-path.ts`
- **Supabase**: autenticação e banco Postgres com RLS
- **Resend**: e-mails (convites, vínculo de participantes, autorização de responsável)
- **UploadThing**: upload de áudios, mapas de luz e imagens
- **Vercel**: hospedagem (deploy automático a cada merge na `main`)

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev                  # http://localhost:3000/fest
```

Antes de abrir um PR:

```bash
npx tsc --noEmit
npm run lint
```

## Variáveis de ambiente

Todas estão descritas em [`.env.example`](.env.example). Na Vercel ficam em
*Settings → Environment Variables* (Production e Preview).

| Variável | Para quê |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Endereço do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON` | Chave pública (navegador) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta (só servidor; ignora RLS) |
| `NEXT_PUBLIC_APP_URL` | Origem pública, sem `/fest` (links dos e-mails) |
| `RESEND_API_KEY` / `RESEND_FROM` | Envio de e-mails |
| `UPLOADTHING_TOKEN` | Uploads |

## Segurança

- O proxy (`proxy.ts`) renova a sessão e barra áreas restritas sem login.
- Os layouts checam o cargo no servidor (`lib/auth/guards.ts`, `getUser()`).
- Rotas em `app/api` que usam a service role validam sessão, cargo e produtora antes de agir.
- No banco, **todas as tabelas têm RLS**: cada perfil só lê/escreve o que é seu
  (`supabase/migrations/20261023000100_seguranca_rls.sql`).

## Painel do super admin (`/super`)

- **Preços e taxas, contato e dados da empresa** ficam na tabela `configuracoes_sistema` e são editados
  no painel. O site, os Termos e a Política leem de lá (`lib/site/configuracoes.ts`, cache de 5 min
  renovado ao salvar).
- **Demonstração:** cria uma produtora fictícia completa (3 festivais de tipos diferentes, grupos,
  elenco, jurados, notas, caixa e logins de teste) e apaga tudo depois (`lib/demo/demonstracao.ts`).
  O banco de produção fica sempre zerado.

## Tipo de festival e vocabulário

Cada evento tem um tipo (dança, música, teatro, circo, talentos estudantil, multidisciplinar).
`lib/perfis.ts` define, para cada tipo, os termos (escola/banda/companhia, bailarino/músico/ator,
coreografia/apresentação/espetáculo), as formações, as funções do elenco e os arquivos técnicos
pedidos (trilha, riders de som e luz, mapa de palco, cenário…).

## Módulos offline

Jurado (`/jurado`), apuração (`/jurados/apuracao`) e caixa (`/caixa`, `/bilheteria`) funcionam sem internet:

- `public/sw.js` (service worker) guarda essas telas e os arquivos do Next no aparelho;
- os dados ficam no IndexedDB (`lib/offline/idb.ts`);
- as notas do jurado chegam à produção pela internet ou por QR code animado,
  criptografado com AES-256-GCM e uma chave por jurado/evento (`lib/offline/transferencia.ts`).
  O servidor abre o pacote de novo ao importar, então só aceita notas geradas no aparelho do jurado.

## Banco de dados

O esquema está versionado em `supabase/migrations/` (rodar em ordem):

| Arquivo | O que faz |
|---|---|
| `20261022000000_esquema_inicial.sql` | Retrato do banco original (já existe em produção — não rodar lá) |
| `20261023000000_alinhar_colunas.sql` | Colunas que o código usa e faltavam; cargo `operador` |
| `20261023000100_seguranca_rls.sql` | Funções auxiliares, RLS e políticas de todas as tabelas |
| `20261024000000_avaliacao_jurados.sql` | Fichas de avaliação, chaves de transferência por QR, método de apuração, resultado publicado |
| `20261025000000_perfil_e_arquivos.sql` | Tipo de festival por evento e arquivos técnicos por apresentação |
| `20261026000000_configuracoes_sistema.sql` | Valores e taxas editáveis pelo super admin; marca de produtora de demonstração |

**Aplicar uma migration nova em produção:** Supabase → *SQL Editor* → *New query* → colar o
conteúdo do arquivo → *Run*.

**Tipos TypeScript** (`lib/supabase/database.types.ts`) são gerados a partir das migrations.
Com o [Supabase CLI](https://supabase.com/docs/guides/cli):
`npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts`.

## Deploy

A Vercel publica automaticamente:
- **Produção**: a cada merge na branch `main`;
- **Preview**: a cada pull request (link aparece no PR).

Variáveis novas só valem depois de um novo deploy (*Deployments → … → Redeploy*).
