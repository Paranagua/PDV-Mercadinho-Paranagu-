import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'mercadinho_supabase_config';

interface StoredConfig {
  url: string;
  anonKey: string;
}

let supabaseInstance: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  // 1. Tentar ler de localStorage
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: StoredConfig = JSON.parse(raw);
        if (parsed.url && parsed.anonKey) {
          return {
            url: parsed.url.trim(),
            anonKey: parsed.anonKey.trim(),
            isConfigured: true,
          };
        }
      } catch (e) {
        console.error('Erro ao ler configuração do Supabase:', e);
      }
    }
  }

  // 2. Tentar ler das variáveis de ambiente Vite
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const isConfigured = Boolean(envUrl && envKey && !envUrl.includes('EXAMPLE') && !envKey.includes('EXAMPLE'));

  return {
    url: envUrl,
    anonKey: envKey,
    isConfigured,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      url: cleanUrl,
      anonKey: cleanKey,
    })
  );
  // Resetar instância para recriar
  supabaseInstance = null;
  currentUrl = '';
  currentKey = '';
}

export function clearSupabaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  supabaseInstance = null;
  currentUrl = '';
  currentKey = '';
}

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  if (supabaseInstance && currentUrl === config.url && currentKey === config.anonKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentUrl = config.url;
    currentKey = config.anonKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return config.isConfigured;
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    let client: SupabaseClient | null;

    if (url && anonKey) {
      client = createClient(url.trim(), anonKey.trim(), {
        auth: { persistSession: false },
      });
    } else {
      client = getSupabase();
    }

    if (!client) {
      return {
        success: false,
        message: 'Credenciais do Supabase não configuradas.',
      };
    }

    // Tenta uma consulta rápida na tabela de produtos ou configurações
    const { data, error } = await client
      .from('configuracoes_loja')
      .select('nome_fantasia')
      .limit(1);

    if (error) {
      // Se deu erro de tabela não existir, ainda assim a conexão funcionou se o código for 42P01
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Conectado ao Supabase! Porém as tabelas ainda não foram criadas. Execute o script schema.sql no SQL Editor.',
          details: { tablesMissing: true },
        };
      }
      return {
        success: false,
        message: `Erro ao conectar: ${error.message} (Código: ${error.code})`,
        details: error,
      };
    }

    return {
      success: true,
      message: 'Conexão com o Supabase estabelecida com sucesso!',
      details: data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha de rede ou URL inválida: ${err?.message || 'Erro desconhecido'}`,
      details: err,
    };
  }
}
