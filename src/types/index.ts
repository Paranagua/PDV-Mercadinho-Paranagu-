export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO';

export type StatusVenda = 'CONCLUIDA' | 'CANCELADA';

export type TipoMovimentacao = 'ENTRADA' | 'SAIDA_VENDA' | 'AJUSTE' | 'PERDA';

export interface Produto {
  id: string;
  codigo_interno: string;
  codigo_barras: string;
  nome: string;
  categoria: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ItemVenda {
  id?: string;
  venda_id?: string;
  produto_id: string;
  codigo_barras: string;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface PagamentoVenda {
  id?: string;
  venda_id?: string;
  forma_pagamento: FormaPagamento;
  valor_pago: number;
  troco: number;
}

export interface Venda {
  id: string;
  numero_venda: number;
  data_venda: string;
  total_bruto: number;
  desconto: number;
  total_liquido: number;
  status: StatusVenda;
  operador_id?: string;
  operador_nome: string;
  observacoes?: string;
  itens: ItemVenda[];
  pagamentos: PagamentoVenda[];
  created_at?: string;
}

export interface MovimentacaoEstoque {
  id: string;
  produto_id: string;
  nome_produto?: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  estoque_anterior: number;
  estoque_posterior: number;
  motivo?: string;
  venda_id?: string;
  created_at: string;
}

export interface ConfiguracaoLoja {
  id?: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  cidade_uf: string;
  mensagem_cupom: string;
  som_bip_ativo: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export interface ItemCarrinhoPDV {
  id: string; // temporary cart row id
  produto_id: string;
  codigo_barras: string;
  codigo_interno: string;
  nome_produto: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
  unidade: string;
}

export interface DashboardMetrics {
  totalVendasHoje: number;
  faturamentoHoje: number;
  ticketMedioHoje: number;
  itensVendidosHoje: number;
  produtosEstoqueBaixoCount: number;
  vendasPorFormaPagamento: {
    forma: FormaPagamento;
    total: number;
    quantidade: number;
  }[];
  produtosMaisVendidos: {
    produto_id: string;
    nome: string;
    quantidade: number;
    total_gerado: number;
  }[];
  ultimasVendas: Venda[];
}
