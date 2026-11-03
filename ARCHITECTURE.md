# CHLOÉ AI – Architecture Technique Complète (ARCHITECTURE.md)
**Version :** 2.0.0 Enterprise Personal Edition  
**Auteur & Concepteur :** Équipe d'Ingénierie IA, Cybersécurité & Architecture Full-Stack  
**Plateforme d'exécution :** Samsung Galaxy S24 (Android 14+, One UI 6.1, Chrome Mobile)  

---

## 1. VUE D'ENSEMBLE DE L'ARCHITECTURE MULTI-AGENTS

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Samsung Galaxy S24 (Client PWA)                     │
│  - React 19 SPA · TypeScript · Tailwind CSS v4                          │
│  - Web Speech API (Voix & Écoute) · Capture Caméra Multimodale S24      │
│  - One UI Safe-Area Insets (pb-safe) · Touch-Targets >= 44px            │
│  - Détection Hors-Ligne (OfflineIndicator) · Service Worker PWA         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                             Appels HTTPS / JSON
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Serveur Backend Node.js / Express                    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    BOUCLIER DE SÉCURITÉ EN AMONT                  │  │
│  │  - Détection des Injections de Prompt & Jailbreaks                │  │
│  │  - Extraction sécurisée de l'Identité (Bearer / x-user-id)        │  │
│  │  - Filtre Anti-SSRF sur la Passerelle REST Externe                │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼─────────────────────────────────┐  │
│  │               ORCHESTRATEUR CENTRAL CHLOÉ (gemini.ts)             │  │
│  │  - Modèle : Google Gemini gemini-3.8-flash (Option gemini-4-argon)│  │
│  │  - Boucle de Function Calling (Max 5 itérations anti-bouclage)    │  │
│  │  - Injection dynamique des extraits RAG & Mémoires isolées        │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼─────────────────────────────────┐  │
│  │                  SYSTÈME DES 10 AGENTS SPÉCIALISÉS                │  │
│  │  1. chloe_orchestrator  2. search_agent     3. dev_agent          │  │
│  │  4. docs_agent (RAG)    5. comm_agent       6. personal_agent     │  │
│  │  7. automation_agent    8. creative_agent   9. security_agent     │  │
│  │  10. quality_agent (Vérification et Contrôle Qualité)             │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼─────────────────────────────────┐  │
│  │                 MOTEURS DE SERVICES & SCHEDULER                   │  │
│  │  - Moteur RAG : Chunking à fenêtres chevauchantes (rag.ts)        │  │
│  │  - Ordonnanceur d'arrière-plan : Cycle 60s (scheduler.ts)         │  │
│  │  - Approbations Niveau 3 : TTL 15 min & Signature SHA-256        │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼─────────────────────────────────┐  │
│  │          STOCKAGE PERSISTANT CLOISONNÉ PAR UTILISATEUR            │  │
│  │  - Mémoires · Documents · Tâches · Discussions · Logs d'audit     │  │
│  │  - Isolation stricte WHERE userId = req.userId                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. LES 10 AGENTS SPÉCIALISÉS DU COLLECTIF CHLOÉ

| Agent ID | Nom Public | Rôle & Spécialisation | Outils Déployés |
| :--- | :--- | :--- | :--- |
| `chloe_orchestrator` | CHLOÉ (Orchestrateur) | Synthèse globale, coordination et relation bienveillante | Dispatcher, Context Injector |
| `search_agent` | Agent Recherche | Recherche sur le Web, veille et vérification des sources | `googleSearch` Grounding |
| `dev_agent` | Agent Développeur | Programmation, conception de code et résolution de bugs | Code Generator, Syntax Validator |
| `docs_agent` | Agent Documents | Indexation et analyse de documents par passages (RAG) | `searchDocumentChunks` |
| `comm_agent` | Agent Communication | Rédaction d'emails, comptes-rendus et messages formels | Email Draft Builder (Niveau 2/3) |
| `personal_agent` | Agent Personnel | Mémoire des préférences, habitudes et projets du maître | `save_memory`, `delete_memory` |
| `automation_agent` | Agent Automatisation | Exécution et planification des workflows récurrents | `serverScheduler`, Task Dispatcher |
| `creative_agent` | Agent Créativité | Idéation de projets, récits, pitchs et concepts visuels | Creative Prompt Engine |
| `security_agent` | Agent Sécurité | Contrôle d'accès à 3 niveaux et neutralisation d'injections | `auditSecurityShield`, SSRF Filter |
| `quality_agent` | Agent Qualité | Vérification factuelle, cohérence et élimination des biais | Fact Checker, Output Verifier |

---

## 3. LE MOTEUR RAG (RETRIEVAL-AUGMENTED GENERATION)

Le moteur RAG (`server/rag.ts`) a été optimisé pour une précision chirurgicale sur les documents importés par le propriétaire :
1. **Segmentation à fenêtres chevauchantes (`createOverlappingChunks`) :**
   - Taille standard du passage : 350 caractères.
   - Chevauchement entre passages adjacents : 80 caractères.
   - Respect strict des frontières de phrases (`. `, `\n\n`) pour préserver le sens.
2. **Scoring de pertinence sémantique :**
   - Pondération des termes clés (exclusion des mots vides français et anglais).
   - Bonus de proximité et correspondance de séquence exacte.
   - Reconstitution des 3 meilleurs passages injectés dans le prompt système de CHLOÉ.

---

## 4. L'ORDONNANCEUR D'ARRIÈRE-PLAN (`scheduler.ts`)

Pour assurer une véritable autonomie, CHLOÉ dispose d'un ordonnanceur in-process qui tourne toutes les 60 secondes :
- Évalue les automatisations actives (`status === 'active'`).
- Analyse les conditions et déclencheurs horaires (ex: briefing de 08:00).
- Exécute les tâches de Niveau 1 ou 2 de manière transparente.
- Enregistre chaque exécution dans les journaux d'audit avec horodatage strict.

---

## 5. DÉFENSE EN PROFONDEUR & MODÈLE DE DONNÉES

Toutes les entités de données sont associées au champ `userId` :
- `MemoryItem` : Mémoires personnelles.
- `DocumentItem` & `DocumentChunk` : Documents et index vectoriel local.
- `AutomationTask` : Tâches automatisées.
- `ConversationThread` : Fils de discussion.
- `PendingApproval` : Demandes d'action sous approbation (avec expiration après 15 min).
- `AuditLogEntry` : Journaux de traçabilité immuables.

Toute requête vers la base de données sans identifiant valide ou ciblant l'identifiant d'un tiers est interceptée et bloquée.
