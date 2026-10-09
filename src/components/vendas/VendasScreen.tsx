import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Eye,
  Printer,
  Ban,
  RefreshCw,
  X,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
} from 'lucide-react';
import { ConfiguracaoLoja, Venda } from '../../types';
import { cancelarVenda, getVendas } from '../../lib/storage';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ReceiptModal } from '../pdv/ReceiptModal';

interface VendasScreenProps {
  configLoja: ConfiguracaoLoja;
  selectedVendaFromExternal?: Venda | null;
  onClearExternalVenda?: () => void;
}

export const VendasScreen: React.FC<VendasScreenProps> = ({
  configLoja,
  selectedVendaFromExternal,
  onClearExternalVenda,
}) => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'HOJE' | 'ONTEM' | '7DIAS' | 'MES' | 'TODAS'>('HOJE');
  const [statusFilter, setStatusFilter] = useState<'TODAS' | 'CONCLUIDA' | 'CANCELADA'>('TODAS');

  // Modal de Detalhes da Venda
  const [viewingVenda, setViewingVenda] = useState<Venda | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isCanceling, setIsCanceling] = useState<boolean>(false);

  useEffect(() => {
    loadVendas();
  }, []);

  useEffect(() => {
    if (selectedVendaFromExternal) {
      setViewingVenda(selectedVendaFromExternal);
      if (onClearExternalVenda) onClearExternalVenda();
    }
  }, [selectedVendaFromExternal, onClearExternalVenda]);

  const loadVendas = async () => {
    setLoading(true);
    try {
      const res = await getVendas();
      setVendas(res.vendas);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarVenda = async (venda: Venda) => {
    if (venda.status === 'CANCELADA') {
      alert('Esta venda já está cancelada.');
      return;
    }

    const motivo = window.prompt(
      `Confirma o cancelamento da Venda #${String(venda.numero_venda).padStart(5, '0')}?\n` +
      `Os itens serão automaticamente estornados no estoque.\n` +
      `Informe o motivo:`,
      'Devolução solicitada pelo cliente'
    );

    if (motivo !== null) {
      setIsCanceling(true);
      try {
        const res = await cancelarVenda(venda.id, motivo);
        if (res.success) {
          alert('Venda cancelada com sucesso e estoque estornado!');
          setViewingVenda(null);
          loadVendas();
        } else {
          alert(res.error || 'Erro ao cancelar venda.');
        }
      } catch (err: any) {
        alert(err?.message || 'Falha ao cancelar venda.');
      } finally {
        setIsCanceling(false);
      }
    }
  };

  // Filtragem por Data
  const now = new Date();
  const hojeStr = now.toISOString().split('T')[0];

  const ontemDate = new Date(now);
  ontemDate.setDate(ontemDate.getDate() - 1);
  const ontemStr = ontemDate.toISOString().split('T')[0];

  const seteDiasAtras = new Date(now);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

  const filteredVendas = vendas.filter((v) => {
    const dataV = v.data_venda ? new Date(v.data_venda) : new Date();
    const dataStr = v.data_venda ? v.data_venda.split('T')[0] : '';

    // Filtro de data
    if (dateFilter === 'HOJE' && dataStr !== hojeStr) return false;
    if (dateFilter === 'ONTEM' && dataStr !== ontemStr) return false;
    if (dateFilter === '7DIAS' && dataV < seteDiasAtras) return false;
    if (dateFilter === 'MES' && dataV < inicioMes) return false;

    // Filtro de status
    if (statusFilter !== 'TODAS' && v.status !== statusFilter) return false;

    // Filtro de busca (número ou produto)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const numMatch = String(v.numero_venda).includes(term);
      const itemMatch = v.itens?.some((it) => it.nome_produto.toLowerCase().includes(term));
      const obsMatch = v.observacoes?.toLowerCase().includes(term);
      if (!numMatch && !itemMatch && !obsMatch) return false;
    }

    return true;
  });

  const totalFiltrado = filteredVendas
    .filter((v) => v.status !== 'CANCELADA')
    .reduce((acc, v) => acc + v.total_liquido, 0);

  const getFormaIcon = (forma: string) => {
    switch (forma) {
      case 'DINHEIRO':
        return <Banknote className="w-3.5 h-3.5 text-emerald-400" />;
      case 'PIX':
        return <QrCode className="w-3.5 h-3.5 text-teal-400" />;
      case 'DEBITO':
      case 'CREDITO':
        return <CreditCard className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <DollarSign className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950">
      {/* Topo: Título e Atualizar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Histórico de Vendas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Consulte cupons emitidos, comprovantes, formas de pagamento e estornos
          </p>
        </div>

        <button
          onClick={loadVendas}
          disabled={loading}
          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-800 transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Vendas</span>
        </button>
      </div>

      {/* Indicadores do Período Filtrado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Faturamento no Período
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
            {formatCurrency(totalFiltrado)}
          </div>
          <span className="text-[11px] text-slate-400">
            Vendas válidas (excluindo canceladas)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Quantidade de Cupons
          </span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
            {filteredVendas.length}
          </div>
          <span className="text-[11px] text-slate-400">
            {filteredVendas.filter((v) => v.status === 'CANCELADA').length} cancelada(s)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Ticket Médio
          </span>
          <div className="text-2xl font-bold font-mono text-purple-300 tabular-nums mt-1">
            {filteredVendas.filter((v) => v.status !== 'CANCELADA').length > 0
              ? formatCurrency(
                  totalFiltrado /
                    filteredVendas.filter((v) => v.status !== 'CANCELADA').length
                )
              : 'R$ 0,00'}
          </div>
          <span className="text-[11px] text-slate-400">
            Média de receita por cliente
          </span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número do cupom ou produto..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Filtros de Data e Status */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="HOJE">Hoje</option>
            <option value="ONTEM">Ontem</option>
            <option value="7DIAS">Últimos 7 Dias</option>
            <option value="MES">Este Mês</option>
            <option value="TODAS">Todas as Datas</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="TODAS">Todos os Status</option>
            <option value="CONCLUIDA">Apenas Concluídas</option>
            <option value="CANCELADA">Apenas Canceladas</option>
          </select>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Carregando histórico...</span>
            </div>
          ) : filteredVendas.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-300">
                Nenhuma venda encontrada para os filtros selecionados.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Cupom Nº</th>
                  <th className="px-4 py-3">Data e Hora</th>
                  <th className="px-4 py-3">Itens</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3 text-right">Total Líquido</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredVendas.map((venda) => (
                  <tr
                    key={venda.id}
                    className="hover:bg-slate-950/40 transition-colors text-xs"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">
                      #{String(venda.numero_venda).padStart(5, '0')}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                      {formatDateTime(venda.data_venda)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <span className="font-semibold">{venda.itens?.length || 0}</span> itens
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                        {getFormaIcon(venda.pagamentos?.[0]?.forma_pagamento || 'DINHEIRO')}
                        {venda.pagamentos?.[0]?.forma_pagamento || 'DINHEIRO'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 tabular-nums text-sm">
                      {formatCurrency(venda.total_liquido)}
                    </td>
                    <td className="px-4 py-3 text-center">
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
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingVenda(venda)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Ver detalhes do cupom"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setViewingVenda(venda);
                            setIsReceiptOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          title="Reimprimir cupom"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {venda.status !== 'CANCELADA' && (
                          <button
                            type="button"
                            onClick={() => handleCancelarVenda(venda)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Cancelar venda e estornar estoque"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da Venda */}
      {viewingVenda && !isReceiptOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
          onClick={() => setViewingVenda(null)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do Modal */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Detalhes da Venda #{String(viewingVenda.numero_venda).padStart(5, '0')}
                </h3>
                <span className="text-xs text-slate-400">
                  {formatDateTime(viewingVenda.data_venda)} · Operador: {viewingVenda.operador_nome || 'Caixa 01'}
                </span>
              </div>
              <button
                onClick={() => setViewingVenda(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Itens */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Status Banner */}
              <div
                className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  viewingVenda.status === 'CONCLUIDA'
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                }`}
              >
                <span>Status da Venda: {viewingVenda.status}</span>
                {viewingVenda.observacoes && (
                  <span className="text-[11px] text-slate-400 font-normal">
                    {viewingVenda.observacoes}
                  </span>
                )}
              </div>

              {/* Tabela de Itens */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Itens da Venda
                </h4>
                <div className="rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2 text-right">Qtd</th>
                        <th className="px-3 py-2 text-right">Preço Unit</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {viewingVenda.itens.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="px-3 py-2 font-medium text-slate-200">
                            {it.nome_produto}
                            <span className="block text-[10px] text-slate-500 font-mono">
                              {it.codigo_barras}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-300 tabular-nums">
                            {it.quantidade} un
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-400 tabular-nums">
                            {formatCurrency(it.preco_unitario)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-white tabular-nums">
                            {formatCurrency(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totais e Pagamentos */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {formatCurrency(viewingVenda.total_bruto)}
                  </span>
                </div>
                {viewingVenda.desconto > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Desconto:</span>
                    <span className="font-mono tabular-nums">
                      -{formatCurrency(viewingVenda.desconto)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-emerald-400 pt-2 border-t border-slate-800">
                  <span>Total Líquido:</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(viewingVenda.total_liquido)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  {viewingVenda.pagamentos.map((pg, i) => (
                    <div key={i} className="flex justify-between text-slate-300">
                      <span>Forma: {pg.forma_pagamento}</span>
                      <span className="font-mono tabular-nums">
                        Pago: {formatCurrency(pg.valor_pago)}{' '}
                        {pg.troco > 0 && `(Troco: ${formatCurrency(pg.troco)})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rodapé com Ações */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              {viewingVenda.status !== 'CANCELADA' ? (
                <button
                  type="button"
                  onClick={() => handleCancelarVenda(viewingVenda)}
                  disabled={isCanceling}
                  className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>Cancelar Venda</span>
                </button>
              ) : (
                <span className="text-xs text-rose-400 font-semibold">
                  Venda Cancelada
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiptOpen(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Visualizar Comprovante Térmico</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante Térmico Reimpressão */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        venda={viewingVenda}
        configLoja={configLoja}
        onNovaVenda={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
