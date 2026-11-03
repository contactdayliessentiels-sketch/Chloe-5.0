# CHLOÉ AI — 25 améliorations réellement vérifiables

**Statut de départ :** backlog d'implémentation, aucune ligne n'est marquée terminée sur la seule base d'une déclaration documentaire. Chaque case ne pourra être cochée qu'après implémentation et test reproductible.

## P0 — Sécurité et données

1. [ ] **Authentification réelle** — remplacer `x-user-id` par une session signée/JWT validée côté serveur; refuser les requêtes anonymes sur les routes privées. Test : jeton absent, expiré et falsifié refusés.
2. [ ] **Isolation de chaque route API** — dériver l'identité uniquement de la session; vérifier l'appartenance pour les IDs d'automatisations, conversations, fichiers et approbations. Test : utilisateur B ne lit/modifie/supprime aucun objet de A.
3. [ ] **Données privées hors Git** — retirer du suivi `data/chloe_store.json`, `data/backups/**`, `data/ai_providers.json` si présent et `android/local.properties`; conserver les données locales; règles `.gitignore`. Test : `git ls-files` ne retourne aucun de ces chemins.
4. [ ] **Secrets hors fichiers JSON** — clés fournisseurs uniquement en variables d'environnement ou coffre chiffré; ne jamais les renvoyer au frontend. Test : scan de dépôt + test de sérialisation API.
5. [ ] **Protection HTTP** — validation stricte des entrées, limites de taille, rate limiting, CORS maîtrisé, en-têtes de sécurité et gestion uniforme des erreurs. Test : tests HTTP d'abus et de validation.

## P1 — Agents, outils et MCP

6. [ ] **Planificateur multi-agent** — CHLOÉ décompose une tâche en sous-tâches typées et choisit plusieurs agents selon leurs compétences. Test : trace d'exécution montrant un plan multi-agent sur une demande complexe.
7. [ ] **Exécution parallèle contrôlée** — tâches indépendantes exécutées en parallèle avec timeout, annulation et limites de concurrence. Test : mesure de concurrence et gestion d'un agent en panne.
8. [ ] **Relecture croisée** — un agent qualité vérifie les livrables et demande une correction quand les critères échouent. Test : défaut volontaire détecté puis corrigé.
9. [ ] **Registre d'outils réel** — chaque outil expose schéma, permission, timeout, résultat et erreur; aucune réponse fictive présentée comme réelle. Test : outil indisponible retourne explicitement `not_configured` ou `error`.
10. [ ] **MCP HTTP/SSE complet** — vraie négociation JSON-RPC, découverte et appel des outils, gestion de session et erreurs protocole. Test : serveur MCP de test externe réel.
11. [ ] **MCP STDIO réel** — démarrer/arrêter le processus déclaré, communiquer sur stdin/stdout JSON-RPC, gérer les sorties et timeouts. Test : serveur MCP local factice lancé en sous-processus.
12. [ ] **Permissions MCP par agent** — l'agent ne peut appeler que les outils explicitement autorisés par l'utilisateur. Test : appel non autorisé bloqué côté serveur.

## P2 — Fournisseurs IA et connaissances

13. [ ] **Gestion multi-fournisseurs** — Gemini, OpenAI, NVIDIA et OpenRouter utilisables à partir de clés testées, avec choix explicite du modèle. Test : appel réel de chaque fournisseur configuré.
14. [ ] **Routage et repli de modèles** — sélection selon tâche/capacités, bascule sur erreur/quota et traçabilité du modèle utilisé. Test : provoquer un échec fournisseur et vérifier le repli.
15. [ ] **Contrôle des coûts et quotas** — budgets par utilisateur/fournisseur, comptage réel des tokens et blocage/alerte aux seuils. Test : dépassement de quota simulé puis vérifié.
16. [ ] **RAG traçable** — indexation avec embeddings ou algorithme lexical correctement nommé, classement mesuré, IDs de sources et citations exactes. Test : questions de référence avec précision/rappel mesurés.
17. [ ] **Ingestion documentaire sûre** — validation MIME, taille, isolation par compte, extraction des PDF/DOCX et suppression des chunks associés. Test : fichier hostile/invalide refusé et document A invisible à B.

## P3 — Exécution, approbations et intégrations

18. [ ] **Planification calendrier** — parser les horaires réels, fuseau IANA, récurrence, prochaine occurrence et changements d'heure. Test : série de cas timezone/DST.
19. [ ] **File d'exécution durable** — worker avec reprises, idempotence et état `queued/running/succeeded/failed`; pas de faux journal de succès. Test : redémarrage serveur pendant une tâche.
20. [ ] **Approbations cryptographiques** — HMAC avec secret serveur, comparaison sûre, TTL, liaison au payload et anti-rejeu. Test : signature modifiée, payload modifié et token rejoué refusés.
21. [ ] **Exécution après approbation** — approbation valide déclenche exactement l'action correspondante; rejet/expiration n'exécute rien. Test : action sandbox instrumentée appelée une seule fois.
22. [ ] **Google Workspace réel** — OAuth avec callback/refresh token, scopes minimaux et révocation; Gmail/Drive clairement différenciés du mode simulation. Test : compte de test réel, lecture et brouillon vérifiés.
23. [ ] **Google Calendar réel** — lecture/création/modification d'événement via API avec fuseau et approbation selon le niveau. Test : événement de test créé puis supprimé.
24. [ ] **Connecteurs cloud externes** — Firestore, WhatsApp Business et Spotify activables uniquement avec identifiants réels, webhooks/OAuth vérifiés et statut honnête. Test : suite d'intégration pour chaque connecteur configuré; sinon statut `not_configured`.

## P4 — Voix et Android

25. [ ] **Application Android réellement utilisable** — URL API HTTPS configurée, authentification sécurisée, permissions micro/caméra, réseau/hors-ligne et build signé; voix streaming et réveil vocal uniquement quand le service est effectivement intégré. Test : APK installé sur Galaxy S24, test UI/API réel, puis artefact et SHA-256 publiés par CI.

---

## Règle de validation

Une case passe à `[x]` uniquement si : (1) le code de production est présent, (2) un test automatisé ou d'intégration teste le comportement réel, (3) le test échoue quand la fonction est cassée, et (4) le statut de connecteur distingue service réel, simulation et non configuré. Une vérification de présence de code, une valeur préremplie ou un test qui retourne toujours `true` ne suffit pas.
