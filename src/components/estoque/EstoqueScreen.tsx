import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Search,
  PlusCircle,
  X,
  CheckCircle,
} from 'lucide-react';
import { MovimentacaoEstoque, Produto } from '../../types';
import { ajustarEstoque, getMovimentacoesEstoque, getProdutos } from '../../lib/storage';
import { formatCurrency, formatDateTime, formatQuantity } from '../../utils/formatters';

export const EstoqueScreen: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'posicao' | 'movimentacoes'>('posicao');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'BAIXO' | 'ZERADO'>('TODOS');

  // Modal de Ajuste de Estoque
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState<boolean>(false);
  const [selectedProdutoId, setSelectedProdutoId] = useState<string>('');
  const [tipoAjuste, setTipoAjuste] = useState<'ENTRADA' | 'AJUSTE' | 'PERDA'>('ENTRADA');
  const [quantidadeAjuste, setQuantidadeAjuste] = useState<string>('');
  const [motivoAjuste, setMotivoAjuste] = useState<string>('');
  const [isSavingAjuste, setIsSavingAjuste] = useState<boolean>(false);
  const [ajusteFeedback, setAjusteFeedback] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const prodRes = await getProdutos();
      setProdutos(prodRes.produtos);
      const movs = await getMovimentacoesEstoque();
      setMovimentacoes(movs);
    } catch (err) {
      console.error('Erro ao carregar estoque:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAjuste = (produtoId?: string) => {
    if (produtoId) {
      setSelectedProdutoId(produtoId);
    } else if (produtos.length > 0) {
      setSelectedProdutoId(produtos[0].id);
    }
    setTipoAjuste('ENTRADA');
    setQuantidadeAjuste('10');
    setMotivoAjuste('Recebimento de mercadoria de fornecedor');
    setAjusteFeedback('');
    setIsAjusteModalOpen(true);
  };

  const handleSalvarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantidadeAjuste.replace(',', '.')) || 0;
    if (qty <= 0 && tipoAjuste !== 'AJUSTE') {
      setAjusteFeedback('Informe uma quantidade válida.');
      return;
    }

    setIsSavingAjuste(true);
    setAjusteFeedback('');

    try {
      const res = await ajustarEstoque(
        selectedProdutoId,
        qty,
        tipoAjuste,
        motivoAjuste || 'Ajuste manual de estoque'
      );

      if (res.success) {
        setIsAjusteModalOpen(false);
        loadData();
      } else {
        setAjusteFeedback(res.error || 'Erro ao ajustar estoque.');
      }
    } catch (err: any) {
      setAjusteFeedback(err?.message || 'Erro ao processar ajuste.');
    } finally {
      setIsSavingAjuste(false);
    }
  };

  // Cálculos consolidados
  const totalItensEstoque = produtos.reduce((acc, p) => acc + (p.ativo ? p.estoque_atual : 0), 0);
  const valorTotalCusto = produtos.reduce((acc, p) => acc + (p.ativo ? p.estoque_atual * p.preco_custo : 0), 0);
  const valorTotalVenda = produtos.reduce((acc, p) => acc + (p.ativo ? p.estoque_atual * p.preco_venda : 0), 0);
  const itensCriticos = produtos.filter((p) => p.ativo && p.estoque_atual <= p.estoque_minimo);

  const filteredProdutos = produtos.filter((prod) => {
    if (!prod.ativo) return false;
    const term = searchTerm.toLowerCase();
    const match =
      prod.nome.toLowerCase().includes(term) ||
      prod.codigo_barras.toLowerCase().includes(term) ||
      prod.codigo_interno.toLowerCase().includes(term);

    if (!match) return false;

    if (statusFilter === 'BAIXO' && prod.estoque_atual > prod.estoque_minimo) return false;
    if (statusFilter === 'ZERADO' && prod.estoque_atual > 0) return false;

    return true;
  });

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950">
      {/* Topo: Título e Botão de Ajuste */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Controle de Estoque
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitore quantidades disponíveis, valor patrimonial e histórico de movimentações
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-800 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => handleOpenAjuste()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-emerald-950"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lançar Ajuste / Entrada</span>
          </button>
        </div>
      </div>

      {/* Cards de Indicadores do Estoque */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total em Estoque
          </span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums mt-2">
            {Math.round(totalItensEstoque)} un
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {produtos.filter((p) => p.ativo).length} itens ativos cadastrados
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Valor a Preço de Custo
          </span>
          <div className="text-2xl font-bold font-mono text-slate-200 tabular-nums mt-2">
            {formatCurrency(valorTotalCusto)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Capital investido em mercadorias
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Potencial de Venda (Receita)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-2">
            {formatCurrency(valorTotalVenda)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Faturamento bruto potencial
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Itens Abaixo do Mínimo
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-2 flex items-center gap-2">
            {itensCriticos.length}
            {itensCriticos.length > 0 && <AlertTriangle className="w-5 h-5 text-amber-400" />}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Necessitam de pedido de reposição
          </span>
        </div>
      </div>

      {/* Seletor de Abas: Posição Atual vs Movimentações */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('posicao')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'posicao'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Posição de Estoque por Produto
        </button>

        <button
          onClick={() => setActiveTab('movimentacoes')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'movimentacoes'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Histórico de Movimentações ({movimentacoes.length})
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {activeTab === 'posicao' ? (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nome ou código..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="TODOS">Todos os Níveis</option>
                <option value="BAIXO">Apenas Estoque Baixo / Crítico</option>
                <option value="ZERADO">Apenas Estoque Zerado</option>
              </select>
            </div>
          </div>

          {/* Tabela de Posição de Estoque */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Cód. Barras</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3 text-right">Estoque Mínimo</th>
                    <th className="px-4 py-3 text-right">Estoque Atual</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center w-28">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProdutos.map((prod) => {
                    const isZero = prod.estoque_atual <= 0;
                    const isLow = prod.estoque_atual <= prod.estoque_minimo;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                          {prod.codigo_barras}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {prod.nome}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {prod.categoria}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-400 tabular-nums">
                          {formatQuantity(prod.estoque_minimo, prod.unidade)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-bold tabular-nums">
                          <span
                            className={
                              isZero
                                ? 'text-rose-400'
                                : isLow
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {formatQuantity(prod.estoque_atual, prod.unidade)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              isZero
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : isLow
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {isZero ? 'Zerado' : isLow ? 'Baixo' : 'Normal'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenAjuste(prod.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs font-medium transition-colors"
                          >
                            Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Aba de Histórico de Movimentações */
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            {movimentacoes.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-300">
                  Nenhuma movimentação de estoque registrada até o momento.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Data / Hora</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Qtd</th>
                    <th className="px-4 py-3 text-right">Anterior</th>
                    <th className="px-4 py-3 text-right">Novo Estoque</th>
                    <th className="px-4 py-3">Motivo / Venda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {movimentacoes.map((mov) => {
                    const isSaida = mov.tipo === 'SAIDA_VENDA' || mov.tipo === 'PERDA';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-950/40 text-xs">
                        <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                          {formatDateTime(mov.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {mov.nome_produto}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              isSaida ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {isSaida ? (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                            {mov.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                          {mov.quantidade} un
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400 tabular-nums">
                          {mov.estoque_anterior}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-white tabular-nums">
                          {mov.estoque_posterior}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {mov.motivo || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Estoque */}
      {isAjusteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
          onClick={() => !isSavingAjuste && setIsAjusteModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Lançar Movimentação de Estoque
                </h3>
              </div>
              <button
                onClick={() => setIsAjusteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarAjuste} className="p-6 space-y-4">
              {/* Seleção do Produto */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Produto *
                </label>
                <select
                  required
                  value={selectedProdutoId}
                  onChange={(e) => setSelectedProdutoId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
                >
                  {produtos
                    .filter((p) => p.ativo)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} (Atual: {p.estoque_atual} {p.unidade})
                      </option>
                    ))}
                </select>
              </div>

              {/* Tipo de Ajuste */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Tipo de Operação *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoAjuste('ENTRADA');
                      setMotivoAjuste('Entrada de mercadoria de fornecedor');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition-colors ${
                      tipoAjuste === 'ENTRADA'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    + Entrada
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoAjuste('PERDA');
                      setMotivoAjuste('Avaria / Produto vencido / Perda');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition-colors ${
                      tipoAjuste === 'PERDA'
                        ? 'bg-rose-950 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    - Perda/Avaria
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoAjuste('AJUSTE');
                      setMotivoAjuste('Ajuste de inventário (Balanço)');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition-colors ${
                      tipoAjuste === 'AJUSTE'
                        ? 'bg-purple-950 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    = Balanço
                  </button>
                </div>
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  {tipoAjuste === 'AJUSTE'
                    ? 'Novo Saldo Real em Estoque *'
                    : 'Quantidade a Movimentar *'}
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={quantidadeAjuste}
                  onChange={(e) => setQuantidadeAjuste(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Motivo / Observações
                </label>
                <input
                  type="text"
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  placeholder="Ex: NF 12345 Fornecedor X"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {ajusteFeedback && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                  {ajusteFeedback}
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAjusteModalOpen(false)}
                  disabled={isSavingAjuste}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSavingAjuste}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-emerald-950"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmar Movimentação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
