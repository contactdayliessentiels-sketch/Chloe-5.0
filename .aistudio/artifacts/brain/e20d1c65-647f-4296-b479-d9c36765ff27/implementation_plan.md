# CHLOÉ AI – Reprise du Dépôt GitHub & Réparation Haute Fidélité de l'Avatar 3D

Plan de reprise intégrale du projet **CHLOÉ AI – Galaxy S24 Edition** à partir du dépôt officiel `https://github.com/contactdayliessentiels-sketch/Chloe-v2.0`. Ce document détaille l'audit complet de l'architecture existante, la création de la branche de travail dédiée, la refonte prioritaire de l'avatar 3D (remplacement des formes géométriques par un rendu 3D hybride ultra-réaliste fidèle au portrait officiel de Chloé, agrandi de 12% et animé avec synchronisation labiale), ainsi que la fiabilisation de l'ensemble des fonctionnalités du système multi-agents et du build Android Capacitor.

---

## Décisions Confirmées & Revue Utilisateur

> [!IMPORTANT]
> **Choix validés lors de la Phase 1 de clarification :**
> - **Rendu de l'Avatar 3D** : Rendu 3D hybride haute fidélité basé sur le portrait officiel (texture haute résolution de Chloé, géométrie déformable à profondeur 3D, éclairage studio PBR dynamique, clignement et visèmes labiaux temps réel synchronisés avec la voix).
> - **Branche Git dédiée** : `fix/avatar-3d-chloe-v2` pour isoler et sécuriser l'ensemble des modifications sans toucher directement à la branche principale.
> - **Cible & Performance** : Optimisation dédiée Samsung Galaxy S24 (processeur Snapdragon 8 Gen 3, rafraîchissement 60/120Hz, cibles tactiles $\ge 44$px, synchronisation Capacitor et gestion du mode hors-ligne PWA).

---

## 1. Vue d'Ensemble & Objectifs

- **Problème résolu** : L'avatar 3D actuel dans `ChloeAvatar.tsx` était un assemblage rudimentaire de primitives géométriques (cylindres et sphères) créant un aspect "figurine déformée" avec des mèches qui masquaient le visage, rompant totalement avec le Portrait Officiel de Chloé. De plus, la taille apparente était trop petite et la session AI Studio précédente a changé de compte.
- **Solution apportée** :
  1. Cloner et importer 100% du code source, de la configuration et des tests du dépôt GitHub existant.
  2. Créer immédiatement la branche de travail `fix/avatar-3d-chloe-v2`.
  3. Reconstruire le studio 3D de Chloé (`ChloeAvatar3D.tsx` et `ChloeAvatar.tsx`) en utilisant un rendu 3D hybride PBR fondé sur son portrait officiel : visage féminin adulte réaliste, yeux marron chauds bien visibles, cheveux bruns ondulés soignés, pull lavande en maille fine, pantalon violet et bottines sombres.
  4. Augmenter la taille apparente de Chloé de 12% dans le champ de la caméra tout en préservant l'intégrité anatomique (vue complète de la tête aux pieds, aucun recadrage tronqué).
  5. Implémenter des animations naturelles : respiration organique du buste, micro-mouvements de tête et regard vivant, clignements d'yeux périodiques et synchronisation labiale temps réel (visèmes bouche ouverte, voyelles et consonnes) synchronisée avec le moteur de synthèse vocale et d'analyse audio.
  6. Auditer et réparer l'ensemble des fonctionnalités existantes (les 10 agents autonomes, le moteur RAG, l'ordonnanceur, les 20 tests d'intégration, les connecteurs d'IA et le build Capacitor Android).

---

## 2. Expérience Utilisateur & Design Visuel

### A. Studio Avatar 3D Haute Fidélité
- **Cadrage & Échelle (+12%)** : La caméra de perspective Three.js est précisément calibrée (FOV 36°, distance 3.9m, pivot vertical $y = 0.05$) pour que Chloé occupe majestueusement le viewport vertical sans couper ni le haut de sa coiffure ni la semelle de ses bottines.
- **Éclairage Studio PBR** :
  - *Lumière clé (Key light)* : Directionnelle douce blanc chaud (3000K, intensité 1.25) sculptant les volumes du visage et la texture du pull lavande.
  - *Lumière de remplissage (Fill light)* : Hémisphérique ciel/sol violet doux (6000K/2800K, intensité 0.7).
  - *Lumière de contour (Rim light)* : Deux spots latéraux pourpre électrique et cyan subtil détachant la silhouette du fond sombre avec élégance.
  - *Ombre de contact* : Disque d'ombre douce au sol sous les bottines pour ancrer fermement Chloé dans l'espace.
- **Animations Vivantes** :
  - *Respiration* : Déformation sinusoïdale continue et fluide de la cage thoracique ($f \approx 0.28\text{ Hz}$).
  - *Regard & Clignement* : Suivi discret du pointeur/doigt tactile avec amortissement exponentiel (`THREE.MathUtils.damp`), et paupières naturelles clignant toutes les 3.6 à 4.2 secondes avec micro-variations.
  - *Synchronisation Labiale (Lip-Sync)* : Cartographie temps réel des phonèmes audio/texte (`speechLipSync.ts`) vers les déformations de bouche (visèmes A, O, E, I, U, bouche ouverte, sourire).

### B. Interface Galaxy S24 & Ergonomie Tactile
- **Contrats One UI 6.1 & Snapdragon 8 Gen 3** :
  - Hitboxes tactiles $\ge 44\text{px}$ sur l'ensemble des boutons de navigation et filtres.
  - Dock de contrôle escamotable en bas d'écran laissant la vue 3D dégagée à 100%.
  - Thème sombre luxueux violet nuit (`#090C19`) avec typographie soignée et sans aucun "slop" visuel (pas de faux scores d'innovation, pas de texte dégradé illisible, pas de pill badges redondants).

---

## 3. Décisions Techniques Clés & Arbitrages

1. **Rendu 3D Hybride vs Modèle Cartoon Primitif** :
   - *Approche retenue* : Utilisation du portrait officiel haute fidélité comme texture maître sur un mesh 3D calibré et subdivisé avec carte de relief/normales, pivot de tête indépendant et superposition dynamique des visèmes/paupières.
   - *Raison* : C'est le seul moyen de garantir une fidélité photographique absolue au portrait officiel sans dépendre d'un modèle GLB générique ou de formes géométriques déformées.
2. **Isolation du Code & Protection du Dépôt** :
   - *Approche retenue* : Création immédiate de la branche `fix/avatar-3d-chloe-v2` dès le clone. Toutes les modifications seront committées sur cette branche.
   - *Raison* : Protection stricte de l'historique et des configurations existantes.
3. **Optimisation Mobile Snapdragon 8 Gen 3** :
   - *Approche retenue* : Réutilisation des buffers géométriques Three.js, rendu à la demande ou boucle cadencée à 60/120 FPS avec ratio de pixels plafonné à 2, limitation du ramasse-miettes (GC) en préallouant les vecteurs et matrices.
   - *Raison* : Évite toute surchauffe ou saccade sur Galaxy S24 tout en offrant une fluidité maximale.

---

## 4. Architecture Technique & Flux de Données

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CHLOÉ AI — GALAXY S24                           │
├────────────────────────────────────────────────────────────────────────┤
│  INTERFACE UTILISATEUR REACT 19 + TAILWIND V4                          │
│  ┌───────────────────────┐ ┌────────────────────────────────────────┐ │
│  │ ChloeAvatar3D (Three) │ │ Navigation & Vues                      │ │
│  │ - PBR Studio Rig      │ │ - ChatView (Multi-Agents)              │ │
│  │ - Regard & Clignement │ │ - AgentsView (10 Agents Autonomes)     │ │
│  │ - Visèmes Lip-Sync    │ │ - ConnectorsView (Gemini, OAuth...)    │ │
│  │ - Respiration & Poses │ │ - MemoryView, Automations, MCP, Tests  │ │
│  └───────────▲───────────┘ └───────────────────▲────────────────────┘ │
│              │                                 │                       │
│  CONTEXTES & SERVICES CLIENTS                  │                       │
│  ┌─────────────────────────────────────────────┴─────────────────────┐ │
│  │ AvatarContext · useAudioLipSync · speechLipSync · api-base        │ │
│  └─────────────────────────────────────────────▲─────────────────────┘ │
├────────────────────────────────────────────────┼───────────────────────┤
│  SERVEUR EXPRESS & CERVEAU MULTI-AGENTS (PORT 3000)                    │
│  ┌─────────────────────────────────────────────┴─────────────────────┐ │
│  │ Cerveau Multi-Agents (10 agents spécialisés)                      │ │
│  │ - chloe_orchestrator · dev_agent · search_agent · comm_agent...   │ │
│  │ Moteur RAG & Fenêtres Chevauchantes (rag.ts)                      │ │
│  │ Ordonnanceur d'Arrière-Plan (scheduler.ts)                        │ │
│  │ Base de données persistante cloisonnée par userId (db.ts)         │ │
│  │ Bouclier Anti-Injection & Passerelle Anti-SSRF                    │ │
│  │ Banc de Tests d'Intégration (tests.ts : 20/20 validés)            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Plan d'Exécution par Phases

- **Phase 1 : Clonage et initialisation de la branche de travail** :
  - Cloner l'intégralité du dépôt `https://github.com/contactdayliessentiels-sketch/Chloe-v2.0` dans l'espace de travail.
  - Créer et basculer sur la branche `fix/avatar-3d-chloe-v2`.
- **Phase 2 : Réparation et sublimation de l'Avatar 3D** :
  - Remplacer le mesh rudimentaire de `ProceduralChloeModel` dans `ChloeAvatar.tsx` / `ChloeAvatar3D.tsx` par le rig 3D hybride haute fidélité basé sur le portrait officiel.
  - Calibrer le cadrage de la caméra pour un agrandissement de +12% sans recadrage ni coupure.
  - Assurer la synchronisation labiale fluide avec `speechLipSync.ts` et `useAudioLipSync.ts`.
- **Phase 3 : Audit & consolidation du système complet** :
  - Vérifier le serveur Express, les routes API `/api/*`, et les 10 agents autonomes.
  - Vérifier la persistance des mémoires et documents (`/data/chloe_store.json`).
  - Vérifier le fonctionnement des connecteurs d'IA (Gemini et configuration des clés).
- **Phase 4 : Tests & Vérification de Compilation** :
  - Exécuter la suite complète de 20 tests (`npm test`).
  - Compiler le frontend via Vite (`npm run build`).
  - Vérifier la synchronisation Capacitor Android (`npx cap sync android`).
  - Valider l'absence totale d'erreurs TypeScript (`tsc --noEmit`).
- **Phase 5 : Rapport Final Documenté** :
  - Fournir la branche, les commits, les fichiers modifiés et les résultats des tests.
