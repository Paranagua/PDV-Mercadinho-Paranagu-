import React from 'react';
import {
  ShoppingCart,
  LayoutDashboard,
  Package,
  Layers,
  History,
  Settings,
  Store,
  User,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  cartCount: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  cartCount,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'pdv',
      label: 'Frente de Caixa (PDV)',
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined,
      highlight: true,
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'produtos',
      label: 'Produtos',
      icon: Package,
    },
    {
      id: 'estoque',
      label: 'Estoque',
      icon: Layers,
    },
    {
      id: 'vendas',
      label: 'Histórico de Vendas',
      icon: History,
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      {/* Topo: Marca e Identidade Visual */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-950 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold tracking-tight text-white whitespace-nowrap truncate">
              Mercadinho Paranaguá
            </h2>
            <p className="text-xs text-slate-400 whitespace-nowrap truncate">
              Gestão Comercial & PDV
            </p>
          </div>
        </div>
      </div>

      {/* Menu Principal de Navegação */}
      <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Módulos do Sistema
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? item.highlight
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950'
                    : 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-white'
                      : item.highlight
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full font-mono tabular-nums ${
                    isActive
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Rodapé: Operador Logado e Segurança */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800/60">
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate">
              Caixa 01
            </div>
            <div className="text-[11px] text-emerald-400 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Operador Ativo
            </div>
          </div>
        </div>

        <div className="px-3 py-1 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            RLS Ativo
          </span>
          <span className="font-mono text-slate-400">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
