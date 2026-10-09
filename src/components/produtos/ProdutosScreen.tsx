import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Barcode,
  CheckCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { Produto } from '../../types';
import { excluirProduto, getProdutos, salvarProduto } from '../../lib/storage';
import { formatCurrency, formatQuantity } from '../../utils/formatters';

const CATEGORIAS_PADRAO = [
  'Mercearia',
  'Bebidas',
  'Laticínios',
  'Padaria',
  'Açougue / Carnes',
  'Hortifruti',
  'Limpeza',
  'Higiene',
  'Doces & Biscoitos',
  'Outros',
];

export const ProdutosScreen: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedEstoqueFiltro, setSelectedEstoqueFiltro] = useState<string>('TODOS');

  // Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formNome, setFormNome] = useState<string>('');
  const [formCodigoBarras, setFormCodigoBarras] = useState<string>('');
  const [formCodigoInterno, setFormCodigoInterno] = useState<string>('');
  const [formCategoria, setFormCategoria] = useState<string>('Mercearia');
  const [formPrecoCusto, setFormPrecoCusto] = useState<string>('');
  const [formPrecoVenda, setFormPrecoVenda] = useState<string>('');
  const [formEstoqueAtual, setFormEstoqueAtual] = useState<string>('10');
  const [formEstoqueMinimo, setFormEstoqueMinimo] = useState<string>('5');
  const [formUnidade, setFormUnidade] = useState<string>('UN');

  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    setLoading(true);
    try {
      const res = await getProdutos();
      setProdutos(res.produtos);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prod?: Produto) => {
    if (prod) {
      setEditingProduto(prod);
      setFormNome(prod.nome);
      setFormCodigoBarras(prod.codigo_barras);
      setFormCodigoInterno(prod.codigo_interno);
      setFormCategoria(prod.categoria);
      setFormPrecoCusto(prod.preco_custo.toFixed(2));
      setFormPrecoVenda(prod.preco_venda.toFixed(2));
      setFormEstoqueAtual(String(prod.estoque_atual));
      setFormEstoqueMinimo(String(prod.estoque_minimo));
      setFormUnidade(prod.unidade || 'UN');
    } else {
      setEditingProduto(null);
      setFormNome('');
      setFormCodigoBarras('');
      setFormCodigoInterno(`MER-${String(produtos.length + 1).padStart(3, '0')}`);
      setFormCategoria('Mercearia');
      setFormPrecoCusto('0.00');
      setFormPrecoVenda('0.00');
      setFormEstoqueAtual('10');
      setFormEstoqueMinimo('5');
      setFormUnidade('UN');
    }
    setFeedbackMsg(null);
    setIsModalOpen(true);
  };

  const handleGerarCodigoBarras = () => {
    // Gera código EAN-13 válido iniciado em 789 (Brasil)
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
    setFormCodigoBarras(`789${randomSuffix}`);
  };

  const handleSaveProduto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNome.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Informe o nome do produto.' });
      return;
    }
    if (!formCodigoBarras.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Informe ou gere o código de barras.' });
      return;
    }

    const custo = parseFloat(formPrecoCusto.replace(',', '.')) || 0;
    const venda = parseFloat(formPrecoVenda.replace(',', '.')) || 0;
    const estoque = parseFloat(formEstoqueAtual.replace(',', '.')) || 0;
    const estoqueMin = parseFloat(formEstoqueMinimo.replace(',', '.')) || 0;

    if (venda <= 0) {
      setFeedbackMsg({ type: 'error', text: 'O preço de venda deve ser maior que zero.' });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const res = await salvarProduto({
        id: editingProduto?.id,
        nome: formNome.trim(),
        codigo_barras: formCodigoBarras.trim(),
        codigo_interno: formCodigoInterno.trim() || `SKU-${Date.now()}`,
        categoria: formCategoria,
        preco_custo: custo,
        preco_venda: venda,
        estoque_atual: estoque,
        estoque_minimo: estoqueMin,
        unidade: formUnidade,
        ativo: true,
      });

      if (res.success) {
        setIsModalOpen(false);
        loadProdutos();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Erro ao salvar produto.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Falha ao salvar produto.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduto = async (prod: Produto) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${prod.nome}"?`)) {
      const res = await excluirProduto(prod.id);
      if (res.success) {
        loadProdutos();
      } else {
        alert(res.error || 'Não foi possível excluir o produto.');
      }
    }
  };

  // Cálculo da Margem de Lucro Bruta
  const custoNum = parseFloat(formPrecoCusto.replace(',', '.')) || 0;
  const vendaNum = parseFloat(formPrecoVenda.replace(',', '.')) || 0;
  const margemLucro = vendaNum > 0 ? (((vendaNum - custoNum) / vendaNum) * 100).toFixed(1) : '0.0';

  // Filtragem dos Produtos
  const filteredProdutos = produtos.filter((prod) => {
    if (!prod.ativo) return false;

    // Filtro de texto
    const term = searchTerm.toLowerCase();
    const matchText =
      prod.nome.toLowerCase().includes(term) ||
      prod.codigo_barras.toLowerCase().includes(term) ||
      prod.codigo_interno.toLowerCase().includes(term);

    if (!matchText) return false;

    // Filtro de categoria
    if (selectedCategoria !== 'TODAS' && prod.categoria !== selectedCategoria) {
      return false;
    }

    // Filtro de estoque
    if (selectedEstoqueFiltro === 'BAIXO' && prod.estoque_atual > prod.estoque_minimo) {
      return false;
    }
    if (selectedEstoqueFiltro === 'ZERADO' && prod.estoque_atual > 0) {
      return false;
    }

    return true;
  });

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950">
      {/* Topo: Título e Botão de Cadastro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Catálogo de Produtos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie preços, códigos de barras e estoque dos itens do Mercadinho Paranaguá
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Produto</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, código de barras ou SKU..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Filtro por Categoria */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="TODAS">Todas as Categorias</option>
            {CATEGORIAS_PADRAO.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Filtro por Estoque */}
          <select
            value={selectedEstoqueFiltro}
            onChange={(e) => setSelectedEstoqueFiltro(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="TODOS">Todos os Estoques</option>
            <option value="BAIXO">Estoque Baixo</option>
            <option value="ZERADO">Estoque Zerado</option>
          </select>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Listagem de Itens Cadastrados
          </span>
          <span className="text-xs font-mono text-slate-500">
            {filteredProdutos.length} de {produtos.length} produtos
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Carregando produtos...</span>
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-300">
                Nenhum produto encontrado com os filtros atuais.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategoria('TODAS');
                  setSelectedEstoqueFiltro('TODOS');
                }}
                className="text-xs text-emerald-400 hover:underline"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Cód. Barras / SKU</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Preço Custo</th>
                  <th className="px-4 py-3 text-right">Preço Venda</th>
                  <th className="px-4 py-3 text-right">Estoque</th>
                  <th className="px-4 py-3 text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProdutos.map((prod) => {
                  const isLow = prod.estoque_atual <= prod.estoque_minimo;
                  const isZero = prod.estoque_atual <= 0;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-950/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                        <div className="text-slate-200 font-semibold">{prod.codigo_barras}</div>
                        <div className="text-[11px] text-slate-500">{prod.codigo_interno}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {prod.nome}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {prod.categoria}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-400 tabular-nums">
                        {formatCurrency(prod.preco_custo)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(prod.preco_venda)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isZero
                              ? 'text-rose-400 font-bold'
                              : isLow
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-300'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                          {formatQuantity(prod.estoque_atual, prod.unidade)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Mín: {prod.estoque_minimo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(prod)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Editar produto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduto(prod)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Cadastro / Edição de Produto */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
          onClick={() => !isSaving && setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingProduto ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSaveProduto} className="p-6 space-y-4 overflow-y-auto">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Arroz Tio João Tipo 1 5kg"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Códigos: Barras e Interno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Código de Barras (EAN) *
                    </label>
                    <button
                      type="button"
                      onClick={handleGerarCodigoBarras}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Gerar EAN</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formCodigoBarras}
                      onChange={(e) => setFormCodigoBarras(e.target.value)}
                      placeholder="Ex: 7891000100103"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Código Interno (SKU)
                  </label>
                  <input
                    type="text"
                    value={formCodigoInterno}
                    onChange={(e) => setFormCodigoInterno(e.target.value)}
                    placeholder="Ex: MER-001"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Categoria e Unidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    {CATEGORIAS_PADRAO.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="UN">UN - Unidade</option>
                    <option value="KG">KG - Quilograma</option>
                    <option value="LT">LT - Litro</option>
                    <option value="PCT">PCT - Pacote</option>
                    <option value="CX">CX - Caixa</option>
                  </select>
                </div>
              </div>

              {/* Preços e Margem de Lucro */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Preço de Custo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formPrecoCusto}
                      onChange={(e) => setFormPrecoCusto(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formPrecoVenda}
                      onChange={(e) => setFormPrecoVenda(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-emerald-400 font-bold font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="text-xs text-slate-400 mb-1">Margem Bruta Estimada:</span>
                    <span className="text-sm font-bold font-mono text-teal-400 tabular-nums">
                      {margemLucro}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Estoques: Atual e Mínimo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formEstoqueAtual}
                    onChange={(e) => setFormEstoqueAtual(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formEstoqueMinimo}
                    onChange={(e) => setFormEstoqueMinimo(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {feedbackMsg && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    feedbackMsg.type === 'error'
                      ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                      : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                  }`}
                >
                  {feedbackMsg.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-emerald-950 disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Salvando...</span>
                  ) : (
                    <span>{editingProduto ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
