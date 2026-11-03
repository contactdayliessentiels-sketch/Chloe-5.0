# FEUILLE DE ROUTE STRATÉGIQUE (ROADMAP) – CHLOÉ AI
**Version courante :** 2.0.0 (Production-Ready)  
**Direction technique :** Évolutivité, Intégrations Natives et Voice Streaming  

---

## PHASE 1 : EXPÉRIENCE VOCALE TEMPS RÉEL (COURT TERME)
- [ ] **Streaming Gemini Live API bidirectionnel :**
  - Remplacement de la synthèse SpeechSynthesis par le modèle audio natif `gemini-3.8-live` ou `gemini-3.8-live-extended-thinking`.
  - Streaming WebSocket duplex à latence ultra-faible (<300ms) pour une conversation orale interrompable et spontanée.
  - Détection du souffle, du ton de voix du propriétaire et des émotions.
- [ ] **Détection de mot-clé de réveil ("Hey Chloé") :**
  - Modèle léger embarqué dans le Web Worker / Service Worker Android sans consommation excessive de batterie sur Galaxy S24.

---

## PHASE 2 : EXPANSION DES CONNECTEURS TIERS (MOYEN TERME)
- [ ] **Persistance Cloud Firestore & Synchronisation multi-appareils :**
  - Synchronisation temps réel des mémoires et documents sur Cloud Firestore dès que le projet Firebase externe est activé.
- [ ] **Connecteur WhatsApp Business officiel :**
  - Intégration Meta Cloud API avec webhook vérifié pour recevoir des messages et préparer des réponses automatiques validées sous Niveau 3.
- [ ] **Contrôle Musique Spotify Web Playback SDK :**
  - Intégration du lecteur Spotify embarqué pour lancer des playlists adaptées au travail, au sport ou à la détente.
- [ ] **Intégration Google Agenda approfondie :**
  - Synchronisation bidirectionnelle avec l'application native Google Agenda de Samsung One UI via Google Calendar API.

---

## PHASE 3 : INTÉGRATION SYSTÈME NATIVE ANDROID (SAMSUNG S24)
- [ ] **Encapsulation Android Native / TWA (Trusted Web Activity) :**
  - Packaging de la PWA au format APK / AAB avec signature de clé propriétaire.
  - Publication privée sur Google Play Store ou déploiement direct via adb / téléchargement direct sur Galaxy S24.
- [ ] **Raccourcis One UI & Écran d'accueil :**
  - Widgets Android interactifs pour l'écran d'accueil du Galaxy S24 (accès direct au micro de CHLOÉ et aux briefings du matin).
  - Intégration avec les routines Bixby / Samsung Modes & Routines.

---

## PHASE 4 : INTELLIGENCE AGENTIQUE AVANCÉE
- [ ] **Apprentissage continu des habitudes :**
  - Détection automatique et proactive des motifs d'activité (horaires de réveil, préférences de lecture, personnes fréquentes dans l'agenda) avec demande de consentement d'enregistrement.
- [ ] **Mode Voyage & Localisation :**
  - Adaptation automatique des fuseaux horaires, alertes météo locales et recommandations de transport lors des déplacements.
