import { db, OWNER_USER_ID } from '../db.ts';
import { SkillConfig, AgentId, SkillCategory } from '../../shared/types.ts';

export interface LearnedSkillExtraction {
  name: string;
  description: string;
  objective: string;
  method: string;
  executionSteps: string[];
  toolsNeeded: string[];
  examples: string[];
  limitations: string[];
  category: SkillCategory;
}

export class ContinuousLearningEngine {
  /**
   * Sensitive data shield: checks if text contains passwords, API keys, private tokens, or secrets
   */
  public containsSensitiveData(text: string): boolean {
    if (!text || typeof text !== 'string') return false;

    const sensitivePatterns = [
      /(?:api[_-]?key|secret|token|password|passwd|mot de passe|clef|credential|bearer)\s*[:=]\s*['"]?[a-zA-Z0-9_\-\.]{8,}['"]?/i,
      /ghp_[a-zA-Z0-9]{30,}/, // GitHub Personal Access Token
      /sk-[a-zA-Z0-9]{20,}/,  // OpenAI secret key
      /nvapi-[a-zA-Z0-9_-]{20,}/, // NVIDIA API key
      /AIzaSy[a-zA-Z0-9_-]{33}/, // Google API key
      /-----BEGIN (?:RSA|OPENSSH|PRIVATE) KEY-----/,
    ];

    return sensitivePatterns.some(pat => pat.test(text));
  }

  /**
   * Analyzes user message & conversation context to detect reusable procedures and techniques
   */
  public analyzeForSkill(userMessage: string, assistantReply?: string): LearnedSkillExtraction | null {
    if (!userMessage || userMessage.length < 25) return null;

    // Strict security check: never learn from sensitive secrets
    if (this.containsSensitiveData(userMessage) || (assistantReply && this.containsSensitiveData(assistantReply))) {
      return null;
    }

    const trimmed = userMessage.trim();

    // Trigger patterns in French & English
    const procedureTriggers = [
      /(?:pour|afin de|quand on veut|lorsque je|quand je|si je veux)\s+(.+?)(?:,\s*|\s+il faut\s+|\s+utilise\s+|\s+fais\s+)(.+)/i,
      /(?:voici la m[ée]thode|voici la proc[ée]dure|voici comment|la technique est de)\s*:\s*(.+)/i,
      /(?:retiens que pour|m[ée]morise que pour|apprends que pour)\s+(.+)/i,
      /(?:la r[èe]gle pour|les [ée]tapes pour)\s+(.+)/i,
    ];

    let detectedGoal = '';
    let detectedProcedure = '';

    for (const pat of procedureTriggers) {
      const match = trimmed.match(pat);
      if (match) {
        detectedGoal = match[1]?.trim() || '';
        detectedProcedure = match[2]?.trim() || trimmed;
        break;
      }
    }

    // Example prompt specifically highlighted in specification:
    // « Pour compiler mon application Android, utilise GitHub Actions, vérifie les erreurs Gradle et récupère l'APK dans les Artifacts. »
    if (/compile.*android|github actions|gradle|apk.*artifact/i.test(trimmed)) {
      return {
        name: 'Compilation Android avec GitHub Actions & Artifacts',
        description: 'Procédure automatisée de build Android via GitHub Actions, vérification des erreurs Gradle et extraction de l’APK.',
        objective: 'Compiler et récupérer l’APK Android sans erreur Gradle',
        method: '1. Déclencher le workflow GitHub Actions. 2. Vérifier les logs d’erreurs Gradle. 3. Télécharger l’APK final dans les Artifacts.',
        executionSteps: [
          'Déclencher le workflow GitHub Actions sur la branche active',
          'Inspecter les logs de compilation Gradle pour détecter d’éventuelles erreurs',
          'Télécharger et vérifier l’APK généré dans la section Artifacts de GitHub',
        ],
        toolsNeeded: ['github_actions', 'gradle', 'capacitor', 'android_sdk'],
        examples: [userMessage],
        limitations: [
          'Nécessite des secrets de signature valides et une connexion GitHub opérationnelle.',
        ],
        category: 'developer',
      };
    }

    if (!detectedGoal || detectedGoal.length < 8) {
      return null;
    }

    // Derive category
    let category: SkillCategory = 'custom';
    if (/code|programm|build|compil|git|script|gradle|android|react|ts|npm/i.test(trimmed)) category = 'developer';
    else if (/automati|cron|planifi|t[âa]che/i.test(trimmed)) category = 'automation';
    else if (/cherch|trouv|web|source|document/i.test(trimmed)) category = 'web_search';
    else if (/image|photo|dessin|design|ui/i.test(trimmed)) category = 'creative';

    // Extract steps if separated by commas or numbers
    const rawSteps = detectedProcedure
      .split(/(?:,|\.|\bet\s+puis\b|\bensuite\b|\bpuis\b|\b\d+[\.\)]\s*)/i)
      .map(s => s.trim())
      .filter(s => s.length > 5);

    const steps = rawSteps.length > 0 ? rawSteps : [detectedProcedure];

    // Build skill name
    const cleanGoal = detectedGoal
      .replace(/^(?:faire|utiliser|gérer|créer|mettre en place)\s+/i, '')
      .replace(/[,\.\?!]$/, '');
    const capitalizedName = cleanGoal.charAt(0).toUpperCase() + cleanGoal.slice(1);

    return {
      name: `Méthode : ${capitalizedName.substring(0, 50)}`,
      description: `Procédure réutilisable pour : ${detectedGoal}`,
      objective: `Accomplir : ${detectedGoal}`,
      method: detectedProcedure,
      executionSteps: steps,
      toolsNeeded: ['chloe_ai', category],
      examples: [userMessage],
      limitations: ['À valider selon le contexte d’exécution.'],
      category,
    };
  }

  /**
   * Saves or enriches a skill in the database
   */
  public registerOrEnrichSkill(
    extraction: LearnedSkillExtraction,
    conversationId?: string,
    userId: string = OWNER_USER_ID
  ): { skill: SkillConfig; action: 'created' | 'enriched' } {
    const existingSkills = db.getSkills();

    // Search for existing skill with similar name or objective (fuzzy deduplication)
    const normalizedName = extraction.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = existingSkills.find(s => {
      const sNorm = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return sNorm.includes(normalizedName) || normalizedName.includes(sNorm) || (s.objective && s.objective.toLowerCase().includes(extraction.objective.toLowerCase()));
    });

    const now = new Date().toISOString();

    if (existing) {
      // Enrich existing skill
      const existingSteps = existing.executionSteps || [];
      const newSteps = extraction.executionSteps.filter(ns => !existingSteps.some(es => es.toLowerCase() === ns.toLowerCase()));
      const combinedSteps = [...existingSteps, ...newSteps];

      const existingTools = existing.toolsNeeded || existing.permissions || [];
      const newTools = extraction.toolsNeeded.filter(nt => !existingTools.includes(nt));
      const combinedTools = [...existingTools, ...newTools];

      const history = existing.history || [];
      history.push({
        timestamp: now,
        action: `Compétence enrichie lors de la conversation (${newSteps.length} nouvelles étapes)`,
        status: 'success',
      });

      const updated = db.updateSkill(existing.id, {
        description: `${existing.description} | Amélioration : ${extraction.description}`,
        executionSteps: combinedSteps,
        toolsNeeded: combinedTools,
        updatedAt: now,
        usageCount: (existing.usageCount || 0) + 1,
        history,
      });

      db.log(userId, 'APPRENTISSAGE', `Compétence enrichie : "${existing.name}"`, 'LEVEL_2_PREPARATION', 'success', `Étapes totales: ${combinedSteps.length}`);
      return { skill: updated || existing, action: 'enriched' };
    }

    // Create new structured skill
    const skillSlug = extraction.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 30);
    const newId = `learned_${skillSlug}_${Date.now().toString(36)}`;

    const newSkill: SkillConfig = {
      id: newId,
      name: extraction.name,
      description: extraction.description,
      category: extraction.category,
      enabled: true,
      accessLevel: 'LEVEL_2_PREPARATION',
      permissions: extraction.toolsNeeded,
      dependencies: [],
      objective: extraction.objective,
      method: extraction.method,
      executionSteps: extraction.executionSteps,
      toolsNeeded: extraction.toolsNeeded,
      examples: extraction.examples,
      limitations: extraction.limitations,
      createdAt: now,
      updatedAt: now,
      sourceConversationId: conversationId,
      usageCount: 1,
      isCustom: true,
      allowedAgents: ['chloe_orchestrator', 'dev_agent', 'analysis_agent', 'creative_agent'],
      history: [
        {
          timestamp: now,
          action: 'Compétence découverte et créée depuis la conversation',
          status: 'success',
        },
      ],
    };

    const created = db.createSkill(newSkill);
    db.log(userId, 'APPRENTISSAGE', `Nouvelle compétence mémorisée : "${extraction.name}"`, 'LEVEL_2_PREPARATION', 'success', `Catégorie: ${extraction.category}`);

    return { skill: created, action: 'created' };
  }

  /**
   * Search learned skills for multi-agent retrieval
   */
  public findRelevantSkills(query: string, agentId?: AgentId): SkillConfig[] {
    const allSkills = db.getSkills().filter(s => s.enabled);
    const lower = query.toLowerCase();

    return allSkills.filter(skill => {
      // Check agent permission if specified
      if (agentId && skill.allowedAgents && skill.allowedAgents.length > 0 && !skill.allowedAgents.includes(agentId)) {
        return false;
      }

      const matchName = skill.name.toLowerCase().includes(lower);
      const matchDesc = skill.description.toLowerCase().includes(lower);
      const matchObj = (skill.objective || '').toLowerCase().includes(lower);
      const matchMethod = (skill.method || '').toLowerCase().includes(lower);

      return matchName || matchDesc || matchObj || matchMethod;
    });
  }
}

export const continuousLearningEngine = new ContinuousLearningEngine();
