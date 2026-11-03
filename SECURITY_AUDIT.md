# AUDIT DE SÉCURITÉ APPROFONDI & PROTOCOLES DE DÉFENSE – CHLOÉ AI
**Système :** CHLOÉ AI v2.0 Enterprise Personal Edition  
**Périmètre :** Samsung Galaxy S24, API Node.js / Express, Gemini Multi-Agent Core  
**Référence propriétaire :** `chloeassistance1@gmail.com`  

---

## 1. MODÈLE DE CONTRÔLE D'ACCÈS À 3 NIVEAUX (RBAC)

CHLOÉ AI applique un principe de sécurité zero-trust basé sur la séparation stricte des privilèges :

```
┌──────────────────────────────────────────────────────────────┐
│                  NIVEAU 1 : CONSULTATION                     │
│  - Lecture seule (Mémoires, Documents, Calendrier, Agenda)    │
│  - Réponses informatives et questions conversationnelles     │
│  - Autorisation implicite sans effet de bord                 │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                   NIVEAU 2 : PRÉPARATION                     │
│  - Rédaction de brouillons d'emails (Gmail Drafts)           │
│  - Simulation d'ajout d'événements et planification          │
│  - Génération de code et préparation de scripts sans envoi   │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                    NIVEAU 3 : EXÉCUTION                      │
│  - Envoi définitif d'email ou message WhatsApp               │
│  - Suppression de mémoires, de documents ou purge de compte  │
│  - Modification du calendrier ou exécution d'automatisations │
│  - EXIGE OBLIGATOIREMENT UNE VALIDATION EXPLICITE DANS L'UI  │
│  - Durée de vie (TTL) : 15 MINUTES avec SIGNATURE SHA-256    │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. PREUVE DU CLOISONNEMENT STRICT MULTI-UTILISATEURS

Toutes les opérations de base de données exigent désormais le paramètre `userId`. Aucun identifiant utilisateur ne peut accéder, lire ou modifier les enregistrements appartenant à un autre compte.

### Protocole de test d'intrusion automatisé (Test 15) :
1. Le propriétaire légitime (`chloeassistance1@gmail.com`, `user_owner_default`) stocke une mémoire sensible intitulée `"Secret Personnel Propriétaire"`.
2. Un utilisateur d'attaque non autorisé (`user_intruder_hacker_test`) tente d'énumérer les mémoires via `db.getMemories(intruderId)`.
3. **Résultat :** 0 enregistrement renvoyé pour l'intrus. Zéro fuite de données (Fuite = NON).
4. La barrière est également appliquée aux documents, conversations, journaux et automatisations.

---

## 3. PROTECTION ANTI-INJECTION DE PROMPT (SHIELD)

L'**Agent Sécurité** inspecte chaque message utilisateur en amont de son injection dans l'orchestrateur.

### Motifs neutralisés en temps réel :
- Directives d'altération : `ignore all previous instructions`, `forget your rules`, `system prompt override`.
- Tentatives d'extraction de secrets : `reveal your api key`, `show me your system prompt`, `what is your secret key`.
- Rôle malveillant : `dan mode`, `jailbreak`, `act as an unrestricted ai`.

Lorsqu'une tentative est détectée, le bouclier renvoie immédiatement un refus courtois et consigne l'événement dans le journal d'audit de sécurité avec le statut `warning`.

---

## 4. DÉFENSE ANTI-SSRF (SERVER-SIDE REQUEST FORGERY)

Le connecteur `custom_api` permettant de se relier à des APIs REST personnalisées est protégé par la fonction `db.isUrlSafeFromSSRF(url)`.

### Adresses formellement interdites et rejetées :
- Hôtes locaux : `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`.
- Réseau de métadonnées Cloud : `169.254.169.254` (blocage des vols de tokens AWS / GCP metadata).
- Sous-réseaux privés internes (RFC 1918) :
  - `10.0.0.0/8`
  - `172.16.0.0/12`
  - `192.168.0.0/16`
- Protocoles non sécurisés : Seul `https:` (et `http:` sur des noms de domaine publics valides) sont tolérés.

---

## 5. SÉCURISATION DES VALIDATIONS DE NIVEAU 3 (TTL & ANTI-REJEU)

Toute demande nécessitant l'intervention humaine (envoi d'email, suppression) génère une structure `PendingApproval` :
- **Horodatage d'expiration :** Fixé rigoureusement à $T + 15\text{ minutes}$.
- **Signature d'intégrité :** `SHA-256(id + userId + action + expiresAt + SECRET_SALT)`.
- **Validation :** Toute tentative de résolution après l'expiration ou avec une signature corrompue est rejetée avec code HTTP 400.

---

## 6. PROTECTION DES SECRETS & VARIABLES D'ENVIRONNEMENT

- Aucune clé d'API (`GEMINI_API_KEY`, tokens Google, clés Firebase) n'est jamais exposée dans le bundle client, dans le DOM ou dans les réponses d'API REST.
- Les requêtes frontend passent exclusivement par les routes proxy sécurisées `/api/*`.
- L'audit `db.getSettings()` prouve que les paramètres renvoyés au navigateur sont exempts de toute clé confidentielle.

---

## 7. CONFORMITÉ RGPD & GOUVERNANCE DES DONNÉES

1. **Droit d'accès et portabilité :** L'endpoint `/api/export` génère un export JSON exhaustif de l'ensemble des données du compte (profil, mémoires, documents, automatisations, historique de discussions).
2. **Droit à l'effacement (Droit à l'oubli) :** L'utilisateur peut supprimer n'importe quel souvenir individuellement, ou purger l'intégralité de son compte via `/api/account/wipe` après confirmation Niveau 3.
