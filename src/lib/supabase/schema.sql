-- ==============================================================================
-- MERCADINHO PARANAGUÁ - ESQUEMA DE BANCO DE DADOS POSTGRESQL (SUPABASE)
-- Sistema de Gestão Comercial e Frente de Caixa (PDV)
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. Tabela: configuracoes_loja
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.configuracoes_loja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_fantasia VARCHAR(150) NOT NULL DEFAULT 'Mercadinho Paranaguá',
    razao_social VARCHAR(150) DEFAULT 'Mercadinho Paranaguá Comércio de Alimentos LTDA',
    cnpj VARCHAR(30) DEFAULT '12.345.678/0001-90',
    telefone VARCHAR(30) DEFAULT '(41) 3422-0000',
    endereco VARCHAR(255) DEFAULT 'Rua Paranaguá, 1200 - Centro',
    cidade_uf VARCHAR(100) DEFAULT 'Paranaguá - PR',
    mensagem_cupom VARCHAR(255) DEFAULT 'Obrigado pela preferência! Volte sempre ao Mercadinho Paranaguá.',
    som_bip_ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão inicial se não existir
INSERT INTO public.configuracoes_loja (nome_fantasia, razao_social, cnpj, telefone, endereco, cidade_uf, mensagem_cupom)
SELECT 'Mercadinho Paranaguá', 'Mercadinho Paranaguá Comércio de Alimentos LTDA', '12.345.678/0001-90', '(41) 3422-0000', 'Rua Paranaguá, 1200 - Centro', 'Paranaguá - PR', 'Obrigado pela preferência! Volte sempre ao Mercadinho Paranaguá.'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_loja LIMIT 1);

-- ------------------------------------------------------------------------------
-- 3. Tabela: produtos
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_interno VARCHAR(50) NOT NULL UNIQUE,
    codigo_barras VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL DEFAULT 'Geral',
    preco_custo NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (preco_custo >= 0),
    preco_venda NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (preco_venda >= 0),
    estoque_atual NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    estoque_minimo NUMERIC(10,3) NOT NULL DEFAULT 5.000 CHECK (estoque_minimo >= 0),
    unidade VARCHAR(10) NOT NULL DEFAULT 'UN',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_interno ON public.produtos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON public.produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);

-- ------------------------------------------------------------------------------
-- 4. Tabela: vendas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_venda BIGSERIAL UNIQUE,
    data_venda TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_bruto NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total_bruto >= 0),
    desconto NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (desconto >= 0),
    total_liquido NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total_liquido >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'CONCLUIDA' CHECK (status IN ('CONCLUIDA', 'CANCELADA')),
    operador_id UUID,
    operador_nome VARCHAR(100) NOT NULL DEFAULT 'Caixa 01',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendas_data ON public.vendas(data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON public.vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_numero ON public.vendas(numero_venda);

-- ------------------------------------------------------------------------------
-- 5. Tabela: itens_venda
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.itens_venda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
    codigo_barras VARCHAR(50) NOT NULL,
    nome_produto VARCHAR(255) NOT NULL,
    quantidade NUMERIC(10,3) NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itens_venda_venda_id ON public.itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto_id ON public.itens_venda(produto_id);

-- ------------------------------------------------------------------------------
-- 6. Tabela: pagamentos_venda
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pagamentos_venda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
    forma_pagamento VARCHAR(30) NOT NULL CHECK (forma_pagamento IN ('DINHEIRO', 'PIX', 'DEBITO', 'CREDITO')),
    valor_pago NUMERIC(10,2) NOT NULL CHECK (valor_pago >= 0),
    troco NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (troco >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_venda_venda_id ON public.pagamentos_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_forma ON public.pagamentos_venda(forma_pagamento);

-- ------------------------------------------------------------------------------
-- 7. Tabela: movimentacoes_estoque
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA_VENDA', 'AJUSTE', 'PERDA')),
    quantidade NUMERIC(10,3) NOT NULL,
    estoque_anterior NUMERIC(10,3) NOT NULL,
    estoque_posterior NUMERIC(10,3) NOT NULL,
    motivo VARCHAR(255),
    venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mov_estoque_produto_id ON public.movimentacoes_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_mov_estoque_data ON public.movimentacoes_estoque(created_at DESC);

-- ------------------------------------------------------------------------------
-- 8. FUNÇÃO TRANSACIONAL SEGURA: finalizar_venda_transacional
-- Executa a criação da venda, seus itens, pagamentos e a baixa consistente de estoque
-- de forma atômica (tudo ou nada)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalizar_venda_transacional(
    p_venda JSONB,
    p_itens JSONB,
    p_pagamentos JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venda_id UUID;
    v_numero_venda BIGINT;
    v_item JSONB;
    v_pagamento JSONB;
    v_produto_id UUID;
    v_qtd NUMERIC(10,3);
    v_preco NUMERIC(10,2);
    v_subtotal NUMERIC(10,2);
    v_cod_barras VARCHAR(50);
    v_nome_prod VARCHAR(255);
    v_estoque_atual NUMERIC(10,3);
    v_novo_estoque NUMERIC(10,3);
    v_resultado JSONB;
BEGIN
    -- 1. Inserir a venda
    INSERT INTO public.vendas (
        total_bruto,
        desconto,
        total_liquido,
        status,
        operador_nome,
        observacoes,
        data_venda
    ) VALUES (
        (p_venda->>'total_bruto')::NUMERIC,
        COALESCE((p_venda->>'desconto')::NUMERIC, 0.00),
        (p_venda->>'total_liquido')::NUMERIC,
        'CONCLUIDA',
        COALESCE(p_venda->>'operador_nome', 'Caixa 01'),
        p_venda->>'observacoes',
        NOW()
    )
    RETURNING id, numero_venda INTO v_venda_id, v_numero_venda;

    -- 2. Processar itens da venda e atualizar estoque
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        v_produto_id := (v_item->>'produto_id')::UUID;
        v_qtd := (v_item->>'quantidade')::NUMERIC;
        v_preco := (v_item->>'preco_unitario')::NUMERIC;
        v_subtotal := (v_item->>'subtotal')::NUMERIC;
        v_cod_barras := v_item->>'codigo_barras';
        v_nome_prod := v_item->>'nome_produto';

        -- Obter estoque atual com LOCK (FOR UPDATE) para evitar race conditions
        SELECT estoque_atual INTO v_estoque_atual
        FROM public.produtos
        WHERE id = v_produto_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produto com ID % não foi encontrado.', v_produto_id;
        END IF;

        v_novo_estoque := v_estoque_atual - v_qtd;

        -- Atualizar produto
        UPDATE public.produtos
        SET estoque_atual = v_novo_estoque,
            updated_at = NOW()
        WHERE id = v_produto_id;

        -- Registrar item da venda
        INSERT INTO public.itens_venda (
            venda_id,
            produto_id,
            codigo_barras,
            nome_produto,
            quantidade,
            preco_unitario,
            subtotal
        ) VALUES (
            v_venda_id,
            v_produto_id,
            v_cod_barras,
            v_nome_prod,
            v_qtd,
            v_preco,
            v_subtotal
        );

        -- Registrar movimentação de estoque
        INSERT INTO public.movimentacoes_estoque (
            produto_id,
            tipo,
            quantidade,
            estoque_anterior,
            estoque_posterior,
            motivo,
            venda_id
        ) VALUES (
            v_produto_id,
            'SAIDA_VENDA',
            v_qtd,
            v_estoque_atual,
            v_novo_estoque,
            'Venda #' || v_numero_venda,
            v_venda_id
        );
    END LOOP;

    -- 3. Processar pagamentos
    FOR v_pagamento IN SELECT * FROM jsonb_array_elements(p_pagamentos)
    LOOP
        INSERT INTO public.pagamentos_venda (
            venda_id,
            forma_pagamento,
            valor_pago,
            troco
        ) VALUES (
            v_venda_id,
            v_pagamento->>'forma_pagamento',
            (v_pagamento->>'valor_pago')::NUMERIC,
            COALESCE((v_pagamento->>'troco')::NUMERIC, 0.00)
        );
    END LOOP;

    -- 4. Montar retorno
    v_resultado := jsonb_build_object(
        'success', true,
        'venda_id', v_venda_id,
        'numero_venda', v_numero_venda,
        'total_liquido', (p_venda->>'total_liquido')::NUMERIC
    );

    RETURN v_resultado;
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. FUNÇÃO PARA CANCELAMENTO COM ESTORNO DE ESTOQUE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancelar_venda_transacional(
    p_venda_id UUID,
    p_motivo TEXT DEFAULT 'Cancelamento solicitado pelo operador'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venda RECORD;
    v_item RECORD;
    v_estoque_atual NUMERIC(10,3);
    v_novo_estoque NUMERIC(10,3);
BEGIN
    SELECT * INTO v_venda FROM public.vendas WHERE id = p_venda_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venda não encontrada.';
    END IF;

    IF v_venda.status = 'CANCELADA' THEN
        RAISE EXCEPTION 'Esta venda já está cancelada.';
    END IF;

    -- Marcar como cancelada
    UPDATE public.vendas
    SET status = 'CANCELADA',
        observacoes = COALESCE(observacoes, '') || ' [CANCELADA: ' || p_motivo || ']'
    WHERE id = p_venda_id;

    -- Estornar estoque dos itens
    FOR v_item IN SELECT * FROM public.itens_venda WHERE venda_id = p_venda_id
    LOOP
        SELECT estoque_atual INTO v_estoque_atual
        FROM public.produtos
        WHERE id = v_item.produto_id
        FOR UPDATE;

        IF FOUND THEN
            v_novo_estoque := v_estoque_atual + v_item.quantidade;

            UPDATE public.produtos
            SET estoque_atual = v_novo_estoque,
                updated_at = NOW()
            WHERE id = v_item.produto_id;

            INSERT INTO public.movimentacoes_estoque (
                produto_id,
                tipo,
                quantidade,
                estoque_anterior,
                estoque_posterior,
                motivo,
                venda_id
            ) VALUES (
                v_item.produto_id,
                'ENTRADA',
                v_item.quantidade,
                v_estoque_atual,
                v_novo_estoque,
                'Estorno Venda #' || v_venda.numero_venda || ': ' || p_motivo,
                p_venda_id
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'venda_id', p_venda_id, 'status', 'CANCELADA');
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.configuracoes_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Permitir leitura e escrita para o app comercial)
CREATE POLICY "Permitir leitura pública/autenticada nas configurações"
    ON public.configuracoes_loja FOR SELECT USING (true);
CREATE POLICY "Permitir alteração nas configurações"
    ON public.configuracoes_loja FOR ALL USING (true);

CREATE POLICY "Permitir leitura nos produtos"
    ON public.produtos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e edição de produtos"
    ON public.produtos FOR ALL USING (true);

CREATE POLICY "Permitir leitura nas vendas"
    ON public.vendas FOR SELECT USING (true);
CREATE POLICY "Permitir gravação de vendas"
    ON public.vendas FOR ALL USING (true);

CREATE POLICY "Permitir leitura nos itens de venda"
    ON public.itens_venda FOR SELECT USING (true);
CREATE POLICY "Permitir gravação de itens de venda"
    ON public.itens_venda FOR ALL USING (true);

CREATE POLICY "Permitir leitura nos pagamentos"
    ON public.pagamentos_venda FOR SELECT USING (true);
CREATE POLICY "Permitir gravação de pagamentos"
    ON public.pagamentos_venda FOR ALL USING (true);

CREATE POLICY "Permitir leitura nas movimentações"
    ON public.movimentacoes_estoque FOR SELECT USING (true);
CREATE POLICY "Permitir gravação de movimentações"
    ON public.movimentacoes_estoque FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 11. DADOS INICIAIS DE EXEMPLO PARA O MERCADINHO PARANAGUÁ
-- (Produtos típicos de mercadinho de bairro brasileiro com códigos EAN reais)
-- ------------------------------------------------------------------------------
INSERT INTO public.produtos (codigo_interno, codigo_barras, nome, categoria, preco_custo, preco_venda, estoque_atual, estoque_minimo, unidade)
VALUES
    ('MER-001', '7891000100103', 'Arroz Tio João Branco Tipo 1 5kg', 'Mercearia', 22.50, 28.90, 45, 10, 'UN'),
    ('MER-002', '7896006711124', 'Feijão Carioca Camil Tipo 1 1kg', 'Mercearia', 6.20, 8.50, 60, 15, 'UN'),
    ('MER-003', '7891025114147', 'Óleo de Soja Liza Pet 900ml', 'Mercearia', 4.80, 6.90, 38, 12, 'UN'),
    ('MER-004', '7896005800119', 'Café Tradicional Pilão Almofada 500g', 'Mercearia', 14.50, 19.80, 28, 8, 'UN'),
    ('MER-005', '7898215150015', 'Açúcar Refinado União 1kg', 'Mercearia', 3.40, 4.90, 50, 15, 'UN'),
    ('MER-006', '7896006745129', 'Macarrão Espaguete Dona Benta 500g', 'Mercearia', 2.80, 4.20, 40, 10, 'UN'),
    ('BEB-001', '7894900010015', 'Refrigerante Coca-Cola Pet 2L', 'Bebidas', 7.50, 10.90, 32, 10, 'UN'),
    ('BEB-002', '7891991000857', 'Cerveja Brahma Chopp Lata 350ml', 'Bebidas', 2.80, 3.99, 120, 24, 'UN'),
    ('LAT-001', '7898215151128', 'Leite Integral Piracanjuba Tetra Pak 1L', 'Laticínios', 4.10, 5.75, 75, 20, 'UN'),
    ('LAT-002', '7896051111016', 'Manteiga com Sal Batavo Pote 200g', 'Laticínios', 8.20, 11.50, 18, 5, 'UN'),
    ('PAD-001', '7891000244418', 'Pão de Forma Tradicional Wickbold 500g', 'Padaria', 6.90, 9.90, 14, 6, 'UN'),
    ('LIM-001', '7896098900253', 'Detergente Líquido Neutro Ypê 500ml', 'Limpeza', 1.80, 2.70, 80, 20, 'UN'),
    ('LIM-002', '7891037000100', 'Sabão em Pó Omo Lavagem Perfeita 800g', 'Limpeza', 11.20, 15.90, 22, 6, 'UN'),
    ('HIG-001', '7891055310014', 'Creme Dental Colgate Total 12 90g', 'Higiene', 4.50, 6.99, 35, 10, 'UN'),
    ('HIG-002', '7896000700018', 'Sabonete em Barra Dove Original 90g', 'Higiene', 3.20, 4.80, 48, 12, 'UN')
ON CONFLICT (codigo_barras) DO NOTHING;
