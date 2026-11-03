# Vérifications fonctionnelles après application

- [ ] Les quatre cartes Gemini, OpenAI, NVIDIA NIM et OpenRouter sont visibles même si le backend n'est pas encore joignable.
- [ ] Une erreur d'accès à `/api/providers` est affichée explicitement.
- [ ] Modifier le modèle NVIDIA ne change pas le fournisseur actif.
- [ ] Cliquer sur « Activer ce moteur » sans clé est refusé par le serveur.
- [ ] Après avoir configuré `CHLOE_ENCRYPTION_KEY`, enregistrer une clé produit un fichier `data/ai_providers.json` contenant `encryptedKeys`, pas les clés en clair.
- [ ] Sans `CHLOE_ENCRYPTION_KEY`, l'API de sauvegarde renvoie une erreur et ne prétend pas avoir enregistré la clé.
- [ ] Le bouton « Tester le ping » confirme une vraie requête fournisseur.
- [ ] Avec Gemini qui renvoie 429 ou 5xx et au moins une clé externe valide, le serveur utilise l'API externe et journalise le fournisseur réellement utilisé.
- [ ] Avec un fournisseur qui renvoie 401/403, le serveur remonte l'erreur d'identifiants au lieu de masquer le problème.
- [ ] En mode avatar latéral, l'avatar reste visible sur écran mobile ; sur grand écran il apparaît dans le panneau latéral.
- [ ] L'API fonctionne dans l'APK avec `VITE_API_BASE_URL` configurée et CORS configuré sur le backend.
- [ ] `npm run lint`, `npm test`, `npm run build`, `npx cap sync android` et `gradlew assembleDebug` réussissent.
