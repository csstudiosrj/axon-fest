// Gerado a partir de supabase/migrations (não editar à mão).
// Para regerar: ver README → "Banco de dados".

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      apresentacao_elenco: {
        Row: {
          apresentacao_id: string;
          participante_id: string;
        };
        Insert: {
          apresentacao_id: string;
          participante_id: string;
        };
        Update: {
          apresentacao_id?: string;
          participante_id?: string;
        };
        Relationships: [
          { foreignKeyName: "coreografia_elenco_bailarino_id_fkey"; columns: ["participante_id"]; isOneToOne: false; referencedRelation: "participantes"; referencedColumns: ["id"] },
          { foreignKeyName: "coreografia_elenco_coreografia_id_fkey"; columns: ["apresentacao_id"]; isOneToOne: false; referencedRelation: "apresentacoes"; referencedColumns: ["id"] },
        ];
      };
      apresentacoes: {
        Row: {
          id: string;
          evento_id: string | null;
          grupo_id: string | null;
          nome: string;
          categoria_id_old: string;
          tipo: string;
          quantidade_bailarinos: number | null;
          valor_total: number | null;
          status_pagamento: string | null;
          arquivo_audio: string | null;
          status_audio: string | null;
          ordem_apresentacao: number | null;
          created_at: string;
          observacoes: string | null;
          arquivo_mapa_luz: string | null;
          categoria_id: string | null;
          produtora_id: string | null;
          local_id: string | null;
          data_apresentacao: string | null;
          audio_duracao: number | null;
          audio_nome_original: string | null;
        };
        Insert: {
          id?: string;
          evento_id?: string | null;
          grupo_id?: string | null;
          nome: string;
          categoria_id_old: string;
          tipo: string;
          quantidade_bailarinos?: number | null;
          valor_total?: number | null;
          status_pagamento?: string | null;
          arquivo_audio?: string | null;
          status_audio?: string | null;
          ordem_apresentacao?: number | null;
          created_at?: string;
          observacoes?: string | null;
          arquivo_mapa_luz?: string | null;
          categoria_id?: string | null;
          produtora_id?: string | null;
          local_id?: string | null;
          data_apresentacao?: string | null;
          audio_duracao?: number | null;
          audio_nome_original?: string | null;
        };
        Update: {
          id?: string;
          evento_id?: string | null;
          grupo_id?: string | null;
          nome?: string;
          categoria_id_old?: string;
          tipo?: string;
          quantidade_bailarinos?: number | null;
          valor_total?: number | null;
          status_pagamento?: string | null;
          arquivo_audio?: string | null;
          status_audio?: string | null;
          ordem_apresentacao?: number | null;
          created_at?: string;
          observacoes?: string | null;
          arquivo_mapa_luz?: string | null;
          categoria_id?: string | null;
          produtora_id?: string | null;
          local_id?: string | null;
          data_apresentacao?: string | null;
          audio_duracao?: number | null;
          audio_nome_original?: string | null;
        };
        Relationships: [
          { foreignKeyName: "apresentacoes_categoria_id_fkey"; columns: ["categoria_id"]; isOneToOne: false; referencedRelation: "categorias"; referencedColumns: ["id"] },
          { foreignKeyName: "apresentacoes_local_id_fkey"; columns: ["local_id"]; isOneToOne: false; referencedRelation: "locais_evento"; referencedColumns: ["id"] },
          { foreignKeyName: "apresentacoes_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
          { foreignKeyName: "coreografias_escola_id_fkey"; columns: ["grupo_id"]; isOneToOne: false; referencedRelation: "grupos"; referencedColumns: ["id"] },
          { foreignKeyName: "coreografias_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
        ];
      };
      avaliacoes: {
        Row: {
          id: string;
          evento_id: string | null;
          apresentacao_id: string | null;
          avaliador_id: string | null;
          criterio_id: string | null;
          nota: number;
          sincronizado: boolean | null;
          created_at: string | null;
          produtora_id: string | null;
        };
        Insert: {
          id?: string;
          evento_id?: string | null;
          apresentacao_id?: string | null;
          avaliador_id?: string | null;
          criterio_id?: string | null;
          nota: number;
          sincronizado?: boolean | null;
          created_at?: string | null;
          produtora_id?: string | null;
        };
        Update: {
          id?: string;
          evento_id?: string | null;
          apresentacao_id?: string | null;
          avaliador_id?: string | null;
          criterio_id?: string | null;
          nota?: number;
          sincronizado?: boolean | null;
          created_at?: string | null;
          produtora_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "avaliacoes_coreografia_id_fkey"; columns: ["apresentacao_id"]; isOneToOne: false; referencedRelation: "apresentacoes"; referencedColumns: ["id"] },
          { foreignKeyName: "avaliacoes_criterio_id_fkey"; columns: ["criterio_id"]; isOneToOne: false; referencedRelation: "criterios_avaliacao"; referencedColumns: ["id"] },
          { foreignKeyName: "avaliacoes_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
          { foreignKeyName: "avaliacoes_jurado_id_fkey"; columns: ["avaliador_id"]; isOneToOne: false; referencedRelation: "usuarios"; referencedColumns: ["id"] },
          { foreignKeyName: "avaliacoes_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      categorias: {
        Row: {
          id: string;
          evento_id: string;
          nome: string;
          valor_solo: number | null;
          valor_duo: number | null;
          valor_conjunto: number | null;
          created_at: string | null;
          genero: string | null;
          faixa_etaria_min: number | null;
          faixa_etaria_max: number | null;
          faixa_etaria_label: string | null;
          categoria_pai_id: string | null;
          estilo_id: string | null;
          permite_solo: boolean | null;
          permite_duo: boolean | null;
          permite_conjunto: boolean | null;
          min_participantes: number | null;
          max_participantes: number | null;
          tempo_apresentacao_min: number | null;
          tempo_apresentacao_max: number | null;
          observacoes: string | null;
          cor_identificacao: string | null;
          produtora_id: string | null;
          competitiva: boolean | null;
          premio_dinheiro_1: number | null;
          premio_dinheiro_2: number | null;
          premio_dinheiro_3: number | null;
        };
        Insert: {
          id?: string;
          evento_id: string;
          nome: string;
          valor_solo?: number | null;
          valor_duo?: number | null;
          valor_conjunto?: number | null;
          created_at?: string | null;
          genero?: string | null;
          faixa_etaria_min?: number | null;
          faixa_etaria_max?: number | null;
          faixa_etaria_label?: string | null;
          categoria_pai_id?: string | null;
          estilo_id?: string | null;
          permite_solo?: boolean | null;
          permite_duo?: boolean | null;
          permite_conjunto?: boolean | null;
          min_participantes?: number | null;
          max_participantes?: number | null;
          tempo_apresentacao_min?: number | null;
          tempo_apresentacao_max?: number | null;
          observacoes?: string | null;
          cor_identificacao?: string | null;
          produtora_id?: string | null;
          competitiva?: boolean | null;
          premio_dinheiro_1?: number | null;
          premio_dinheiro_2?: number | null;
          premio_dinheiro_3?: number | null;
        };
        Update: {
          id?: string;
          evento_id?: string;
          nome?: string;
          valor_solo?: number | null;
          valor_duo?: number | null;
          valor_conjunto?: number | null;
          created_at?: string | null;
          genero?: string | null;
          faixa_etaria_min?: number | null;
          faixa_etaria_max?: number | null;
          faixa_etaria_label?: string | null;
          categoria_pai_id?: string | null;
          estilo_id?: string | null;
          permite_solo?: boolean | null;
          permite_duo?: boolean | null;
          permite_conjunto?: boolean | null;
          min_participantes?: number | null;
          max_participantes?: number | null;
          tempo_apresentacao_min?: number | null;
          tempo_apresentacao_max?: number | null;
          observacoes?: string | null;
          cor_identificacao?: string | null;
          produtora_id?: string | null;
          competitiva?: boolean | null;
          premio_dinheiro_1?: number | null;
          premio_dinheiro_2?: number | null;
          premio_dinheiro_3?: number | null;
        };
        Relationships: [
          { foreignKeyName: "categorias_categoria_pai_id_fkey"; columns: ["categoria_pai_id"]; isOneToOne: false; referencedRelation: "categorias"; referencedColumns: ["id"] },
          { foreignKeyName: "categorias_estilo_id_fkey"; columns: ["estilo_id"]; isOneToOne: false; referencedRelation: "estilos"; referencedColumns: ["id"] },
          { foreignKeyName: "categorias_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
          { foreignKeyName: "categorias_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      criterios_avaliacao: {
        Row: {
          id: string;
          evento_id: string | null;
          nome: string;
          nota_min: number;
          nota_max: number;
          ordem: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          evento_id?: string | null;
          nome: string;
          nota_min?: number;
          nota_max?: number;
          ordem?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          evento_id?: string | null;
          nome?: string;
          nota_min?: number;
          nota_max?: number;
          ordem?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "criterios_avaliacao_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
        ];
      };
      estilos: {
        Row: {
          id: string;
          perfil_id: string;
          nome: string;
          slug: string;
          ativo: boolean;
          ordem: number | null;
          created_at: string;
          descricao: string | null;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          nome: string;
          slug: string;
          ativo?: boolean;
          ordem?: number | null;
          created_at?: string;
          descricao?: string | null;
        };
        Update: {
          id?: string;
          perfil_id?: string;
          nome?: string;
          slug?: string;
          ativo?: boolean;
          ordem?: number | null;
          created_at?: string;
          descricao?: string | null;
        };
        Relationships: [
          { foreignKeyName: "estilos_perfil_id_fkey"; columns: ["perfil_id"]; isOneToOne: false; referencedRelation: "perfis_festival"; referencedColumns: ["id"] },
        ];
      };
      evento_jurados: {
        Row: {
          id: string;
          evento_id: string;
          jurado_id: string;
          created_at: string;
          cache_valor: number | null;
          cache_status: string | null;
          especialidade: string | null;
        };
        Insert: {
          id?: string;
          evento_id: string;
          jurado_id: string;
          created_at?: string;
          cache_valor?: number | null;
          cache_status?: string | null;
          especialidade?: string | null;
        };
        Update: {
          id?: string;
          evento_id?: string;
          jurado_id?: string;
          created_at?: string;
          cache_valor?: number | null;
          cache_status?: string | null;
          especialidade?: string | null;
        };
        Relationships: [
          { foreignKeyName: "evento_jurados_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
          { foreignKeyName: "evento_jurados_jurado_id_fkey"; columns: ["jurado_id"]; isOneToOne: false; referencedRelation: "usuarios"; referencedColumns: ["id"] },
        ];
      };
      evento_produtos: {
        Row: {
          id: string;
          evento_id: string;
          produto_id: string;
          preco_evento: number | null;
          estoque_evento: number | null;
          ativo_evento: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          produto_id: string;
          preco_evento?: number | null;
          estoque_evento?: number | null;
          ativo_evento?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          produto_id?: string;
          preco_evento?: number | null;
          estoque_evento?: number | null;
          ativo_evento?: boolean | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "evento_produtos_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
          { foreignKeyName: "evento_produtos_produto_id_fkey"; columns: ["produto_id"]; isOneToOne: false; referencedRelation: "pdv_produtos"; referencedColumns: ["id"] },
        ];
      };
      eventos: {
        Row: {
          id: string;
          nome: string;
          data_inicio: string | null;
          data_fim: string | null;
          local: string | null;
          status: string | null;
          inscritos_count: number | null;
          created_at: string;
          descricao: string | null;
          banner_url: string | null;
          regulamento_url: string | null;
          produtora_id: string | null;
          perfil_id: string | null;
          formato: string | null;
          tipo_premiacao: string | null;
          multilocal: boolean | null;
          slug: string | null;
          cor_primaria: string | null;
          cor_secundaria: string | null;
          fonte_familia: string | null;
          logo_url: string | null;
          tema_escuro: boolean | null;
          exibir_loja_publica: boolean | null;
          instagram_handle: string | null;
          exibir_feed_instagram: boolean | null;
          termo_imagem_url: string | null;
          autorizacao_menor_url: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          data_inicio?: string | null;
          data_fim?: string | null;
          local?: string | null;
          status?: string | null;
          inscritos_count?: number | null;
          created_at?: string;
          descricao?: string | null;
          banner_url?: string | null;
          regulamento_url?: string | null;
          produtora_id?: string | null;
          perfil_id?: string | null;
          formato?: string | null;
          tipo_premiacao?: string | null;
          multilocal?: boolean | null;
          slug?: string | null;
          cor_primaria?: string | null;
          cor_secundaria?: string | null;
          fonte_familia?: string | null;
          logo_url?: string | null;
          tema_escuro?: boolean | null;
          exibir_loja_publica?: boolean | null;
          instagram_handle?: string | null;
          exibir_feed_instagram?: boolean | null;
          termo_imagem_url?: string | null;
          autorizacao_menor_url?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          data_inicio?: string | null;
          data_fim?: string | null;
          local?: string | null;
          status?: string | null;
          inscritos_count?: number | null;
          created_at?: string;
          descricao?: string | null;
          banner_url?: string | null;
          regulamento_url?: string | null;
          produtora_id?: string | null;
          perfil_id?: string | null;
          formato?: string | null;
          tipo_premiacao?: string | null;
          multilocal?: boolean | null;
          slug?: string | null;
          cor_primaria?: string | null;
          cor_secundaria?: string | null;
          fonte_familia?: string | null;
          logo_url?: string | null;
          tema_escuro?: boolean | null;
          exibir_loja_publica?: boolean | null;
          instagram_handle?: string | null;
          exibir_feed_instagram?: boolean | null;
          termo_imagem_url?: string | null;
          autorizacao_menor_url?: string | null;
        };
        Relationships: [
          { foreignKeyName: "eventos_perfil_id_fkey"; columns: ["perfil_id"]; isOneToOne: false; referencedRelation: "perfis_festival"; referencedColumns: ["id"] },
          { foreignKeyName: "eventos_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      grupo_participante: {
        Row: {
          id: string;
          grupo_id: string;
          participante_id: string;
          data_vinculo: string | null;
          status: string | null;
          bloqueado_por_produtora: string | null;
          funcao: string | null;
          confirmado: boolean;
          token_confirmacao: string | null;
        };
        Insert: {
          id?: string;
          grupo_id: string;
          participante_id: string;
          data_vinculo?: string | null;
          status?: string | null;
          bloqueado_por_produtora?: string | null;
          funcao?: string | null;
          confirmado?: boolean;
          token_confirmacao?: string | null;
        };
        Update: {
          id?: string;
          grupo_id?: string;
          participante_id?: string;
          data_vinculo?: string | null;
          status?: string | null;
          bloqueado_por_produtora?: string | null;
          funcao?: string | null;
          confirmado?: boolean;
          token_confirmacao?: string | null;
        };
        Relationships: [
          { foreignKeyName: "grupo_participante_grupo_id_fkey"; columns: ["grupo_id"]; isOneToOne: false; referencedRelation: "grupos"; referencedColumns: ["id"] },
          { foreignKeyName: "grupo_participante_participante_id_fkey"; columns: ["participante_id"]; isOneToOne: false; referencedRelation: "participantes"; referencedColumns: ["id"] },
        ];
      };
      grupos: {
        Row: {
          id: string;
          nome: string;
          responsavel: string | null;
          telefone: string | null;
          email: string;
          created_at: string;
          cidade: string | null;
          estado: string | null;
          documento: string | null;
          produtora_id: string | null;
          email_contato: string | null;
          tipo_documento: string | null;
          origem_produtora_id: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          responsavel?: string | null;
          telefone?: string | null;
          email: string;
          created_at?: string;
          cidade?: string | null;
          estado?: string | null;
          documento?: string | null;
          produtora_id?: string | null;
          email_contato?: string | null;
          tipo_documento?: string | null;
          origem_produtora_id?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          responsavel?: string | null;
          telefone?: string | null;
          email?: string;
          created_at?: string;
          cidade?: string | null;
          estado?: string | null;
          documento?: string | null;
          produtora_id?: string | null;
          email_contato?: string | null;
          tipo_documento?: string | null;
          origem_produtora_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "grupos_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      inscricoes_grupo_evento: {
        Row: {
          id: string;
          grupo_id: string;
          evento_id: string;
          data_inscricao: string | null;
          status: string | null;
          created_at: string | null;
          origem: string | null;
        };
        Insert: {
          id?: string;
          grupo_id: string;
          evento_id: string;
          data_inscricao?: string | null;
          status?: string | null;
          created_at?: string | null;
          origem?: string | null;
        };
        Update: {
          id?: string;
          grupo_id?: string;
          evento_id?: string;
          data_inscricao?: string | null;
          status?: string | null;
          created_at?: string | null;
          origem?: string | null;
        };
        Relationships: [
          { foreignKeyName: "inscricoes_grupo_evento_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
          { foreignKeyName: "inscricoes_grupo_evento_grupo_id_fkey"; columns: ["grupo_id"]; isOneToOne: false; referencedRelation: "grupos"; referencedColumns: ["id"] },
        ];
      };
      locais_evento: {
        Row: {
          id: string;
          evento_id: string;
          nome_local: string;
          endereco: string | null;
          cidade: string | null;
          estado: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          nome_local: string;
          endereco?: string | null;
          cidade?: string | null;
          estado?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          nome_local?: string;
          endereco?: string | null;
          cidade?: string | null;
          estado?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "locais_evento_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
        ];
      };
      participacoes_participante_grupo_evento: {
        Row: {
          id: string;
          participante_id: string;
          grupo_id: string;
          evento_id: string;
          data_vinculo: string | null;
          confirmado: boolean | null;
          status_disponibilidade: string | null;
          token_confirmacao: string | null;
        };
        Insert: {
          id?: string;
          participante_id: string;
          grupo_id: string;
          evento_id: string;
          data_vinculo?: string | null;
          confirmado?: boolean | null;
          status_disponibilidade?: string | null;
          token_confirmacao?: string | null;
        };
        Update: {
          id?: string;
          participante_id?: string;
          grupo_id?: string;
          evento_id?: string;
          data_vinculo?: string | null;
          confirmado?: boolean | null;
          status_disponibilidade?: string | null;
          token_confirmacao?: string | null;
        };
        Relationships: [
          { foreignKeyName: "participacoes_participante_grupo_evento_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
          { foreignKeyName: "participacoes_participante_grupo_evento_grupo_id_fkey"; columns: ["grupo_id"]; isOneToOne: false; referencedRelation: "grupos"; referencedColumns: ["id"] },
          { foreignKeyName: "participacoes_participante_grupo_evento_participante_id_fkey"; columns: ["participante_id"]; isOneToOne: false; referencedRelation: "participantes"; referencedColumns: ["id"] },
        ];
      };
      participantes: {
        Row: {
          id: string;
          nome: string;
          data_nascimento: string;
          documento: string | null;
          termo_assinado: boolean | null;
          created_at: string;
          estilo_id: string | null;
          produtora_id: string | null;
          festival_id: string | null;
          status_disponibilidade: string | null;
          confirmado_vinculo: boolean | null;
          email_contato: string | null;
          tipo_documento: string | null;
          origem_produtora_id: string | null;
          funcao: string | null;
          nome_artistico: string | null;
          responsavel_nome: string | null;
          responsavel_cpf: string | null;
          responsavel_parentesco: string | null;
          termo_assinado_em: string | null;
          termo_assinado_ip: string | null;
          termo_assinado_user_agent: string | null;
          criado_por: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          data_nascimento: string;
          documento?: string | null;
          termo_assinado?: boolean | null;
          created_at?: string;
          estilo_id?: string | null;
          produtora_id?: string | null;
          festival_id?: string | null;
          status_disponibilidade?: string | null;
          confirmado_vinculo?: boolean | null;
          email_contato?: string | null;
          tipo_documento?: string | null;
          origem_produtora_id?: string | null;
          funcao?: string | null;
          nome_artistico?: string | null;
          responsavel_nome?: string | null;
          responsavel_cpf?: string | null;
          responsavel_parentesco?: string | null;
          termo_assinado_em?: string | null;
          termo_assinado_ip?: string | null;
          termo_assinado_user_agent?: string | null;
          criado_por?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          data_nascimento?: string;
          documento?: string | null;
          termo_assinado?: boolean | null;
          created_at?: string;
          estilo_id?: string | null;
          produtora_id?: string | null;
          festival_id?: string | null;
          status_disponibilidade?: string | null;
          confirmado_vinculo?: boolean | null;
          email_contato?: string | null;
          tipo_documento?: string | null;
          origem_produtora_id?: string | null;
          funcao?: string | null;
          nome_artistico?: string | null;
          responsavel_nome?: string | null;
          responsavel_cpf?: string | null;
          responsavel_parentesco?: string | null;
          termo_assinado_em?: string | null;
          termo_assinado_ip?: string | null;
          termo_assinado_user_agent?: string | null;
          criado_por?: string | null;
        };
        Relationships: [
          { foreignKeyName: "participantes_criado_por_fkey"; columns: ["criado_por"]; isOneToOne: false; referencedRelation: "usuarios"; referencedColumns: ["id"] },
          { foreignKeyName: "participantes_estilo_id_fkey"; columns: ["estilo_id"]; isOneToOne: false; referencedRelation: "estilos"; referencedColumns: ["id"] },
          { foreignKeyName: "participantes_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      participantes_bloqueados: {
        Row: {
          id: string;
          participante_id: string | null;
          produtora_id: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          participante_id?: string | null;
          produtora_id: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          participante_id?: string | null;
          produtora_id?: string;
          criado_em?: string;
        };
        Relationships: [
          { foreignKeyName: "participantes_bloqueados_participante_id_fkey"; columns: ["participante_id"]; isOneToOne: false; referencedRelation: "participantes"; referencedColumns: ["id"] },
        ];
      };
      pdv_config: {
        Row: {
          id: string;
          pin_vendedor: string | null;
          pix_chave: string | null;
          pix_nome: string | null;
          pix_cidade: string | null;
          criado_em: string;
          atualizado_em: string;
          produtora_id: string | null;
          pin_admin: string | null;
        };
        Insert: {
          id?: string;
          pin_vendedor?: string | null;
          pix_chave?: string | null;
          pix_nome?: string | null;
          pix_cidade?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          produtora_id?: string | null;
          pin_admin?: string | null;
        };
        Update: {
          id?: string;
          pin_vendedor?: string | null;
          pix_chave?: string | null;
          pix_nome?: string | null;
          pix_cidade?: string | null;
          criado_em?: string;
          atualizado_em?: string;
          produtora_id?: string | null;
          pin_admin?: string | null;
        };
        Relationships: [
          { foreignKeyName: "pdv_config_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      pdv_produtos: {
        Row: {
          id: string;
          nome: string;
          preco: number;
          categoria: string | null;
          tipo: string;
          estoque: number | null;
          ativo: boolean;
          created_at: string;
          ordem: number | null;
          evento_id: string | null;
          descricao: string | null;
          produtora_id: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          preco?: number;
          categoria?: string | null;
          tipo?: string;
          estoque?: number | null;
          ativo?: boolean;
          created_at?: string;
          ordem?: number | null;
          evento_id?: string | null;
          descricao?: string | null;
          produtora_id?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          preco?: number;
          categoria?: string | null;
          tipo?: string;
          estoque?: number | null;
          ativo?: boolean;
          created_at?: string;
          ordem?: number | null;
          evento_id?: string | null;
          descricao?: string | null;
          produtora_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "pdv_produtos_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
          { foreignKeyName: "pdv_produtos_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      pdv_vendas: {
        Row: {
          id: string;
          operador_id: string | null;
          itens: Json;
          total: number;
          forma_pagamento: string;
          sincronizado: boolean;
          created_at: string;
          produtora_id: string | null;
          evento_id: string | null;
          produto_id: string | null;
          produto_nome: string | null;
          quantidade: number;
          preco_unitario: number;
          operador_nome: string | null;
        };
        Insert: {
          id?: string;
          operador_id?: string | null;
          itens?: Json;
          total?: number;
          forma_pagamento: string;
          sincronizado?: boolean;
          created_at?: string;
          produtora_id?: string | null;
          evento_id?: string | null;
          produto_id?: string | null;
          produto_nome?: string | null;
          quantidade?: number;
          preco_unitario?: number;
          operador_nome?: string | null;
        };
        Update: {
          id?: string;
          operador_id?: string | null;
          itens?: Json;
          total?: number;
          forma_pagamento?: string;
          sincronizado?: boolean;
          created_at?: string;
          produtora_id?: string | null;
          evento_id?: string | null;
          produto_id?: string | null;
          produto_nome?: string | null;
          quantidade?: number;
          preco_unitario?: number;
          operador_nome?: string | null;
        };
        Relationships: [
          { foreignKeyName: "pdv_vendas_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
          { foreignKeyName: "pdv_vendas_operador_id_fkey"; columns: ["operador_id"]; isOneToOne: false; referencedRelation: "usuarios"; referencedColumns: ["id"] },
          { foreignKeyName: "pdv_vendas_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      pedido_itens: {
        Row: {
          id: string;
          escola_id: string;
          coreografia_id: string | null;
          produto_id: string;
          variacao_id: string | null;
          quantidade: number;
          preco_unitario: number;
          status: string;
          created_at: string;
          produtora_id: string | null;
        };
        Insert: {
          id?: string;
          escola_id: string;
          coreografia_id?: string | null;
          produto_id: string;
          variacao_id?: string | null;
          quantidade?: number;
          preco_unitario?: number;
          status?: string;
          created_at?: string;
          produtora_id?: string | null;
        };
        Update: {
          id?: string;
          escola_id?: string;
          coreografia_id?: string | null;
          produto_id?: string;
          variacao_id?: string | null;
          quantidade?: number;
          preco_unitario?: number;
          status?: string;
          created_at?: string;
          produtora_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "pedido_itens_coreografia_id_fkey"; columns: ["coreografia_id"]; isOneToOne: false; referencedRelation: "apresentacoes"; referencedColumns: ["id"] },
          { foreignKeyName: "pedido_itens_escola_id_fkey"; columns: ["escola_id"]; isOneToOne: false; referencedRelation: "grupos"; referencedColumns: ["id"] },
          { foreignKeyName: "pedido_itens_produto_id_fkey"; columns: ["produto_id"]; isOneToOne: false; referencedRelation: "produtos"; referencedColumns: ["id"] },
          { foreignKeyName: "pedido_itens_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
          { foreignKeyName: "pedido_itens_variacao_id_fkey"; columns: ["variacao_id"]; isOneToOne: false; referencedRelation: "produto_variacoes"; referencedColumns: ["id"] },
        ];
      };
      perfis_festival: {
        Row: {
          id: string;
          slug: string;
          nome: string;
          icone: string | null;
          descricao: string | null;
          ativo: boolean;
          ordem: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nome: string;
          icone?: string | null;
          descricao?: string | null;
          ativo?: boolean;
          ordem?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nome?: string;
          icone?: string | null;
          descricao?: string | null;
          ativo?: boolean;
          ordem?: number | null;
          created_at?: string;
        };
        Relationships: [
        ];
      };
      posts_marketing: {
        Row: {
          id: string;
          legenda: string;
          imagem_url: string | null;
          agendado_para: string;
          status: string;
          plataforma: string;
          publicado_em: string | null;
          erro: string | null;
          created_at: string;
          produtora_id: string | null;
        };
        Insert: {
          id?: string;
          legenda: string;
          imagem_url?: string | null;
          agendado_para: string;
          status?: string;
          plataforma?: string;
          publicado_em?: string | null;
          erro?: string | null;
          created_at?: string;
          produtora_id?: string | null;
        };
        Update: {
          id?: string;
          legenda?: string;
          imagem_url?: string | null;
          agendado_para?: string;
          status?: string;
          plataforma?: string;
          publicado_em?: string | null;
          erro?: string | null;
          created_at?: string;
          produtora_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "posts_marketing_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      produto_variacoes: {
        Row: {
          id: string;
          produto_id: string;
          nome: string;
          estoque: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          produto_id: string;
          nome: string;
          estoque?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          produto_id?: string;
          nome?: string;
          estoque?: number | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "produto_variacoes_produto_id_fkey"; columns: ["produto_id"]; isOneToOne: false; referencedRelation: "produtos"; referencedColumns: ["id"] },
        ];
      };
      produtoras: {
        Row: {
          id: string;
          nome: string;
          documento: string | null;
          email: string | null;
          created_at: string | null;
          telefone: string | null;
          logo_url: string | null;
          ativo: boolean;
        };
        Insert: {
          id?: string;
          nome: string;
          documento?: string | null;
          email?: string | null;
          created_at?: string | null;
          telefone?: string | null;
          logo_url?: string | null;
          ativo?: boolean;
        };
        Update: {
          id?: string;
          nome?: string;
          documento?: string | null;
          email?: string | null;
          created_at?: string | null;
          telefone?: string | null;
          logo_url?: string | null;
          ativo?: boolean;
        };
        Relationships: [
        ];
      };
      produtos: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          preco: number;
          estoque: number | null;
          tem_variacao: boolean;
          ativo: boolean;
          mostrar_checkout: boolean;
          created_at: string;
          imagem_url: string | null;
          exibir_imagem: boolean | null;
          exibir_loja_publica: boolean | null;
          produtora_id: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          preco?: number;
          estoque?: number | null;
          tem_variacao?: boolean;
          ativo?: boolean;
          mostrar_checkout?: boolean;
          created_at?: string;
          imagem_url?: string | null;
          exibir_imagem?: boolean | null;
          exibir_loja_publica?: boolean | null;
          produtora_id?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          preco?: number;
          estoque?: number | null;
          tem_variacao?: boolean;
          ativo?: boolean;
          mostrar_checkout?: boolean;
          created_at?: string;
          imagem_url?: string | null;
          exibir_imagem?: boolean | null;
          exibir_loja_publica?: boolean | null;
          produtora_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "produtos_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      tenant_config: {
        Row: {
          id: string;
          perfil_id: string | null;
          nome_organizacao: string | null;
          configurado_em: string | null;
          termo_inscricao: string | null;
          termo_participante: string | null;
          termo_grupo: string | null;
          updated_at: string;
          termo_apresentacao: string | null;
          organizacao_id: string | null;
          produtora_id: string | null;
          logo_url: string | null;
          cor_primaria: string | null;
          nome_exibicao: string | null;
          termo_grupo_plural: string | null;
          termo_participante_plural: string | null;
          termo_apresentacao_plural: string | null;
          termo_evento: string | null;
          termo_legal_texto: string | null;
        };
        Insert: {
          id?: string;
          perfil_id?: string | null;
          nome_organizacao?: string | null;
          configurado_em?: string | null;
          termo_inscricao?: string | null;
          termo_participante?: string | null;
          termo_grupo?: string | null;
          updated_at?: string;
          termo_apresentacao?: string | null;
          organizacao_id?: string | null;
          produtora_id?: string | null;
          logo_url?: string | null;
          cor_primaria?: string | null;
          nome_exibicao?: string | null;
          termo_grupo_plural?: string | null;
          termo_participante_plural?: string | null;
          termo_apresentacao_plural?: string | null;
          termo_evento?: string | null;
          termo_legal_texto?: string | null;
        };
        Update: {
          id?: string;
          perfil_id?: string | null;
          nome_organizacao?: string | null;
          configurado_em?: string | null;
          termo_inscricao?: string | null;
          termo_participante?: string | null;
          termo_grupo?: string | null;
          updated_at?: string;
          termo_apresentacao?: string | null;
          organizacao_id?: string | null;
          produtora_id?: string | null;
          logo_url?: string | null;
          cor_primaria?: string | null;
          nome_exibicao?: string | null;
          termo_grupo_plural?: string | null;
          termo_participante_plural?: string | null;
          termo_apresentacao_plural?: string | null;
          termo_evento?: string | null;
          termo_legal_texto?: string | null;
        };
        Relationships: [
          { foreignKeyName: "tenant_config_escola_id_fkey"; columns: ["organizacao_id"]; isOneToOne: false; referencedRelation: "usuarios"; referencedColumns: ["id"] },
          { foreignKeyName: "tenant_config_perfil_id_fkey"; columns: ["perfil_id"]; isOneToOne: false; referencedRelation: "perfis_festival"; referencedColumns: ["id"] },
          { foreignKeyName: "tenant_config_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      tenant_estilos_ativos: {
        Row: {
          id: string;
          estilo_id: string;
          ativo: boolean;
          created_at: string;
          organizacao_id: string | null;
          produtora_id: string;
        };
        Insert: {
          id?: string;
          estilo_id: string;
          ativo?: boolean;
          created_at?: string;
          organizacao_id?: string | null;
          produtora_id: string;
        };
        Update: {
          id?: string;
          estilo_id?: string;
          ativo?: boolean;
          created_at?: string;
          organizacao_id?: string | null;
          produtora_id?: string;
        };
        Relationships: [
          { foreignKeyName: "tenant_estilos_ativos_escola_id_fkey"; columns: ["organizacao_id"]; isOneToOne: false; referencedRelation: "usuarios"; referencedColumns: ["id"] },
          { foreignKeyName: "tenant_estilos_ativos_estilo_id_fkey"; columns: ["estilo_id"]; isOneToOne: false; referencedRelation: "estilos"; referencedColumns: ["id"] },
          { foreignKeyName: "tenant_estilos_ativos_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      termos_aceites: {
        Row: {
          id: string;
          documento_id: string;
          usuario_id: string | null;
          bailarino_id: string | null;
          nome_assinante: string | null;
          email_assinante: string | null;
          ip_address: string | null;
          user_agent: string | null;
          tipo_assinante: string;
          aceito_em: string;
        };
        Insert: {
          id?: string;
          documento_id: string;
          usuario_id?: string | null;
          bailarino_id?: string | null;
          nome_assinante?: string | null;
          email_assinante?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          tipo_assinante: string;
          aceito_em?: string;
        };
        Update: {
          id?: string;
          documento_id?: string;
          usuario_id?: string | null;
          bailarino_id?: string | null;
          nome_assinante?: string | null;
          email_assinante?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          tipo_assinante?: string;
          aceito_em?: string;
        };
        Relationships: [
          { foreignKeyName: "termos_aceites_bailarino_id_fkey"; columns: ["bailarino_id"]; isOneToOne: false; referencedRelation: "participantes"; referencedColumns: ["id"] },
          { foreignKeyName: "termos_aceites_documento_id_fkey"; columns: ["documento_id"]; isOneToOne: false; referencedRelation: "termos_documentos"; referencedColumns: ["id"] },
          { foreignKeyName: "termos_aceites_usuario_id_fkey"; columns: ["usuario_id"]; isOneToOne: false; referencedRelation: "usuarios"; referencedColumns: ["id"] },
        ];
      };
      termos_documentos: {
        Row: {
          id: string;
          tipo: string;
          titulo: string;
          conteudo: string;
          versao: number;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
          evento_id: string | null;
          produtora_id: string | null;
          exibir_publico: boolean | null;
          formato: string | null;
          arquivo_url: string | null;
        };
        Insert: {
          id?: string;
          tipo: string;
          titulo: string;
          conteudo?: string;
          versao?: number;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
          evento_id?: string | null;
          produtora_id?: string | null;
          exibir_publico?: boolean | null;
          formato?: string | null;
          arquivo_url?: string | null;
        };
        Update: {
          id?: string;
          tipo?: string;
          titulo?: string;
          conteudo?: string;
          versao?: number;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
          evento_id?: string | null;
          produtora_id?: string | null;
          exibir_publico?: boolean | null;
          formato?: string | null;
          arquivo_url?: string | null;
        };
        Relationships: [
          { foreignKeyName: "termos_documentos_evento_id_fkey"; columns: ["evento_id"]; isOneToOne: false; referencedRelation: "eventos"; referencedColumns: ["id"] },
          { foreignKeyName: "termos_documentos_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
      usuarios: {
        Row: {
          id: string;
          email: string;
          nome: string | null;
          role: string;
          organizacao_id: string | null;
          created_at: string | null;
          invite_token: string | null;
          invite_usado: boolean | null;
          especialidade: string | null;
          cache_valor: number | null;
          cache_status: string | null;
          telefone: string | null;
          foto_url: string | null;
          produtora_id: string | null;
          ativo: boolean;
          mini_bio: string | null;
        };
        Insert: {
          id: string;
          email: string;
          nome?: string | null;
          role: string;
          organizacao_id?: string | null;
          created_at?: string | null;
          invite_token?: string | null;
          invite_usado?: boolean | null;
          especialidade?: string | null;
          cache_valor?: number | null;
          cache_status?: string | null;
          telefone?: string | null;
          foto_url?: string | null;
          produtora_id?: string | null;
          ativo?: boolean;
          mini_bio?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          nome?: string | null;
          role?: string;
          organizacao_id?: string | null;
          created_at?: string | null;
          invite_token?: string | null;
          invite_usado?: boolean | null;
          especialidade?: string | null;
          cache_valor?: number | null;
          cache_status?: string | null;
          telefone?: string | null;
          foto_url?: string | null;
          produtora_id?: string | null;
          ativo?: boolean;
          mini_bio?: string | null;
        };
        Relationships: [
          { foreignKeyName: "usuarios_escola_id_fkey"; columns: ["organizacao_id"]; isOneToOne: false; referencedRelation: "grupos"; referencedColumns: ["id"] },
          { foreignKeyName: "usuarios_produtora_id_fkey"; columns: ["produtora_id"]; isOneToOne: false; referencedRelation: "produtoras"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: {
      jurados_publicos: {
        Row: {
          evento_id: string | null;
          jurado_id: string | null;
          nome: string | null;
          foto_url: string | null;
          especialidade: string | null;
          mini_bio: string | null;
        };
        Relationships: [
        ];
      };
    };
    Functions: {
      grupo_por_documento: { Args: { p_documento: string }; Returns: { id: string; nome: string; email_mascarado: string }[] };
      get_meu_role: { Args: Record<PropertyKey, never>; Returns: string };
      get_minha_produtora_id: { Args: Record<PropertyKey, never>; Returns: string };
      get_minha_organizacao_id: { Args: Record<PropertyKey, never>; Returns: string };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type Public = Database["public"];
export type Tabela<T extends keyof Public["Tables"]> = Public["Tables"][T]["Row"];
export type NovaLinha<T extends keyof Public["Tables"]> = Public["Tables"][T]["Insert"];
