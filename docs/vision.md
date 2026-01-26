## Baara — Vision Document

### Notre croyance fondamentale

> **Le recrutement est cassé parce qu'il mesure les mauvaises choses.**

Depuis 50 ans, le recrutement n'a pas changé : CV → Screening call → Entretiens → Décision au feeling. On mesure la capacité à se vendre, pas la capacité à faire le travail.

L'IA change tout. Pour la première fois, on peut collecter, analyser et comparer des **preuves réelles de compétence** à grande échelle, instantanément, objectivement.

---

### Le secret Baara (au sens Peter Thiel)

> **"Quelle vérité importante peu de gens partagent avec vous ?"**

Notre secret :

> **Le meilleur prédicteur de performance future n'est ni le CV, ni l'entretien, ni les références. C'est l'observation directe du travail — passé ou simulé. L'IA permet enfin de collecter et analyser ces preuves à scale.**

Ce que les autres croient :

- "Un bon recruteur sait détecter les talents" → Faux, les études montrent que l'entretien non structuré a une valeur prédictive proche du hasard
- "Le CV résume bien un candidat" → Faux, il résume ce que le candidat veut montrer
- "Les références sont fiables" → Faux, elles sont biaisées par sélection

Ce que nous savons :

- Les preuves de travail réel sont le meilleur signal
- L'IA peut extraire ces signaux partout (code, écrits, réponses, conversations)
- L'humain doit décider, mais sur la base de données objectives, pas de gut feeling

---

### Notre mission

> **Éliminer l'incertitude des décisions de recrutement en remplaçant les opinions par des preuves.**

---

### Les principes fondateurs

#### 1. Evidence over narrative

On ne demande pas au candidat de raconter ce qu'il sait faire. On lui demande de le **montrer**, ou on va **chercher les preuves** là où elles existent.

#### 2. Objectivité over gut feeling

Chaque évaluation est basée sur des **critères explicites**, un **scoring transparent**, des **preuves citables**. Pas de "je le sens bien".

#### 3. Équité by design

Mêmes critères pour tous. Pas de biais sur l'école, le genre, l'origine, l'apparence. On juge le travail, pas la personne.

#### 4. Respect du temps (candidat et recruteur)

Candidat : 60 minutes max, fractionnable, feedback utile même si rejeté.
Recruteur : Décision possible en heures, pas en semaines.

#### 5. L'IA augmente, l'humain décide

L'IA collecte, analyse, synthétise, recommande. L'humain valide, contextualise, décide. Jamais d'automatisation totale sur une décision humaine aussi importante.

---

### Le framework Baara : Recrutement basé sur les preuves

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                        EVIDENCE-BASED HIRING                            │
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  DEFINE  │ →  │ COLLECT  │ →  │ EVALUATE │ →  │  DECIDE  │          │
│  │          │    │          │    │          │    │          │          │
│  │ Outcome  │    │ Evidence │    │  Proof   │    │ Decision │          │
│  │  Brief   │    │  Multi-  │    │ Profile  │    │   Memo   │          │
│  │    +     │    │  source  │    │    +     │    │          │          │
│  │Scorecard │    │          │    │ Compare  │    │          │          │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘          │
│                                                                         │
│       │                │                │               │               │
│       ▼                ▼                ▼               ▼               │
│                                                                         │
│   "Qu'est-ce      "Montrez-moi"     "Voici ce       "Hire/No hire     │
│    qu'on                             que je sais      avec preuves"    │
│    cherche ?"                        de vous"                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Les 4 piliers du système

#### Pilier 1 : DEFINE — Savoir ce qu'on cherche

**Problème** : La plupart des recrutements échouent parce qu'on ne sait pas vraiment ce qu'on cherche. Job descriptions vagues, critères implicites, chaque interviewer évalue différemment.

**Solution Baara** :

**Outcome Brief** — Répondre à 3 questions :

1. Quel problème cette personne résout dans les 6 premiers mois ?
2. Dans quel contexte ? (équipe, stack, contraintes)
3. À quoi ressemble le succès ?

**Scorecard** — Générée par l'IA à partir de l'Outcome Brief :

- 5-7 critères mesurables
- Pour chaque critère : signaux positifs, signaux négatifs, red flags
- Pondération selon l'importance

**Exemple** :

```
Poste : Senior Backend Go — Équipe Payments

Critère 1 : Debugging systématique (Poids : 25%)
  Signal + : Approche méthodique (logs → metrics → traces → hypothèse)
  Signal - : "Je regarde le code jusqu'à trouver"
  Red flag : Blâme l'infra ou les autres sans investiguer

Critère 2 : Expérience systèmes distribués (Poids : 20%)
  Signal + : A conçu/opéré des services à >10k RPS
  Signal - : Expérience limitée aux monolithes
  Red flag : Ne comprend pas les trade-offs CAP

[...]
```

---

#### Pilier 2 : COLLECT — Rassembler les preuves

**Problème** : On demande aux candidats de se décrire (CV, entretien). C'est du déclaratif, pas des preuves.

**Solution Baara** : Collecter des preuves vérifiables de plusieurs sources.

**Source 1 : Work Sample (contrôlé)**

- Scénario réaliste basé sur le poste (30-60 min)
- Le candidat montre son raisonnement, pas juste une réponse
- Format flexible (texte, audio, vidéo, code)

**Source 2 : Code public (GitHub, GitLab)**

- Analyse automatique des repos, PRs, contributions
- Qualité du code, patterns, documentation
- Collaboration (code reviews, issues)

**Source 3 : Écrits publics (Blog, articles, Stack Overflow)**

- Capacité à expliquer, communiquer
- Profondeur technique
- Thought leadership

**Source 4 : Projets déployés**

- Side projects, apps en production
- Architecture, ops, qualité

**Source 5 : Références structurées**

- Questionnaires ciblés aux références
- Analyse des patterns et consensus
- Détection des divergences

**Source 6 : Interview IA (conversationnel)**

- Exploration des zones d'ombre
- Questions adaptatives basées sur le Proof Profile
- Transcript analysé

**Principe** : Plus on a de sources concordantes, plus la confiance est élevée.

```
Niveau de confiance :

███████████ 5+ sources concordantes → Très haute confiance
████████░░░ 3-4 sources → Haute confiance
█████░░░░░ 2 sources → Confiance moyenne
██░░░░░░░░ 1 source (Work Sample seul) → Confiance de base
```

---

#### Pilier 3 : EVALUATE — Analyser et comparer

**Problème** : L'évaluation est subjective, incohérente, biaisée. Chaque recruteur a son opinion.

**Solution Baara** : Évaluation IA objective, transparente, comparable.

**Proof Profile** — Le dossier de preuves du candidat :

```
┌─────────────────────────────────────────────────────────────┐
│  PROOF PROFILE                                              │
│  Marie Dupont — Senior Backend Go                           │
│                                                             │
│  Score global : 82/100                                      │
│  Percentile : Top 15% (vs 500+ candidats Backend Go)       │
│  Confiance : Haute (4 sources concordantes)                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ÉVALUATION PAR CRITÈRE                                     │
│                                                             │
│  Critère               Score  Confiance  Sources            │
│  ────────────────────────────────────────────────────────   │
│  Debugging système      85     Haute     WS, GitHub, Réf    │
│  Systèmes distribués    78     Haute     WS, Blog, Projet   │
│  Qualité code           88     Très haute WS, GitHub        │
│  Communication          80     Haute     WS, Blog, SO       │
│  Leadership             65     Moyenne   Réf, Interview     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  PREUVES CLÉS                                               │
│                                                             │
│  ✅ "Approche debugging en 5 étapes clairement articulée"  │
│     — Work Sample, section 2                                │
│                                                             │
│  ✅ "A conçu un cache distribué avec invalidation propre"  │
│     — GitHub repo distributed-cache                         │
│                                                             │
│  ✅ "La personne que j'appelle quand rien ne marche"       │
│     — Jean Martin, ex-manager                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ZONES D'OMBRE                                              │
│                                                             │
│  ⚠️ Expérience on-call limitée (mentionné mais non prouvé)│
│  ⚠️ Leadership : peu d'exemples concrets de mentoring     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  RED FLAGS                                                  │
│                                                             │
│  Aucun détecté                                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  RECOMMANDATION IA                                          │
│                                                             │
│  → RECOMMANDÉ pour entretien final                         │
│  → Explorer : expérience on-call, exemples leadership      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Comparaison objective** :

```
COMPARAISON — Poste Backend Go Payments

Rang  Candidat        Score  Forces              Faiblesses
────────────────────────────────────────────────────────────
#1    Marie Dupont    82     Debug, Code         Leadership
#2    Jean Martin     78     Distribué, Ops      Communication
#3    Sophie Chen     75     Leadership, Comm    Profondeur tech
#4    Alex Dubois     71     Code, Tests         Expérience
```

---

#### Pilier 4 : DECIDE — Décider avec confiance

**Problème** : Les décisions de recrutement sont prises au feeling, en réunion, sans trace. On regrette souvent.

**Solution Baara** : Décision structurée, documentée, défendable.

**Interview Kit** — Préparation ciblée pour l'entretien humain :

- Questions basées sur les zones d'ombre du Proof Profile
- Signaux à chercher pour chaque question
- Durée optimisée (45 min au lieu de 1h+)

**Decision Memo** — Document de décision :

- Décision : Hire / No hire
- Justification par critère (preuve + évaluation)
- Risques identifiés et mitigations
- Comparaison avec les autres candidats
- Signature du décisionnaire

```
DECISION MEMO

Candidat : Marie Dupont
Poste : Senior Backend Go — Payments
Décision : ✅ HIRE

JUSTIFICATION :

1. Debugging systématique (Critique) : 85/100 ✅
   Prouvé par Work Sample + GitHub + Référence manager
   → Critère critique satisfait avec haute confiance

2. Systèmes distribués (Important) : 78/100 ✅
   Prouvé par Work Sample + Blog + Projet personnel
   → Au-dessus du seuil requis (70)

3. Leadership (Nice-to-have) : 65/100 ⚠️
   Peu de preuves, mais pas critique pour le rôle
   → Acceptable, à développer on the job

RISQUES :
• Expérience on-call limitée
  Mitigation : Onboarding progressif, shadow d'abord

DÉCISION PRISE PAR : Thomas (Hiring Manager)
DATE : 2025-01-26
```

---

### La différence Baara : Avant / Après

| Aspect                   | Recrutement classique             | Baara                          |
| ------------------------ | --------------------------------- | ------------------------------ |
| **Ce qu'on évalue**      | Capacité à se vendre              | Capacité à faire le travail    |
| **Base de décision**     | Opinions, gut feeling             | Preuves, données               |
| **Temps pour shortlist** | 2-3 semaines                      | 3-5 jours                      |
| **Temps recruteur**      | 50-60h par hire                   | 10-15h par hire                |
| **Cohérence**            | Variable selon l'interviewer      | Standardisée                   |
| **Biais**                | Présents (école, genre, affinité) | Minimisés (critères objectifs) |
| **Expérience candidat**  | Frustrante, opaque                | Respectueuse, feedback utile   |
| **Traçabilité**          | Aucune                            | Decision Memo                  |
| **Prédictibilité**       | ~50% (proche du hasard)           | ~75%+ (basé sur preuves)       |

---

### Roadmap

#### Phase 1 : Foundation (MVP) — 8 semaines

**Objectif** : Un pilote fonctionnel end-to-end pour 5-10 entreprises.

**Milestone 1.1 : Define (Semaines 1-2)**

- [ ] Outcome Brief : formulaire guidé
- [ ] Scorecard Generator : IA génère les critères depuis l'Outcome Brief
- [ ] Work Sample Generator : IA génère le scénario depuis le Scorecard

**Milestone 1.2 : Collect — Work Sample (Semaines 3-4)**

- [ ] Interface candidat Work Sample (déjà en cours)
- [ ] Soumission et stockage des réponses
- [ ] Support format alternatif

**Milestone 1.3 : Evaluate (Semaines 5-6)**

- [ ] Evaluation Engine : IA analyse le Work Sample vs Scorecard
- [ ] Scoring par critère avec preuves/citations
- [ ] Proof Profile Generator : synthèse lisible

**Milestone 1.4 : Decide (Semaines 7-8)**

- [ ] Dashboard recruteur : liste candidats, scores, tri, filtre
- [ ] Accès au Proof Profile complet
- [ ] Interview Kit basique (questions suggérées)
- [ ] Decision Memo template

**Livrable Phase 1** : Un recruteur peut créer un poste, inviter des candidats, voir leurs Proof Profiles, et décider.

---

#### Phase 2 : Multi-source Evidence — 6 semaines

**Objectif** : Enrichir le Proof Profile avec des preuves externes.

**Milestone 2.1 : GitHub Integration (Semaines 1-2)**

- [ ] OAuth GitHub pour candidats
- [ ] Analyse automatique des repos, PRs, contributions
- [ ] Intégration des signaux dans le Proof Profile

**Milestone 2.2 : Références structurées (Semaines 3-4)**

- [ ] Invitation de références par le candidat
- [ ] Questionnaire adapté au rôle de la référence
- [ ] Analyse et synthèse des réponses

**Milestone 2.3 : Autres sources (Semaines 5-6)**

- [ ] Import LinkedIn (parcours)
- [ ] Analyse articles/blog (si fourni)
- [ ] Projets déployés (analyse basique)

**Livrable Phase 2** : Proof Profile enrichi avec niveau de confiance basé sur le nombre de sources.

---

#### Phase 3 : Interview IA — 6 semaines

**Objectif** : L'IA conduit un entretien conversationnel pour explorer les zones d'ombre.

**Milestone 3.1 : Interview Engine (Semaines 1-3)**

- [ ] Questions générées depuis le Proof Profile
- [ ] Interface conversationnelle (texte d'abord, puis audio)
- [ ] Follow-up questions adaptatifs

**Milestone 3.2 : Analyse et intégration (Semaines 4-6)**

- [ ] Transcript et analyse de l'entretien
- [ ] Extraction des signaux supplémentaires
- [ ] Mise à jour du Proof Profile post-interview

**Livrable Phase 3** : Le candidat peut passer un entretien IA, les insights enrichissent le Proof Profile.

---

#### Phase 4 : Intelligence et prédiction — 8 semaines

**Objectif** : Apprendre des données pour améliorer la prédiction.

**Milestone 4.1 : Feedback loop (Semaines 1-3)**

- [ ] Collecte performance post-hire (30/60/90 jours)
- [ ] Corrélation avec les évaluations pré-hire
- [ ] Identification des signaux les plus prédictifs

**Milestone 4.2 : Prédiction (Semaines 4-6)**

- [ ] Score de probabilité de succès
- [ ] Benchmark par rôle/seniority
- [ ] Alertes sur les profils atypiques

**Milestone 4.3 : Talent Intelligence (Semaines 7-8)**

- [ ] Talent pool (candidats réutilisables)
- [ ] Market insights (benchmark marché)
- [ ] Recommandations proactives

**Livrable Phase 4** : Baara apprend et améliore ses prédictions avec le temps.

---

#### Phase 5 : Scale et intégrations — Ongoing

- [ ] Intégrations ATS (Lever, Greenhouse, Ashby)
- [ ] Intégrations communication (Slack, Teams, Email)
- [ ] API publique pour intégrations custom
- [ ] Multi-langue (EN, FR, DE, ES)
- [ ] Compliance (RGPD, SOC2)

---

### Métriques de succès

#### Pour les recruteurs (nos clients)

| Métrique                                    | Baseline     | Cible MVP | Cible Vision |
| ------------------------------------------- | ------------ | --------- | ------------ |
| Time-to-shortlist                           | 2-3 semaines | 5 jours   | 2 jours      |
| Temps recruteur par hire                    | 50-60h       | 15h       | 5h           |
| Qualité de hire (performance review 6 mois) | 3.5/5        | 4.0/5     | 4.5/5        |
| Taux de regret (mauvais hire)               | 25%          | 15%       | 5%           |
| Coût par hire                               | €5-10k       | €2k       | €500         |

#### Pour les candidats

| Métrique           | Baseline    | Cible MVP       | Cible Vision          |
| ------------------ | ----------- | --------------- | --------------------- |
| Temps investi      | 8-15h       | 2h              | 1h                    |
| Feedback reçu      | Rare, vague | Toujours, utile | Détaillé, actionnable |
| Sentiment d'équité | 40%         | 75%             | 90%                   |
| NPS candidat       | +10         | +40             | +60                   |

#### Pour Baara (business)

| Métrique             | Cible 6 mois | Cible 12 mois | Cible 24 mois |
| -------------------- | ------------ | ------------- | ------------- |
| Entreprises actives  | 10           | 50            | 200           |
| Candidats évalués    | 500          | 5,000         | 50,000        |
| Revenue (ARR)        | €50k         | €500k         | €3M           |
| Précision prédictive | 70%          | 75%           | 85%           |

---

### Ce document est vivant

Cette vision évoluera avec nos apprentissages. Chaque pilote, chaque feedback, chaque donnée nous rapproche de la vérité sur ce qui prédit vraiment la performance.

Notre engagement : toujours remettre en question nos hypothèses, mesurer ce qui compte, et améliorer.

---

**Prochaine étape** : Implémenter la Phase 1 (MVP).

Tu veux que je génère les prompts détaillés pour chaque milestone de la Phase 1 ?
