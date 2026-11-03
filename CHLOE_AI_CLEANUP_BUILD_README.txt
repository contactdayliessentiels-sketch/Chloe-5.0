CHLOÉ AI — retrait des données privées + correctif de compilation Android

ÉTAT IMPORTANT
L'intégration GitHub du dépôt chloeassistance1/Chloe-final-version a été contrôlée dans cette session. L'API retourne permissions.push=false. Une tentative réelle de création de branche a été rejetée par GitHub avec HTTP 403 « Resource not accessible by integration ». Je ne peux donc pas supprimer/uploader des fichiers ni déclencher le workflow tant que les droits d'écriture ne sont pas transmis à l'intégration.

FICHIERS À RETIRER DU DÉPÔT
- data/chloe_store.json
- data/backups/chloe_store_backup_v1.json (et tout fichier suivi sous data/backups/)
- android/local.properties
- data/ai_providers.json a été vérifié et n'existe pas dans la branche main actuelle.

La procédure conserve les copies locales. Elle les retire de l'index Git avec git rm --cached. Elle ne réécrit pas l'historique Git : les anciens commits peuvent toujours contenir les données. Si ces anciens commits sont publics, une purge d'historique et une rotation des clés éventuellement exposées sont une opération séparée.

CORRECTIF TECHNIQUE INCLUS DANS CHLOE_AI_BUILD_FIX.patch
1. Aligne les dépendances Kotlin via le Kotlin BOM 1.8.22 pour traiter les classes dupliquées détectées entre kotlin-stdlib 1.8.22 et kotlin-stdlib-jdk7/jdk8 1.6.21.
2. Rend npm ci déterministe (ne masque plus son erreur par npm install).
3. Ajoute des diagnostics Gradle dependencyInsight si la compilation Android échoue.
4. Ignore les fichiers locaux privés/configuration Android dans .gitignore.

APPLICATION
1. Télécharger ces trois fichiers dans un même dossier :
   - CHLOE_AI_BUILD_FIX.patch
   - CHLOE_AI_APPLY_CLEANUP_AND_BUILD_FIX.sh
   - ce README
2. Dans un clone local du dépôt, placer les deux fichiers .patch et .sh à la racine du clone (ou passer le chemin du patch au script).
3. Depuis la racine du clone, exécuter :
   bash ./CHLOE_AI_APPLY_CLEANUP_AND_BUILD_FIX.sh
4. Vérifier attentivement les changements avec git diff et git diff --cached.
5. Commiter et pousser sur main :
   git commit -m "Secure private data and fix Android Kotlin build"
   git push origin main
6. GitHub Actions démarrera sur le push. Vérifier le run, puis télécharger l'artefact CHLOE-AI-Android-v1.0.0-apk uniquement si le job est vert.

DROITS GITHUB À RÉTABLIR
Pour effectuer ces opérations depuis l'intégration, celle-ci doit avoir accès au dépôt avec Contents: Read and write et Actions: Read and write. Après changement des permissions, reconnecter/actualiser l'intégration GitHub puis revérifier que le dépôt retourne permissions.push=true.

LES 25 AMÉLIORATIONS
La ROADMAP.md actuellement publiée ne contient que 10 cases à cocher, pas 25. Plusieurs états affirmés comme terminés dans PROJECT_STATUS.md / AUDIT_REPORT.md ne sont pas confirmés par le code : l'authentification accepte x-user-id et retombe sur un compte propriétaire par défaut; les outils MCP intégrés renvoient des données simulées; l'ordonnanceur journalise des exécutions sans réellement lancer les actions; les validations d'approbation n'exécutent pas l'action approuvée; les 10 agents sont déclarés mais l'orchestrateur sélectionne essentiellement un seul agent; le RAG est lexical et non vectoriel. Je ne les déclare donc pas « réels » ou terminés sans implémentation et tests d'intégration vérifiables.

La correction APK seule ne constitue pas l'achèvement des 25 améliorations. Une fois les droits write rétablis, elles doivent être livrées par lots avec tests réels (API/auth, stockage, agents, MCP, automatisations, approvals, RAG, fournisseurs multi-API, voix, Android) et statut vérifié par fonctionnalité. Les connexions WhatsApp, Spotify, Firestore et Google OAuth exigent en plus leurs identifiants/comptes externes et ne peuvent pas être activées en inventant des clés.
