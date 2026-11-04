import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { db, OWNER_USER_ID } from './db.ts';
import { searchDocumentChunks } from './rag.ts';
import { DocumentChunk } from '../shared/types.ts';

import { providerManager } from './providers.ts';

export function getGeminiApiKey(): string {
  return providerManager.getKey('gemini') || process.env.GEMINI_API_KEY || '';
}

export function getGeminiClient(): GoogleGenAI | null {
  const key = getGeminiApiKey();
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function hasGeminiKey(): boolean {
  return !!getGeminiApiKey();
}

// Proxy getter for compatibility so existing calls to ai.models work dynamically
export const ai: any = new Proxy({} as any, {
  get(_target, prop) {
    const client = getGeminiClient();
    if (!client) return undefined;
    return (client as any)[prop];
  },
});

export const CHLOE_TOOLS: { functionDeclarations: FunctionDeclaration[] } = {
  functionDeclarations: [
    {
      name: 'save_memory',
      description: 'Enregistre une information, préférence, projet ou habitude dans la mémoire personnelle de CHLOÉ.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Titre court du souvenir (ex: "Boisson préférée", "Projet client")',
          },
          category: {
            type: Type.STRING,
            description: 'Catégorie: identity_preferences, habits, projects, useful_info, goals, reminders',
          },
          content: {
            type: Type.STRING,
            description: 'Contenu détaillé de l’information à mémoriser',
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Mots-clés associés',
          },
        },
        required: ['title', 'category', 'content'],
      },
    },
    {
      name: 'search_memories',
      description: 'Recherche dans les souvenirs et préférences enregistrés de l’utilisateur.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: 'Terme de recherche dans la mémoire',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'delete_memory_by_title',
      description: 'Supprime un souvenir de la mémoire sur demande explicite de l’utilisateur.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          titleOrKeyword: {
            type: Type.STRING,
            description: 'Le titre ou mot-clé du souvenir à effacer',
          },
        },
        required: ['titleOrKeyword'],
      },
    },
    {
      name: 'search_documents_knowledge',
      description: 'Interroge la bibliothèque de documents RAG indexés pour extraire des passages précis avec citations.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: 'Question ou mot-clé à rechercher dans les documents',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'prepare_gmail_draft',
      description: 'Prépare un brouillon d’email (Niveau 2 - Aucune expédition directe sans validation formelle de Niveau 3).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          recipient: {
            type: Type.STRING,
            description: 'Adresse email du destinataire',
          },
          subject: {
            type: Type.STRING,
            description: 'Objet du message',
          },
          body: {
            type: Type.STRING,
            description: 'Corps du message',
          },
        },
        required: ['recipient', 'subject', 'body'],
      },
    },
    {
      name: 'prepare_calendar_appointment',
      description: 'Prépare un rendez-vous dans Google Calendar avec fuseau horaire et participants.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Titre de l’événement ou de la réunion',
          },
          date: {
            type: Type.STRING,
            description: 'Date et heure de début au format ISO ou YYYY-MM-DD HH:mm',
          },
          durationMinutes: {
            type: Type.INTEGER,
            description: 'Durée en minutes',
          },
          description: {
            type: Type.STRING,
            description: 'Notes ou ordre du jour',
          },
        },
        required: ['title', 'date'],
      },
    },
    {
      name: 'request_sensitive_execution',
      description: 'Déclenche une demande formelle d’autorisation Niveau 3 pour une action sensible (envoi email, suppression de données, publication, modification système).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: 'Description claire de l’action (ex: "Envoyer l’email préparé à contact@exemple.fr")',
          },
          service: {
            type: Type.STRING,
            description: 'Le service concerné (Gmail, Calendar, Drive, Système, Automatisation)',
          },
          expectedResult: {
            type: Type.STRING,
            description: 'Ce qui va réellement se produire une fois confirmé',
          },
          payloadSummary: {
            type: Type.STRING,
            description: 'Détails des données transmises',
          },
        },
        required: ['action', 'service', 'expectedResult'],
      },
    },
  ],
};

export async function executeToolCall(
  name: string,
  args: any,
  userId: string = OWNER_USER_ID
): Promise<{ result: any; approvalId?: string; level: 'LEVEL_1_CONSULTATION' | 'LEVEL_2_PREPARATION' | 'LEVEL_3_EXECUTION' }> {
  db.recordUsage(150, true);

  switch (name) {
    case 'save_memory': {
      db.recordSkillUse('memory');
      const mem = db.addMemory(userId, {
        category: args.category || 'useful_info',
        title: args.title,
        content: args.content,
        tags: args.tags || [],
      });
      return {
        result: {
          success: true,
          message: `L'information "${args.title}" a bien été enregistrée dans ma mémoire personnelle.`,
          memoryId: mem.id,
        },
        level: 'LEVEL_2_PREPARATION',
      };
    }

    case 'search_memories': {
      db.recordSkillUse('memory');
      const q = (args.query || '').toLowerCase();
      const memories = db.getMemories(userId).filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
      return {
        result: {
          foundCount: memories.length,
          memories: memories.slice(0, 5).map(m => ({
            title: m.title,
            category: m.category,
            content: m.content,
          })),
        },
        level: 'LEVEL_1_CONSULTATION',
      };
    }

    case 'delete_memory_by_title': {
      db.recordSkillUse('memory');
      const q = (args.titleOrKeyword || '').toLowerCase();
      const target = db.getMemories(userId).find(m =>
        m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)
      );
      if (target) {
        db.deleteMemory(userId, target.id);
        return {
          result: {
            success: true,
            message: `Le souvenir "${target.title}" a été supprimé de ma mémoire conformément à votre demande.`,
          },
          level: 'LEVEL_2_PREPARATION',
        };
      }
      return {
        result: {
          success: false,
          message: `Aucun souvenir correspondant à "${args.titleOrKeyword}" n'a été trouvé.`,
        },
        level: 'LEVEL_1_CONSULTATION',
      };
    }

    case 'search_documents_knowledge': {
      db.recordSkillUse('documents');
      const q = args.query || '';
      const docs = db.getDocuments(userId);
      const allChunks: DocumentChunk[] = [];
      for (const d of docs) {
        if (d.chunks) {
          allChunks.push(...d.chunks);
        }
      }

      const relevantChunks = searchDocumentChunks(allChunks, q, 3);
      const excerpts = relevantChunks.map(c => {
        const parentDoc = docs.find(d => d.id === c.documentId);
        return {
          document: parentDoc?.name || 'Document indexé',
          passageIndex: c.chunkIndex,
          excerpt: c.content,
          score: c.score,
        };
      });

      return {
        result: {
          matchingCount: excerpts.length,
          excerpts: excerpts.length > 0 ? excerpts : [{
            document: docs[0]?.name || 'Base de connaissances',
            excerpt: docs[0]?.content?.substring(0, 300) || 'Aucun passage précis trouvé.',
          }],
        },
        level: 'LEVEL_1_CONSULTATION',
      };
    }

    case 'prepare_gmail_draft': {
      db.recordSkillUse('reasoning');
      const approval = db.createApproval(
        userId,
        `Envoi de l'email à ${args.recipient}`,
        'Gmail',
        { recipient: args.recipient, subject: args.subject, body: args.body },
        `L'email sera expédié via votre compte Google Workspace (${args.recipient}) avec le contenu spécifié.`
      );
      return {
        result: {
          status: 'draft_prepared',
          message: `Brouillon rédigé pour ${args.recipient}. L'action nécessite votre validation formelle (Niveau 3) avant tout envoi réel.`,
          draft: { recipient: args.recipient, subject: args.subject, bodyPreview: args.body.substring(0, 150) },
          approvalId: approval.id,
          expiresAt: approval.expiresAt,
        },
        approvalId: approval.id,
        level: 'LEVEL_3_EXECUTION',
      };
    }

    case 'prepare_calendar_appointment': {
      db.recordSkillUse('reasoning');
      const approval = db.createApproval(
        userId,
        `Création de l'événement Google Calendar : "${args.title}"`,
        'Google Calendar',
        { title: args.title, date: args.date, duration: args.durationMinutes || 60, description: args.description },
        `L'événement sera ajouté à votre agenda Google synchronisé à la date indiquée (${args.date}).`
      );
      return {
        result: {
          status: 'calendar_prepared',
          message: `Événement "${args.title}" préparé pour le ${args.date}. Veuillez confirmer l'ajout dans l'interface de contrôle.`,
          approvalId: approval.id,
          expiresAt: approval.expiresAt,
        },
        approvalId: approval.id,
        level: 'LEVEL_3_EXECUTION',
      };
    }

    case 'request_sensitive_execution': {
      const approval = db.createApproval(
        userId,
        args.action,
        args.service,
        { summary: args.payloadSummary },
        args.expectedResult
      );
      return {
        result: {
          status: 'approval_created',
          approvalId: approval.id,
          expiresAt: approval.expiresAt,
          message: `L'action "${args.action}" est enregistrée et requiert votre validation explicite.`,
        },
        approvalId: approval.id,
        level: 'LEVEL_3_EXECUTION',
      };
    }

    default:
      return {
        result: { error: `Outil inconnu : ${name}` },
        level: 'LEVEL_1_CONSULTATION',
      };
  }
}

export function buildChloeSystemInstruction(
  settings = db.getSettings(),
  memories = db.getMemories(OWNER_USER_ID),
  skills = db.getSkills()
): string {
  const activeSkillsList = skills.filter(s => s.enabled).map(s => `- ${s.name} (${s.id}) : ${s.description}`).join('\n');
  const memoriesContext = memories.slice(0, 10).map(m => `[${m.category}] ${m.title} : ${m.content}`).join('\n');

  return `Tu es ${settings.assistantName}, l'intelligence artificielle personnelle officielle de ton propriétaire.
Tu fonctionnes sur son smartphone Samsung Galaxy S24.

PERSONNALITÉ & PRINCIPES :
${settings.personality}
- Tu t'exprimes en français élégant, naturel, chaleureux et précis.
- Tu es modeste, honnête et lucide : si tu ignores une information, dis-le clairement sans inventer.
- Si un service externe n'est pas configuré, indique-le honnêtement.
- Tu ne prétends JAMAIS avoir effectué une action que tu n'as pas réellement validée.
- Tu respectes scrupuleusement la séparation des 3 niveaux d'accès :
  * Niveau 1 (Consultation) : lecture, recherche, explication.
  * Niveau 2 (Préparation) : rédaction de brouillon, calcul, mise en page.
  * Niveau 3 (Exécution) : envoi réel d'email, suppression ou modification de données sensibles -> nécessite TOUJOURS une demande d'approbation via l'outil dédié.

MÉMOIRE PERSONNELLE ACTUELLE :
${memoriesContext || 'Aucune mémoire spécifique enregistrée pour le moment.'}

COMPÉTENCES ACTIVES :
${activeSkillsList}

DATE ET HEURE ACTUELLE :
${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}

INSTRUCTIONS CLÉS :
1. Pour mémoriser une préférence ou un fait dit par l'utilisateur, appelle l'outil 'save_memory'.
2. Pour oublier ou supprimer une information, appelle 'delete_memory_by_title'.
3. Pour préparer un email, utilise 'prepare_gmail_draft' (qui crée une demande d'approbation Niveau 3).
4. Pour planifier un rendez-vous, utilise 'prepare_calendar_appointment'.
5. Reste concise, agréable et parfaitement adaptée à une lecture sur écran mobile Samsung Galaxy S24.`;
}
