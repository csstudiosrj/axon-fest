
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "apresentacao_arquivos": {
                  Row: {
                    "apresentacao_id": string,"created_at": string,"enviado_por": string | null,"id": string,"mime": string | null,"nome": string | null,"observacao": string | null,"status": string,"tamanho": number | null,"tipo": string,"updated_at": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "apresentacao_id": string,"created_at"?: string,"enviado_por"?: string | null,"id"?: string,"mime"?: string | null,"nome"?: string | null,"observacao"?: string | null,"status"?: string,"tamanho"?: number | null,"tipo": string,"updated_at"?: string,"url": string
                  }
                  Update: {
                    "apresentacao_id"?: string,"created_at"?: string,"enviado_por"?: string | null,"id"?: string,"mime"?: string | null,"nome"?: string | null,"observacao"?: string | null,"status"?: string,"tamanho"?: number | null,"tipo"?: string,"updated_at"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "apresentacao_arquivos_apresentacao_id_fkey"
      columns: ["apresentacao_id"]
isOneToOne: false
      referencedRelation: "apresentacoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "apresentacao_arquivos_enviado_por_fkey"
      columns: ["enviado_por"]
isOneToOne: false
      referencedRelation: "jurados_publicos"
      referencedColumns: ["jurado_id"]
    },{
      foreignKeyName: "apresentacao_arquivos_enviado_por_fkey"
      columns: ["enviado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"apresentacao_elenco": {
                  Row: {
                    "apresentacao_id": string,"participante_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "apresentacao_id": string,"participante_id": string
                  }
                  Update: {
                    "apresentacao_id"?: string,"participante_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "coreografia_elenco_bailarino_id_fkey"
      columns: ["participante_id"]
isOneToOne: false
      referencedRelation: "participantes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coreografia_elenco_coreografia_id_fkey"
      columns: ["apresentacao_id"]
isOneToOne: false
      referencedRelation: "apresentacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"apresentacoes": {
                  Row: {
                    "arquivo_audio": string | null,"arquivo_mapa_luz": string | null,"audio_duracao": number | null,"audio_nome_original": string | null,"categoria_id": string | null,"categoria_id_old": string,"created_at": string,"data_apresentacao": string | null,"desempate": number | null,"evento_id": string | null,"grupo_id": string | null,"id": string,"local_id": string | null,"nome": string,"observacoes": string | null,"ordem_apresentacao": number | null,"produtora_id": string | null,"quantidade_bailarinos": number | null,"status_audio": string | null,"status_pagamento": string | null,"tipo": string,"valor_total": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "arquivo_audio"?: string | null,"arquivo_mapa_luz"?: string | null,"audio_duracao"?: number | null,"audio_nome_original"?: string | null,"categoria_id"?: string | null,"categoria_id_old": string,"created_at"?: string,"data_apresentacao"?: string | null,"desempate"?: number | null,"evento_id"?: string | null,"grupo_id"?: string | null,"id"?: string,"local_id"?: string | null,"nome": string,"observacoes"?: string | null,"ordem_apresentacao"?: number | null,"produtora_id"?: string | null,"quantidade_bailarinos"?: number | null,"status_audio"?: string | null,"status_pagamento"?: string | null,"tipo": string,"valor_total"?: number | null
                  }
                  Update: {
                    "arquivo_audio"?: string | null,"arquivo_mapa_luz"?: string | null,"audio_duracao"?: number | null,"audio_nome_original"?: string | null,"categoria_id"?: string | null,"categoria_id_old"?: string,"created_at"?: string,"data_apresentacao"?: string | null,"desempate"?: number | null,"evento_id"?: string | null,"grupo_id"?: string | null,"id"?: string,"local_id"?: string | null,"nome"?: string,"observacoes"?: string | null,"ordem_apresentacao"?: number | null,"produtora_id"?: string | null,"quantidade_bailarinos"?: number | null,"status_audio"?: string | null,"status_pagamento"?: string | null,"tipo"?: string,"valor_total"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "apresentacoes_categoria_id_fkey"
      columns: ["categoria_id"]
isOneToOne: false
      referencedRelation: "categorias"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "apresentacoes_local_id_fkey"
      columns: ["local_id"]
isOneToOne: false
      referencedRelation: "locais_evento"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "apresentacoes_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coreografias_escola_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coreografias_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    }
                  ]
                },"avaliacoes": {
                  Row: {
                    "apresentacao_id": string | null,"atualizado_em": string,"avaliador_id": string | null,"created_at": string | null,"criterio_id": string | null,"evento_id": string | null,"id": string,"nota": number,"produtora_id": string | null,"sincronizado": boolean | null
                  }
                  ComputedFields: never
                  Insert: {
                    "apresentacao_id"?: string | null,"atualizado_em"?: string,"avaliador_id"?: string | null,"created_at"?: string | null,"criterio_id"?: string | null,"evento_id"?: string | null,"id"?: string,"nota": number,"produtora_id"?: string | null,"sincronizado"?: boolean | null
                  }
                  Update: {
                    "apresentacao_id"?: string | null,"atualizado_em"?: string,"avaliador_id"?: string | null,"created_at"?: string | null,"criterio_id"?: string | null,"evento_id"?: string | null,"id"?: string,"nota"?: number,"produtora_id"?: string | null,"sincronizado"?: boolean | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "avaliacoes_coreografia_id_fkey"
      columns: ["apresentacao_id"]
isOneToOne: false
      referencedRelation: "apresentacoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "avaliacoes_criterio_id_fkey"
      columns: ["criterio_id"]
isOneToOne: false
      referencedRelation: "criterios_avaliacao"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "avaliacoes_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "avaliacoes_jurado_id_fkey"
      columns: ["avaliador_id"]
isOneToOne: false
      referencedRelation: "jurados_publicos"
      referencedColumns: ["jurado_id"]
    },{
      foreignKeyName: "avaliacoes_jurado_id_fkey"
      columns: ["avaliador_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "avaliacoes_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"avaliacoes_fichas": {
                  Row: {
                    "apresentacao_id": string,"atualizado_em": string,"avaliador_id": string,"comentario": string | null,"created_at": string,"evento_id": string,"finalizada_em": string | null,"id": string,"origem": string
                  }
                  ComputedFields: never
                  Insert: {
                    "apresentacao_id": string,"atualizado_em"?: string,"avaliador_id": string,"comentario"?: string | null,"created_at"?: string,"evento_id": string,"finalizada_em"?: string | null,"id"?: string,"origem"?: string
                  }
                  Update: {
                    "apresentacao_id"?: string,"atualizado_em"?: string,"avaliador_id"?: string,"comentario"?: string | null,"created_at"?: string,"evento_id"?: string,"finalizada_em"?: string | null,"id"?: string,"origem"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "avaliacoes_fichas_apresentacao_id_fkey"
      columns: ["apresentacao_id"]
isOneToOne: false
      referencedRelation: "apresentacoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "avaliacoes_fichas_avaliador_id_fkey"
      columns: ["avaliador_id"]
isOneToOne: false
      referencedRelation: "jurados_publicos"
      referencedColumns: ["jurado_id"]
    },{
      foreignKeyName: "avaliacoes_fichas_avaliador_id_fkey"
      columns: ["avaliador_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "avaliacoes_fichas_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    }
                  ]
                },"categorias": {
                  Row: {
                    "categoria_pai_id": string | null,"competitiva": boolean | null,"cor_identificacao": string | null,"created_at": string | null,"estilo_id": string | null,"evento_id": string,"faixa_etaria_label": string | null,"faixa_etaria_max": number | null,"faixa_etaria_min": number | null,"genero": string | null,"id": string,"max_participantes": number | null,"min_participantes": number | null,"nome": string,"observacoes": string | null,"permite_conjunto": boolean | null,"permite_duo": boolean | null,"permite_solo": boolean | null,"premio_dinheiro_1": number | null,"premio_dinheiro_2": number | null,"premio_dinheiro_3": number | null,"produtora_id": string | null,"tempo_apresentacao_max": number | null,"tempo_apresentacao_min": number | null,"vagas": number | null,"valor_conjunto": number | null,"valor_duo": number | null,"valor_solo": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "categoria_pai_id"?: string | null,"competitiva"?: boolean | null,"cor_identificacao"?: string | null,"created_at"?: string | null,"estilo_id"?: string | null,"evento_id": string,"faixa_etaria_label"?: string | null,"faixa_etaria_max"?: number | null,"faixa_etaria_min"?: number | null,"genero"?: string | null,"id"?: string,"max_participantes"?: number | null,"min_participantes"?: number | null,"nome": string,"observacoes"?: string | null,"permite_conjunto"?: boolean | null,"permite_duo"?: boolean | null,"permite_solo"?: boolean | null,"premio_dinheiro_1"?: number | null,"premio_dinheiro_2"?: number | null,"premio_dinheiro_3"?: number | null,"produtora_id"?: string | null,"tempo_apresentacao_max"?: number | null,"tempo_apresentacao_min"?: number | null,"vagas"?: number | null,"valor_conjunto"?: number | null,"valor_duo"?: number | null,"valor_solo"?: number | null
                  }
                  Update: {
                    "categoria_pai_id"?: string | null,"competitiva"?: boolean | null,"cor_identificacao"?: string | null,"created_at"?: string | null,"estilo_id"?: string | null,"evento_id"?: string,"faixa_etaria_label"?: string | null,"faixa_etaria_max"?: number | null,"faixa_etaria_min"?: number | null,"genero"?: string | null,"id"?: string,"max_participantes"?: number | null,"min_participantes"?: number | null,"nome"?: string,"observacoes"?: string | null,"permite_conjunto"?: boolean | null,"permite_duo"?: boolean | null,"permite_solo"?: boolean | null,"premio_dinheiro_1"?: number | null,"premio_dinheiro_2"?: number | null,"premio_dinheiro_3"?: number | null,"produtora_id"?: string | null,"tempo_apresentacao_max"?: number | null,"tempo_apresentacao_min"?: number | null,"vagas"?: number | null,"valor_conjunto"?: number | null,"valor_duo"?: number | null,"valor_solo"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "categorias_categoria_pai_id_fkey"
      columns: ["categoria_pai_id"]
isOneToOne: false
      referencedRelation: "categorias"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "categorias_estilo_id_fkey"
      columns: ["estilo_id"]
isOneToOne: false
      referencedRelation: "estilos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "categorias_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "categorias_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"configuracoes_sistema": {
                  Row: {
                    "atualizado_em": string,"atualizado_por": string | null,"chave": string,"valor": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"atualizado_por"?: string | null,"chave": string,"valor": NonNullable<Json>
                  }
                  Update: {
                    "atualizado_em"?: string,"atualizado_por"?: string | null,"chave"?: string,"valor"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "configuracoes_sistema_atualizado_por_fkey"
      columns: ["atualizado_por"]
isOneToOne: false
      referencedRelation: "jurados_publicos"
      referencedColumns: ["jurado_id"]
    },{
      foreignKeyName: "configuracoes_sistema_atualizado_por_fkey"
      columns: ["atualizado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"criterios_avaliacao": {
                  Row: {
                    "created_at": string | null,"evento_id": string | null,"id": string,"nome": string,"nota_max": number,"nota_min": number,"ordem": number | null,"peso": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"evento_id"?: string | null,"id"?: string,"nome": string,"nota_max"?: number,"nota_min"?: number,"ordem"?: number | null,"peso"?: number
                  }
                  Update: {
                    "created_at"?: string | null,"evento_id"?: string | null,"id"?: string,"nome"?: string,"nota_max"?: number,"nota_min"?: number,"ordem"?: number | null,"peso"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "criterios_avaliacao_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    }
                  ]
                },"estilos": {
                  Row: {
                    "ativo": boolean,"created_at": string,"descricao": string | null,"id": string,"nome": string,"ordem": number | null,"perfil_id": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"descricao"?: string | null,"id"?: string,"nome": string,"ordem"?: number | null,"perfil_id": string,"slug": string
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"descricao"?: string | null,"id"?: string,"nome"?: string,"ordem"?: number | null,"perfil_id"?: string,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "estilos_perfil_id_fkey"
      columns: ["perfil_id"]
isOneToOne: false
      referencedRelation: "perfis_festival"
      referencedColumns: ["id"]
    }
                  ]
                },"evento_jurados": {
                  Row: {
                    "cache_status": string | null,"cache_valor": number | null,"chave_transferencia": string,"created_at": string,"especialidade": string | null,"evento_id": string,"id": string,"jurado_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cache_status"?: string | null,"cache_valor"?: number | null,"chave_transferencia"?: string,"created_at"?: string,"especialidade"?: string | null,"evento_id": string,"id"?: string,"jurado_id": string
                  }
                  Update: {
                    "cache_status"?: string | null,"cache_valor"?: number | null,"chave_transferencia"?: string,"created_at"?: string,"especialidade"?: string | null,"evento_id"?: string,"id"?: string,"jurado_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "evento_jurados_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "evento_jurados_jurado_id_fkey"
      columns: ["jurado_id"]
isOneToOne: false
      referencedRelation: "jurados_publicos"
      referencedColumns: ["jurado_id"]
    },{
      foreignKeyName: "evento_jurados_jurado_id_fkey"
      columns: ["jurado_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"evento_produtos": {
                  Row: {
                    "ativo_evento": boolean | null,"created_at": string,"estoque_evento": number | null,"evento_id": string,"id": string,"preco_evento": number | null,"produto_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo_evento"?: boolean | null,"created_at"?: string,"estoque_evento"?: number | null,"evento_id": string,"id"?: string,"preco_evento"?: number | null,"produto_id": string
                  }
                  Update: {
                    "ativo_evento"?: boolean | null,"created_at"?: string,"estoque_evento"?: number | null,"evento_id"?: string,"id"?: string,"preco_evento"?: number | null,"produto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "evento_produtos_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "evento_produtos_produto_id_fkey"
      columns: ["produto_id"]
isOneToOne: false
      referencedRelation: "pdv_produtos"
      referencedColumns: ["id"]
    }
                  ]
                },"eventos": {
                  Row: {
                    "autorizacao_menor_url": string | null,"banner_url": string | null,"cor_primaria": string | null,"cor_secundaria": string | null,"created_at": string,"data_fim": string | null,"data_inicio": string | null,"descricao": string | null,"exibir_feed_instagram": boolean | null,"exibir_loja_publica": boolean | null,"fonte_familia": string | null,"formato": string | null,"id": string,"inscritos_count": number | null,"instagram_handle": string | null,"liberar_comentarios": boolean,"local": string | null,"logo_url": string | null,"metodo_apuracao": string,"multilocal": boolean | null,"nome": string,"perfil_id": string | null,"produtora_id": string | null,"regulamento_url": string | null,"resultado_publicado_em": string | null,"slug": string | null,"status": string | null,"tema_escuro": boolean | null,"termo_imagem_url": string | null,"tipo_premiacao": string | null,"vagas_total": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "autorizacao_menor_url"?: string | null,"banner_url"?: string | null,"cor_primaria"?: string | null,"cor_secundaria"?: string | null,"created_at"?: string,"data_fim"?: string | null,"data_inicio"?: string | null,"descricao"?: string | null,"exibir_feed_instagram"?: boolean | null,"exibir_loja_publica"?: boolean | null,"fonte_familia"?: string | null,"formato"?: string | null,"id"?: string,"inscritos_count"?: number | null,"instagram_handle"?: string | null,"liberar_comentarios"?: boolean,"local"?: string | null,"logo_url"?: string | null,"metodo_apuracao"?: string,"multilocal"?: boolean | null,"nome": string,"perfil_id"?: string | null,"produtora_id"?: string | null,"regulamento_url"?: string | null,"resultado_publicado_em"?: string | null,"slug"?: string | null,"status"?: string | null,"tema_escuro"?: boolean | null,"termo_imagem_url"?: string | null,"tipo_premiacao"?: string | null,"vagas_total"?: number | null
                  }
                  Update: {
                    "autorizacao_menor_url"?: string | null,"banner_url"?: string | null,"cor_primaria"?: string | null,"cor_secundaria"?: string | null,"created_at"?: string,"data_fim"?: string | null,"data_inicio"?: string | null,"descricao"?: string | null,"exibir_feed_instagram"?: boolean | null,"exibir_loja_publica"?: boolean | null,"fonte_familia"?: string | null,"formato"?: string | null,"id"?: string,"inscritos_count"?: number | null,"instagram_handle"?: string | null,"liberar_comentarios"?: boolean,"local"?: string | null,"logo_url"?: string | null,"metodo_apuracao"?: string,"multilocal"?: boolean | null,"nome"?: string,"perfil_id"?: string | null,"produtora_id"?: string | null,"regulamento_url"?: string | null,"resultado_publicado_em"?: string | null,"slug"?: string | null,"status"?: string | null,"tema_escuro"?: boolean | null,"termo_imagem_url"?: string | null,"tipo_premiacao"?: string | null,"vagas_total"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "eventos_perfil_id_fkey"
      columns: ["perfil_id"]
isOneToOne: false
      referencedRelation: "perfis_festival"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "eventos_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"grupo_participante": {
                  Row: {
                    "bloqueado_por_produtora": string | null,"confirmado": boolean,"data_vinculo": string | null,"funcao": string | null,"grupo_id": string,"id": string,"participante_id": string,"status": string | null,"token_confirmacao": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bloqueado_por_produtora"?: string | null,"confirmado"?: boolean,"data_vinculo"?: string | null,"funcao"?: string | null,"grupo_id": string,"id"?: string,"participante_id": string,"status"?: string | null,"token_confirmacao"?: string | null
                  }
                  Update: {
                    "bloqueado_por_produtora"?: string | null,"confirmado"?: boolean,"data_vinculo"?: string | null,"funcao"?: string | null,"grupo_id"?: string,"id"?: string,"participante_id"?: string,"status"?: string | null,"token_confirmacao"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "grupo_participante_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "grupo_participante_participante_id_fkey"
      columns: ["participante_id"]
isOneToOne: false
      referencedRelation: "participantes"
      referencedColumns: ["id"]
    }
                  ]
                },"grupos": {
                  Row: {
                    "cidade": string | null,"created_at": string,"documento": string | null,"email": string,"email_contato": string | null,"estado": string | null,"id": string,"nome": string,"origem_produtora_id": string | null,"produtora_id": string | null,"responsavel": string | null,"telefone": string | null,"tipo_documento": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cidade"?: string | null,"created_at"?: string,"documento"?: string | null,"email": string,"email_contato"?: string | null,"estado"?: string | null,"id"?: string,"nome": string,"origem_produtora_id"?: string | null,"produtora_id"?: string | null,"responsavel"?: string | null,"telefone"?: string | null,"tipo_documento"?: string | null
                  }
                  Update: {
                    "cidade"?: string | null,"created_at"?: string,"documento"?: string | null,"email"?: string,"email_contato"?: string | null,"estado"?: string | null,"id"?: string,"nome"?: string,"origem_produtora_id"?: string | null,"produtora_id"?: string | null,"responsavel"?: string | null,"telefone"?: string | null,"tipo_documento"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "grupos_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"inscricoes_grupo_evento": {
                  Row: {
                    "created_at": string | null,"data_inscricao": string | null,"evento_id": string,"grupo_id": string,"id": string,"origem": string | null,"status": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"data_inscricao"?: string | null,"evento_id": string,"grupo_id": string,"id"?: string,"origem"?: string | null,"status"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"data_inscricao"?: string | null,"evento_id"?: string,"grupo_id"?: string,"id"?: string,"origem"?: string | null,"status"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "inscricoes_grupo_evento_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inscricoes_grupo_evento_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    }
                  ]
                },"locais_evento": {
                  Row: {
                    "cidade": string | null,"created_at": string,"endereco": string | null,"estado": string | null,"evento_id": string,"id": string,"nome_local": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cidade"?: string | null,"created_at"?: string,"endereco"?: string | null,"estado"?: string | null,"evento_id": string,"id"?: string,"nome_local": string
                  }
                  Update: {
                    "cidade"?: string | null,"created_at"?: string,"endereco"?: string | null,"estado"?: string | null,"evento_id"?: string,"id"?: string,"nome_local"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "locais_evento_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    }
                  ]
                },"participacoes_participante_grupo_evento": {
                  Row: {
                    "confirmado": boolean | null,"data_vinculo": string | null,"evento_id": string,"grupo_id": string,"id": string,"participante_id": string,"status_disponibilidade": string | null,"token_confirmacao": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "confirmado"?: boolean | null,"data_vinculo"?: string | null,"evento_id": string,"grupo_id": string,"id"?: string,"participante_id": string,"status_disponibilidade"?: string | null,"token_confirmacao"?: string | null
                  }
                  Update: {
                    "confirmado"?: boolean | null,"data_vinculo"?: string | null,"evento_id"?: string,"grupo_id"?: string,"id"?: string,"participante_id"?: string,"status_disponibilidade"?: string | null,"token_confirmacao"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "participacoes_participante_grupo_evento_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "participacoes_participante_grupo_evento_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "participacoes_participante_grupo_evento_participante_id_fkey"
      columns: ["participante_id"]
isOneToOne: false
      referencedRelation: "participantes"
      referencedColumns: ["id"]
    }
                  ]
                },"participantes": {
                  Row: {
                    "confirmado_vinculo": boolean | null,"created_at": string,"criado_por": string | null,"data_nascimento": string,"documento": string | null,"email_contato": string | null,"estilo_id": string | null,"festival_id": string | null,"funcao": string | null,"id": string,"nome": string,"nome_artistico": string | null,"origem_produtora_id": string | null,"produtora_id": string | null,"responsavel_cpf": string | null,"responsavel_nome": string | null,"responsavel_parentesco": string | null,"status_disponibilidade": string | null,"termo_assinado": boolean | null,"termo_assinado_em": string | null,"termo_assinado_ip": string | null,"termo_assinado_user_agent": string | null,"tipo_documento": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "confirmado_vinculo"?: boolean | null,"created_at"?: string,"criado_por"?: string | null,"data_nascimento": string,"documento"?: string | null,"email_contato"?: string | null,"estilo_id"?: string | null,"festival_id"?: string | null,"funcao"?: string | null,"id"?: string,"nome": string,"nome_artistico"?: string | null,"origem_produtora_id"?: string | null,"produtora_id"?: string | null,"responsavel_cpf"?: string | null,"responsavel_nome"?: string | null,"responsavel_parentesco"?: string | null,"status_disponibilidade"?: string | null,"termo_assinado"?: boolean | null,"termo_assinado_em"?: string | null,"termo_assinado_ip"?: string | null,"termo_assinado_user_agent"?: string | null,"tipo_documento"?: string | null
                  }
                  Update: {
                    "confirmado_vinculo"?: boolean | null,"created_at"?: string,"criado_por"?: string | null,"data_nascimento"?: string,"documento"?: string | null,"email_contato"?: string | null,"estilo_id"?: string | null,"festival_id"?: string | null,"funcao"?: string | null,"id"?: string,"nome"?: string,"nome_artistico"?: string | null,"origem_produtora_id"?: string | null,"produtora_id"?: string | null,"responsavel_cpf"?: string | null,"responsavel_nome"?: string | null,"responsavel_parentesco"?: string | null,"status_disponibilidade"?: string | null,"termo_assinado"?: boolean | null,"termo_assinado_em"?: string | null,"termo_assinado_ip"?: string | null,"termo_assinado_user_agent"?: string | null,"tipo_documento"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "participantes_criado_por_fkey"
      columns: ["criado_por"]
isOneToOne: false
      referencedRelation: "jurados_publicos"
      referencedColumns: ["jurado_id"]
    },{
      foreignKeyName: "participantes_criado_por_fkey"
      columns: ["criado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "participantes_estilo_id_fkey"
      columns: ["estilo_id"]
isOneToOne: false
      referencedRelation: "estilos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "participantes_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"participantes_bloqueados": {
                  Row: {
                    "criado_em": string,"id": string,"participante_id": string | null,"produtora_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"id"?: string,"participante_id"?: string | null,"produtora_id": string
                  }
                  Update: {
                    "criado_em"?: string,"id"?: string,"participante_id"?: string | null,"produtora_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "participantes_bloqueados_participante_id_fkey"
      columns: ["participante_id"]
isOneToOne: false
      referencedRelation: "participantes"
      referencedColumns: ["id"]
    }
                  ]
                },"pdv_config": {
                  Row: {
                    "atualizado_em": string,"criado_em": string,"id": string,"pin_admin": string | null,"pin_vendedor": string | null,"pix_chave": string | null,"pix_cidade": string | null,"pix_nome": string | null,"produtora_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"criado_em"?: string,"id"?: string,"pin_admin"?: string | null,"pin_vendedor"?: string | null,"pix_chave"?: string | null,"pix_cidade"?: string | null,"pix_nome"?: string | null,"produtora_id"?: string | null
                  }
                  Update: {
                    "atualizado_em"?: string,"criado_em"?: string,"id"?: string,"pin_admin"?: string | null,"pin_vendedor"?: string | null,"pix_chave"?: string | null,"pix_cidade"?: string | null,"pix_nome"?: string | null,"produtora_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pdv_config_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"pdv_produtos": {
                  Row: {
                    "ativo": boolean,"categoria": string | null,"created_at": string,"descricao": string | null,"estoque": number | null,"evento_id": string | null,"id": string,"nome": string,"ordem": number | null,"preco": number,"produtora_id": string | null,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"categoria"?: string | null,"created_at"?: string,"descricao"?: string | null,"estoque"?: number | null,"evento_id"?: string | null,"id"?: string,"nome": string,"ordem"?: number | null,"preco"?: number,"produtora_id"?: string | null,"tipo"?: string
                  }
                  Update: {
                    "ativo"?: boolean,"categoria"?: string | null,"created_at"?: string,"descricao"?: string | null,"estoque"?: number | null,"evento_id"?: string | null,"id"?: string,"nome"?: string,"ordem"?: number | null,"preco"?: number,"produtora_id"?: string | null,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pdv_produtos_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pdv_produtos_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"pdv_vendas": {
                  Row: {
                    "created_at": string,"evento_id": string | null,"forma_pagamento": string,"id": string,"itens": NonNullable<Json>,"operador_id": string | null,"operador_nome": string | null,"preco_unitario": number,"produto_id": string | null,"produto_nome": string | null,"produtora_id": string | null,"quantidade": number,"sincronizado": boolean,"total": number,"venda_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"evento_id"?: string | null,"forma_pagamento": string,"id"?: string,"itens"?: NonNullable<Json>,"operador_id"?: string | null,"operador_nome"?: string | null,"preco_unitario"?: number,"produto_id"?: string | null,"produto_nome"?: string | null,"produtora_id"?: string | null,"quantidade"?: number,"sincronizado"?: boolean,"total"?: number,"venda_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"evento_id"?: string | null,"forma_pagamento"?: string,"id"?: string,"itens"?: NonNullable<Json>,"operador_id"?: string | null,"operador_nome"?: string | null,"preco_unitario"?: number,"produto_id"?: string | null,"produto_nome"?: string | null,"produtora_id"?: string | null,"quantidade"?: number,"sincronizado"?: boolean,"total"?: number,"venda_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pdv_vendas_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pdv_vendas_operador_id_fkey"
      columns: ["operador_id"]
isOneToOne: false
      referencedRelation: "jurados_publicos"
      referencedColumns: ["jurado_id"]
    },{
      foreignKeyName: "pdv_vendas_operador_id_fkey"
      columns: ["operador_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pdv_vendas_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"pedido_itens": {
                  Row: {
                    "coreografia_id": string | null,"created_at": string,"escola_id": string,"id": string,"preco_unitario": number,"produto_id": string,"produtora_id": string | null,"quantidade": number,"status": string,"variacao_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "coreografia_id"?: string | null,"created_at"?: string,"escola_id": string,"id"?: string,"preco_unitario"?: number,"produto_id": string,"produtora_id"?: string | null,"quantidade"?: number,"status"?: string,"variacao_id"?: string | null
                  }
                  Update: {
                    "coreografia_id"?: string | null,"created_at"?: string,"escola_id"?: string,"id"?: string,"preco_unitario"?: number,"produto_id"?: string,"produtora_id"?: string | null,"quantidade"?: number,"status"?: string,"variacao_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pedido_itens_coreografia_id_fkey"
      columns: ["coreografia_id"]
isOneToOne: false
      referencedRelation: "apresentacoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedido_itens_escola_id_fkey"
      columns: ["escola_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedido_itens_produto_id_fkey"
      columns: ["produto_id"]
isOneToOne: false
      referencedRelation: "produtos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedido_itens_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedido_itens_variacao_id_fkey"
      columns: ["variacao_id"]
isOneToOne: false
      referencedRelation: "produto_variacoes"
      referencedColumns: ["id"]
    }
                  ]
                },"perfis_festival": {
                  Row: {
                    "ativo": boolean,"created_at": string,"descricao": string | null,"icone": string | null,"id": string,"nome": string,"ordem": number | null,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"descricao"?: string | null,"icone"?: string | null,"id"?: string,"nome": string,"ordem"?: number | null,"slug": string
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"descricao"?: string | null,"icone"?: string | null,"id"?: string,"nome"?: string,"ordem"?: number | null,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"posts_marketing": {
                  Row: {
                    "agendado_para": string,"created_at": string,"erro": string | null,"id": string,"imagem_url": string | null,"legenda": string,"plataforma": string,"produtora_id": string | null,"publicado_em": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agendado_para": string,"created_at"?: string,"erro"?: string | null,"id"?: string,"imagem_url"?: string | null,"legenda": string,"plataforma"?: string,"produtora_id"?: string | null,"publicado_em"?: string | null,"status"?: string
                  }
                  Update: {
                    "agendado_para"?: string,"created_at"?: string,"erro"?: string | null,"id"?: string,"imagem_url"?: string | null,"legenda"?: string,"plataforma"?: string,"produtora_id"?: string | null,"publicado_em"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_marketing_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"produto_variacoes": {
                  Row: {
                    "created_at": string,"estoque": number | null,"id": string,"nome": string,"produto_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"estoque"?: number | null,"id"?: string,"nome": string,"produto_id": string
                  }
                  Update: {
                    "created_at"?: string,"estoque"?: number | null,"id"?: string,"nome"?: string,"produto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "produto_variacoes_produto_id_fkey"
      columns: ["produto_id"]
isOneToOne: false
      referencedRelation: "produtos"
      referencedColumns: ["id"]
    }
                  ]
                },"produtoras": {
                  Row: {
                    "ativo": boolean,"created_at": string | null,"demonstracao": boolean,"documento": string | null,"email": string | null,"id": string,"logo_url": string | null,"nome": string,"plano": string,"plano_inicio": string,"pro_ate": string | null,"telefone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string | null,"demonstracao"?: boolean,"documento"?: string | null,"email"?: string | null,"id"?: string,"logo_url"?: string | null,"nome": string,"plano"?: string,"plano_inicio"?: string,"pro_ate"?: string | null,"telefone"?: string | null
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string | null,"demonstracao"?: boolean,"documento"?: string | null,"email"?: string | null,"id"?: string,"logo_url"?: string | null,"nome"?: string,"plano"?: string,"plano_inicio"?: string,"pro_ate"?: string | null,"telefone"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"produtos": {
                  Row: {
                    "ativo": boolean,"created_at": string,"descricao": string | null,"estoque": number | null,"exibir_imagem": boolean | null,"exibir_loja_publica": boolean | null,"id": string,"imagem_url": string | null,"mostrar_checkout": boolean,"nome": string,"preco": number,"produtora_id": string | null,"tem_variacao": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"descricao"?: string | null,"estoque"?: number | null,"exibir_imagem"?: boolean | null,"exibir_loja_publica"?: boolean | null,"id"?: string,"imagem_url"?: string | null,"mostrar_checkout"?: boolean,"nome": string,"preco"?: number,"produtora_id"?: string | null,"tem_variacao"?: boolean
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"descricao"?: string | null,"estoque"?: number | null,"exibir_imagem"?: boolean | null,"exibir_loja_publica"?: boolean | null,"id"?: string,"imagem_url"?: string | null,"mostrar_checkout"?: boolean,"nome"?: string,"preco"?: number,"produtora_id"?: string | null,"tem_variacao"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "produtos_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"resultados_publicados": {
                  Row: {
                    "apresentacao_id": string | null,"apresentacao_nome": string,"created_at": string,"evento_id": string,"grupo_nome": string | null,"grupo_titulo": string,"id": string,"nota": number | null,"ordem_grupo": number,"posicao": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "apresentacao_id"?: string | null,"apresentacao_nome": string,"created_at"?: string,"evento_id": string,"grupo_nome"?: string | null,"grupo_titulo": string,"id"?: string,"nota"?: number | null,"ordem_grupo": number,"posicao"?: number | null
                  }
                  Update: {
                    "apresentacao_id"?: string | null,"apresentacao_nome"?: string,"created_at"?: string,"evento_id"?: string,"grupo_nome"?: string | null,"grupo_titulo"?: string,"id"?: string,"nota"?: number | null,"ordem_grupo"?: number,"posicao"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "resultados_publicados_apresentacao_id_fkey"
      columns: ["apresentacao_id"]
isOneToOne: false
      referencedRelation: "apresentacoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resultados_publicados_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    }
                  ]
                },"tenant_config": {
                  Row: {
                    "configurado_em": string | null,"cor_primaria": string | null,"id": string,"logo_url": string | null,"nome_exibicao": string | null,"nome_organizacao": string | null,"organizacao_id": string | null,"perfil_id": string | null,"produtora_id": string | null,"termo_apresentacao": string | null,"termo_apresentacao_plural": string | null,"termo_evento": string | null,"termo_grupo": string | null,"termo_grupo_plural": string | null,"termo_inscricao": string | null,"termo_legal_texto": string | null,"termo_participante": string | null,"termo_participante_plural": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "configurado_em"?: string | null,"cor_primaria"?: string | null,"id"?: string,"logo_url"?: string | null,"nome_exibicao"?: string | null,"nome_organizacao"?: string | null,"organizacao_id"?: string | null,"perfil_id"?: string | null,"produtora_id"?: string | null,"termo_apresentacao"?: string | null,"termo_apresentacao_plural"?: string | null,"termo_evento"?: string | null,"termo_grupo"?: string | null,"termo_grupo_plural"?: string | null,"termo_inscricao"?: string | null,"termo_legal_texto"?: string | null,"termo_participante"?: string | null,"termo_participante_plural"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "configurado_em"?: string | null,"cor_primaria"?: string | null,"id"?: string,"logo_url"?: string | null,"nome_exibicao"?: string | null,"nome_organizacao"?: string | null,"organizacao_id"?: string | null,"perfil_id"?: string | null,"produtora_id"?: string | null,"termo_apresentacao"?: string | null,"termo_apresentacao_plural"?: string | null,"termo_evento"?: string | null,"termo_grupo"?: string | null,"termo_grupo_plural"?: string | null,"termo_inscricao"?: string | null,"termo_legal_texto"?: string | null,"termo_participante"?: string | null,"termo_participante_plural"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tenant_config_escola_id_fkey"
      columns: ["organizacao_id"]
isOneToOne: false
      referencedRelation: "jurados_publicos"
      referencedColumns: ["jurado_id"]
    },{
      foreignKeyName: "tenant_config_escola_id_fkey"
      columns: ["organizacao_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tenant_config_perfil_id_fkey"
      columns: ["perfil_id"]
isOneToOne: false
      referencedRelation: "perfis_festival"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tenant_config_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"tenant_estilos_ativos": {
                  Row: {
                    "ativo": boolean,"created_at": string,"estilo_id": string,"id": string,"organizacao_id": string | null,"produtora_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"estilo_id": string,"id"?: string,"organizacao_id"?: string | null,"produtora_id": string
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"estilo_id"?: string,"id"?: string,"organizacao_id"?: string | null,"produtora_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tenant_estilos_ativos_escola_id_fkey"
      columns: ["organizacao_id"]
isOneToOne: false
      referencedRelation: "jurados_publicos"
      referencedColumns: ["jurado_id"]
    },{
      foreignKeyName: "tenant_estilos_ativos_escola_id_fkey"
      columns: ["organizacao_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tenant_estilos_ativos_estilo_id_fkey"
      columns: ["estilo_id"]
isOneToOne: false
      referencedRelation: "estilos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tenant_estilos_ativos_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"termos_aceites": {
                  Row: {
                    "aceito_em": string,"bailarino_id": string | null,"documento_id": string,"email_assinante": string | null,"id": string,"ip_address": string | null,"nome_assinante": string | null,"tipo_assinante": string,"user_agent": string | null,"usuario_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "aceito_em"?: string,"bailarino_id"?: string | null,"documento_id": string,"email_assinante"?: string | null,"id"?: string,"ip_address"?: string | null,"nome_assinante"?: string | null,"tipo_assinante": string,"user_agent"?: string | null,"usuario_id"?: string | null
                  }
                  Update: {
                    "aceito_em"?: string,"bailarino_id"?: string | null,"documento_id"?: string,"email_assinante"?: string | null,"id"?: string,"ip_address"?: string | null,"nome_assinante"?: string | null,"tipo_assinante"?: string,"user_agent"?: string | null,"usuario_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "termos_aceites_bailarino_id_fkey"
      columns: ["bailarino_id"]
isOneToOne: false
      referencedRelation: "participantes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "termos_aceites_documento_id_fkey"
      columns: ["documento_id"]
isOneToOne: false
      referencedRelation: "termos_documentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "termos_aceites_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "jurados_publicos"
      referencedColumns: ["jurado_id"]
    },{
      foreignKeyName: "termos_aceites_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"termos_documentos": {
                  Row: {
                    "arquivo_url": string | null,"ativo": boolean,"atualizado_em": string,"conteudo": string,"criado_em": string,"evento_id": string | null,"exibir_publico": boolean | null,"formato": string | null,"id": string,"produtora_id": string | null,"tipo": string,"titulo": string,"versao": number
                  }
                  ComputedFields: never
                  Insert: {
                    "arquivo_url"?: string | null,"ativo"?: boolean,"atualizado_em"?: string,"conteudo"?: string,"criado_em"?: string,"evento_id"?: string | null,"exibir_publico"?: boolean | null,"formato"?: string | null,"id"?: string,"produtora_id"?: string | null,"tipo": string,"titulo": string,"versao"?: number
                  }
                  Update: {
                    "arquivo_url"?: string | null,"ativo"?: boolean,"atualizado_em"?: string,"conteudo"?: string,"criado_em"?: string,"evento_id"?: string | null,"exibir_publico"?: boolean | null,"formato"?: string | null,"id"?: string,"produtora_id"?: string | null,"tipo"?: string,"titulo"?: string,"versao"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "termos_documentos_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "termos_documentos_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                },"usuarios": {
                  Row: {
                    "ativo": boolean,"cache_status": string | null,"cache_valor": number | null,"created_at": string | null,"email": string,"especialidade": string | null,"foto_url": string | null,"id": string,"invite_token": string | null,"invite_usado": boolean | null,"mini_bio": string | null,"nome": string | null,"organizacao_id": string | null,"produtora_id": string | null,"role": string,"telefone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"cache_status"?: string | null,"cache_valor"?: number | null,"created_at"?: string | null,"email": string,"especialidade"?: string | null,"foto_url"?: string | null,"id": string,"invite_token"?: string | null,"invite_usado"?: boolean | null,"mini_bio"?: string | null,"nome"?: string | null,"organizacao_id"?: string | null,"produtora_id"?: string | null,"role": string,"telefone"?: string | null
                  }
                  Update: {
                    "ativo"?: boolean,"cache_status"?: string | null,"cache_valor"?: number | null,"created_at"?: string | null,"email"?: string,"especialidade"?: string | null,"foto_url"?: string | null,"id"?: string,"invite_token"?: string | null,"invite_usado"?: boolean | null,"mini_bio"?: string | null,"nome"?: string | null,"organizacao_id"?: string | null,"produtora_id"?: string | null,"role"?: string,"telefone"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "usuarios_escola_id_fkey"
      columns: ["organizacao_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "usuarios_produtora_id_fkey"
      columns: ["produtora_id"]
isOneToOne: false
      referencedRelation: "produtoras"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "comentarios_jurados_grupo": {
                  Row: {
                    "apresentacao_id": string | null,"comentario": string | null,"evento_id": string | null,"grupo_id": string | null,"jurado_numero": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "avaliacoes_fichas_apresentacao_id_fkey"
      columns: ["apresentacao_id"]
isOneToOne: false
      referencedRelation: "apresentacoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "avaliacoes_fichas_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coreografias_escola_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    }
                  ]
                },"jurados_publicos": {
                  Row: {
                    "especialidade": string | null,"evento_id": string | null,"foto_url": string | null,"jurado_id": string | null,"mini_bio": string | null,"nome": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "evento_jurados_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "checar_vagas":
{ Args: { "p_apresentacao": string,"p_categoria": string,"p_evento": string,"p_nova": boolean }; Returns: undefined
                           },
"eh_equipe":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"eh_gestor":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"eh_operador":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"eh_super_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"eh_usuario_grupo":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"evento_da_minha_produtora":
{ Args: { "p_evento": string }; Returns: boolean
                           },
"evento_publico":
{ Args: { "p_evento": string }; Returns: boolean
                           },
"gerar_chave_transferencia":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"get_meu_role":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"get_minha_organizacao_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"get_minha_produtora_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"grupo_da_minha_produtora":
{ Args: { "p_grupo": string }; Returns: boolean
                           },
"grupo_por_documento":
{ Args: { "p_documento": string }; Returns: {
              "email_mascarado": string,"id": string,"nome": string
            }[]
                           },
"inscricoes_abertas":
{ Args: { "p_status": string }; Returns: boolean
                           },
"meu_grupo_inscrito":
{ Args: { "p_evento": string }; Returns: boolean
                           },
"ocupacao_evento":
{ Args: { "p_evento": string }; Returns: Json
                           },
"pode_editar_apresentacao":
{ Args: { "p_apresentacao": string }; Returns: boolean
                           },
"pode_gerir_evento":
{ Args: { "p_evento": string }; Returns: boolean
                           },
"pode_ver_evento":
{ Args: { "p_evento": string }; Returns: boolean
                           },
"pode_ver_grupo":
{ Args: { "p_grupo": string }; Returns: boolean
                           },
"pode_ver_participante":
{ Args: { "p_participante": string }; Returns: boolean
                           },
"sou_jurado_do_evento":
{ Args: { "p_evento": string }; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
