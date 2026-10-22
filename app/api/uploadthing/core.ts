import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { createClient } from "@/lib/supabase/server";
import { ROLES_GRUPO, ROLES_PAINEL_ADMIN } from "@/lib/auth/roles";

const f = createUploadthing();

export const ourFileRouter = {
  musicUploader: f({
    audio: {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const supabase = await createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new UploadThingError("Não autorizado");
      }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id, organizacao_id, role")
        .eq("id", user.id)
        .single();

      if (!usuario) {
        throw new UploadThingError("Usuário não encontrado");
      }

      if (!ROLES_GRUPO.includes(usuario.role)) {
        throw new UploadThingError("Sem permissão para upload");
      }

      return {
        userId: user.id,
        escolaId: usuario.id,
        organizacaoId: usuario.organizacao_id ?? null,
        tipo: "audio",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        escolaId: metadata.escolaId,
        organizacaoId: metadata.organizacaoId,
        tipo: metadata.tipo,
        url: file.ufsUrl,
        nome: file.name,
        tamanho: file.size,
      };
    }),

  mapaDeLuzUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const supabase = await createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new UploadThingError("Não autorizado");
      }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id, organizacao_id, role")
        .eq("id", user.id)
        .single();

      if (!usuario) {
        throw new UploadThingError("Usuário não encontrado");
      }

      if (!ROLES_GRUPO.includes(usuario.role)) {
        throw new UploadThingError("Sem permissão para upload");
      }

      return {
        userId: user.id,
        escolaId: usuario.id,
        organizacaoId: usuario.organizacao_id ?? null,
        tipo: "mapa_de_luz",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        escolaId: metadata.escolaId,
        organizacaoId: metadata.organizacaoId,
        tipo: metadata.tipo,
        url: file.ufsUrl,
        nome: file.name,
        tamanho: file.size,
      };
    }),

  imageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const supabase = await createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new UploadThingError("Não autorizado");
      }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id, produtora_id, role")
        .eq("id", user.id)
        .single();

      if (!usuario) {
        throw new UploadThingError("Usuário não encontrado");
      }

      // Permite o upload se o usuário pertencer a uma produtora ou for super admin
      if (!usuario.produtora_id && usuario.role !== "super_admin") {
        throw new UploadThingError("Sem permissão para upload de mídias do festival");
      }

      return {
        userId: user.id,
        produtoraId: usuario.produtora_id ?? null,
        tipo: "marketing_imagem",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        produtoraId: metadata.produtoraId,
        tipo: metadata.tipo,
        url: file.ufsUrl,
        nome: file.name,
        tamanho: file.size,
      };
    }),

  // Arquivos técnicos da apresentação (trilha, riders, mapas, cenário…).
  // Quem envia: o grupo dono ou a equipe da produtora. O vínculo com a
  // apresentação é gravado depois em apresentacao_arquivos (protegido por RLS).
  arquivoTecnico: f({
    audio: { maxFileSize: "64MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    image: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new UploadThingError("Não autorizado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("role, ativo")
        .eq("id", user.id)
        .single();

      if (!usuario || usuario.ativo === false || ![...ROLES_GRUPO, ...ROLES_PAINEL_ADMIN].includes(usuario.role)) {
        throw new UploadThingError("Sem permissão para upload");
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => ({
      uploadedBy: metadata.userId,
      url: file.ufsUrl,
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
    })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;