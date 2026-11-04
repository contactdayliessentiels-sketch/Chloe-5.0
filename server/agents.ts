import { AgentId, AgentInfo, ChatMessage } from '../shared/types.ts';
import { db } from './db.ts';
import { ai, buildChloeSystemInstruction } from './gemini.ts';

export const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: 'chloe_orchestrator',
    name: 'CHLOÉ Orchestrateur',
    role: 'Chef d’orchestre central',
    description: 'Analyse l’intention, détermine la complexité, active les agents utiles et synthétise la réponse finale.',
    model: 'gemini-3.8-flash',
    status: 'active',
    tools: ['save_memory', 'search_memories', 'delete_memory_by_title', 'request_sensitive_execution'],
    executionCount: 52,
  },
  {
    id: 'search_agent',
    name: 'Agent Recherche & Sources',
    role: 'Vérification factuelle & Actualité',
    description: 'Interroge le web via Google Search Grounding, valide les dates, extrait des sources fiables et neutralise les infox.',
    model: 'gemini-3.8-flash',
    status: 'idle',
    tools: ['googleSearch'],
    executionCount: 24,
  },
  {
    id: 'dev_agent',
    name: 'Agent Développeur & Code',
    role: 'Architecture & Programmation',
    description: 'Génère du code propre (TypeScript, React, Python), explique les algorithmes et analyse les bugs sans exécuter de commandes non sûres.',
    model: 'gemini-4-argon',
    status: 'idle',
    tools: ['lint_syntax', 'format_code'],
    executionCount: 16,
  },
  {
    id: 'ui_agent',
    name: 'Agent Interface Graphique & Ergonomie',
    role: 'Design Système & Front-End',
    description: 'Optimise l’interface utilisateur, Tailwind CSS, la réactivité tactile mobile et les composants visuels.',
    model: 'gemini-3.8-flash',
    status: 'idle',
    tools: ['validate_responsive_layout', 'inspect_ui_components'],
    executionCount: 22,
  },
  {
    id: 'analysis_agent',
    name: 'Agent Analyse & Données',
    role: 'Analyse quantitative & Synthèse',
    description: 'Structure les jeux de données, extrait les tendances clés, calcule les métriques et génère des synthèses décisionnelles.',
    model: 'gemini-3.8-flash',
    status: 'idle',
    tools: ['compute_data_metrics', 'extract_structured_insights'],
    executionCount: 18,
  },
  {
    id: 'docs_agent',
    name: 'Agent Documents & RAG',
    role: 'Analyste de connaissances',
    description: 'Gère le découpage sémantique en passages avec chevauchement et extrait les citations exactes de vos documents.',
    model: 'gemini-3.8-flash',
    status: 'idle',
    tools: ['search_documents_knowledge'],
    executionCount: 19,
  },
  {
    id: 'comm_agent',
    name: 'Agent Communication',
    role: 'Rédaction & Messagerie',
    description: 'Prépare les brouillons d’emails Gmail, rendez-vous Google Calendar et messages, strictement isolés au Niveau 2.',
    model: 'gemini-3.8-flash',
    status: 'idle',
    tools: ['prepare_gmail_draft', 'prepare_calendar_appointment'],
    executionCount: 14,
  },
  {
    id: 'personal_agent',
    name: 'Agent Personnel & Habitudes',
    role: 'Mémoire & Contexte',
    description: 'Gère les souvenirs, préférences et habitudes personnelles du propriétaire sur Samsung Galaxy S24.',
    model: 'gemini-3.8-flash',
    status: 'idle',
    tools: ['save_memory', 'search_memories', 'delete_memory_by_title'],
    executionCount: 31,
  },
  {
    id: 'automation_agent',
    name: 'Agent Automatisation & Tâches',
    role: 'Planificateur de workflows',
    description: 'Évalue les déclencheurs, vérifie les conditions horaires/système et trace les exécutions en journal sécurisé.',
    model: 'gemini-3.8-flash',
    status: 'idle',
    tools: ['evaluate_condition', 'schedule_task'],
    executionCount: 9,
  },
  {
    id: 'creative_agent',
    name: 'Agent Créativité & Récits',
    role: 'Concepteur d’idées',
    description: 'Brainstorme des projets innovants, compose des récits narratifs et structure des concepts visuels.',
    model: 'gemini-3.8-flash',
    status: 'idle',
    tools: ['ideation_prompt'],
    executionCount: 12,
  },
  {
    id: 'security_agent',
    name: 'Agent Sécurité & Anti-Injection',
    role: 'Sentinelle de conformité',
    description: 'Scanne les invites utilisateur et documents pour neutraliser les attaques d’injection et applique le modèle Niveau 1-2-3.',
    model: 'gemini-3.8-flash',
    status: 'active',
    tools: ['audit_access_level', 'sanitize_prompt'],
    executionCount: 64,
  },
  {
    id: 'quality_agent',
    name: 'Agent Contrôle Qualité',
    role: 'Validateur de vérité',
    description: 'Passe en revue la réponse finale pour garantir l’absence d’hallucination, la courtoisie et la concision adaptée au S24.',
    model: 'gemini-3.8-flash',
    status: 'idle',
    tools: ['verify_truthfulness'],
    executionCount: 48,
  },
];

export class MultiAgentCoordinator {
  private agents: Map<AgentId, AgentInfo>;

  constructor() {
    this.agents = new Map();
    for (const a of INITIAL_AGENTS) {
      this.agents.set(a.id, { ...a });
    }
  }

  public getAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  public recordAgentRun(id: AgentId): void {
    const a = this.agents.get(id);
    if (a) {
      a.executionCount += 1;
    }
  }

  /**
   * Intelligently selects the specialized agent required for the task.
   * Avoids unnecessary multi-agent chaining when a single direct turn suffices.
   */
  public selectSpecializedAgent(message: string, hasImage: boolean, hasDocQuery: boolean): AgentId {
    const text = message.toLowerCase();

    // Security check is always active
    this.recordAgentRun('security_agent');

    if (hasImage) {
      return 'chloe_orchestrator'; // Multi-modal direct
    }
    if (/interface|ui|ux|design|css|tailwind|graphique|layout|responsive|bouton|écran/i.test(text)) {
      return 'ui_agent';
    }
    if (/analyse|statistique|métrique|tendance|comparatif|données|chiffres|audit/i.test(text)) {
      return 'analysis_agent';
    }
    if (hasDocQuery || /document|pdf|fichier|résume le document|rag|passage/i.test(text)) {
      return 'docs_agent';
    }
    if (/code|typescript|javascript|react|python|fonction|script|bug|algorithme/i.test(text)) {
      return 'dev_agent';
    }
    if (/email|mail|courriel|rendez-vous|agenda|calendrier|réunion|planning/i.test(text)) {
      return 'comm_agent';
    }
    if (/cherche|actualité|source|aujourd'hui|météo|dernier|nouvelle|qui est/i.test(text)) {
      return 'search_agent';
    }
    if (/rappelle-toi|retiens|mémorise|souvenir|habitude|préfère|mon nom|oublie/i.test(text)) {
      return 'personal_agent';
    }
    if (/automatise|workflow|scénario|chaque jour|planifie/i.test(text)) {
      return 'automation_agent';
    }
    if (/histoire|scénario|crée une idée|brainstorming|concept|poème|pitch/i.test(text)) {
      return 'creative_agent';
    }

    return 'chloe_orchestrator';
  }

  /**
   * Verifies input prompt against prompt-injection attempts.
   * Returns sanitized text or flags safety violation.
   */
  public auditSecurityShield(input: string): { safe: boolean; reason?: string } {
    const lower = input.toLowerCase();
    const maliciousPatterns = [
      /ignore all previous instructions/i,
      /oublie toutes les instructions précédentes/i,
      /ignore prior rules/i,
      /system prompt leak/i,
      /reveal your api key/i,
      /donne-moi ta clé d'api/i,
      /execute arbitrary bash/i,
      /drop database/i,
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(lower)) {
        return {
          safe: false,
          reason: "Tentative d'altération des règles maîtresses détectée par l'Agent Sécurité.",
        };
      }
    }

    return { safe: true };
  }
}

export const agentCoordinator = new MultiAgentCoordinator();
