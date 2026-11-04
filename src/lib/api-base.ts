/**
 * Intelligent API Request Orchestrator & Base URL Manager
 * 
 * Capabilities:
 * - Redirects relative /api requests to VITE_API_BASE_URL when configured.
 * - Detects HTTP 429 (Rate Limit / Quota Exceeded) errors transparently.
 * - Automatically rotates between pre-configured providers:
 *   (Google Gemini -> OpenAI -> NVIDIA NIM -> OpenRouter)
 * - Preserves conversation context by re-dispatching the exact request payload.
 * - Dispatches real-time rotation events to notify users in the UI.
 */

export type OrchestratedProviderId = 'gemini' | 'openai' | 'nvidia' | 'openrouter';

export interface ProviderInfo {
  id: OrchestratedProviderId;
  name: string;
  label: string;
}

export const ORCHESTRATED_PROVIDERS: ProviderInfo[] = [
  { id: 'gemini', name: 'Google Gemini', label: 'Gemini 3.8 Flash' },
  { id: 'openai', name: 'OpenAI', label: 'GPT-4o' },
  { id: 'nvidia', name: 'NVIDIA NIM', label: 'Llama 3.3 70B' },
  { id: 'openrouter', name: 'OpenRouter', label: 'DeepSeek R1 / Claude' },
];

export interface RotationEvent {
  fromProvider: ProviderInfo;
  toProvider: ProviderInfo;
  reason: string;
  statusCode: number;
  attempt: number;
  timestamp: string;
  url: string;
}

type RotationListener = (event: RotationEvent) => void;

class ApiOrchestrator {
  private currentIndex: number = 0;
  private listeners: Set<RotationListener> = new Set();
  private history: RotationEvent[] = [];
  private isRotating: boolean = false;
  private cooldowns: Map<string, number> = new Map(); // providerId -> cooldown timestamp

  public getCurrentProvider(): ProviderInfo {
    return ORCHESTRATED_PROVIDERS[this.currentIndex];
  }

  public getNextProvider(): ProviderInfo {
    const nextIdx = (this.currentIndex + 1) % ORCHESTRATED_PROVIDERS.length;
    return ORCHESTRATED_PROVIDERS[nextIdx];
  }

  public subscribe(listener: RotationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getHistory(): RotationEvent[] {
    return [...this.history];
  }

  public notifyRotation(event: RotationEvent) {
    this.history.unshift(event);
    if (this.history.length > 20) this.history.pop();

    // Notify registered listeners
    this.listeners.forEach(fn => {
      try {
        fn(event);
      } catch (err) {
        console.error('[CHLOÉ Orchestrator] Erreur listener rotation:', err);
      }
    });

    // Also dispatch global DOM event for components and notifications
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('chloe:provider-rotation', {
          detail: event,
        })
      );
    }
  }

  public async rotateProvider(reason: string, statusCode: number = 429, url: string = ''): Promise<ProviderInfo> {
    const fromProvider = this.getCurrentProvider();
    this.cooldowns.set(fromProvider.id, Date.now() + 60_000); // 60s cooldown

    this.currentIndex = (this.currentIndex + 1) % ORCHESTRATED_PROVIDERS.length;
    const toProvider = this.getCurrentProvider();

    const event: RotationEvent = {
      fromProvider,
      toProvider,
      reason,
      statusCode,
      attempt: this.history.length + 1,
      timestamp: new Date().toISOString(),
      url,
    };

    console.warn(
      `[CHLOÉ Orchestrator] Basculement automatique déclenché (${reason}) : ${fromProvider.name} ➡️ ${toProvider.name}`
    );

    this.notifyRotation(event);
    return toProvider;
  }
}

export const apiOrchestrator = new ApiOrchestrator();

export function onProviderRotation(listener: RotationListener): () => void {
  return apiOrchestrator.subscribe(listener);
}

// ---------------------------------------------------------------------------
// Base URL and Native Fetch Interception with Automatic 429 Failover
// ---------------------------------------------------------------------------

const configuredBase = String(import.meta.env.VITE_API_BASE_URL || '').trim();
const apiBase = configuredBase.replace(/\/+$/, '');

if (apiBase) {
  try {
    const parsed = new URL(apiBase);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      throw new Error('VITE_API_BASE_URL must use HTTPS outside localhost.');
    }
    console.info(`[CHLOÉ AI] Backend API configuré : ${parsed.origin}`);
  } catch (error) {
    console.error('[CHLOÉ AI] VITE_API_BASE_URL invalide :', error);
    throw error;
  }
}

export const CHLOE_API_BASE_URL = apiBase;

// Native Fetch Proxy with 429 Interceptor & Context Preserving Auto-Retry
if (typeof window !== 'undefined' && window.fetch) {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // Resolve full target URL
    let targetUrl: string;
    if (typeof input === 'string') {
      targetUrl = apiBase && input.startsWith('/api/') ? `${apiBase}${input}` : input;
    } else if (input instanceof URL) {
      targetUrl = apiBase && input.pathname.startsWith('/api/')
        ? `${apiBase}${input.pathname}${input.search}${input.hash}`
        : input.toString();
    } else if (typeof Request !== 'undefined' && input instanceof Request) {
      const parsed = new URL(input.url);
      targetUrl =
        apiBase && parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/')
          ? `${apiBase}${parsed.pathname}${parsed.search}${parsed.hash}`
          : input.url;
    } else {
      targetUrl = String(input);
    }

    // Only apply intelligent rotation for /api/ requests (particularly /api/chat)
    const isApiRequest = targetUrl.includes('/api/');
    const isChatRequest = targetUrl.includes('/api/chat');

    if (!isApiRequest) {
      return nativeFetch(input, init);
    }

    // Clone init options to preserve body across retries
    const originalBody = init?.body;
    let maxAttempts = isChatRequest ? ORCHESTRATED_PROVIDERS.length : 2;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;

      // Clone RequestInit for this attempt
      const attemptInit: RequestInit = {
        ...init,
        body: originalBody,
        headers: {
          ...(init?.headers || {}),
          'x-chloe-orchestrated-provider': apiOrchestrator.getCurrentProvider().id,
        },
      };

      try {
        const response = await nativeFetch(targetUrl, attemptInit);

        // Check for HTTP 429 Too Many Requests
        if (response.status === 429) {
          console.warn(`[CHLOÉ Orchestrator] HTTP 429 détecté sur ${targetUrl}. Rotation vers fournisseur suivant...`);

          const newProvider = await apiOrchestrator.rotateProvider(
            'Limite de requêtes atteinte (HTTP 429 Too Many Requests)',
            429,
            targetUrl
          );

          // Inform backend of provider switch
          try {
            await nativeFetch(`${apiBase || ''}/api/providers/select`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: newProvider.id }),
            });
          } catch {
            // Ignore failure to sync active provider with backend
          }

          // Delay slightly before retrying to prevent burst loop
          await new Promise(r => setTimeout(r, 450));
          continue; // Retry with next provider!
        }

        // Check if response is 200/OK, or return it directly
        if (response.ok) {
          return response;
        }

        // If error response contains 429 in JSON body:
        if (response.status >= 400 && response.status < 500) {
          const clonedRes = response.clone();
          try {
            const errData = await clonedRes.json();
            const errMsg = String(errData?.error || '').toLowerCase();
            if (
              errMsg.includes('429') ||
              errMsg.includes('quota') ||
              errMsg.includes('rate limit') ||
              errMsg.includes('too many requests')
            ) {
              console.warn(`[CHLOÉ Orchestrator] Erreur de quota détectée dans le payload (${errMsg}). Rotation...`);
              const newProvider = await apiOrchestrator.rotateProvider(
                'Quota ou limite dépassée dans la réponse',
                429,
                targetUrl
              );

              try {
                await nativeFetch(`${apiBase || ''}/api/providers/select`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: newProvider.id }),
                });
              } catch {}

              await new Promise(r => setTimeout(r, 450));
              continue;
            }
          } catch {
            // Not a JSON error, return original response
          }
        }

        return response;
      } catch (networkError: any) {
        console.warn(`[CHLOÉ Orchestrator] Erreur réseau lors de la requête vers ${targetUrl}:`, networkError);
        // Only retry network errors if not final attempt
        if (attempt >= maxAttempts) {
          throw networkError;
        }
        await new Promise(r => setTimeout(r, 400));
      }
    }

    // If all failover attempts exhausted, make one last native call
    return nativeFetch(targetUrl, init);
  };
}
