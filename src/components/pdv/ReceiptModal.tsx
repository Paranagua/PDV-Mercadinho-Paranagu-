import React, { useEffect } from 'react';
import { Printer, CheckCircle, Plus, X } from 'lucide-react';
import { ConfiguracaoLoja, Venda } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  venda: Venda | null;
  configLoja: ConfiguracaoLoja;
  onNovaVenda: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  venda,
  configLoja,
  onNovaVenda,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'F2') {
        e.preventDefault();
        onNovaVenda();
      } else if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNovaVenda]);

  if (!isOpen || !venda) return null;

  const totalItens = (venda.itens || []).reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho da Janela de Diálogo */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Venda Concluída com Sucesso!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pré-visualização do Cupom Térmico (80mm) */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white text-black p-4 rounded-lg font-mono text-[11px] leading-tight shadow-md border border-neutral-300 select-text"
          >
            {/* Topo do Estabelecimento */}
            <div className="text-center pb-2 border-b border-dashed border-neutral-400 space-y-0.5">
              <div className="font-bold text-xs uppercase tracking-tight">
                {configLoja.nome_fantasia || 'Mercadinho Paranaguá'}
              </div>
              <div className="text-[10px] text-neutral-600">
                {configLoja.razao_social}
              </div>
              <div className="text-[10px] text-neutral-600">
                CNPJ: {configLoja.cnpj}
              </div>
              <div className="text-[10px] text-neutral-600">
                {configLoja.endereco} - {configLoja.cidade_uf}
              </div>
              <div className="text-[10px] text-neutral-600">
                Fone: {configLoja.telefone}
              </div>
            </div>

            {/* Informações do Cupom */}
            <div className="py-2 border-b border-dashed border-neutral-400 space-y-0.5 text-[10px]">
              <div className="font-bold text-center text-xs">
                DOCUMENTO NÃO FISCAL
              </div>
              <div className="flex justify-between">
                <span>CUPOM Nº:</span>
                <span className="font-bold">
                  {String(venda.numero_venda).padStart(6, '0')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>DATA/HORA:</span>
                <span>{formatDateTime(venda.data_venda)}</span>
              </div>
              <div className="flex justify-between">
                <span>OPERADOR:</span>
                <span>{venda.operador_nome || 'Caixa 01'}</span>
              </div>
            </div>

            {/* Cabeçalho da Tabela de Itens */}
            <div className="py-1.5 border-b border-dashed border-neutral-400">
              <div className="grid grid-cols-12 font-bold text-[10px]">
                <span className="col-span-1">#</span>
                <span className="col-span-6">DESCRIÇÃO</span>
                <span className="col-span-2 text-right">QTD</span>
                <span className="col-span-3 text-right">TOTAL</span>
              </div>
            </div>

            {/* Lista dos Itens */}
            <div className="py-1 space-y-1.5 border-b border-dashed border-neutral-400">
              {venda.itens.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="grid grid-cols-12 text-[10px]">
                    <span className="col-span-1 text-neutral-500">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="col-span-6 font-semibold truncate">
                      {item.nome_produto}
                    </span>
                    <span className="col-span-2 text-right">
                      {item.quantidade}x
                    </span>
                    <span className="col-span-3 text-right font-bold">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                  <div className="text-[9px] text-neutral-500 pl-4">
                    {item.codigo_barras} · {item.quantidade} x {formatCurrency(item.preco_unitario)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totais */}
            <div className="py-2 border-b border-dashed border-neutral-400 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>QTD TOTAL DE ITENS:</span>
                <span className="font-bold">{totalItens}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>SUBTOTAL:</span>
                <span>{formatCurrency(venda.total_bruto)}</span>
              </div>
              {venda.desconto > 0 && (
                <div className="flex justify-between text-[10px] text-neutral-700">
                  <span>DESCONTO:</span>
                  <span>-{formatCurrency(venda.desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-neutral-300">
                <span>TOTAL A PAGAR:</span>
                <span>{formatCurrency(venda.total_liquido)}</span>
              </div>
            </div>

            {/* Pagamentos */}
            <div className="py-2 border-b border-dashed border-neutral-400 space-y-0.5 text-[10px]">
              {venda.pagamentos.map((pg, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex justify-between">
                    <span>FORMA PGTO:</span>
                    <span className="font-bold">{pg.forma_pagamento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VALOR RECEBIDO:</span>
                    <span>{formatCurrency(pg.valor_pago)}</span>
                  </div>
                  {pg.troco > 0 && (
                    <div className="flex justify-between font-bold text-neutral-900">
                      <span>TROCO:</span>
                      <span>{formatCurrency(pg.troco)}</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
              {venda.observacoes && (
                <div className="pt-1 text-[9px] text-neutral-600">
                  OBS: {venda.observacoes}
                </div>
              )}
            </div>

            {/* Rodapé do Cupom */}
            <div className="pt-3 text-center text-[10px] space-y-1">
              <p className="font-semibold text-neutral-800">
                {configLoja.mensagem_cupom ||
                  'Obrigado pela preferência! Volte sempre ao Mercadinho Paranaguá.'}
              </p>
              <p className="text-[9px] text-neutral-500">
                Sistema Mercadinho Paranaguá PDV
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cupom [Ctrl+P]</span>
          </button>

          <button
            type="button"
            onClick={onNovaVenda}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Venda [F2]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
