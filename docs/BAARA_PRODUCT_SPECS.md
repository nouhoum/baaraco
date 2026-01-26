# Baara — Product Specifications

> **Document de référence pour l'implémentation**
> Version: 1.0 | Date: 2025-01-26

---

## Table des matières

1. [Vision et Mission](#1-vision-et-mission)
2. [Principes fondateurs](#2-principes-fondateurs)
3. [Le Framework Baara](#3-le-framework-baara)
4. [Concepts métier](#4-concepts-métier)
5. [User Flows](#5-user-flows)
6. [Phase 1 — Milestones et Specs](#6-phase-1--milestones-et-specs)
7. [Roadmap future](#7-roadmap-future)

---

## 1. Vision et Mission

### Notre croyance fondamentale

> **Le recrutement est cassé parce qu'il mesure les mauvaises choses.**

Depuis 50 ans, le recrutement n'a pas changé : CV → Screening call → Entretiens → Décision au feeling. On mesure la capacité à se vendre, pas la capacité à faire le travail.

L'IA change tout. Pour la première fois, on peut collecter, analyser et comparer des **preuves réelles de compétence** à grande échelle, instantanément, objectivement.

### Le secret Baara (au sens Peter Thiel)

> **Le meilleur prédicteur de performance future n'est ni le CV, ni l'entretien, ni les références. C'est l'observation directe du travail — passé ou simulé. L'IA permet enfin de collecter et analyser ces preuves à scale.**

### Notre mission

> **Éliminer l'incertitude des décisions de recrutement en remplaçant les opinions par des preuves.**

### La promesse 10x

| Métrique                 | Recrutement classique | Baara     |
| ------------------------ | --------------------- | --------- |
| Time-to-shortlist        | 2-3 semaines          | 3-5 jours |
| Temps recruteur par hire | 50-60h                | 10-15h    |
| Qualité prédictive       | ~50% (hasard)         | ~75%+     |
| Biais                    | Élevés                | Minimisés |
| Traçabilité              | Aucune                | Complète  |

---

## 2. Principes fondateurs

### 2.1 Evidence over narrative

On ne demande pas au candidat de raconter ce qu'il sait faire. On lui demande de le **montrer**, ou on va **chercher les preuves** là où elles existent.

### 2.2 Objectivité over gut feeling

Chaque évaluation est basée sur des **critères explicites**, un **scoring transparent**, des **preuves citables**. Pas de "je le sens bien".

### 2.3 Équité by design

Mêmes critères pour tous. Pas de biais sur l'école, le genre, l'origine, l'apparence. On juge le travail, pas la personne.

### 2.4 Respect du temps

- **Candidat** : 60 minutes max, fractionnable, feedback utile même si rejeté
- **Recruteur** : Décision possible en heures, pas en semaines

### 2.5 L'IA augmente, l'humain décide

L'IA collecte, analyse, synthétise, recommande. L'humain valide, contextualise, décide. Jamais d'automatisation totale sur une décision humaine aussi importante.

---

## 3. Le Framework Baara

### Evidence-Based Hiring en 4 étapes

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│   │  DEFINE  │ →  │ COLLECT  │ →  │ EVALUATE │ →  │  DECIDE  │          │
│   │          │    │          │    │          │    │          │          │
│   │ Outcome  │    │ Work     │    │  Proof   │    │ Decision │          │
│   │  Brief   │    │ Sample   │    │ Profile  │    │   Memo   │          │
│   │    +     │    │    +     │    │    +     │    │          │          │
│   │Scorecard │    │ Sources  │    │ Compare  │    │          │          │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘          │
│                                                                          │
│       ↓                ↓                ↓               ↓                │
│                                                                          │
│   "Qu'est-ce      "Montrez-moi"     "Voici ce       "Hire/No hire       │
│    qu'on                             que je sais      avec preuves"      │
│    cherche ?"                        de vous"                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.1 DEFINE — Savoir ce qu'on cherche

**Problème** : La plupart des recrutements échouent parce qu'on ne sait pas vraiment ce qu'on cherche.

**Solution** :

- **Outcome Brief** : Définir le problème à résoudre, le contexte, les outcomes attendus
- **Scorecard** : 5-7 critères mesurables avec signaux positifs/négatifs et red flags

### 3.2 COLLECT — Rassembler les preuves

**Problème** : On demande aux candidats de se décrire (CV, entretien). C'est du déclaratif.

**Solution** :

- **Work Sample** : Exercice court (30-60 min) simulant le travail réel
- **Sources externes** (Phase 2+) : GitHub, articles, références

### 3.3 EVALUATE — Analyser et comparer

**Problème** : L'évaluation est subjective, incohérente, biaisée.

**Solution** :

- **Evaluation Engine** : IA analyse les réponses vs le Scorecard
- **Proof Profile** : Synthèse structurée avec scores, preuves, zones d'ombre

### 3.4 DECIDE — Décider avec confiance

**Problème** : Décisions au feeling, sans trace, regrets fréquents.

**Solution** :

- **Interview Kit** : Questions ciblées sur les zones d'ombre
- **Decision Memo** : Document structuré justifiant la décision

---

## 4. Concepts métier

### 4.1 Entités principales

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Organization                                                           │
│       │                                                                 │
│       ├── Users (recruiters, admins)                                    │
│       │                                                                 │
│       └── Jobs                                                          │
│             │                                                           │
│             ├── Scorecard (1:1)                                         │
│             │                                                           │
│             ├── WorkSample (1:1)                                        │
│             │                                                           │
│             └── Candidates (invites)                                    │
│                   │                                                     │
│                   ├── WorkSampleAttempt                                 │
│                   │         │                                           │
│                   │         └── Evaluation                              │
│                   │                   │                                 │
│                   │                   └── ProofProfile                  │
│                   │                                                     │
│                   ├── InterviewKit                                      │
│                   │                                                     │
│                   └── DecisionMemo                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Job

Un poste à pourvoir.

| Champ              | Type      | Description                               |
| ------------------ | --------- | ----------------------------------------- |
| id                 | UUID      | Identifiant unique                        |
| org_id             | UUID      | Organisation propriétaire                 |
| title              | string    | Titre du poste                            |
| team               | string    | Équipe                                    |
| location_type      | enum      | remote / hybrid / onsite                  |
| location_city      | string    | Ville (si applicable)                     |
| contract_type      | enum      | cdi / cdd / freelance                     |
| seniority          | enum      | junior / mid / senior / staff / principal |
| stack              | string[]  | Technologies requises                     |
| team_size          | string    | Taille de l'équipe actuelle               |
| manager_info       | string    | Info sur le manager                       |
| business_context   | text      | Contexte business                         |
| main_problem       | text      | Problème principal à résoudre             |
| expected_outcomes  | text[]    | Outcomes attendus (3-5)                   |
| success_looks_like | text      | Définition du succès                      |
| failure_looks_like | text      | Définition de l'échec                     |
| salary_min         | int       | Salaire min (optionnel)                   |
| salary_max         | int       | Salaire max (optionnel)                   |
| start_date         | date      | Date de début souhaitée                   |
| urgency            | enum      | immediate / 1-2months / flexible          |
| status             | enum      | draft / active / paused / closed          |
| created_by         | UUID      | Créateur                                  |
| created_at         | timestamp | Création                                  |
| updated_at         | timestamp | Mise à jour                               |

### 4.3 Scorecard

Les critères d'évaluation pour un poste.

| Champ         | Type      | Description          |
| ------------- | --------- | -------------------- |
| id            | UUID      | Identifiant unique   |
| job_id        | UUID      | Job associé          |
| criteria      | JSONB     | Liste des critères   |
| generated_at  | timestamp | Date de génération   |
| model_version | string    | Version du modèle IA |

**Structure d'un critère** :

```json
{
  "id": "uuid",
  "name": "Debugging systématique",
  "description": "Capacité à investiguer méthodiquement les problèmes",
  "weight": "critical",
  "positive_signals": [
    "Approche méthodique (logs → metrics → traces)",
    "Formule des hypothèses avant d'agir"
  ],
  "negative_signals": ["Random guessing", "Ne documente pas ses trouvailles"],
  "red_flags": [
    "Blâme les autres sans investiguer",
    "Ne comprend pas les concepts de base"
  ]
}
```

**Valeurs de weight** : `critical` | `important` | `nice_to_have`

### 4.4 WorkSample

L'exercice à compléter par les candidats.

| Champ                        | Type      | Description                         |
| ---------------------------- | --------- | ----------------------------------- |
| id                           | UUID      | Identifiant unique                  |
| job_id                       | UUID      | Job associé                         |
| sections                     | JSONB     | Sections/scénarios                  |
| total_estimated_time_minutes | int       | Durée totale estimée                |
| intro_message                | text      | Message d'introduction              |
| rules                        | JSONB     | Règles (ce qui est permis/interdit) |
| generated_at                 | timestamp | Date de génération                  |
| model_version                | string    | Version du modèle IA                |

**Structure d'une section** :

```json
{
  "id": "uuid",
  "title": "Investigation de performance",
  "type": "scenario",
  "estimated_time_minutes": 30,
  "scenario": "Un service Go connaît des pics de latence P95...",
  "instructions": "Décrivez votre approche étape par étape...",
  "evaluation_rubric": [
    {
      "criterion_id": "uuid",
      "criterion_name": "Debugging systématique",
      "what_to_look_for": "Approche méthodique, pas de random guessing"
    }
  ]
}
```

### 4.5 WorkSampleAttempt

Une tentative de Work Sample par un candidat.

| Champ          | Type      | Description                                |
| -------------- | --------- | ------------------------------------------ |
| id             | UUID      | Identifiant unique                         |
| candidate_id   | UUID      | Candidat                                   |
| job_id         | UUID      | Job                                        |
| work_sample_id | UUID      | Work Sample                                |
| status         | enum      | draft / in_progress / submitted / reviewed |
| answers        | JSONB     | Réponses par section                       |
| progress       | int       | Pourcentage de complétion (0-100)          |
| started_at     | timestamp | Début                                      |
| last_saved_at  | timestamp | Dernière sauvegarde                        |
| submitted_at   | timestamp | Soumission                                 |

**Structure des answers** :

```json
{
  "section_uuid_1": {
    "text": "Ma réponse...",
    "updated_at": "2025-01-26T10:30:00Z"
  }
}
```

### 4.6 Evaluation

L'évaluation IA d'un Work Sample.

| Champ                    | Type      | Description                           |
| ------------------------ | --------- | ------------------------------------- |
| id                       | UUID      | Identifiant unique                    |
| attempt_id               | UUID      | Attempt évalué                        |
| overall_score            | int       | Score global (0-100)                  |
| criteria_evaluations     | JSONB     | Évaluation par critère                |
| strengths                | JSONB     | Points forts identifiés               |
| areas_to_explore         | JSONB     | Zones d'ombre                         |
| red_flags                | JSONB     | Red flags détectés                    |
| recommendation           | enum      | proceed_to_interview / maybe / reject |
| recommendation_reasoning | text      | Justification                         |
| evaluated_at             | timestamp | Date d'évaluation                     |
| model_version            | string    | Version du modèle IA                  |

**Structure d'une évaluation de critère** :

```json
{
  "criterion_id": "uuid",
  "criterion_name": "Debugging systématique",
  "criterion_weight": "critical",
  "score": 85,
  "confidence": "high",
  "evidence": [
    {
      "type": "positive",
      "signal": "Approche méthodique en étapes",
      "quote": "Je commencerais par analyser...",
      "section_id": "uuid"
    }
  ],
  "gaps": ["N'a pas mentionné le tracing distribué"],
  "red_flags_detected": []
}
```

**Valeurs de confidence** : `high` | `medium` | `low`

**Valeurs de recommendation** : `proceed_to_interview` | `maybe` | `reject`

### 4.7 ProofProfile

Le profil de preuves d'un candidat, vue synthétique pour le recruteur.

| Champ            | Type      | Description                                |
| ---------------- | --------- | ------------------------------------------ |
| id               | UUID      | Identifiant unique                         |
| candidate_id     | UUID      | Candidat                                   |
| job_id           | UUID      | Job                                        |
| attempt_id       | UUID      | Attempt source                             |
| evaluation_id    | UUID      | Evaluation source                          |
| summary          | JSONB     | Résumé (score, percentile, recommendation) |
| criteria_summary | JSONB     | Résumé par critère                         |
| strengths        | JSONB     | Forces avec preuves                        |
| areas_to_explore | JSONB     | Zones à explorer en entretien              |
| red_flags        | JSONB     | Red flags                                  |
| interview_focus  | JSONB     | Points à explorer en entretien             |
| status           | enum      | pending / complete / error                 |
| generated_at     | timestamp | Date de génération                         |

**Structure du summary** :

```json
{
  "overall_score": 82,
  "percentile": 75,
  "recommendation": "proceed_to_interview",
  "one_liner": "Solide sur les fondamentaux, à explorer sur l'expérience production"
}
```

**Structure d'un criteria_summary item** :

```json
{
  "criterion_id": "uuid",
  "name": "Debugging systématique",
  "score": 85,
  "weight": "critical",
  "status": "strong",
  "headline": "Approche méthodique et structurée"
}
```

**Valeurs de status (critère)** : `strong` | `good` | `acceptable` | `weak`

### 4.8 InterviewKit

Le kit de préparation pour l'entretien.

| Champ                  | Type      | Description             |
| ---------------------- | --------- | ----------------------- |
| id                     | UUID      | Identifiant unique      |
| proof_profile_id       | UUID      | Proof Profile source    |
| candidate_id           | UUID      | Candidat                |
| job_id                 | UUID      | Job                     |
| total_duration_minutes | int       | Durée recommandée       |
| sections               | JSONB     | Sections avec questions |
| debrief_template       | JSONB     | Template de debrief     |
| generated_at           | timestamp | Date de génération      |

**Structure d'une section** :

```json
{
  "title": "Validation des zones d'ombre",
  "duration_minutes": 20,
  "questions": [
    {
      "question": "Avez-vous de l'expérience avec OpenTelemetry ?",
      "context": "Zone d'ombre : Tracing distribué non mentionné",
      "positive_signals": ["Décrit une implémentation concrète"],
      "negative_signals": ["Reste vague ou théorique"],
      "follow_up": "Pouvez-vous me donner un exemple ?"
    }
  ]
}
```

### 4.9 DecisionMemo

Le document de décision finale.

| Champ               | Type      | Description                      |
| ------------------- | --------- | -------------------------------- |
| id                  | UUID      | Identifiant unique               |
| candidate_id        | UUID      | Candidat                         |
| job_id              | UUID      | Job                              |
| proof_profile_id    | UUID      | Proof Profile                    |
| decision            | enum      | hire / no_hire / need_more_info  |
| criteria_updates    | JSONB     | Scores mis à jour post-entretien |
| confirmed_strengths | JSONB     | Forces confirmées                |
| identified_risks    | JSONB     | Risques identifiés               |
| justification       | text      | Justification de la décision     |
| next_steps          | JSONB     | Prochaines étapes                |
| decided_by          | UUID      | Décisionnaire                    |
| decided_at          | timestamp | Date de décision                 |

### 4.10 Candidate Status (dans le contexte d'un job)

| Status      | Description                               |
| ----------- | ----------------------------------------- |
| invited     | Invitation envoyée                        |
| in_progress | Work Sample en cours                      |
| submitted   | Work Sample soumis, évaluation en attente |
| evaluated   | Proof Profile disponible                  |
| shortlisted | Sélectionné pour entretien                |
| rejected    | Non retenu                                |
| hired       | Embauché                                  |

### 4.11 FormatRequest

Demande de format alternatif par un candidat.

| Champ            | Type      | Description                               |
| ---------------- | --------- | ----------------------------------------- |
| id               | UUID      | Identifiant unique                        |
| attempt_id       | UUID      | Attempt concerné                          |
| candidate_id     | UUID      | Candidat                                  |
| reason           | string    | Raison de la demande                      |
| preferred_format | string    | Format souhaité                           |
| comment          | text      | Commentaire optionnel                     |
| status           | enum      | pending / approved / rejected / completed |
| response_message | text      | Réponse au candidat                       |
| responded_by     | UUID      | Qui a répondu                             |
| responded_at     | timestamp | Date de réponse                           |

---

## 5. User Flows

### 5.1 Flow Recruteur — Créer un poste

```
1. Recruteur va sur /app/jobs/new
2. Remplit l'Outcome Brief :
   - Infos de base (titre, équipe, stack, seniority)
   - Contexte (business context, taille équipe)
   - Outcomes (problème à résoudre, outcomes attendus, succès/échec)
3. Clique sur "Générer les critères"
4. L'IA génère le Scorecard (5-7 critères)
5. Recruteur ajuste les critères si besoin
6. Clique sur "Générer le Work Sample"
7. L'IA génère les scénarios
8. Recruteur ajuste si besoin
9. Clique sur "Publier le poste"
10. Le poste est actif, prêt à recevoir des candidats
```

### 5.2 Flow Recruteur — Inviter des candidats

```
1. Recruteur va sur /app/jobs/:id/invite
2. Entre les emails des candidats (ou upload CSV)
3. Personnalise le message d'invitation (optionnel)
4. Clique sur "Envoyer les invitations"
5. Chaque candidat reçoit un email avec lien vers le Work Sample
```

### 5.3 Flow Candidat — Compléter le Work Sample

```
1. Candidat reçoit l'email d'invitation
2. Clique sur le lien → /app/work-sample
3. Voit l'introduction et les règles
4. Complète chaque section :
   - Lit le scénario
   - Rédige sa réponse
   - Peut sauvegarder et continuer plus tard
5. Quand prêt, clique sur "Soumettre"
6. Confirmation : "Votre Work Sample a été soumis"
7. Redirect vers /app/proof-profile (en attente de génération)
```

### 5.4 Flow Système — Évaluation et génération du Proof Profile

```
1. Candidat soumet son Work Sample
2. Job queue : evaluate_work_sample
3. Evaluation Engine :
   - Charge le Scorecard et les réponses
   - Analyse chaque réponse vs chaque critère
   - Génère scores, preuves, zones d'ombre
4. Job queue : generate_proof_profile
5. Proof Profile Generator :
   - Synthétise l'évaluation
   - Calcule le percentile
   - Génère les suggestions pour l'entretien
6. Notifications :
   - Email au candidat : "Votre Proof Profile est prêt"
   - Notification au recruteur : "Nouveau candidat évalué"
```

### 5.5 Flow Recruteur — Évaluer les candidats

```
1. Recruteur va sur /app/jobs/:id/candidates
2. Voit la liste des candidats avec scores
3. Peut filtrer (par score, par statut)
4. Peut trier (par score, par date)
5. Clique sur un candidat → voir le Proof Profile
6. Analyse le profil :
   - Score global et par critère
   - Preuves et citations
   - Zones d'ombre
7. Décide : "Shortlister" ou "Rejeter"
```

### 5.6 Flow Recruteur — Conduire l'entretien

```
1. Recruteur shortliste un candidat
2. Planifie l'entretien
3. Avant l'entretien, va sur /app/.../interview-kit
4. Voit les questions préparées basées sur le Proof Profile
5. Pendant l'entretien :
   - Pose les questions suggérées
   - Prend des notes
6. Après l'entretien, va sur /app/.../decision
7. Remplit le Decision Memo :
   - Décision (hire/no hire)
   - Mise à jour des scores post-entretien
   - Justification
8. Soumet la décision
```

---

## 6. Phase 1 — Milestones et Specs

### Vue d'ensemble

| Milestone    | Durée      | Livrables                                                            |
| ------------ | ---------- | -------------------------------------------------------------------- |
| 1.1 Define   | 2 semaines | Outcome Brief, Scorecard Generator, Work Sample Generator            |
| 1.2 Collect  | 2 semaines | Interface candidat Work Sample, API attempts                         |
| 1.3 Evaluate | 2 semaines | Evaluation Engine, Proof Profile Generator                           |
| 1.4 Decide   | 2 semaines | Dashboard recruteur, Vue Proof Profile, Interview Kit, Decision Memo |

---

### Milestone 1.1 : Define

#### 1.1.1 — Outcome Brief (formulaire)

**Route** : `/app/jobs/new` et `/app/jobs/:id/edit`

**Accès** : Recruteurs

**Structure du formulaire** :

**Section 1 : Le poste**

- `title` (text, requis) — Ex: "Senior Backend Engineer"
- `team` (text, requis) — Ex: "Payments"
- `location_type` (select, requis) — Remote / Hybride / Sur site
- `location_city` (text, si onsite/hybride)
- `contract_type` (select, requis) — CDI / CDD / Freelance
- `seniority` (select, requis) — Junior / Mid / Senior / Staff / Principal

**Section 2 : Le contexte**

- `stack` (multi-select + text, requis) — Go, Python, Kubernetes, etc.
- `team_size` (select, requis) — 1-3 / 4-8 / 9-15 / 16+
- `manager_info` (text) — Nom et rôle du manager
- `business_context` (textarea, requis) — "Nous lançons un nouveau produit..."

**Section 3 : Les outcomes**

- `main_problem` (textarea, requis) — "Quel est LE problème à résoudre ?"
- `expected_outcomes` (liste de textarea, requis, 3-5 items) — Résultats attendus
- `success_looks_like` (textarea, requis) — Définition du succès
- `failure_looks_like` (textarea) — Définition de l'échec

**Section 4 : Critères suggérés**

- Après avoir rempli les sections 1-3, bouton "Générer les critères"
- Affiche les critères générés par l'IA
- Chaque critère est éditable (nom, description, poids)
- Possibilité d'ajouter/supprimer des critères

**Section 5 : Logistique**

- `salary_min` et `salary_max` (number) — Optionnel
- `start_date` (date) — Date de début souhaitée
- `urgency` (select) — Immédiat / 1-2 mois / Flexible

**Comportement** :

- Auto-save toutes les 30 secondes
- Validation avant publication
- États : draft → active → paused → closed

**Endpoints** :

```
POST /api/v1/jobs                         → Créer (status: draft)
GET /api/v1/jobs/:id                      → Récupérer
PATCH /api/v1/jobs/:id                    → Mettre à jour
POST /api/v1/jobs/:id/generate-scorecard  → Générer les critères
POST /api/v1/jobs/:id/publish             → Publier (status: active)
```

---

#### 1.1.2 — Scorecard Generator

**Service** : `ScorecardGenerator` (ou selon conventions existantes)

**Trigger** : POST /api/v1/jobs/:id/generate-scorecard

**Input** : L'Outcome Brief complet (job data)

**Output** : Scorecard avec 5-7 critères

**Prompt IA** — Le prompt doit :

1. Analyser l'Outcome Brief (contexte, problème, outcomes)
2. Identifier les compétences clés pour réussir
3. Prioriser selon ce qui est critique
4. Pour chaque critère, générer :
   - Nom clair et concis
   - Description
   - Poids (critical / important / nice_to_have)
   - 2-4 signaux positifs (observables, concrets)
   - 2-3 signaux négatifs
   - 1-2 red flags
5. Limiter à 5-7 critères maximum

**Stockage** : Table `scorecards`

**Édition** : Le recruteur peut modifier après génération via PATCH /api/v1/jobs/:id/scorecard

---

#### 1.1.3 — Work Sample Generator

**Service** : `WorkSampleGenerator` (ou selon conventions existantes)

**Trigger** : POST /api/v1/jobs/:id/generate-work-sample

**Prérequis** : Un Scorecard doit exister pour le job

**Input** : Job + Scorecard

**Output** : Work Sample avec 1-3 sections

**Prompt IA** — Le prompt doit :

1. Analyser le Scorecard et le contexte du poste
2. Créer 1-3 scénarios réalistes
3. Chaque scénario doit :
   - Simuler un problème réel du poste
   - Permettre d'évaluer 2-3 critères du Scorecard
   - Être faisable en 20-35 minutes
   - Avoir des instructions claires
   - Inclure le rubric (ce qu'on évalue)
4. Temps total ≤ 60 minutes
5. Générer le message d'introduction et les règles

**Stockage** : Table `work_samples`

**Édition** : Le recruteur peut modifier via PATCH /api/v1/jobs/:id/work-sample

---

### Milestone 1.2 : Collect

#### 1.2.1 — Interface candidat Work Sample

**Route** : `/app/work-sample` (ou `/app/work-sample/:attempt_id`)

**Accès** : Candidat authentifié avec un attempt actif

**Structure de la page** :

**Header** :

- Nom du candidat + poste
- Temps estimé total
- Progression (pourcentage)
- Statut de sauvegarde ("Brouillon sauvegardé il y a X min")

**Introduction** :

- Message d'intro du Work Sample
- Règles (peut consulter docs, pas de code proprio, fractionnable)
- Note rassurante

**Navigation par sections** :

- Tabs pour chaque section
- Indicateur de statut par section (vide / en cours / complété)

**Section active** :

- Titre + temps estimé
- Scénario (le problème)
- Instructions
- Rubric (optionnel, collapsible) — "Ce qu'on évalue"
- Textarea pour la réponse
- Compteur de mots (optionnel)

**Actions** :

- "Sauvegarder" (manuel)
- "Soumettre le Work Sample" (final)
- "Demander un format alternatif" (lien)

**Comportement** :

_Auto-save_ :

- Toutes les 15 secondes si contenu modifié
- Sur blur du textarea
- Avant changement de section
- Afficher statut ("Sauvegardé" / "Erreur")

_Changement de section_ :

- Auto-save section courante
- Charger nouvelle section
- Mettre à jour progression

_Progression_ :

- = (sections avec réponse non vide / total sections) × 100

_Soumission_ :

- Vérifier au moins une section remplie
- Modal de confirmation : "Une fois soumis, vous ne pourrez plus modifier. Continuer ?"
- Si confirmé : soumettre
- Toast succès
- Redirect vers /app/proof-profile

_Format alternatif_ :

- Ouvre modal existant
- Après demande : afficher bandeau "Demande en cours"

**États selon status** :

| Status      | Comportement                              |
| ----------- | ----------------------------------------- |
| draft       | Mode édition, vide                        |
| in_progress | Mode édition, réponses partielles         |
| submitted   | Lecture seule, message "Soumis le [date]" |
| reviewed    | Lecture seule + lien Proof Profile        |

---

#### 1.2.2 — API Work Sample Attempts

**Endpoints** :

```
GET /api/v1/work-sample-attempts/:id
  → Charge l'attempt avec le work sample et les réponses
  Response: {
    id, status, progress, answers, last_saved_at, submitted_at,
    work_sample: { sections, intro_message, rules },
    job: { title, team }
  }

PATCH /api/v1/work-sample-attempts/:id
  → Sauvegarde les réponses
  Body: { answers: { "section_id": { "text": "..." } } }
  Comportement:
    - Merge answers (pas replace)
    - Recalcule progress
    - Met à jour last_saved_at
    - Si draft et answers non vide → in_progress
    - Si started_at null → set now()
  Response: { id, status, progress, last_saved_at }

POST /api/v1/work-sample-attempts/:id/submit
  → Soumet définitivement
  Préconditions:
    - Status = draft ou in_progress
    - Au moins une section non vide
  Comportement:
    - Status → submitted
    - submitted_at = now()
    - Déclenche job: evaluate_work_sample
    - Envoie email confirmation
  Response: { id, status: "submitted", submitted_at }

POST /api/v1/jobs/:job_id/apply
  → Crée un attempt pour le candidat courant
  Response: { attempt_id }
```

---

### Milestone 1.3 : Evaluate

#### 1.3.1 — Evaluation Engine

**Service** : `EvaluationEngine` (ou selon conventions existantes)

**Trigger** : Job queue `evaluate_work_sample` après soumission

**Input** :

- Attempt (avec answers)
- Scorecard (avec criteria)
- Work Sample (avec sections et rubrics)
- Infos candidat et job

**Output** : Evaluation complète

**Prompt IA** — Le prompt doit :

1. Pour chaque critère du Scorecard :
   - Analyser les réponses pour trouver des preuves
   - Identifier les signaux positifs et négatifs présents
   - Détecter les red flags éventuels
   - Attribuer un score (0-100)
   - Évaluer la confiance (high/medium/low)
   - Citer les passages pertinents (quotes)
2. Identifier les zones d'ombre (critères non couverts)
3. Calculer le score global (moyenne pondérée par weight)
4. Générer une recommandation (proceed_to_interview / maybe / reject)
5. Justifier la recommandation

**Échelle de scoring** :

- 0-40 : Insuffisant
- 41-60 : En dessous des attentes
- 61-75 : Acceptable
- 76-85 : Bon
- 86-100 : Excellent

**Pondération pour score global** :

- critical : poids 3
- important : poids 2
- nice_to_have : poids 1

**Stockage** : Table `evaluations`

**Job queue** :

- Job name : `evaluate_work_sample`
- Payload : `{ attempt_id }`
- Timeout : 60s
- Retries : 3
- On success : déclenche `generate_proof_profile`

---

#### 1.3.2 — Proof Profile Generator

**Service** : `ProofProfileGenerator` (ou selon conventions existantes)

**Trigger** : Job queue `generate_proof_profile` après évaluation

**Input** : Evaluation + infos candidat/job

**Output** : Proof Profile complet

**Logique** :

1. Charger l'évaluation
2. Calculer le percentile :
   - Comparer avec autres candidats du même job
   - Ou benchmark global si pas assez de candidats
3. Formater les données pour affichage :
   - Summary (score, percentile, recommendation, one-liner)
   - Criteria summary (nom, score, weight, status, headline)
   - Strengths avec evidence preview
   - Areas to explore avec suggested questions
   - Red flags
   - Interview focus points
4. Sauvegarder le Proof Profile

**Calcul du status par critère** :

- score >= 85 : "strong"
- score >= 70 : "good"
- score >= 55 : "acceptable"
- score < 55 : "weak"

**Stockage** : Table `proof_profiles`

**Notifications** (après génération) :

- Email au candidat : "Votre Proof Profile est prêt"
- Notification au recruteur : "Nouveau Proof Profile pour [Candidat]"

---

### Milestone 1.4 : Decide

#### 1.4.1 — Dashboard recruteur

**Route** : `/app/jobs/:job_id/candidates`

**Accès** : Recruteurs de l'organisation

**Structure** :

**Header** :

- Titre du poste + statut
- Stats : X candidats total, Y en attente, Z évalués
- Actions : "Inviter", "Modifier le poste", "Fermer"

**Filtres** :

- Statut : Tous / En attente / Évalués / Shortlistés / Rejetés
- Score : Tous / 80+ / 60-79 / <60
- Recherche par nom/email

**Liste des candidats** (tableau ou cards) :

- Photo/initiales + Nom
- Score global (avec couleur : vert ≥80, jaune 60-79, rouge <60)
- Statut (badge)
- Date de soumission
- One-liner (depuis Proof Profile)
- Actions : Voir / Shortlister / Rejeter

**Tri** :

- Par score (défaut, décroissant)
- Par date
- Par nom

**Endpoints** :

```
GET /api/v1/jobs/:job_id/candidates
  Query: status, min_score, search, sort, page
  Response: { candidates: [...], total, page, per_page }

PATCH /api/v1/jobs/:job_id/candidates/:candidate_id
  Body: { status: "shortlisted" | "rejected", rejection_reason?: "..." }
```

---

#### 1.4.2 — Vue Proof Profile (recruteur)

**Route** : `/app/jobs/:job_id/candidates/:candidate_id`

**Structure** :

**Header** :

- Photo + Nom
- Score global + percentile
- Recommandation IA (badge)
- Actions : Shortlister / Rejeter / Planifier entretien

**Section : Résumé** :

- One-liner
- Graphique des scores par critère (barres ou radar)

**Section : Évaluation par critère** :
Pour chaque critère :

- Nom + score + poids
- Headline
- Preuves (citations)
- Gaps identifiés

**Section : Points forts** :

- Liste avec preuves

**Section : Zones à explorer** :

- Liste avec questions suggérées

**Section : Red flags** :

- Si présents, bien visibles
- Sinon : "Aucun red flag détecté"

**Section : Réponses brutes** (collapsible) :

- Accès aux réponses originales

**Section : Interview Kit preview** :

- Aperçu des questions
- Lien vers kit complet

**Actions** :

- Shortlister → change statut
- Rejeter → modal avec raison optionnelle
- Exporter PDF (optionnel pour MVP)

---

#### 1.4.3 — Interview Kit

**Route** : `/app/jobs/:job_id/candidates/:candidate_id/interview-kit`

**Génération** : Automatique avec le Proof Profile, ou à la demande

**Service** : `InterviewKitGenerator`

**Structure** :

**Header** :

- Nom candidat + poste
- Durée recommandée

**Sections** (2-3) :
Chaque section contient :

- Titre (ex: "Validation des zones d'ombre")
- Durée suggérée
- Questions avec :
  - La question
  - Le contexte (pourquoi on pose cette question)
  - Signaux positifs à chercher
  - Signaux négatifs
  - Follow-up suggéré

**Notes** :

- Possibilité de prendre des notes par question (sauvegardées)

**Debrief template** :

- Critères à réévaluer post-entretien
- Question finale : "Recommandez-vous ce candidat ?"

**Prompt IA** :

1. Analyser le Proof Profile (zones d'ombre, forces)
2. Générer des questions ciblées pour chaque zone d'ombre
3. Générer des questions pour approfondir les forces
4. Ajouter une section culture/motivation
5. Pour chaque question : context, positive signals, negative signals, follow-up

---

#### 1.4.4 — Decision Memo

**Route** : `/app/jobs/:job_id/candidates/:candidate_id/decision`

**Accès** : Après shortlist ou entretien

**Structure du formulaire** :

**Section 1 : Décision**

- Radio : Hire / No Hire / Besoin de plus d'info

**Section 2 : Évaluation post-entretien**
Pour chaque critère du Scorecard :

- Score pré-entretien (readonly, depuis Proof Profile)
- Score post-entretien (input 0-100)
- Notes (textarea)

**Section 3 : Forces confirmées**

- Liste éditable (pré-remplie depuis Proof Profile)
- Ajouter/supprimer

**Section 4 : Risques identifiés**

- Liste éditable
- Pour chaque risque : mitigation

**Section 5 : Comparaison** (si plusieurs candidats shortlistés)

- Tableau comparatif
- Classement

**Section 6 : Justification**

- Textarea : "Pourquoi cette décision ?"

**Section 7 : Prochaines étapes**

- Si Hire : Date offre, date début
- Si No Hire : Feedback à envoyer

**Actions post-soumission** :

- Si Hire : Statut → hired, notification équipe
- Si No Hire : Statut → rejected, email feedback (configurable)

**Stockage** : Table `decision_memos`

---

## 7. Roadmap future

### Phase 2 : Multi-source Evidence (6 semaines)

- GitHub Integration (analyse repos, PRs)
- Références structurées (questionnaires, analyse)
- Import LinkedIn
- Projets déployés

### Phase 3 : Interview IA (6 semaines)

- Interview conversationnelle par IA
- Questions adaptatives
- Analyse du transcript
- Enrichissement du Proof Profile

### Phase 4 : Intelligence et prédiction (8 semaines)

- Feedback loop (performance post-hire)
- Score de probabilité de succès
- Talent pool
- Market intelligence

### Phase 5 : Scale et intégrations

- Intégrations ATS (Lever, Greenhouse, Ashby)
- Slack/Teams
- API publique
- Multi-langue
- Compliance (RGPD, SOC2)

---

## Annexes

### A. Jobs asynchrones à implémenter

| Job                       | Trigger             | Action                  |
| ------------------------- | ------------------- | ----------------------- |
| `evaluate_work_sample`    | Soumission attempt  | Évalue le Work Sample   |
| `generate_proof_profile`  | Évaluation terminée | Génère le Proof Profile |
| `generate_interview_kit`  | Proof Profile créé  | Génère l'Interview Kit  |
| `send_notification_email` | Divers événements   | Envoie les emails       |

### B. Emails à implémenter

| Email                   | Trigger              | Destinataire         |
| ----------------------- | -------------------- | -------------------- |
| Invitation Work Sample  | Recruteur invite     | Candidat             |
| Confirmation soumission | Candidat soumet      | Candidat             |
| Proof Profile prêt      | Génération terminée  | Candidat + Recruteur |
| Candidat shortlisté     | Recruteur shortliste | Candidat             |
| Candidat rejeté         | Recruteur rejette    | Candidat (optionnel) |

### C. Autorisations

| Rôle      | Accès                                         |
| --------- | --------------------------------------------- |
| Candidat  | Ses attempts, son Proof Profile (vue limitée) |
| Recruteur | Jobs et candidats de son organisation         |
| Admin     | Tout                                          |

---

_Fin du document_
