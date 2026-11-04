import fs from 'node:fs';
import path from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { AIProviderId, AIProviderConfig } from '../shared/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const KEYS_FILE = path.join(DATA_DIR, 'ai_providers.json');
const PROVIDER_IDS: AIProviderId[] = ['gemini', 'openai', 'nvidia', 'openrouter'];
type KeyMap = Partial<Record<AIProviderId, string>>;

interface StoredProviderData {
  activeProvider: AIProviderId;
  activeModel: string;
  keys: KeyMap;
  selectedModels: Record<AIProviderId, string>;
}

interface EncryptedKeyPayload {
  version: 1;
  iv: string;
  authTag: string;
  ciphertext: string;
}

const DEFAULT_MODELS: Record<AIProviderId, string> = {
  gemini: 'gemini-3.8-flash',
  openai: 'gpt-4o',
  nvidia: 'meta/llama-3.3-70b-instruct',
  openrouter: 'deepseek/deepseek-r1',
};

const PROVIDER_METADATA: Record<AIProviderId, { name: string; endpoint: string; description: string; keyUrl: string; models: string[] }> = {
  gemini: {
    name: 'Google Gemini', endpoint: 'Google GenAI Cloud',
    description: 'Modèle multimodal Google avec raisonnement et recherche Google Grounding.',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    models: ['gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.1-flash-lite'],
  },
  openai: {
    name: 'OpenAI', endpoint: 'https://api.openai.com/v1',
    description: 'Modèles OpenAI accessibles via l’API officielle.',
    keyUrl: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'gpt-4.5-preview'],
  },
  nvidia: {
    name: 'NVIDIA NIM', endpoint: 'https://integrate.api.nvidia.com/v1',
    description: 'Modèles servis par NVIDIA NIM.',
    keyUrl: 'https://build.nvidia.com',
    models: [
      'meta/llama-3.3-70b-instruct',
      'mistralai/mistral-large-2-instruct',
      'deepseek-ai/deepseek-r1',
      'nvidia/llama-3.1-nemotron-70b-instruct',
    ],
  },
  openrouter: {
    name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1',
    description: 'Passerelle unifiée vers plusieurs fournisseurs et familles de modèles.',
    keyUrl: 'https://openrouter.ai/keys',
    models: [
      'deepseek/deepseek-r1',
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-001',
      'openai/gpt-4o',
    ],
  },
};

function isProviderId(value: unknown): value is AIProviderId {
  return typeof value === 'string' && PROVIDER_IDS.includes(value as AIProviderId);
}

function errorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error && typeof (error as any).status === 'number') {
    return (error as any).status;
  }
  const match = String((error as any)?.message || error || '').match(/(?:HTTP|Erreur)\s*(\d{3})/i);
  return match ? Number(match[1]) : undefined;
}

class ProviderManager {
  private data: StoredProviderData;
  private legacyPlaintextLoaded = false;

  constructor() {
    this.data = this.loadData();
    for (const id of PROVIDER_IDS) {
      const envName = `${id.toUpperCase()}_API_KEY`;
      if (!this.data.keys[id] && process.env[envName]) this.data.keys[id] = process.env[envName];
    }

    // Automatically encrypt an old plaintext file when the encryption key is configured.
    if (this.legacyPlaintextLoaded && process.env.CHLOE_ENCRYPTION_KEY) {
      this.saveData();
      console.info('[CHLOE AI] Legacy provider keys migrated to encrypted storage.');
    } else if (this.legacyPlaintextLoaded) {
      console.warn('[CHLOE AI] Legacy provider keys are still plaintext. Set CHLOE_ENCRYPTION_KEY and re-save/rotate them.');
    }
  }

  private encryptionKey(): Buffer {
    const envSecret = process.env.CHLOE_ENCRYPTION_KEY?.trim() || '';
    if (/^[a-f0-9]{64}$/i.test(envSecret)) {
      return Buffer.from(envSecret, 'hex');
    }

    // Persist a cryptographically secure 32-byte key in data directory if env is not configured
    const keyFile = path.join(DATA_DIR, '.chloe_master_key');
    try {
      if (fs.existsSync(keyFile)) {
        const saved = fs.readFileSync(keyFile, 'utf8').trim();
        if (/^[a-f0-9]{64}$/i.test(saved)) {
          return Buffer.from(saved, 'hex');
        }
      }
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
      const generated = randomBytes(32).toString('hex');
      fs.writeFileSync(keyFile, generated, { encoding: 'utf8', mode: 0o600 });
      try { fs.chmodSync(keyFile, 0o600); } catch { /* Ignore chmod errors on windows/virtual fs */ }
      return Buffer.from(generated, 'hex');
    } catch (e) {
      // In-memory deterministic fallback if disk is completely read-only
      const fallbackKey = 'c410e_a1_s24_pro_master_sec_key_2026_0102030405060708090a0b0c0d0e0f10';
      return Buffer.from(fallbackKey.substring(0, 64), 'hex');
    }
  }

  private encryptKeys(keys: KeyMap): EncryptedKeyPayload {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(keys), 'utf8'),
      cipher.final(),
    ]);
    return {
      version: 1,
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };
  }

  private decryptKeys(payload: EncryptedKeyPayload): KeyMap {
    if (payload.version !== 1) throw new Error('Version de stockage des clés non prise en charge.');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey(),
      Buffer.from(payload.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const clear = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
    const parsed = JSON.parse(clear);
    const clean: KeyMap = {};
    for (const id of PROVIDER_IDS) {
      if (typeof parsed[id] === 'string') clean[id] = parsed[id];
    }
    return clean;
  }

  private loadData(): StoredProviderData {
    const defaults: StoredProviderData = {
      activeProvider: 'gemini',
      activeModel: DEFAULT_MODELS.gemini,
      keys: { gemini: process.env.GEMINI_API_KEY || '' },
      selectedModels: { ...DEFAULT_MODELS },
    };

    try {
      if (!fs.existsSync(KEYS_FILE)) return defaults;
      const parsed = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
      let keys: KeyMap = {};
      if (parsed.encryptedKeys) {
        try {
          keys = this.decryptKeys(parsed.encryptedKeys as EncryptedKeyPayload);
        } catch (error) {
          throw new Error(`Unable to decrypt saved provider keys. Verify CHLOE_ENCRYPTION_KEY. ${(error as Error).message}`);
        }
      } else if (parsed.keys && typeof parsed.keys === 'object') {
        // Backward compatibility. The constructor migrates this file when encryption is configured.
        this.legacyPlaintextLoaded = Object.values(parsed.keys).some((value) => typeof value === 'string' && value.length > 0);
        keys = parsed.keys;
      }
      return {
        activeProvider: isProviderId(parsed.activeProvider) ? parsed.activeProvider : defaults.activeProvider,
        activeModel: typeof parsed.activeModel === 'string' ? parsed.activeModel : defaults.activeModel,
        keys,
        selectedModels: { ...DEFAULT_MODELS, ...(parsed.selectedModels || {}) },
      };
    } catch (error) {
      const message = String((error as Error)?.message || error);
      if (message.includes('CHLOE_ENCRYPTION_KEY')) throw error;
      console.error('[CHLOE AI] Could not load provider configuration:', message);
      return defaults;
    }
  }

  private saveData(): void {
    const encryptedKeys = this.encryptKeys(this.data.keys);
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    const persisted = {
      activeProvider: this.data.activeProvider,
      activeModel: this.data.activeModel,
      selectedModels: this.data.selectedModels,
      encryptedKeys,
    };
    fs.writeFileSync(KEYS_FILE, JSON.stringify(persisted, null, 2), { encoding: 'utf8', mode: 0o600 });
    try { fs.chmodSync(KEYS_FILE, 0o600); } catch { /* Some deployment filesystems do not support chmod. */ }
  }

  private maskKey(key?: string): string {
    if (!key) return '';
    const clean = key.trim();
    if (clean.length <= 8) return '••••••••';
    return `${clean.substring(0, 4)}••••••••${clean.substring(clean.length - 4)}`;
  }

  public getProvidersInfo(): { activeProvider: AIProviderId; activeModel: string; providers: AIProviderConfig[] } {
    const providers: AIProviderConfig[] = PROVIDER_IDS.map((id) => {
      const meta = PROVIDER_METADATA[id];
      const key = this.getKey(id);
      const hasKey = key.length > 5;
      return {
        id, name: meta.name, endpoint: meta.endpoint, description: meta.description,
        keyUrl: meta.keyUrl, hasKey, maskedKey: this.maskKey(key),
        status: hasKey ? 'configured_untested' : 'not_configured',
        models: meta.models,
        selectedModel: this.data.selectedModels[id] || DEFAULT_MODELS[id],
      };
    });
    return { activeProvider: this.data.activeProvider, activeModel: this.data.activeModel, providers };
  }

  public setProviderKey(id: AIProviderId, key: string): { success: true; maskedKey: string } {
    if (!isProviderId(id)) throw new Error('Fournisseur inconnu.');
    const clean = key.trim();
    if (clean.length < 8 || clean.length > 2048) throw new Error('La clé API semble invalide (longueur incorrecte).');
    this.data.keys[id] = clean;
    this.saveData(); // Throws on disk/encryption errors: never report a false success.
    return { success: true, maskedKey: this.maskKey(clean) };
  }

  public removeProviderKey(id: AIProviderId): { success: true } {
    if (!isProviderId(id)) throw new Error('Fournisseur inconnu.');
    delete this.data.keys[id];
    if (this.data.activeProvider === id) {
      this.data.activeProvider = 'gemini';
      this.data.activeModel = this.data.selectedModels.gemini || DEFAULT_MODELS.gemini;
    }
    this.saveData();
    return { success: true };
  }

  public setActiveProvider(id: AIProviderId, model?: string): void {
    if (!isProviderId(id)) throw new Error('Fournisseur inconnu.');
    if (id !== 'gemini' && !this.getKey(id)) throw new Error(`Aucune clé API configurée pour ${PROVIDER_METADATA[id].name}.`);
    this.data.activeProvider = id;
    if (model) this.setProviderModel(id, model);
    else this.data.activeModel = this.data.selectedModels[id] || DEFAULT_MODELS[id];
    this.saveData();
  }

  public setProviderModel(id: AIProviderId, model: string): void {
    if (!isProviderId(id)) throw new Error('Fournisseur inconnu.');
    const cleanModel = String(model || '').trim();
    if (!cleanModel || cleanModel.length > 200) throw new Error('Nom de modèle invalide.');
    this.data.selectedModels[id] = cleanModel;
    if (this.data.activeProvider === id) this.data.activeModel = cleanModel;
    this.saveData();
  }

  public getKey(id: AIProviderId): string {
    const stored = this.data.keys[id];
    if (stored?.trim()) return stored.trim();
    const envName = `${id.toUpperCase()}_API_KEY`;
    return process.env[envName]?.trim() || '';
  }

  public getAvailableAlternativeProvider(exclude?: AIProviderId): AIProviderId | null {
    const order: AIProviderId[] = ['openai', 'nvidia', 'openrouter'];
    return order.find((id) => id !== exclude && !!this.getKey(id)) || null;
  }

  private isAuthenticationError(error: unknown): boolean {
    const status = errorStatus(error);
    return status === 401 || status === 403;
  }

  private isRetryableError(error: unknown): boolean {
    const status = errorStatus(error);
    if (status === 401 || status === 403) return false;
    if (status === 408 || status === 429 || (status !== undefined && status >= 500)) return true;
    return /timeout|timed out|aborted|ECONNRESET|EAI_AGAIN|network|fetch failed/i.test(String((error as any)?.message || error));
  }

  public async generateWithFailover(params: {
    provider: AIProviderId;
    systemPrompt: string;
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    image?: string;
  }): Promise<{ text: string; providerUsed: AIProviderId; modelUsed: string; fallbackCount: number }> {
    const order: AIProviderId[] = [params.provider, 'gemini', 'openai', 'nvidia', 'openrouter'];
    const candidates = [...new Set(order)].filter((id) => !!this.getKey(id));
    if (!candidates.length) {
      throw new Error('Aucun fournisseur IA n’a de clé API configurée. Veuillez enregistrer une clé dans Paramètres > Fournisseurs d’IA.');
    }

    let lastError: unknown;
    for (let index = 0; index < candidates.length; index++) {
      const provider = candidates[index];
      try {
        const result = await this.generateChatCompletion({ ...params, provider });
        const fallbackCount = provider === params.provider ? 0 : Math.max(1, index);
        return { ...result, fallbackCount };
      } catch (error) {
        lastError = error;
        // Invalid credentials/permissions (401/403) must remain visible; do not mask them by silently trying another key.
        if (this.isAuthenticationError(error) || !this.isRetryableError(error)) {
          throw error;
        }
        console.warn(`[CHLOE AI Router] Fournisseur ${provider} temporairement indisponible (quota ou réseau), tentative avec le suivant...`);
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Tous les fournisseurs IA configurés ont échoué.');
  }

  public async testProvider(id: AIProviderId): Promise<{ success: boolean; message: string; latencyMs: number }> {
    if (!isProviderId(id)) return { success: false, message: 'Fournisseur inconnu.', latencyMs: 0 };
    const key = this.getKey(id);
    if (!key) return { success: false, message: `Aucune clé API configurée pour ${PROVIDER_METADATA[id].name}.`, latencyMs: 0 };
    const started = Date.now();

    try {
      if (id === 'gemini') {
        const g = new GoogleGenAI({
          apiKey: key,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
        const resp = await g.models.generateContent({
          model: this.data.selectedModels.gemini || DEFAULT_MODELS.gemini,
          contents: 'Réponds uniquement OK.',
        });
        const latencyMs = Date.now() - started;
        const reply = resp.text?.trim() || 'OK';
        return { success: true, message: `Connexion Google Gemini vérifiée (${latencyMs} ms). Réponse: "${reply.substring(0, 30)}"`, latencyMs };
      }

      const config = {
        openai: { endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
        nvidia: { endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions', model: 'meta/llama-3.3-70b-instruct' },
        openrouter: { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'deepseek/deepseek-r1' },
      }[id];
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
      if (id === 'openrouter') {
        headers['HTTP-Referer'] = 'https://chloe.ai';
        headers['X-Title'] = 'CHLOE AI';
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      let response: Response;
      try {
        response = await fetch(config.endpoint, {
          method: 'POST', headers,
          body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: 'Réponds uniquement PONG.' }], max_tokens: 10 }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      const latencyMs = Date.now() - started;
      if (!response.ok) {
        const details = (await response.text()).slice(0, 150);
        return { success: false, message: `${PROVIDER_METADATA[id].name} : Erreur HTTP ${response.status} — ${details}`, latencyMs };
      }
      return { success: true, message: `Connexion ${PROVIDER_METADATA[id].name} vérifiée (${latencyMs} ms).`, latencyMs };
    } catch (error) {
      return { success: false, message: `Échec du test ${PROVIDER_METADATA[id].name} : ${(error as Error).message || 'erreur réseau'}`, latencyMs: Date.now() - started };
    }
  }

  public async generateChatCompletion(params: {
    provider: AIProviderId;
    systemPrompt: string;
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    image?: string;
  }): Promise<{ text: string; providerUsed: AIProviderId; modelUsed: string }> {
    const provider = params.provider;
    if (!isProviderId(provider)) throw new Error('Fournisseur IA non reconnu.');
    const key = this.getKey(provider);
    if (!key) throw new Error(`Aucune clé API configurée pour ${PROVIDER_METADATA[provider].name}.`);
    const model = this.data.selectedModels[provider] || DEFAULT_MODELS[provider];

    // Native Gemini Execution via @google/genai
    if (provider === 'gemini') {
      const g = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const parts: any[] = [];
      if (params.image) {
        const matches = params.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
        }
      }
      const lastUserMsg = [...params.messages].reverse().find(m => m.role === 'user')?.content || 'Bonjour';
      parts.push({ text: lastUserMsg });

      try {
        const geminiResp = await g.models.generateContent({
          model,
          contents: { parts },
          config: {
            systemInstruction: params.systemPrompt,
            temperature: 0.7,
          },
        });
        const text = geminiResp.text || '';
        if (!text.trim()) throw new Error('Google Gemini a renvoyé une réponse vide.');
        return { text, providerUsed: 'gemini', modelUsed: model };
      } catch (geminiErr: any) {
        const status = errorStatus(geminiErr);
        const err = new Error(`Google Gemini: ${geminiErr.message || String(geminiErr)}`) as Error & { status?: number };
        err.status = status;
        throw err;
      }
    }

    // OpenAI-Compatible Providers (OpenAI, NVIDIA NIM, OpenRouter)
    const endpoints: Record<Exclude<AIProviderId, 'gemini'>, string> = {
      openai: 'https://api.openai.com/v1/chat/completions',
      nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    };
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://chloe.ai';
      headers['X-Title'] = 'CHLOE AI';
    }

    const formattedMessages: any[] = [{ role: 'system', content: params.systemPrompt }];
    params.messages.forEach((message, index) => {
      if (params.image && message.role === 'user' && index === params.messages.length - 1) {
        formattedMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: message.content },
            { type: 'image_url', image_url: { url: params.image } },
          ],
        });
      } else {
        formattedMessages.push({ role: message.role, content: message.content });
      }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let response: Response;
    try {
      response = await fetch(endpoints[provider], {
        method: 'POST', headers,
        body: JSON.stringify({ model, messages: formattedMessages, temperature: 0.7, max_tokens: 1500 }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const details = (await response.text()).slice(0, 300);
      const error = new Error(`${PROVIDER_METADATA[provider].name} HTTP ${response.status}: ${details}`) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    const text = typeof content === 'string'
      ? content
      : Array.isArray(content) ? content.map((part: any) => part?.text || '').join('\n') : '';
    if (!text.trim()) throw new Error(`${PROVIDER_METADATA[provider].name} a renvoyé une réponse vide.`);
    return { text, providerUsed: provider, modelUsed: model };
  }
}

export const providerManager = new ProviderManager();
