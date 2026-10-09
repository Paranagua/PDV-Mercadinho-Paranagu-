import {
  ConfiguracaoLoja,
  DashboardMetrics,
  FormaPagamento,
  ItemCarrinhoPDV,
  MovimentacaoEstoque,
  Produto,
  Venda,
} from '../../types';
import { getSupabase, isSupabaseConfigured } from '../supabase/client';

// Chaves de armazenamento local
const STORAGE_PRODUTOS = 'mercadinho_paranagua_produtos';
const STORAGE_VENDAS = 'mercadinho_paranagua_vendas';
const STORAGE_MOVIMENTACOES = 'mercadinho_paranagua_movimentacoes';
const STORAGE_CONFIG = 'mercadinho_paranagua_config';

// Configuração padrão da loja
export const CONFIG_PADRAO: ConfiguracaoLoja = {
  nome_fantasia: 'Mercadinho Paranaguá',
  razao_social: 'Mercadinho Paranaguá Comércio de Alimentos LTDA',
  cnpj: '12.345.678/0001-90',
  telefone: '(41) 3422-0000',
  endereco: 'Rua Paranaguá, 1200 - Centro',
  cidade_uf: 'Paranaguá - PR',
  mensagem_cupom: 'Obrigado pela preferência! Volte sempre ao Mercadinho Paranaguá.',
  som_bip_ativo: true,
};

// Catálogo inicial com códigos de barras EAN-13 reais para teste imediato
export const PRODUTOS_PADRAO: Produto[] = [
  {
    id: 'prod-001',
    codigo_interno: 'MER-001',
    codigo_barras: '7891000100103',
    nome: 'Arroz Tio João Branco Tipo 1 5kg',
    categoria: 'Mercearia',
    preco_custo: 22.50,
    preco_venda: 28.90,
    estoque_atual: 45,
    estoque_minimo: 10,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-002',
    codigo_interno: 'MER-002',
    codigo_barras: '7896006711124',
    nome: 'Feijão Carioca Camil Tipo 1 1kg',
    categoria: 'Mercearia',
    preco_custo: 6.20,
    preco_venda: 8.50,
    estoque_atual: 60,
    estoque_minimo: 15,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-003',
    codigo_interno: 'MER-003',
    codigo_barras: '7891025114147',
    nome: 'Óleo de Soja Liza Pet 900ml',
    categoria: 'Mercearia',
    preco_custo: 4.80,
    preco_venda: 6.90,
    estoque_atual: 38,
    estoque_minimo: 12,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-004',
    codigo_interno: 'MER-004',
    codigo_barras: '7896005800119',
    nome: 'Café Tradicional Pilão Almofada 500g',
    categoria: 'Mercearia',
    preco_custo: 14.50,
    preco_venda: 19.80,
    estoque_atual: 28,
    estoque_minimo: 8,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-005',
    codigo_interno: 'MER-005',
    codigo_barras: '7898215150015',
    nome: 'Açúcar Refinado União 1kg',
    categoria: 'Mercearia',
    preco_custo: 3.40,
    preco_venda: 4.90,
    estoque_atual: 50,
    estoque_minimo: 15,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-006',
    codigo_interno: 'MER-006',
    codigo_barras: '7896006745129',
    nome: 'Macarrão Espaguete Dona Benta 500g',
    categoria: 'Mercearia',
    preco_custo: 2.80,
    preco_venda: 4.20,
    estoque_atual: 40,
    estoque_minimo: 10,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-007',
    codigo_interno: 'BEB-001',
    codigo_barras: '7894900010015',
    nome: 'Refrigerante Coca-Cola Pet 2L',
    categoria: 'Bebidas',
    preco_custo: 7.50,
    preco_venda: 10.90,
    estoque_atual: 32,
    estoque_minimo: 10,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-008',
    codigo_interno: 'BEB-002',
    codigo_barras: '7891991000857',
    nome: 'Cerveja Brahma Chopp Lata 350ml',
    categoria: 'Bebidas',
    preco_custo: 2.80,
    preco_venda: 3.99,
    estoque_atual: 120,
    estoque_minimo: 24,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-009',
    codigo_interno: 'LAT-001',
    codigo_barras: '7898215151128',
    nome: 'Leite Integral Piracanjuba Tetra Pak 1L',
    categoria: 'Laticínios',
    preco_custo: 4.10,
    preco_venda: 5.75,
    estoque_atual: 75,
    estoque_minimo: 20,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-010',
    codigo_interno: 'LAT-002',
    codigo_barras: '7896051111016',
    nome: 'Manteiga com Sal Batavo Pote 200g',
    categoria: 'Laticínios',
    preco_custo: 8.20,
    preco_venda: 11.50,
    estoque_atual: 18,
    estoque_minimo: 5,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-011',
    codigo_interno: 'PAD-001',
    codigo_barras: '7891000244418',
    nome: 'Pão de Forma Tradicional Wickbold 500g',
    categoria: 'Padaria',
    preco_custo: 6.90,
    preco_venda: 9.90,
    estoque_atual: 14,
    estoque_minimo: 6,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-012',
    codigo_interno: 'LIM-001',
    codigo_barras: '7896098900253',
    nome: 'Detergente Líquido Neutro Ypê 500ml',
    categoria: 'Limpeza',
    preco_custo: 1.80,
    preco_venda: 2.70,
    estoque_atual: 80,
    estoque_minimo: 20,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-013',
    codigo_interno: 'LIM-002',
    codigo_barras: '7891037000100',
    nome: 'Sabão em Pó Omo Lavagem Perfeita 800g',
    categoria: 'Limpeza',
    preco_custo: 11.20,
    preco_venda: 15.90,
    estoque_atual: 22,
    estoque_minimo: 6,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-014',
    codigo_interno: 'HIG-001',
    codigo_barras: '7891055310014',
    nome: 'Creme Dental Colgate Total 12 90g',
    categoria: 'Higiene',
    preco_custo: 4.50,
    preco_venda: 6.99,
    estoque_atual: 35,
    estoque_minimo: 10,
    unidade: 'UN',
    ativo: true,
  },
  {
    id: 'prod-015',
    codigo_interno: 'HIG-002',
    codigo_barras: '7896000700018',
    nome: 'Sabonete em Barra Dove Original 90g',
    categoria: 'Higiene',
    preco_custo: 3.20,
    preco_venda: 4.80,
    estoque_atual: 48,
    estoque_minimo: 12,
    unidade: 'UN',
    ativo: true,
  },
];

// Funções auxiliares para localStorage
function getLocalProdutos(): Produto[] {
  if (typeof window === 'undefined') return PRODUTOS_PADRAO;
  const raw = localStorage.getItem(STORAGE_PRODUTOS);
  if (!raw) {
    localStorage.setItem(STORAGE_PRODUTOS, JSON.stringify(PRODUTOS_PADRAO));
    return PRODUTOS_PADRAO;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return PRODUTOS_PADRAO;
  }
}

function saveLocalProdutos(produtos: Produto[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_PRODUTOS, JSON.stringify(produtos));
}

function getLocalVendas(): Venda[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_VENDAS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalVendas(vendas: Venda[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_VENDAS, JSON.stringify(vendas));
}

function getLocalMovimentacoes(): MovimentacaoEstoque[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_MOVIMENTACOES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalMovimentacoes(movs: MovimentacaoEstoque[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_MOVIMENTACOES, JSON.stringify(movs));
}

// -----------------------------------------------------------------------------
// REPOSITÓRIO: PRODUTOS
// -----------------------------------------------------------------------------
export async function getProdutos(): Promise<{ produtos: Produto[]; fromSupabase: boolean; error?: string }> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (!error && data && data.length > 0) {
        // Mapear campos para numérico
        const formatted = data.map((p) => ({
          ...p,
          preco_custo: Number(p.preco_custo),
          preco_venda: Number(p.preco_venda),
          estoque_atual: Number(p.estoque_atual),
          estoque_minimo: Number(p.estoque_minimo),
        }));
        // Salva cópia em cache local
        saveLocalProdutos(formatted);
        return { produtos: formatted, fromSupabase: true };
      }
      if (error) {
        console.warn('Erro ao carregar do Supabase, usando armazenamento local:', error.message);
      }
    } catch (err: any) {
      console.warn('Exceção ao conectar com Supabase:', err?.message);
    }
  }

  return { produtos: getLocalProdutos(), fromSupabase: false };
}

export async function buscarProdutoPorCodigo(codigo: string): Promise<Produto | null> {
  const cleanCode = codigo.trim();
  if (!cleanCode) return null;

  const { produtos } = await getProdutos();
  return (
    produtos.find(
      (p) =>
        p.ativo &&
        (p.codigo_barras.toLowerCase() === cleanCode.toLowerCase() ||
          p.codigo_interno.toLowerCase() === cleanCode.toLowerCase())
    ) || null
  );
}

export async function salvarProduto(
  produto: Omit<Produto, 'id'> & { id?: string }
): Promise<{ success: boolean; produto?: Produto; error?: string }> {
  const supabase = getSupabase();
  const id = produto.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`);

  const produtoCompleto: Produto = {
    ...produto,
    id,
    preco_custo: Number(produto.preco_custo),
    preco_venda: Number(produto.preco_venda),
    estoque_atual: Number(produto.estoque_atual),
    estoque_minimo: Number(produto.estoque_minimo),
    ativo: produto.ativo !== false,
  };

  // Salvar no Supabase se disponível
  if (supabase) {
    try {
      const { error } = await supabase
        .from('produtos')
        .upsert({
          id: produtoCompleto.id,
          codigo_interno: produtoCompleto.codigo_interno,
          codigo_barras: produtoCompleto.codigo_barras,
          nome: produtoCompleto.nome,
          categoria: produtoCompleto.categoria,
          preco_custo: produtoCompleto.preco_custo,
          preco_venda: produtoCompleto.preco_venda,
          estoque_atual: produtoCompleto.estoque_atual,
          estoque_minimo: produtoCompleto.estoque_minimo,
          unidade: produtoCompleto.unidade,
          ativo: produtoCompleto.ativo,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Erro ao salvar produto no Supabase:', error);
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      console.error('Falha de rede ao salvar produto no Supabase:', err);
    }
  }

  // Sempre sincronizar no local
  const locais = getLocalProdutos();
  const index = locais.findIndex((p) => p.id === id);
  if (index >= 0) {
    locais[index] = produtoCompleto;
  } else {
    locais.push(produtoCompleto);
  }
  saveLocalProdutos(locais);

  return { success: true, produto: produtoCompleto };
}

export async function excluirProduto(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) {
        // Se houver restrição de chave estrangeira em itens de venda, desativa
        if (error.code === '23503') {
          await supabase.from('produtos').update({ ativo: false }).eq('id', id);
        } else {
          return { success: false, error: error.message };
        }
      }
    } catch (err: any) {
      console.error('Erro ao excluir no Supabase:', err);
    }
  }

  const locais = getLocalProdutos().filter((p) => p.id !== id);
  saveLocalProdutos(locais);

  return { success: true };
}

// -----------------------------------------------------------------------------
// REPOSITÓRIO: FRENTE DE CAIXA (PDV) E FINALIZAÇÃO DE VENDA
// -----------------------------------------------------------------------------
export interface FinalizarVendaPayload {
  itens: ItemCarrinhoPDV[];
  formaPagamento: FormaPagamento;
  valorRecebido: number;
  troco: number;
  desconto: number;
  operadorNome: string;
  observacoes?: string;
}

export async function finalizarVendaPDV(
  payload: FinalizarVendaPayload
): Promise<{ success: boolean; venda?: Venda; error?: string; fromSupabase: boolean }> {
  const supabase = getSupabase();

  const totalBruto = payload.itens.reduce((acc, item) => acc + item.subtotal, 0);
  const totalLiquido = Math.max(0, totalBruto - (payload.desconto || 0));

  const localVendas = getLocalVendas();
  const proximoNumero = localVendas.length > 0 ? Math.max(...localVendas.map((v) => v.numero_venda || 0)) + 1 : 1;
  const vendaId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `venda-${Date.now()}`;
  const dataVenda = new Date().toISOString();

  const itensFormatados = payload.itens.map((it) => ({
    produto_id: it.produto_id,
    codigo_barras: it.codigo_barras,
    nome_produto: it.nome_produto,
    quantidade: it.quantidade,
    preco_unitario: it.preco_unitario,
    subtotal: it.subtotal,
  }));

  const pagamentosFormatados = [
    {
      forma_pagamento: payload.formaPagamento,
      valor_pago: payload.formaPagamento === 'DINHEIRO' ? payload.valorRecebido : totalLiquido,
      troco: payload.troco || 0,
    },
  ];

  // 1. Tentar execução transacional no Supabase via RPC se disponível
  if (supabase) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('finalizar_venda_transacional', {
        p_venda: {
          total_bruto: totalBruto,
          desconto: payload.desconto || 0,
          total_liquido: totalLiquido,
          operador_nome: payload.operadorNome || 'Caixa 01',
          observacoes: payload.observacoes || '',
        },
        p_itens: itensFormatados,
        p_pagamentos: pagamentosFormatados,
      });

      if (!rpcError && rpcData?.success) {
        const novaVenda: Venda = {
          id: rpcData.venda_id || vendaId,
          numero_venda: Number(rpcData.numero_venda || proximoNumero),
          data_venda: dataVenda,
          total_bruto: totalBruto,
          desconto: payload.desconto || 0,
          total_liquido: totalLiquido,
          status: 'CONCLUIDA',
          operador_nome: payload.operadorNome || 'Caixa 01',
          observacoes: payload.observacoes,
          itens: itensFormatados,
          pagamentos: pagamentosFormatados,
        };

        // Atualizar cache local
        localVendas.unshift(novaVenda);
        saveLocalVendas(localVendas);

        return { success: true, venda: novaVenda, fromSupabase: true };
      }

      // Se RPC falhar (ex: função não criada no SQL Editor ainda), tentar inserção padrão direta
      if (rpcError) {
        console.warn('Função RPC não disponível, gravando diretamente nas tabelas:', rpcError.message);

        const { data: vData, error: vErr } = await supabase
          .from('vendas')
          .insert({
            id: vendaId,
            total_bruto: totalBruto,
            desconto: payload.desconto || 0,
            total_liquido: totalLiquido,
            status: 'CONCLUIDA',
            operador_nome: payload.operadorNome || 'Caixa 01',
            observacoes: payload.observacoes,
            data_venda: dataVenda,
          })
          .select('id, numero_venda')
          .single();

        if (!vErr && vData) {
          const insertedVendaId = vData.id;
          const numVenda = vData.numero_venda || proximoNumero;

          // Inserir itens
          await supabase.from('itens_venda').insert(
            itensFormatados.map((it) => ({
              venda_id: insertedVendaId,
              ...it,
            }))
          );

          // Inserir pagamentos
          await supabase.from('pagamentos_venda').insert(
            pagamentosFormatados.map((pg) => ({
              venda_id: insertedVendaId,
              ...pg,
            }))
          );

          // Baixar estoque de cada produto
          for (const item of payload.itens) {
            const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', item.produto_id).single();
            if (prod) {
              const estoqueAnt = Number(prod.estoque_atual);
              const novoEstoque = estoqueAnt - item.quantidade;
              await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', item.produto_id);
              await supabase.from('movimentacoes_estoque').insert({
                produto_id: item.produto_id,
                tipo: 'SAIDA_VENDA',
                quantidade: item.quantidade,
                estoque_anterior: estoqueAnt,
                estoque_posterior: novoEstoque,
                motivo: `Venda #${numVenda}`,
                venda_id: insertedVendaId,
              });
            }
          }

          const novaVenda: Venda = {
            id: insertedVendaId,
            numero_venda: numVenda,
            data_venda: dataVenda,
            total_bruto: totalBruto,
            desconto: payload.desconto || 0,
            total_liquido: totalLiquido,
            status: 'CONCLUIDA',
            operador_nome: payload.operadorNome || 'Caixa 01',
            observacoes: payload.observacoes,
            itens: itensFormatados,
            pagamentos: pagamentosFormatados,
          };

          localVendas.unshift(novaVenda);
          saveLocalVendas(localVendas);

          return { success: true, venda: novaVenda, fromSupabase: true };
        }
      }
    } catch (err: any) {
      console.error('Falha ao processar venda no Supabase:', err);
    }
  }

  // 2. Fluxo local (offline ou aguardando conexão Supabase)
  const produtosLocais = getLocalProdutos();
  const movsLocais = getLocalMovimentacoes();

  for (const item of payload.itens) {
    const prod = produtosLocais.find((p) => p.id === item.produto_id);
    if (prod) {
      const ant = prod.estoque_atual;
      const novo = ant - item.quantidade;
      prod.estoque_atual = novo;

      movsLocais.unshift({
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        produto_id: item.produto_id,
        nome_produto: item.nome_produto,
        tipo: 'SAIDA_VENDA',
        quantidade: item.quantidade,
        estoque_anterior: ant,
        estoque_posterior: novo,
        motivo: `Venda #${proximoNumero}`,
        venda_id: vendaId,
        created_at: dataVenda,
      });
    }
  }
  saveLocalProdutos(produtosLocais);
  saveLocalMovimentacoes(movsLocais);

  const novaVenda: Venda = {
    id: vendaId,
    numero_venda: proximoNumero,
    data_venda: dataVenda,
    total_bruto: totalBruto,
    desconto: payload.desconto || 0,
    total_liquido: totalLiquido,
    status: 'CONCLUIDA',
    operador_nome: payload.operadorNome || 'Caixa 01',
    observacoes: payload.observacoes,
    itens: itensFormatados,
    pagamentos: pagamentosFormatados,
  };

  localVendas.unshift(novaVenda);
  saveLocalVendas(localVendas);

  return { success: true, venda: novaVenda, fromSupabase: false };
}

// -----------------------------------------------------------------------------
// REPOSITÓRIO: VENDAS E CANCELAMENTO
// -----------------------------------------------------------------------------
export async function getVendas(): Promise<{ vendas: Venda[]; fromSupabase: boolean }> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          id,
          numero_venda,
          data_venda,
          total_bruto,
          desconto,
          total_liquido,
          status,
          operador_nome,
          observacoes,
          itens:itens_venda (
            id,
            produto_id,
            codigo_barras,
            nome_produto,
            quantidade,
            preco_unitario,
            subtotal
          ),
          pagamentos:pagamentos_venda (
            id,
            forma_pagamento,
            valor_pago,
            troco
          )
        `)
        .order('data_venda', { ascending: false });

      if (!error && data) {
        const formatted: Venda[] = data.map((v: any) => ({
          id: v.id,
          numero_venda: Number(v.numero_venda),
          data_venda: v.data_venda,
          total_bruto: Number(v.total_bruto),
          desconto: Number(v.desconto || 0),
          total_liquido: Number(v.total_liquido),
          status: v.status,
          operador_nome: v.operador_nome,
          observacoes: v.observacoes,
          itens: (v.itens || []).map((it: any) => ({
            ...it,
            quantidade: Number(it.quantidade),
            preco_unitario: Number(it.preco_unitario),
            subtotal: Number(it.subtotal),
          })),
          pagamentos: (v.pagamentos || []).map((p: any) => ({
            ...p,
            valor_pago: Number(p.valor_pago),
            troco: Number(p.troco || 0),
          })),
        }));

        saveLocalVendas(formatted);
        return { vendas: formatted, fromSupabase: true };
      }
    } catch (err: any) {
      console.warn('Erro ao consultar vendas no Supabase:', err);
    }
  }

  return { vendas: getLocalVendas(), fromSupabase: false };
}

export async function cancelarVenda(
  vendaId: string,
  motivo: string = 'Cancelado pelo operador'
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('cancelar_venda_transacional', {
        p_venda_id: vendaId,
        p_motivo: motivo,
      });

      if (!error && data?.success) {
        return { success: true };
      }
    } catch (err: any) {
      console.error('Erro ao cancelar venda no Supabase:', err);
    }
  }

  // Fallback local
  const vendas = getLocalVendas();
  const venda = vendas.find((v) => v.id === vendaId);
  if (!venda) return { success: false, error: 'Venda não encontrada' };
  if (venda.status === 'CANCELADA') return { success: false, error: 'Venda já cancelada' };

  venda.status = 'CANCELADA';
  venda.observacoes = (venda.observacoes ? `${venda.observacoes} ` : '') + `[CANCELADA: ${motivo}]`;
  saveLocalVendas(vendas);

  // Estornar estoque local
  const produtos = getLocalProdutos();
  const movs = getLocalMovimentacoes();

  for (const item of venda.itens) {
    const prod = produtos.find((p) => p.id === item.produto_id);
    if (prod) {
      const ant = prod.estoque_atual;
      const novo = ant + item.quantidade;
      prod.estoque_atual = novo;

      movs.unshift({
        id: `mov-estorno-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        produto_id: item.produto_id,
        nome_produto: item.nome_produto,
        tipo: 'ENTRADA',
        quantidade: item.quantidade,
        estoque_anterior: ant,
        estoque_posterior: novo,
        motivo: `Estorno Venda #${venda.numero_venda}: ${motivo}`,
        venda_id: venda.id,
        created_at: new Date().toISOString(),
      });
    }
  }

  saveLocalProdutos(produtos);
  saveLocalMovimentacoes(movs);

  return { success: true };
}

// -----------------------------------------------------------------------------
// REPOSITÓRIO: ESTOQUE E AJUSTES
// -----------------------------------------------------------------------------
export async function ajustarEstoque(
  produtoId: string,
  quantidadeAjuste: number,
  tipo: 'ENTRADA' | 'AJUSTE' | 'PERDA',
  motivo: string
): Promise<{ success: boolean; novoEstoque: number; error?: string }> {
  const supabase = getSupabase();
  const { produtos } = await getProdutos();
  const prod = produtos.find((p) => p.id === produtoId);

  if (!prod) {
    return { success: false, novoEstoque: 0, error: 'Produto não encontrado' };
  }

  const estoqueAnterior = prod.estoque_atual;
  let novoEstoque: number;

  if (tipo === 'ENTRADA') {
    novoEstoque = estoqueAnterior + quantidadeAjuste;
  } else if (tipo === 'PERDA') {
    novoEstoque = Math.max(0, estoqueAnterior - quantidadeAjuste);
  } else {
    // AJUSTE: quantidadeAjuste é o novo valor absoluto
    novoEstoque = quantidadeAjuste;
  }

  const delta = Math.abs(novoEstoque - estoqueAnterior);

  if (supabase) {
    try {
      const { error: updErr } = await supabase
        .from('produtos')
        .update({ estoque_atual: novoEstoque, updated_at: new Date().toISOString() })
        .eq('id', produtoId);

      if (!updErr) {
        await supabase.from('movimentacoes_estoque').insert({
          produto_id: produtoId,
          tipo,
          quantidade: delta,
          estoque_anterior: estoqueAnterior,
          estoque_posterior: novoEstoque,
          motivo,
        });
      }
    } catch (err: any) {
      console.warn('Erro ao atualizar estoque no Supabase:', err);
    }
  }

  // Atualizar local
  prod.estoque_atual = novoEstoque;
  saveLocalProdutos(produtos);

  const movs = getLocalMovimentacoes();
  movs.unshift({
    id: `mov-${Date.now()}`,
    produto_id: produtoId,
    nome_produto: prod.nome,
    tipo,
    quantidade: delta,
    estoque_anterior: estoqueAnterior,
    estoque_posterior: novoEstoque,
    motivo,
    created_at: new Date().toISOString(),
  });
  saveLocalMovimentacoes(movs);

  return { success: true, novoEstoque };
}

export async function getMovimentacoesEstoque(): Promise<MovimentacaoEstoque[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select(`
          id,
          produto_id,
          tipo,
          quantidade,
          estoque_anterior,
          estoque_posterior,
          motivo,
          venda_id,
          created_at,
          produtos ( nome )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        const formatted: MovimentacaoEstoque[] = data.map((m: any) => ({
          id: m.id,
          produto_id: m.produto_id,
          nome_produto: m.produtos?.nome || 'Produto',
          tipo: m.tipo,
          quantidade: Number(m.quantidade),
          estoque_anterior: Number(m.estoque_anterior),
          estoque_posterior: Number(m.estoque_posterior),
          motivo: m.motivo,
          venda_id: m.venda_id,
          created_at: m.created_at,
        }));
        saveLocalMovimentacoes(formatted);
        return formatted;
      }
    } catch (err: any) {
      console.warn('Erro ao consultar movimentações no Supabase:', err);
    }
  }

  return getLocalMovimentacoes();
}

// -----------------------------------------------------------------------------
// REPOSITÓRIO: CONFIGURAÇÕES DA LOJA
// -----------------------------------------------------------------------------
export async function getConfiguracoesLoja(): Promise<ConfiguracaoLoja> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('configuracoes_loja')
        .select('*')
        .limit(1)
        .single();

      if (!error && data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_CONFIG, JSON.stringify(data));
        }
        return data;
      }
    } catch (err: any) {
      console.warn('Erro ao carregar configurações do Supabase:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_CONFIG);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
  }

  return CONFIG_PADRAO;
}

export async function salvarConfiguracoesLoja(config: ConfiguracaoLoja): Promise<boolean> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { error } = await supabase
        .from('configuracoes_loja')
        .upsert({
          nome_fantasia: config.nome_fantasia,
          razao_social: config.razao_social,
          cnpj: config.cnpj,
          telefone: config.telefone,
          endereco: config.endereco,
          cidade_uf: config.cidade_uf,
          mensagem_cupom: config.mensagem_cupom,
          som_bip_ativo: config.som_bip_ativo,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        console.error('Erro ao salvar configurações no Supabase:', error);
      }
    } catch (err: any) {
      console.error('Erro de rede nas configurações:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_CONFIG, JSON.stringify(config));
  }

  return true;
}

// -----------------------------------------------------------------------------
// METRICAS DO DASHBOARD
// -----------------------------------------------------------------------------
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { vendas } = await getVendas();
  const { produtos } = await getProdutos();

  const hoje = new Date().toISOString().split('T')[0];

  const vendasHoje = vendas.filter((v) => {
    if (v.status === 'CANCELADA') return false;
    const dataV = v.data_venda ? v.data_venda.split('T')[0] : '';
    return dataV === hoje;
  });

  const totalVendasHoje = vendasHoje.length;
  const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + (v.total_liquido || 0), 0);
  const ticketMedioHoje = totalVendasHoje > 0 ? faturamentoHoje / totalVendasHoje : 0;

  let itensVendidosHoje = 0;
  vendasHoje.forEach((v) => {
    (v.itens || []).forEach((it) => {
      itensVendidosHoje += Number(it.quantidade || 0);
    });
  });

  const produtosEstoqueBaixoCount = produtos.filter((p) => p.ativo && p.estoque_atual <= p.estoque_minimo).length;

  // Agrupamento por forma de pagamento hoje
  const pagMap: Record<FormaPagamento, { total: number; quantidade: number }> = {
    DINHEIRO: { total: 0, quantidade: 0 },
    PIX: { total: 0, quantidade: 0 },
    DEBITO: { total: 0, quantidade: 0 },
    CREDITO: { total: 0, quantidade: 0 },
  };

  vendasHoje.forEach((v) => {
    (v.pagamentos || []).forEach((p) => {
      if (pagMap[p.forma_pagamento]) {
        pagMap[p.forma_pagamento].total += p.valor_pago - (p.troco || 0);
        pagMap[p.forma_pagamento].quantidade += 1;
      }
    });
  });

  const vendasPorFormaPagamento = (Object.keys(pagMap) as FormaPagamento[]).map((forma) => ({
    forma,
    total: pagMap[forma].total,
    quantidade: pagMap[forma].quantidade,
  }));

  // Produtos mais vendidos
  const prodVendasMap: Record<string, { nome: string; quantidade: number; total_gerado: number }> = {};

  vendas.filter(v => v.status !== 'CANCELADA').forEach((v) => {
    (v.itens || []).forEach((it) => {
      if (!prodVendasMap[it.produto_id]) {
        prodVendasMap[it.produto_id] = {
          nome: it.nome_produto,
          quantidade: 0,
          total_gerado: 0,
        };
      }
      prodVendasMap[it.produto_id].quantidade += Number(it.quantidade || 0);
      prodVendasMap[it.produto_id].total_gerado += Number(it.subtotal || 0);
    });
  });

  const produtosMaisVendidos = Object.entries(prodVendasMap)
    .map(([produto_id, data]) => ({
      produto_id,
      nome: data.nome,
      quantidade: data.quantidade,
      total_gerado: data.total_gerado,
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  return {
    totalVendasHoje,
    faturamentoHoje,
    ticketMedioHoje,
    itensVendidosHoje,
    produtosEstoqueBaixoCount,
    vendasPorFormaPagamento,
    produtosMaisVendidos,
    ultimasVendas: vendas.slice(0, 8),
  };
}

// Sincronizar catálogo padrão para o Supabase
export async function sincronizarCatalogoParaSupabase(): Promise<{ success: boolean; inseridos: number; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, inseridos: 0, error: 'Supabase não está configurado.' };
  }

  const produtosLocais = getLocalProdutos();
  try {
    const { error } = await supabase.from('produtos').upsert(
      produtosLocais.map((p) => ({
        codigo_interno: p.codigo_interno,
        codigo_barras: p.codigo_barras,
        nome: p.nome,
        categoria: p.categoria,
        preco_custo: p.preco_custo,
        preco_venda: p.preco_venda,
        estoque_atual: p.estoque_atual,
        estoque_minimo: p.estoque_minimo,
        unidade: p.unidade,
        ativo: p.ativo,
      })),
      { onConflict: 'codigo_barras' }
    );

    if (error) {
      return { success: false, inseridos: 0, error: error.message };
    }

    return { success: true, inseridos: produtosLocais.length };
  } catch (err: any) {
    return { success: false, inseridos: 0, error: err.message || 'Erro ao sincronizar' };
  }
}
