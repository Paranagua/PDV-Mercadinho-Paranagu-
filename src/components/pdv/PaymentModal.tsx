import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle,
  Coins,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { FormaPagamento } from '../../types';
import { formatCurrency, playBeep } from '../../utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalBruto: number;
  onConfirmarVenda: (data: {
    formaPagamento: FormaPagamento;
    valorRecebido: number;
    troco: number;
    desconto: number;
    observacoes?: string;
  }) => Promise<void>;
  isProcessing: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalBruto,
  onConfirmarVenda,
  isProcessing,
}) => {
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('DINHEIRO');
  const [desconto, setDesconto] = useState<number>(0);
  const [valorRecebidoInput, setValorRecebidoInput] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [erroMsg, setErroMsg] = useState<string>('');

  const inputRecebidoRef = useRef<HTMLInputElement>(null);

  const totalLiquido = Math.max(0, totalBruto - (desconto || 0));
  const valorRecebidoNum = parseFloat(valorRecebidoInput.replace(',', '.')) || 0;
  const troco = formaPagamento === 'DINHEIRO' ? Math.max(0, valorRecebidoNum - totalLiquido) : 0;
  const valorFaltante = formaPagamento === 'DINHEIRO' && valorRecebidoNum > 0 && valorRecebidoNum < totalLiquido
    ? totalLiquido - valorRecebidoNum
    : 0;

  useEffect(() => {
    if (isOpen) {
      setFormaPagamento('DINHEIRO');
      setDesconto(0);
      setValorRecebidoInput(totalLiquido.toFixed(2));
      setObservacoes('');
      setErroMsg('');
      setTimeout(() => inputRecebidoRef.current?.select(), 100);
    }
  }, [isOpen, totalLiquido]);

  const handleSelectForma = (forma: FormaPagamento) => {
    setFormaPagamento(forma);
    setErroMsg('');
    if (forma === 'DINHEIRO') {
      setValorRecebidoInput(totalLiquido.toFixed(2));
      setTimeout(() => inputRecebidoRef.current?.select(), 50);
    }
  };

  const handleCedulaRapida = (valor: number) => {
    setValorRecebidoInput(valor.toFixed(2));
    inputRecebidoRef.current?.focus();
  };

  const handleValorExato = () => {
    setValorRecebidoInput(totalLiquido.toFixed(2));
    inputRecebidoRef.current?.focus();
  };

  const handleConfirmar = async () => {
    if (formaPagamento === 'DINHEIRO' && valorRecebidoNum < totalLiquido) {
      playBeep('error');
      setErroMsg(`Valor recebido (${formatCurrency(valorRecebidoNum)}) é insuficiente para cobrir o total de ${formatCurrency(totalLiquido)}.`);
      return;
    }

    try {
      await onConfirmarVenda({
        formaPagamento,
        valorRecebido: formaPagamento === 'DINHEIRO' ? valorRecebidoNum : totalLiquido,
        troco: formaPagamento === 'DINHEIRO' ? troco : 0,
        desconto,
        observacoes,
      });
    } catch (err: any) {
      setErroMsg(err?.message || 'Erro ao processar pagamento');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !isProcessing) {
      e.preventDefault();
      handleConfirmar();
    } else if (e.key === '1') {
      handleSelectForma('DINHEIRO');
    } else if (e.key === '2') {
      handleSelectForma('PIX');
    } else if (e.key === '3') {
      handleSelectForma('DEBITO');
    } else if (e.key === '4') {
      handleSelectForma('CREDITO');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Finalização da Venda [F8]
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Painel do Total a Pagar */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Total Líquido a Pagar
              </span>
              <div className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                {formatCurrency(totalLiquido)}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <div>
                <span>Subtotal: </span>
                <span className="text-slate-200 tabular-nums">{formatCurrency(totalBruto)}</span>
              </div>
              {desconto > 0 && (
                <div>
                  <span>Desconto: </span>
                  <span className="text-rose-400 tabular-nums">-{formatCurrency(desconto)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Formas de Pagamento (Seleção) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Selecione a Forma de Pagamento (Atalhos: 1 a 4)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectForma('DINHEIRO')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  formaPagamento === 'DINHEIRO'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-xs font-bold">[1] Dinheiro</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectForma('PIX')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  formaPagamento === 'PIX'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-6 h-6" />
                <span className="text-xs font-bold">[2] Pix</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectForma('DEBITO')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  formaPagamento === 'DEBITO'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-bold">[3] Débito</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectForma('CREDITO')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  formaPagamento === 'CREDITO'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-bold">[4] Crédito</span>
              </button>
            </div>
          </div>

          {/* Seção Dinheiro: Recebido e Troco */}
          {formaPagamento === 'DINHEIRO' && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Recebido em Dinheiro (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                      R$
                    </span>
                    <input
                      ref={inputRecebidoRef}
                      type="text"
                      value={valorRecebidoInput}
                      onChange={(e) => {
                        setValorRecebidoInput(e.target.value);
                        setErroMsg('');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xl font-bold font-mono text-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Display do Troco */}
                <div className="sm:w-56 p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-center">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Troco a Devolver
                  </span>
                  <div
                    className={`text-2xl font-bold font-mono tabular-nums ${
                      troco > 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(troco)}
                  </div>
                  {valorFaltante > 0 && (
                    <span className="text-xs text-amber-400 font-mono mt-0.5">
                      Falta: {formatCurrency(valorFaltante)}
                    </span>
                  )}
                </div>
              </div>

              {/* Botões Rápidos de Cédulas */}
              <div>
                <span className="block text-[11px] text-slate-400 font-medium mb-1.5">
                  Cédulas rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={handleValorExato}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-200 transition-colors"
                  >
                    Exato
                  </button>
                  {[10, 20, 50, 100, 200].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleCedulaRapida(val)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-emerald-400 transition-colors"
                    >
                      R$ {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Campo Desconto e Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Desconto no Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={totalBruto}
                value={desconto || ''}
                onChange={(e) => setDesconto(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0,00"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Observação / CPF do Cliente (Opcional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: CPF 000.000.000-00 ou Nota interna"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>
            </div>
          </div>

          {/* Mensagem de Erro se houver */}
          {erroMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{erroMsg}</span>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Voltar ao Carrinho [ESC]
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950 text-sm disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Gravando Venda...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Confirmar Venda [Enter]
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
