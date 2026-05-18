import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/** Production Supabase project (dimarket) — URL is public, safe to hardcode. */
export const DIMARKET_SUPABASE_URL = 'https://wjlfvajloxkevggwjgtk.supabase.co';

function getProjectRefFromUrl(url: string): string | null {
  return url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;
}

function getProjectRefFromAnonKey(key: string): string | null {
  try {
    const payload = key.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      ref?: string;
    };
    return json.ref ?? null;
  } catch {
    return null;
  }
}

function isBrokenSupabaseUrl(url: string): boolean {
  if (!url) return true;
  if (url.includes('httpshttps') || url.includes('://://')) return true;
  if (url.includes('qwvbbvipqmmrpmyysczh')) return true;
  return !getProjectRefFromUrl(url);
}

function resolveSupabaseConfig(): { url: string; key: string; source: string } {
  const dimarketUrl = import.meta.env.VITE_DIMARKET_SUPABASE_URL;
  const dimarketKey = import.meta.env.VITE_DIMARKET_SUPABASE_ANON_KEY;
  const legacyUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const legacyKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

  const key = dimarketKey || legacyKey;
  if (!key) {
    throw new Error(
      'Missing Supabase anon key. In Bolt Secrets add VITE_DIMARKET_SUPABASE_ANON_KEY (wjlfv project).'
    );
  }

  const keyRef = getProjectRefFromAnonKey(key);

  if (dimarketUrl && dimarketKey) {
    return { url: dimarketUrl, key, source: 'VITE_DIMARKET_*' };
  }

  if (keyRef === 'wjlfvajloxkevggwjgtk') {
    return {
      url: DIMARKET_SUPABASE_URL,
      key,
      source: dimarketKey ? 'VITE_DIMARKET_ANON + hardcoded URL' : 'wjlfv anon key + hardcoded URL',
    };
  }

  if (!isBrokenSupabaseUrl(legacyUrl) && legacyKey) {
    return { url: legacyUrl, key: legacyKey, source: 'VITE_SUPABASE_*' };
  }

  throw new Error(
    'Supabase is misconfigured: Bolt still uses old qwvbb URL/key. Add VITE_DIMARKET_SUPABASE_ANON_KEY in Bolt Secrets (anon from wjlfvajloxkevggwjgtk) and redeploy.'
  );
}

const config = resolveSupabaseConfig();
const urlRef = getProjectRefFromUrl(config.url);
const keyRef = getProjectRefFromAnonKey(config.key);

if (urlRef && keyRef && urlRef !== keyRef) {
  throw new Error(
    `Supabase mismatch: URL "${urlRef}" vs key "${keyRef}". Use anon key from wjlfvajloxkevggwjgtk.`
  );
}

export const supabase = createClient<Database>(config.url, config.key);

console.info(`[DImarket] Supabase: ${urlRef} (${config.source})`);
