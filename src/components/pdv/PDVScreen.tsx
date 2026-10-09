import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Search,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  XCircle,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react';
import {
  ConfiguracaoLoja,
  FormaPagamento,
  ItemCarrinhoPDV,
  Produto,
  Venda,
} from '../../types';
import {
  buscarProdutoPorCodigo,
  finalizarVendaPDV,
  getProdutos,
} from '../../lib/storage';
import { formatCurrency, formatQuantity, playBeep } from '../../utils/formatters';
import { ProductSearchModal } from './ProductSearchModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';

interface PDVScreenProps {
  configLoja: ConfiguracaoLoja;
  onVendaConcluida?: () => void;
}

export const PDVScreen: React.FC<PDVScreenProps> = ({
  configLoja,
  onVendaConcluida,
}) => {
  const [cart, setCart] = useState<ItemCarrinhoPDV[]>([]);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [multiplier, setMultiplier] = useState<number>(1);
  const [lastScannedItem, setLastScannedItem] = useState<ItemCarrinhoPDV | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [completedVenda, setCompletedVenda] = useState<Venda | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Carregar produtos disponíveis para busca rápida
  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    const { produtos } = await getProdutos();
    setProdutos(produtos);
  };

  // Manter foco no leitor de código de barras
  useEffect(() => {
    if (!isSearchOpen && !isPaymentOpen && !isReceiptOpen) {
      barcodeInputRef.current?.focus();
    }
  }, [isSearchOpen, isPaymentOpen, isReceiptOpen, cart]);

  // Teclas de atalho globais do PDV
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignorar se outro modal estiver aberto
      if (isPaymentOpen || isReceiptOpen) return;

      if (e.key === 'F2') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        // F4 altera multiplicador de quantidade
        const input = window.prompt('Informe a quantidade para os próximos itens:', String(multiplier));
        if (input) {
          const val = parseFloat(input.replace(',', '.'));
          if (!isNaN(val) && val > 0) {
            setMultiplier(val);
          }
        }
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleClearCart();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentOpen(true);
        } else {
          setErrorMessage('Adicione ao menos um item para finalizar a venda.');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, isPaymentOpen, isReceiptOpen, multiplier]);

  // Adicionar produto ao carrinho
  const addProdutoToCart = (produto: Produto, qtyToAdd: number = 1) => {
    if (produto.estoque_atual <= 0) {
      if (configLoja.som_bip_ativo) playBeep('error');
      setErrorMessage(`Atenção: Produto "${produto.nome}" sem estoque disponível no momento.`);
    }

    if (configLoja.som_bip_ativo) {
      playBeep('scan');
    }

    setErrorMessage('');
    setSuccessMessage(`Item adicionado: ${produto.nome}`);
    setTimeout(() => setSuccessMessage(''), 3000);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((it) => it.produto_id === produto.id);

      if (existingIndex >= 0) {
        const updated = [...prevCart];
        const currentItem = updated[existingIndex];
        const newQty = currentItem.quantidade + qtyToAdd;
        const newSubtotal = newQty * currentItem.preco_unitario;

        const updatedItem: ItemCarrinhoPDV = {
          ...currentItem,
          quantidade: newQty,
          subtotal: Number(newSubtotal.toFixed(2)),
        };

        updated[existingIndex] = updatedItem;
        setLastScannedItem(updatedItem);
        return updated;
      } else {
        const newItem: ItemCarrinhoPDV = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          produto_id: produto.id,
          codigo_barras: produto.codigo_barras,
          codigo_interno: produto.codigo_interno,
          nome_produto: produto.nome,
          preco_unitario: produto.preco_venda,
          quantidade: qtyToAdd,
          subtotal: Number((qtyToAdd * produto.preco_venda).toFixed(2)),
          unidade: produto.unidade,
        };

        setLastScannedItem(newItem);
        return [newItem, ...prevCart];
      }
    });

    // Resetar multiplicador para 1 após bipar
    setMultiplier(1);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Submissão do código de barras
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    let targetCode = raw;
    let qty = multiplier;

    // Suporte ao formato clássico de PDV: "3*7891000..." ou "2*CODIGO"
    if (raw.includes('*')) {
      const parts = raw.split('*');
      if (parts.length === 2) {
        const parsedQty = parseFloat(parts[0].replace(',', '.'));
        if (!isNaN(parsedQty) && parsedQty > 0) {
          qty = parsedQty;
          targetCode = parts[1].trim();
        }
      }
    }

    const produto = await buscarProdutoPorCodigo(targetCode);

    if (produto) {
      addProdutoToCart(produto, qty);
    } else {
      if (configLoja.som_bip_ativo) playBeep('error');
      setErrorMessage(`Produto não encontrado para o código: "${targetCode}". Pressione F2 para buscar.`);
    }

    setBarcodeInput('');
  };

  // Alterar quantidade de um item no carrinho
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantidade + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantidade: newQty,
              subtotal: Number((newQty * item.preco_unitario).toFixed(2)),
            };
          }
          return item;
        })
        .filter((item): item is ItemCarrinhoPDV => item !== null)
    );
  };

  // Remover item do carrinho
  const handleRemoveItem = (itemId: string) => {
    setCart((prevCart) => {
      const filtered = prevCart.filter((item) => item.id !== itemId);
      if (lastScannedItem?.id === itemId) {
        setLastScannedItem(filtered[0] || null);
      }
      return filtered;
    });
  };

  // Limpar carrinho
  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Deseja cancelar o cupom atual e limpar todos os itens?')) {
      setCart([]);
      setLastScannedItem(null);
      setMultiplier(1);
      setErrorMessage('');
      setSuccessMessage('Cupom cancelado.');
      setTimeout(() => setSuccessMessage(''), 2000);
      barcodeInputRef.current?.focus();
    }
  };

  // Finalização da venda no backend Supabase / Storage
  const handleConfirmarVenda = async (dadosPagamento: {
    formaPagamento: FormaPagamento;
    valorRecebido: number;
    troco: number;
    desconto: number;
    observacoes?: string;
  }) => {
    setIsProcessingSale(true);
    setErrorMessage('');

    try {
      const res = await finalizarVendaPDV({
        itens: cart,
        formaPagamento: dadosPagamento.formaPagamento,
        valorRecebido: dadosPagamento.valorRecebido,
        troco: dadosPagamento.troco,
        desconto: dadosPagamento.desconto,
        operadorNome: 'Caixa 01',
        observacoes: dadosPagamento.observacoes,
      });

      if (res.success && res.venda) {
        if (configLoja.som_bip_ativo) playBeep('success');
        setCompletedVenda(res.venda);
        setIsPaymentOpen(false);
        setIsReceiptOpen(true);
        setCart([]);
        setLastScannedItem(null);
        setMultiplier(1);
        loadProdutos(); // recarregar estoque
        if (onVendaConcluida) onVendaConcluida();
      } else {
        throw new Error(res.error || 'Não foi possível finalizar a venda.');
      }
    } catch (err: any) {
      if (configLoja.som_bip_ativo) playBeep('error');
      setErrorMessage(`Erro ao processar venda: ${err?.message || 'Falha de comunicação'}`);
      throw err;
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Iniciar nova venda após emissão do cupom
  const handleNovaVenda = () => {
    setIsReceiptOpen(false);
    setCompletedVenda(null);
    setCart([]);
    setLastScannedItem(null);
    setMultiplier(1);
    setErrorMessage('');
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  const totalBruto = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItens = cart.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* 1. Barra de Ações Rápidas de Terminal PDV */}
      <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Caixa Livre / Aberto
          </span>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400 font-mono">
            Operador: Caixa 01
          </span>
        </div>

        {/* Atalhos de Teclado */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
          >
            <kbd className="px-1.5 py-0.5 bg-slate-950 rounded text-[10px] font-mono text-emerald-400">
              F2
            </kbd>
            <span>Buscar Produto</span>
          </button>

          <button
            onClick={() => {
              const val = window.prompt('Quantidade:', String(multiplier));
              if (val) setMultiplier(parseFloat(val.replace(',', '.')) || 1);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
          >
            <kbd className="px-1.5 py-0.5 bg-slate-950 rounded text-[10px] font-mono text-emerald-400">
              F4
            </kbd>
            <span>Qtd ({multiplier}x)</span>
          </button>

          <button
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 rounded-lg font-medium transition-colors disabled:opacity-40"
          >
            <kbd className="px-1.5 py-0.5 bg-slate-950 rounded text-[10px] font-mono text-rose-400">
              F7
            </kbd>
            <span>Cancelar Cupom</span>
          </button>

          <button
            onClick={() => {
              if (cart.length > 0) setIsPaymentOpen(true);
            }}
            disabled={cart.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-md shadow-emerald-950 disabled:opacity-40"
          >
            <kbd className="px-1.5 py-0.5 bg-emerald-800 rounded text-[10px] font-mono text-white">
              F8
            </kbd>
            <span>Finalizar Venda</span>
          </button>
        </div>
      </div>

      {/* Alertas e Mensagens de Feedback */}
      {errorMessage && (
        <div className="px-6 py-2 bg-rose-950/80 border-b border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="p-1 hover:text-white"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Área Central do PDV: Duas Colunas (Tabela do Cupom + Painel de Totais/Leitor) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Coluna Esquerda/Centro: Grade de Itens do Cupom Fiscal (7 colunas) */}
        <div className="lg:col-span-7 flex flex-col border-r border-slate-800/80 overflow-hidden bg-slate-950">
          {/* Cabeçalho da Tabela */}
          <div className="px-6 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Itens da Venda Atual
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {cart.length} item(ns) na lista · Total: {totalItens} un
            </span>
          </div>

          {/* Lista com Rolagem */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-600">
                  <Barcode className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-300 mb-1">
                  Aguardando leitura de produtos...
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Bipe o código de barras com o leitor USB/Bluetooth ou digite o código abaixo. Use [F2] para busca manual.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Abrir Catálogo de Produtos [F2]</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-xs">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">#</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Descrição do Produto</th>
                    <th className="px-4 py-3 text-right">Unitário</th>
                    <th className="px-4 py-3 text-center w-32">Qtd</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cart.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-900/50 transition-colors group"
                    >
                      <td className="px-4 py-3 text-center font-mono text-xs text-slate-500">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {item.codigo_barras}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-100">
                        <div className="truncate max-w-xs">{item.nome_produto}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
                        {formatCurrency(item.preco_unitario)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="p-0.5 text-slate-400 hover:text-white transition-colors"
                            title="Diminuir quantidade"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs font-bold text-white tabular-nums px-1">
                            {item.quantidade}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="p-0.5 text-slate-400 hover:text-white transition-colors"
                            title="Aumentar quantidade"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 tabular-nums whitespace-nowrap">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remover item [DEL]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Coluna Direita: Display de Caixa, Leitor e Totais (5 colunas) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 bg-slate-900/60 overflow-y-auto space-y-6">
          {/* Topo Direita: Card do Último Item Registrado (estilo supermercado) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">
                Último Item Bipado
              </span>
              {lastScannedItem && (
                <span className="font-mono text-emerald-400">
                  {lastScannedItem.codigo_barras}
                </span>
              )}
            </div>

            {lastScannedItem ? (
              <div className="space-y-2">
                <div className="text-base font-bold text-white truncate">
                  {lastScannedItem.nome_produto}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Unitário:</span>
                    <span className="text-slate-200 font-bold tabular-nums">
                      {formatCurrency(lastScannedItem.preco_unitario)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Qtd x Subtotal:</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {lastScannedItem.quantidade}x = {formatCurrency(lastScannedItem.subtotal)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-slate-500 italic">
                Nenhum produto bipado nesta venda ainda.
              </div>
            )}
          </div>

          {/* Centro Direita: Campo do Leitor de Código de Barras (Foco Principal) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="barcode-input"
                className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2"
              >
                <Barcode className="w-4 h-4 text-emerald-400" />
                <span>Leitor de Código de Barras</span>
              </label>
              {multiplier > 1 && (
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded text-xs font-mono font-bold">
                  Multiplicador: {multiplier}x
                </span>
              )}
            </div>

            <form onSubmit={handleBarcodeSubmit} className="space-y-2">
              <div className="relative">
                <input
                  id="barcode-input"
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Bipe ou digite o código (Ex: 3*789...)"
                  className="w-full px-4 py-3.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-lg font-mono font-bold text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 tracking-wider"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Enter
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Compatível com leitores USB/Bluetooth. Dica: digite <code className="text-emerald-400">3*código</code> para lançar 3 unidades de uma vez.
              </p>
            </form>
          </div>

          {/* Base Direita: Display de Grandes Totais (Totvs / Toledo Style) */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Total de Itens:</span>
                <span className="text-slate-200 tabular-nums">{totalItens} un</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Subtotal:</span>
                <span className="text-slate-200 tabular-nums">{formatCurrency(totalBruto)}</span>
              </div>
            </div>

            {/* Display Gigante de TOTAL A PAGAR */}
            <div className="pt-3 border-t border-slate-800">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                Total a Pagar
              </div>
              <div className="text-4xl font-extrabold font-mono text-emerald-400 tabular-nums tracking-tight">
                {formatCurrency(totalBruto)}
              </div>
            </div>

            {/* Botão de Finalizar Venda */}
            <button
              type="button"
              onClick={() => {
                if (cart.length > 0) setIsPaymentOpen(true);
              }}
              disabled={cart.length === 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-base rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Finalizar Venda [F8]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modais */}
      <ProductSearchModal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          barcodeInputRef.current?.focus();
        }}
        produtos={produtos}
        onSelectProduto={(produto) => addProdutoToCart(produto, multiplier)}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          barcodeInputRef.current?.focus();
        }}
        totalBruto={totalBruto}
        onConfirmarVenda={handleConfirmarVenda}
        isProcessing={isProcessingSale}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        venda={completedVenda}
        configLoja={configLoja}
        onNovaVenda={handleNovaVenda}
      />
    </div>
  );
};
