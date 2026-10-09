import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  CreditCard,
  Banknote,
  QrCode,
  ArrowUpRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { DashboardMetrics, Venda } from '../../types';
import { getDashboardMetrics } from '../../lib/storage';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface DashboardScreenProps {
  onNavigateToPDV: () => void;
  onNavigateToEstoque: () => void;
  onNavigateToVendas: () => void;
  onViewVenda?: (venda: Venda) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToPDV,
  onNavigateToEstoque,
  onNavigateToVendas,
  onViewVenda,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFormaIcon = (forma: string) => {
    switch (forma) {
      case 'DINHEIRO':
        return <Banknote className="w-4 h-4 text-emerald-400" />;
      case 'PIX':
        return <QrCode className="w-4 h-4 text-teal-400" />;
      case 'DEBITO':
      case 'CREDITO':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950">
      {/* Topo do Dashboard */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Painel de Controle - Mercadinho Paranaguá
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão consolidada das operações e vendas de hoje
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-800 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={onNavigateToPDV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-emerald-950"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Abrir Caixa PDV [F8]</span>
          </button>
        </div>
      </div>

      {/* Grid de Indicadores Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Hoje */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Faturamento Hoje
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {formatCurrency(metrics?.faturamentoHoje || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Receita líquida das vendas finalizadas
            </div>
          </div>
        </div>

        {/* Quantidade de Vendas Hoje */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total de Vendas
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {metrics?.totalVendasHoje || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Cupons emitidos no dia
            </div>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-purple-300 tabular-nums">
              {formatCurrency(metrics?.ticketMedioHoje || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Média gasta por cliente hoje
            </div>
          </div>
        </div>

        {/* Itens com Estoque Baixo */}
        <div
          onClick={onNavigateToEstoque}
          className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-800/80 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Alerta de Estoque
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {metrics?.produtosEstoqueBaixoCount || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>Produtos abaixo do mínimo</span>
              <ArrowUpRight className="w-3 h-3 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2: Distribuição por Forma de Pagamento + Top Produtos Vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vendas por Forma de Pagamento (5 colunas) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Vendas por Forma de Pagamento
            </h3>
            <span className="text-xs text-slate-500 font-mono">Hoje</span>
          </div>

          <div className="space-y-3">
            {metrics?.vendasPorFormaPagamento.map((item) => (
              <div
                key={item.forma}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                    {getFormaIcon(item.forma)}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      {item.forma}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {item.quantidade} transaç{item.quantidade === 1 ? 'ão' : 'ões'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-white tabular-nums">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Produtos Mais Vendidos (7 colunas) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Produtos Mais Vendidos
            </h3>
            <span className="text-xs text-slate-500 font-mono">Histórico Geral</span>
          </div>

          <div className="overflow-x-auto">
            {metrics?.produtosMaisVendidos.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Nenhuma venda registrada ainda para calcular o ranking.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2 w-8">#</th>
                    <th className="pb-2">Produto</th>
                    <th className="pb-2 text-right">Qtd Vendida</th>
                    <th className="pb-2 text-right">Total Gerado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {metrics?.produtosMaisVendidos.map((prod, idx) => (
                    <tr key={prod.produto_id} className="hover:bg-slate-950/40">
                      <td className="py-2.5 font-mono text-slate-500">
                        0{idx + 1}
                      </td>
                      <td className="py-2.5 font-medium text-slate-200">
                        {prod.nome}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-white tabular-nums">
                        {prod.quantidade} un
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(prod.total_gerado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Seção 3: Últimas Vendas Realizadas */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Últimas Vendas Realizadas
            </h3>
          </div>
          <button
            onClick={onNavigateToVendas}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            <span>Ver Histórico Completo</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {metrics?.ultimasVendas.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Nenhuma venda registrada até o momento.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Cupom</th>
                  <th className="pb-2">Data / Hora</th>
                  <th className="pb-2">Itens</th>
                  <th className="pb-2">Forma Pgto</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-center w-16">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics?.ultimasVendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-slate-950/40 text-xs">
                    <td className="py-2.5 font-mono font-bold text-slate-300">
                      #{String(venda.numero_venda).padStart(5, '0')}
                    </td>
                    <td className="py-2.5 font-mono text-slate-400">
                      {formatDateTime(venda.data_venda)}
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {venda.itens.length} produto(s)
                    </td>
                    <td className="py-2.5 font-medium text-slate-300">
                      {venda.pagamentos?.[0]?.forma_pagamento || 'DINHEIRO'}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-400 tabular-nums">
                      {formatCurrency(venda.total_liquido)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          venda.status === 'CONCLUIDA'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {venda.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      {onViewVenda && (
                        <button
                          onClick={() => onViewVenda(venda)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Ver detalhes da venda"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
