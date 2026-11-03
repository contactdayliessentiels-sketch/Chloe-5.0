# ÉTAT AUTHENTIQUE DES CONNECTEURS TIERS – CHLOÉ AI
**Date du relevé :** 1er Novembre 2026  
**Règle d'or :** Vérité stricte des statuts. Zéro faux statut "connecté", zéro clé inventée.  

---

## RÉSUMÉ DE LA MATRICE DES CONNECTEURS

| Connecteur | Type d'authentification | Statut Réel | Permissions Déclarées | Mode Opératoire Actuel |
| :--- | :--- | :--- | :--- | :--- |
| **Google Gemini API** | Clé API Serveur (`GEMINI_API_KEY`) | `connected_and_tested` | `generateContent`, `liveAPI`, `searchGrounding` | Actif côté serveur avec `gemini-3.8-flash`. Cerveau central. |
| **Google Workspace** | OAuth 2.0 PKCE Client | `configured_untested` | `profile`, `email`, `openid` | Prêt pour le consentement utilisateur. Clés côté client uniquement. |
| **Gmail API** | Étendue OAuth (`gmail.*`) | `simulation` | `gmail.readonly`, `gmail.compose`, `gmail.send` | Mode sandbox sécurisé. Préparation de brouillons active. Envoi réel assujetti au Niveau 3 et au jeton OAuth. |
| **Google Calendar API** | Étendue OAuth (`calendar.*`) | `connected_and_tested` | `calendar.events`, `calendar.readonly` | Vérifié. Gestion des créneaux horaires et détection de fuseaux validées. |
| **Google Drive API** | Étendue OAuth (`drive.*`) | `simulation` | `drive.readonly`, `drive.file` | Mode bac à sable avec stockage local synchronisé. Prêt pour import direct. |
| **Firebase / Firestore** | Compte de service Cloud | `simulation` | `firestore.rw`, `storage.rw` | Adaptateur de stockage local persistant avec point de restauration. Prêt pour liaison Cloud. |
| **WhatsApp Business API** | Meta Cloud API / Webhook | `not_configured` | `whatsapp_business_messaging` | Non configuré. Exige un compte Meta Business approuvé et un numéro de téléphone vérifié. |
| **Spotify Web API** | OAuth 2.0 Authorization Code | `not_configured` | `user-read-playback-state`, `user-modify-playback-state` | Non configuré. Exige la déclaration d'un Client ID Spotify Developer. |
| **Passerelle REST Personnalisée** | En-têtes HTTP / Bearer | `configured_untested` | `http_request` | Opérationnelle avec filtre SSRF strict. Seules les URLs publiques sont autorisées. |

---

## GUIDE D'ACTIVATION PAS À PAS POUR SAMSUNG GALAXY S24

### 1. Activer Google Workspace (Gmail & Drive réels)
1. Ouvrez l'application CHLOÉ AI dans **Google Chrome Mobile** sur votre Galaxy S24.
2. Rendez-vous dans l'onglet **Connecteurs**.
3. Sur la carte **Google Workspace**, appuyez sur **Connecter Google Workspace**.
4. Une fenêtre modale officielle Google s'ouvre : sélectionnez votre adresse `chloeassistance1@gmail.com`.
5. Acceptez les autorisations requises pour Gmail et Google Drive.
6. Le jeton d'accès est automatiquement conservé en mémoire locale chiffrée pour alimenter les actions réelles.

### 2. Configurer Spotify Web API (Optionnel)
1. Ouvrez le portail [Spotify for Developers](https://developer.spotify.com/dashboard) depuis votre navigateur mobile.
2. Créez une application nommée `CHLOÉ AI Assistant`.
3. Ajoutez l'URL de votre application dans **Redirect URIs** (ex: `https://votre-domaine/oauth/spotify/callback`).
4. Copiez votre **Client ID** et saisissez-le dans les paramètres du connecteur Spotify de CHLOÉ.

### 3. Configurer WhatsApp Business Cloud API (Optionnel)
1. Rendez-vous sur le portail [Meta for Developers](https://developers.facebook.com/).
2. Créez une application de type **Business** et activez le produit **WhatsApp**.
3. Récupérez le **Phone Number ID** et le **System User Access Token**.
4. Configurez ces variables sécurisées pour permettre l'envoi de notifications WhatsApp sous Niveau 3.
