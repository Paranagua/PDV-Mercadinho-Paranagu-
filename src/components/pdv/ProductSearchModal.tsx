import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Check, AlertTriangle } from 'lucide-react';
import { Produto } from '../../types';
import { formatCurrency, formatQuantity } from '../../utils/formatters';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  produtos: Produto[];
  onSelectProduto: (produto: Produto) => void;
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({
  isOpen,
  onClose,
  produtos,
  onSelectProduto,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = produtos.filter((p) => {
    if (!p.ativo) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.nome.toLowerCase().includes(term) ||
      p.codigo_barras.toLowerCase().includes(term) ||
      p.codigo_interno.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelectProduto(filtered[selectedIndex]);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Cabeçalho do Modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              Buscar Produto no Catálogo [F2]
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campo de Busca Rápida */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Digite o nome, código de barras ou SKU..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 text-sm"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
            <span>{filtered.length} produto(s) encontrado(s)</span>
            <span>Navegue com ↑ / ↓ e pressione Enter para adicionar</span>
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">
                Nenhum produto encontrado com "{searchTerm}"
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Verifique a ortografia ou cadastre o item no módulo Produtos.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Cód. Barras / SKU</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Estoque</th>
                  <th className="px-4 py-3 text-right">Preço</th>
                  <th className="px-4 py-3 text-center w-20">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((prod, index) => {
                  const isSelected = index === selectedIndex;
                  const isLowStock = prod.estoque_atual <= prod.estoque_minimo;
                  const isOutOfStock = prod.estoque_atual <= 0;

                  return (
                    <tr
                      key={prod.id}
                      onClick={() => {
                        onSelectProduto(prod);
                        onClose();
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-950/40 text-emerald-200'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                        <div>{prod.codigo_barras}</div>
                        <div className="text-[11px] text-slate-500">{prod.codigo_interno}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {prod.nome}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {prod.categoria}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isOutOfStock
                              ? 'text-rose-400 font-semibold'
                              : isLowStock
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3" />}
                          {formatQuantity(prod.estoque_atual, prod.unidade)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(prod.preco_venda)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                          <Check className="w-3 h-3" />
                          <span>Adicionar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Rodapé com Atalhos */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 text-[10px] font-mono mr-1">
              ESC
            </kbd>
            Fechar
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 text-[10px] font-mono mr-1">
              ENTER
            </kbd>
            Adicionar ao Caixa
          </div>
        </div>
      </div>
    </div>
  );
};
