# CHLOÉ AI — paquet de corrections source

Ce paquet contient du vrai code source basé sur les fichiers actuellement accessibles du dépôt `chloeassistance1/Chloe-final-version` (branche `main`, lecture seule côté connecteur). Il n'est pas un APK et il n'a pas été compilé dans cet environnement.

## Corrections incluses

1. **Routage des fournisseurs** : `generateChatCompletion` reçoit désormais explicitement le fournisseur demandé. Le secours OpenAI → NVIDIA NIM → OpenRouter essaie réellement le fournisseur suivant en cas de quota (429), timeout, erreur réseau ou erreur serveur (5xx). Les erreurs d'authentification 401/403 ne sont pas masquées par une autre clé.
2. **Séparation fournisseur/modèle** : changer le modèle d'une carte n'active plus ce fournisseur. Seul le bouton « Activer ce moteur » change le fournisseur actif.
3. **Clés API** : le stockage serveur utilise AES-256-GCM, avec un secret serveur `CHLOE_ENCRYPTION_KEY` de 32 octets. La sauvegarde ne renvoie plus « succès » si l'écriture ou le chiffrement échoue. Les anciennes données JSON en clair sont reconnues et migrées automatiquement lorsqu'un secret valide est présent.
4. **Paramètres visibles** : les quatre cartes fournisseur restent affichées même si l'API ne répond pas ; les erreurs de connexion et de sauvegarde sont montrées au lieu d'être ignorées. Le badge mensonger « En ligne » est remplacé par « Moteur sélectionné ».
5. **Backend distant** : `VITE_API_BASE_URL` permet de diriger toutes les requêtes `/api/...` vers le serveur HTTPS hébergé. CORS est limité à une liste d'origines `CHLOE_ALLOWED_ORIGINS`.
6. **Avatar** : grande taille et meilleure visibilité par défaut, dimensions `dvh`, avatar affiché sur mobile même lorsque le mode latéral est choisi.
7. **Android** : alignement des anciens modules Kotlin stdlib/jdk7/jdk8 sur la version 1.8.22, à la suite de l'erreur `checkDebugDuplicateClasses` observée.
8. **Hygiène Git** : ajout des fichiers de données et de configuration locale au `.gitignore`, et retrait de certains fichiers privés de l'index Git sans supprimer les copies locales.

## Appliquer les corrections

Fais d'abord une sauvegarde/branche de ton dépôt. Extrais le ZIP. Depuis un terminal où Git et Python 3 sont installés, exécute :

```bash
python patches/apply_patch.py /chemin/vers/Chloe-final-version
```

Sur Windows, exemple :
```powershell
py .\patches\apply_patch.py "C:\Users\TON_NOM\Documents\Chloe-final-version"
```

Le script vérifie les blocs de code attendus avant d'écrire les fichiers. S'il trouve une version différente, il s'arrête et indique l'ancre qui ne correspond pas. Il ne faut pas forcer les remplacements à l'aveugle.

Ensuite, contrôle les changements :
```bash
git status --short
git diff --check
git diff
```

Puis lance les validations depuis la racine du dépôt :
```bash
npm ci
npm run lint
npm test
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

Sur Windows, dans `android`, utiliser `gradlew.bat assembleDebug`.

## Configuration obligatoire du backend

L'application Android est un client Capacitor. Elle n'embarque pas le serveur Node/Express. Pour que les cartes fournisseurs, les conversations, les mémoires et les autres routes `/api` fonctionnent dans l'APK, le backend `server.ts` doit être déployé sur un hébergement HTTPS accessible.

1. Sur le serveur backend, crée un secret de chiffrement :
```bash
openssl rand -hex 32
```
2. Enregistre la sortie dans l'environnement serveur sous `CHLOE_ENCRYPTION_KEY`. Ne mets jamais ce secret dans le dépôt, dans une variable `VITE_*`, dans l'APK ou dans le chat.
3. Définis `CHLOE_ALLOWED_ORIGINS` avec les origines exactes qui utilisent le backend, séparées par des virgules. Pour le WebView Capacitor Android, ajoute `https://localhost` ; ajoute aussi l'origine du site web si tu en as un.
4. Dans GitHub Actions, configure une variable de dépôt `VITE_API_BASE_URL` avec l'adresse HTTPS du backend, par exemple `https://api.ton-domaine.tld`. Il faut exposer cette variable à l'étape `npm run build` du workflow :
```yaml
env:
  VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
```
`VITE_API_BASE_URL` est une adresse publique, pas une clé secrète.

## Migration des anciennes clés

Si `data/ai_providers.json` contient encore des clés en clair, le gestionnaire les lira pour compatibilité et les réécrira en AES-256-GCM au démarrage **uniquement si** `CHLOE_ENCRYPTION_KEY` est déjà configurée. Sans ce secret, les nouvelles sauvegardes sont refusées. Configure le secret avant d'utiliser l'écran des fournisseurs. Si tu soupçonnes que des clés ont été exposées dans l'historique Git public, révoque-les et crée-en de nouvelles : retirer un fichier de l'index ne purge pas les anciens commits.

## Ce qui n'est pas inclus / pas encore validé

- Pas de partage d'écran natif Android `MediaProjection` ni de fenêtre flottante par-dessus WhatsApp/Chrome. Ils nécessitent un plugin natif et un flux de consentement Android dédié.
- Pas encore de vraie authentification JWT ni de remplacement complet du `x-user-id` actuel. Ne considère pas le backend multi-utilisateur comme sécurisé pour une mise en production publique avant cette correction.
- Pas d'orchestrateur multi-agent complet, d'exécution MCP réelle ou d'automatisations externes dans ce lot.
- Le nettoyage Git retire les copies locales ciblées de l'index, mais n'efface pas leur contenu des anciens commits. Si ces données sont sensibles, révoque les secrets et prévois un nettoyage d'historique contrôlé.
- Les noms de modèles proposés par le dépôt n'ont pas tous été validés auprès des API des fournisseurs.
- Les corrections n'ont pas encore été compilées contre le dépôt complet et aucun APK n'a été produit ici. Les commandes ci-dessus sont les validations à exécuter après application.

Ne marque pas les 25 critères comme terminés avant que lint, tests, build et tests réels sur le Samsung S24 soient passés.
