/**
 * Redirects this application's relative /api requests to a separately deployed
 * CHLOE backend when VITE_API_BASE_URL is configured at build time.
 * Keep this module imported once from App.tsx before the UI starts using fetch.
 */
const configuredBase = String(import.meta.env.VITE_API_BASE_URL || '').trim();
const apiBase = configuredBase.replace(/\/+$/, '');

if (apiBase) {
  let parsed: URL;
  try {
    parsed = new URL(apiBase);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      throw new Error('VITE_API_BASE_URL must use HTTPS outside localhost.');
    }
  } catch (error) {
    console.error('[CHLOÉ AI] Invalid VITE_API_BASE_URL:', error);
    throw error;
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        return nativeFetch(`${apiBase}${input}`, init);
      }
      if (input instanceof URL && input.pathname.startsWith('/api/')) {
        return nativeFetch(`${apiBase}${input.pathname}${input.search}${input.hash}`, init);
      }
      if (typeof Request !== 'undefined' && input instanceof Request) {
        const requestUrl = new URL(input.url);
        if (requestUrl.origin === window.location.origin && requestUrl.pathname.startsWith('/api/')) {
          const target = `${apiBase}${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`;
          return nativeFetch(new Request(target, input), init);
        }
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return nativeFetch(input, init);
  };

  console.info(`[CHLOÉ AI] Backend API configured: ${parsed.origin}`);
}

export const CHLOE_API_BASE_URL = apiBase;
