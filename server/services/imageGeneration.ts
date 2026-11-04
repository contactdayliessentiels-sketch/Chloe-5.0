import { GoogleGenAI } from '@google/genai';
import { providerManager } from '../providers.ts';
import { getGeminiClient, hasGeminiKey } from '../gemini.ts';
import { AIProviderId } from '../../shared/types.ts';

export interface ImageGenerationOptions {
  prompt: string;
  provider?: AIProviderId | 'auto';
  model?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  referenceImage?: string; // base64 data url for img2img / editing
}

export interface ImageGenerationResult {
  imageUrl: string; // base64 data URI data:image/png;base64,...
  provider: AIProviderId;
  model: string;
  prompt: string;
  revisedPrompt?: string;
  aspectRatio?: string;
}

export interface ImageProviderCapability {
  id: AIProviderId;
  name: string;
  hasKey: boolean;
  supportedModels: { id: string; name: string; description: string; default?: boolean }[];
}

export class ImageGenerationRouter {
  /**
   * List of providers supporting real image generation and their models
   */
  public getCapabilities(): ImageProviderCapability[] {
    const geminiHasKey = hasGeminiKey();
    const openaiKey = providerManager.getKey('openai');
    const openrouterKey = providerManager.getKey('openrouter');
    const nvidiaKey = providerManager.getKey('nvidia');

    return [
      {
        id: 'gemini',
        name: 'Google Gemini (Imagen & Flash Image)',
        hasKey: geminiHasKey,
        supportedModels: [
          { id: 'gemini-3.1-flash-lite-image', name: 'Gemini 3.1 Flash Lite Image', description: 'Génération et édition d\'image rapide et multimodale', default: true },
          { id: 'gemini-nano-banana-2.1', name: 'Gemini Nano Banana 2.1', description: 'Génération haute fidélité (1K/2K/4K)' },
        ],
      },
      {
        id: 'openai',
        name: 'OpenAI (DALL·E)',
        hasKey: !!openaiKey,
        supportedModels: [
          { id: 'dall-e-3', name: 'DALL·E 3', description: 'Rendu artistique détaillé 1024x1024', default: true },
          { id: 'dall-e-2', name: 'DALL·E 2', description: 'Génération standard rapide 512x512 ou 1024x1024' },
        ],
      },
      {
        id: 'openrouter',
        name: 'OpenRouter (FLUX & SDXL)',
        hasKey: !!openrouterKey,
        supportedModels: [
          { id: 'black-forest-labs/flux-1-schnell', name: 'FLUX.1 Schnell', description: 'Modèle FLUX ultra-rapide et haute précision', default: true },
          { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'Stable Diffusion XL 1.0', description: 'Génération réaliste open-weights' },
        ],
      },
      {
        id: 'nvidia',
        name: 'NVIDIA NIM (SDXL)',
        hasKey: !!nvidiaKey,
        supportedModels: [
          { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL NIM', description: 'Génération accélérée NVIDIA', default: true },
        ],
      },
    ];
  }

  /**
   * Natural language trigger detector for image generation requests
   */
  public detectImageIntent(message: string): { isImageRequest: boolean; cleanPrompt: string; isEdit: boolean } {
    if (!message || typeof message !== 'string') {
      return { isImageRequest: false, cleanPrompt: '', isEdit: false };
    }

    const trimmed = message.trim();

    // Regex pattern matching French & English creation commands
    const imagePatterns = [
      /^(?:cr[ée]e?(?:-moi)?|g[ée]n[èe]re?(?:-moi)?|dessine?(?:-moi)?|fais(?:-moi)?|peins(?:-moi)?|illustre?(?:-moi)?)\s+(?:une?\s+)?(?:image|illustration|dessin|logo|affiche|visuel|portrait|paysage|ic[oô]ne|tableau|banni[èe]re|photo)\s+(?:de|d'|avec|montrant|qui r[ée]sume|repr[ée]sentant)?\s*(.+)/i,
      /^(?:peux-tu|pourrais-tu)?\s*(?:cr[ée]er|g[ée]n[ée]rer|dessiner|illustrer|peindre)\s+(?:une?\s+)?(?:image|illustration|dessin|logo|affiche|visuel|portrait|paysage|photo)\s*(?:de|d'|avec|montrant|qui|pour)?\s*(.+)/i,
      /^\/image\s+(.+)/i,
      /^(?:g[ée]n[èe]re|cr[ée]e|dessine)\s*:\s*(.+)/i,
      /^(?:modifie?(?:-moi)?|retouche?(?:-moi)?|transforme?(?:-moi)?)\s+(?:cette|l')\s*image\s*(?:en|pour|avec|afin de)?\s*(.+)/i,
    ];

    for (const pattern of imagePatterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        const isEdit = /modifie|retouche|transforme/i.test(trimmed);
        return {
          isImageRequest: true,
          cleanPrompt: match[1].trim(),
          isEdit,
        };
      }
    }

    // Secondary heuristic: sentence strictly asking for an image
    if (/(?:fais|dessine|cr[ée]e|g[ée]n[èe]re)\s+une?\s+(?:image|illustration|photo|logo)/i.test(trimmed) && trimmed.length < 180) {
      return {
        isImageRequest: true,
        cleanPrompt: trimmed.replace(/^(?:s'il te pla[îi]t\s*,?\s*|peux-tu\s+)?(?:me\s+)?(?:faire|dessiner|cr[ée]er|g[ée]n[ée]rer|cr[ée]e|dessine|g[ée]n[èe]re)\s+(?:une?\s+)?(?:image|illustration|photo|logo)\s*(?:de\s+|d'\s*)?/i, '').trim(),
        isEdit: false,
      };
    }

    return { isImageRequest: false, cleanPrompt: message, isEdit: false };
  }

  /**
   * Main router for image generation with multi-provider failover
   */
  public async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const { prompt, provider = 'auto', model, aspectRatio = '1:1', referenceImage } = options;

    if (!prompt || !prompt.trim()) {
      throw new Error('Le prompt de description pour la génération d\'image est requis.');
    }

    const capabilities = this.getCapabilities();
    const providersWithKey = capabilities.filter(c => c.hasKey);

    if (providersWithKey.length === 0) {
      throw new Error(
        'Aucun fournisseur de génération d\'image n\'est actuellement configuré avec une clé API valide. Rendez-vous dans Paramètres > Fournisseurs d\'IA pour activer Google Gemini, OpenAI, OpenRouter ou NVIDIA NIM.'
      );
    }

    // Determine target provider order
    let targetProviders: AIProviderId[] = [];
    if (provider !== 'auto') {
      const selectedCap = capabilities.find(c => c.id === provider);
      if (!selectedCap?.hasKey) {
        throw new Error(`Le fournisseur sélectionné (${provider.toUpperCase()}) n'a pas de clé API configurée.`);
      }
      targetProviders = [provider];
    } else {
      // Prioritize: Gemini > OpenAI > OpenRouter > NVIDIA
      const priorityOrder: AIProviderId[] = ['gemini', 'openai', 'openrouter', 'nvidia'];
      targetProviders = priorityOrder.filter(id => providersWithKey.some(c => c.id === id));
    }

    let lastError: Error | null = null;

    for (const targetProv of targetProviders) {
      try {
        switch (targetProv) {
          case 'gemini':
            return await this.generateWithGemini(prompt, model, aspectRatio, referenceImage);
          case 'openai':
            return await this.generateWithOpenAI(prompt, model, aspectRatio, referenceImage);
          case 'openrouter':
            return await this.generateWithOpenRouter(prompt, model, aspectRatio);
          case 'nvidia':
            return await this.generateWithNvidia(prompt, model, aspectRatio);
        }
      } catch (err: any) {
        console.warn(`[ImageGeneration] Failed with ${targetProv}:`, err.message);
        lastError = err;
        // Continue to next available provider if failover is allowed
      }
    }

    throw lastError || new Error('Échec de la génération d\'image sur l\'ensemble des fournisseurs configurés.');
  }

  /**
   * Google Gemini Image Generation via @google/genai (gemini-3.1-flash-lite-image)
   */
  private async generateWithGemini(
    prompt: string,
    model?: string,
    aspectRatio: string = '1:1',
    referenceImage?: string
  ): Promise<ImageGenerationResult> {
    const client = getGeminiClient();
    if (!client) {
      throw new Error('Client Google Gemini non initialisé. Vérifiez votre clé GEMINI_API_KEY.');
    }

    const selectedModel = model || 'gemini-3.1-flash-lite-image';

    const parts: any[] = [];
    if (referenceImage) {
      const matches = referenceImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
      }
    }
    parts.push({ text: prompt });

    const response = await client.models.generateContent({
      model: selectedModel,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    const candidate = response.candidates?.[0];
    for (const part of candidate?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        return {
          imageUrl,
          provider: 'gemini',
          model: selectedModel,
          prompt,
          aspectRatio,
        };
      }
    }

    // In case model responded with text instead of image data
    const textOutput = response.text || '';
    throw new Error(textOutput ? `Le modèle n'a pas retourné d'image binaire : ${textOutput.substring(0, 100)}` : 'Aucune donnée d\'image reçue du modèle Gemini.');
  }

  /**
   * OpenAI Image Generation via DALL·E 3 / DALL·E 2
   */
  private async generateWithOpenAI(
    prompt: string,
    model?: string,
    aspectRatio: string = '1:1',
    referenceImage?: string
  ): Promise<ImageGenerationResult> {
    const key = providerManager.getKey('openai');
    if (!key) throw new Error('Clé API OpenAI absente.');

    const selectedModel = model || 'dall-e-3';
    let size = '1024x1024';
    if (aspectRatio === '16:9') size = '1792x1024';
    else if (aspectRatio === '9:16') size = '1024x1792';

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        prompt,
        n: 1,
        size,
        response_format: 'b64_json',
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`Erreur OpenAI DALL·E (${res.status}): ${errData.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('Aucune donnée d\'image reçue d\'OpenAI.');

    return {
      imageUrl: `data:image/png;base64,${b64}`,
      provider: 'openai',
      model: selectedModel,
      prompt,
      revisedPrompt: data.data?.[0]?.revised_prompt,
      aspectRatio,
    };
  }

  /**
   * OpenRouter Image Generation via FLUX / SDXL
   */
  private async generateWithOpenRouter(
    prompt: string,
    model?: string,
    aspectRatio: string = '1:1'
  ): Promise<ImageGenerationResult> {
    const key = providerManager.getKey('openrouter');
    if (!key) throw new Error('Clé API OpenRouter absente.');

    const selectedModel = model || 'black-forest-labs/flux-1-schnell';

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'https://chloe-ai.local',
        'X-Title': 'CHLOE AI',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`Erreur OpenRouter (${res.status}): ${errData.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Check for markdown image or data uri in content
    const imgMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+|data:image\/[^\s\)]+)\)/i) ||
                     content.match(/(https?:\/\/[^\s\)]+\.(?:png|jpg|jpeg|webp))/i);

    if (imgMatch && imgMatch[1]) {
      return {
        imageUrl: imgMatch[1],
        provider: 'openrouter',
        model: selectedModel,
        prompt,
        aspectRatio,
      };
    }

    throw new Error('Réponse OpenRouter sans image exploitable.');
  }

  /**
   * NVIDIA NIM Image Generation
   */
  private async generateWithNvidia(
    prompt: string,
    model?: string,
    aspectRatio: string = '1:1'
  ): Promise<ImageGenerationResult> {
    const key = providerManager.getKey('nvidia');
    if (!key) throw new Error('Clé API NVIDIA absente.');

    const selectedModel = model || 'stabilityai/stable-diffusion-xl-base-1.0';

    const res = await fetch('https://integrate.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl-base-1.0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Erreur NVIDIA NIM (${res.status}): ${err.substring(0, 100)}`);
    }

    const data = await res.json();
    const artifact = data.artifacts?.[0];
    if (artifact?.base64) {
      return {
        imageUrl: `data:image/jpeg;base64,${artifact.base64}`,
        provider: 'nvidia',
        model: selectedModel,
        prompt,
        aspectRatio,
      };
    }

    throw new Error('Aucune image retournée par NVIDIA NIM.');
  }
}

export const imageGenerationRouter = new ImageGenerationRouter();
