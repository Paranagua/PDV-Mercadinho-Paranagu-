import React, { useState, useEffect } from 'react';
import {
  Store,
  Database,
  Save,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  Volume2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ConfiguracaoLoja } from '../../types';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabase/client';
import {
  salvarConfiguracoesLoja,
  sincronizarCatalogoParaSupabase,
} from '../../lib/storage';
import { playBeep } from '../../utils/formatters';

interface ConfiguracoesScreenProps {
  configLoja: ConfiguracaoLoja;
  onUpdateConfig: (newConfig: ConfiguracaoLoja) => void;
}

export const ConfiguracoesScreen: React.FC<ConfiguracoesScreenProps> = ({
  configLoja,
  onUpdateConfig,
}) => {
  // Estado das configurações da loja
  const [formData, setFormData] = useState<ConfiguracaoLoja>(configLoja);
  const [isSavingLoja, setIsSavingLoja] = useState<boolean>(false);
  const [lojaSavedFeedback, setLojaSavedFeedback] = useState<boolean>(false);

  // Estado da conexão Supabase
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [sqlContent, setSqlContent] = useState<string>('');

  useEffect(() => {
    setFormData(configLoja);
    const cfg = getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseKey(cfg.anonKey);

    // Carregar o conteúdo SQL do arquivo schema.sql
    fetch('/src/lib/supabase/schema.sql')
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => {
        if (text) setSqlContent(text);
      })
      .catch(() => {
        // Fallback básico se fetch falhar
        setSqlContent('-- O script completo está salvo em src/lib/supabase/schema.sql');
      });
  }, [configLoja]);

  const handleSalvarLoja = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLoja(true);
    try {
      await salvarConfiguracoesLoja(formData);
      onUpdateConfig(formData);
      setLojaSavedFeedback(true);
      setTimeout(() => setLojaSavedFeedback(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingLoja(false);
    }
  };

  const handleTestarConexao = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Falha ao testar conexão',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSalvarSupabase = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    handleTestarConexao();
  };

  const handleDesconectarSupabase = () => {
    if (window.confirm('Deseja remover as credenciais salvas do Supabase?')) {
      clearSupabaseConfig();
      setSupabaseUrl('');
      setSupabaseKey('');
      setTestResult(null);
      alert('Credenciais removidas. O sistema continuará funcionando no modo local.');
    }
  };

  const handleSincronizarCatalogo = async () => {
    setIsSyncing(true);
    setSyncFeedback('');
    try {
      const res = await sincronizarCatalogoParaSupabase();
      if (res.success) {
        setSyncFeedback(`Sucesso! ${res.inseridos} produtos sincronizados na tabela 'produtos' do Supabase.`);
      } else {
        setSyncFeedback(`Erro: ${res.error}`);
      }
    } catch (err: any) {
      setSyncFeedback(`Falha: ${err?.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    if (sqlContent) {
      navigator.clipboard.writeText(sqlContent);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  const handleDownloadSql = () => {
    const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'mercadinho_paranagua_schema.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-8 bg-slate-950 max-w-5xl">
      {/* Topo: Título */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Configurações do Sistema
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Dados do Mercadinho Paranaguá, integração com Supabase PostgreSQL e preferências de operação
        </p>
      </div>

      {/* 1. Integração com Banco de Dados Supabase (Destaque Principal) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Banco de Dados Supabase (PostgreSQL & RLS)
              </h3>
              <p className="text-xs text-slate-400">
                Conecte seu projeto do Supabase para persistência real em nuvem e segurança transacional
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                supabaseUrl && supabaseKey
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {supabaseUrl && supabaseKey ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Configurado</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Local Ativo</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Formulário de Credenciais */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Project URL do Supabase *
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="Ex: https://xyzexampleproject.supabase.co"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Encontrada em Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Project API Anon Key (Chave Pública) *
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="Ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
              />
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Segurança: Use sempre a chave pública <strong>anon</strong> com RLS. Nunca insira a chave secreta <code>service_role</code> no navegador.
                </span>
              </div>
            </div>
          </div>

          {/* Resultado do Teste de Conexão */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
                testResult.success
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-800 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Botões de Ação do Supabase */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSalvarSupabase}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm shadow-emerald-950"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Credenciais e Conectar</span>
              </button>

              <button
                type="button"
                onClick={handleTestarConexao}
                disabled={isTesting || !supabaseUrl || !supabaseKey}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
              </button>

              <button
                type="button"
                onClick={handleDesconectarSupabase}
                className="px-3 py-2 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-lg text-xs font-medium transition-colors"
              >
                Limpar / Desconectar
              </button>
            </div>

            {/* Sincronizar catálogo para Supabase */}
            <button
              type="button"
              onClick={handleSincronizarCatalogo}
              disabled={isSyncing || !supabaseUrl || !supabaseKey}
              className="px-4 py-2 bg-teal-950 hover:bg-teal-900 border border-teal-800 text-teal-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span>{isSyncing ? 'Sincronizando...' : 'Enviar Catálogo Padrão para o Supabase'}</span>
            </button>
          </div>

          {syncFeedback && (
            <div className="p-3 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-200 text-xs">
              {syncFeedback}
            </div>
          )}
        </div>

        {/* Guia de Configuração e Script SQL */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>Como Configurar o Banco de Dados no Supabase</span>
            </h4>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Acessar Painel Supabase</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              Acesse seu painel no <strong>Supabase</strong> e crie um novo projeto (ex: <code>mercadinho-paranagua</code>).
            </li>
            <li>
              Vá em <strong>Project Settings &gt; API</strong>, copie a <strong>Project URL</strong> e a <strong>anon key</strong> e cole nos campos acima.
            </li>
            <li>
              Vá no menu <strong>SQL Editor</strong> do Supabase, clique em <strong>New query</strong>, cole o script SQL abaixo e clique em <strong>Run</strong>.
            </li>
          </ol>

          {/* Visualizador de Script SQL */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                schema.sql (Tabelas, RLS, Triggers e Stored Procedure Transacional)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSql}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Baixar .sql</span>
                </button>
              </div>
            </div>
            <pre className="p-3 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto overflow-x-auto whitespace-pre leading-relaxed select-all">
              {sqlContent || '-- Carregando script schema.sql...'}
            </pre>
          </div>
        </div>
      </div>

      {/* 2. Dados do Estabelecimento (Mercadinho Paranaguá) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Dados do Estabelecimento
            </h3>
            <p className="text-xs text-slate-400">
              Informações impressas no comprovante de venda e cabeçalhos do sistema
            </p>
          </div>
        </div>

        <form onSubmit={handleSalvarLoja} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nome Fantasia *
              </label>
              <input
                type="text"
                required
                value={formData.nome_fantasia}
                onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Razão Social
              </label>
              <input
                type="text"
                value={formData.razao_social}
                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Cidade - UF
              </label>
              <input
                type="text"
                value={formData.cidade_uf}
                onChange={(e) => setFormData({ ...formData, cidade_uf: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Mensagem de Agradecimento no Rodapé do Cupom
            </label>
            <input
              type="text"
              value={formData.mensagem_cupom}
              onChange={(e) => setFormData({ ...formData, mensagem_cupom: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Preferências Operacionais */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Som de Bipe do Leitor de Código de Barras
                </span>
                <span className="text-[11px] text-slate-400">
                  Emite confirmação sonora ao escanear produtos no PDV
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => playBeep('scan')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Testar Som
              </button>
              <input
                type="checkbox"
                checked={formData.som_bip_ativo}
                onChange={(e) => setFormData({ ...formData, som_bip_ativo: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </div>
          </div>

          {lojaSavedFeedback && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Dados do estabelecimento salvos com sucesso!</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingLoja}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-emerald-950 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingLoja ? 'Salvando...' : 'Salvar Dados do Mercadinho'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
