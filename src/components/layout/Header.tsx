import React, { useEffect, useState } from 'react';
import { ShoppingCart, Database, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase/client';

interface HeaderProps {
  currentTab: string;
  onNavigateToConfig: () => void;
  onOpenPDV: () => void;
  cartCount?: number;
}

const TAB_TITLES: Record<string, string> = {
  pdv: 'Frente de Caixa (PDV)',
  dashboard: 'Visão Geral & Indicadores',
  produtos: 'Cadastro & Consulta de Produtos',
  estoque: 'Controle de Estoque & Movimentações',
  vendas: 'Histórico de Vendas',
  configuracoes: 'Configurações & Integração Supabase',
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigateToConfig,
  onOpenPDV,
  cartCount = 0,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [supabaseActive, setSupabaseActive] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(now)
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    setSupabaseActive(isSupabaseConfigured());

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Zona 1: Título contextual da tela */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-slate-100 whitespace-nowrap">
          {TAB_TITLES[currentTab] || 'Mercadinho Paranaguá'}
        </h1>
        <span className="hidden sm:inline text-xs text-slate-500">·</span>
        <span className="hidden sm:inline text-xs text-slate-400">Terminal 01</span>
      </div>

      {/* Zona 2: Relógio em tempo real */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300 font-mono tabular-nums">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>{currentTime}</span>
      </div>

      {/* Zona 3: Ações e Status da Conexão */}
      <div className="flex items-center gap-3">
        {/* Status Supabase */}
        <button
          onClick={onNavigateToConfig}
          title={supabaseActive ? 'Supabase Conectado' : 'Configurar conexão Supabase'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            supabaseActive
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300 hover:bg-emerald-900/50'
              : 'bg-amber-950/50 border-amber-800 text-amber-300 hover:bg-amber-900/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {supabaseActive ? 'Supabase Conectado' : 'Supabase Pendente'}
          </span>
          {supabaseActive ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
        </button>

        {/* Botão rápido para PDV se estiver em outra tela */}
        {currentTab !== 'pdv' && (
          <button
            onClick={onOpenPDV}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors whitespace-nowrap shadow-sm shadow-emerald-950"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Abrir Caixa [F8]</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-800 rounded text-[11px] font-mono tabular-nums">
                {cartCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
