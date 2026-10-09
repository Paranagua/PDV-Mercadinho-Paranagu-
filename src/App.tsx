import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PDVScreen } from './components/pdv/PDVScreen';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { ProdutosScreen } from './components/produtos/ProdutosScreen';
import { EstoqueScreen } from './components/estoque/EstoqueScreen';
import { VendasScreen } from './components/vendas/VendasScreen';
import { ConfiguracoesScreen } from './components/configuracoes/ConfiguracoesScreen';
import { ConfiguracaoLoja, Venda } from './types';
import { CONFIG_PADRAO, getConfiguracoesLoja } from './lib/storage';
import { isSupabaseConfigured } from './lib/supabase/client';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('pdv');
  const [configLoja, setConfigLoja] = useState<ConfiguracaoLoja>(CONFIG_PADRAO);
  const [selectedVendaToView, setSelectedVendaToView] = useState<Venda | null>(null);
  const [showSupabaseBanner, setShowSupabaseBanner] = useState<boolean>(false);

  useEffect(() => {
    // Carregar configurações da loja
    getConfiguracoesLoja().then((cfg) => {
      setConfigLoja(cfg);
    });

    // Verificar se Supabase já está configurado
    const hasSupabase = isSupabaseConfigured();
    if (!hasSupabase) {
      setShowSupabaseBanner(true);
    }
  }, []);

  // Atalhos de navegação globais do sistema
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Evitar conflito se estiver digitando em input
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (!isInput) {
        if (e.key === 'F1') {
          e.preventDefault();
          setCurrentTab('dashboard');
        } else if (e.key === 'F3') {
          e.preventDefault();
          setCurrentTab('produtos');
        } else if (e.key === 'F5') {
          e.preventDefault();
          setCurrentTab('estoque');
        } else if (e.key === 'F6') {
          e.preventDefault();
          setCurrentTab('vendas');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handleViewVenda = (venda: Venda) => {
    setSelectedVendaToView(venda);
    setCurrentTab('vendas');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Menu Lateral de Navegação (Sidebar) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        cartCount={0}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra Superior (Header) */}
        <Header
          currentTab={currentTab}
          onNavigateToConfig={() => setCurrentTab('configuracoes')}
          onOpenPDV={() => setCurrentTab('pdv')}
          cartCount={0}
        />

        {/* Banner Informativo de Conexão Supabase */}
        {showSupabaseBanner && currentTab !== 'configuracoes' && (
          <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Mercadinho Paranaguá em Modo Local:</strong> Conecte sua URL e chave do Supabase no menu Configurações para habilitar persistência transacional em nuvem.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentTab('configuracoes')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Configurar Supabase</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowSupabaseBanner(false)}
                className="text-slate-500 hover:text-slate-300 text-[11px]"
              >
                Ocultar
              </button>
            </div>
          </div>
        )}

        {/* Telas Dinâmicas de acordo com o menu */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {currentTab === 'pdv' && (
            <PDVScreen
              configLoja={configLoja}
              onVendaConcluida={() => {}}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardScreen
              onNavigateToPDV={() => setCurrentTab('pdv')}
              onNavigateToEstoque={() => setCurrentTab('estoque')}
              onNavigateToVendas={() => setCurrentTab('vendas')}
              onViewVenda={handleViewVenda}
            />
          )}

          {currentTab === 'produtos' && <ProdutosScreen />}

          {currentTab === 'estoque' && <EstoqueScreen />}

          {currentTab === 'vendas' && (
            <VendasScreen
              configLoja={configLoja}
              selectedVendaFromExternal={selectedVendaToView}
              onClearExternalVenda={() => setSelectedVendaToView(null)}
            />
          )}

          {currentTab === 'configuracoes' && (
            <ConfiguracoesScreen
              configLoja={configLoja}
              onUpdateConfig={(newCfg) => setConfigLoja(newCfg)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
