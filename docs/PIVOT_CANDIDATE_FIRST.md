# Baara — Pivot "Candidate-First"

> **Document de référence pour le pivot stratégique**
> Version: 1.0 | Date: 2026-02-01

---

## Contexte

### Le constat

Baara v1 est un **outil de recrutement** (recruiter-first) :
- Le recruteur crée un job → génère un scorecard → génère un work sample → invite des candidats
- Le candidat ne peut agir que s'il est invité

**Problème** : Baara résout une douleur 6/10 (évaluation) en ignorant la douleur 10/10 (trouver des candidats). Le recruteur n'a aucune raison urgente de changer son process.

### Le pivot

Baara v2 est une **plateforme de compétences prouvées** (candidate-first) :
- Le candidat arrive seul → choisit son profil (Backend Go, SRE, Infra) → fait un Work Sample standard → reçoit son Proof Profile
- Le recruteur vient APRÈS, pour accéder à un pool de candidats pré-évalués

**Pourquoi** : On résout le problème des deux côtés :
- **Candidat** : "Où est-ce que je me situe ? Comment prouver mon niveau sans refaire un take-home pour chaque boîte ?"
- **Recruteur** : "Où trouver des devs Go/SRE/Infra en France qui sont vraiment bons ?"

### Ce qui ne change PAS

- Le moteur d'évaluation (Claude API, scoring pondéré, preuves citées) → intact
- Le pipeline async (Submit → Evaluate → Proof Profile → Interview Kit) → intact
- L'auth magic link → intacte
- L'app recruteur (jobs, candidates, decision memo) → conservée comme "mode entreprise"
- L'admin → intact

---

## Nouvelle vision

> **Baara est le référentiel de compétences prouvées pour les développeurs tech en France.**

- Côté candidat : "Prouve ce que tu sais faire. Une fois. Réutilise partout."
- Côté recruteur : "Accède aux meilleurs profils tech, déjà évalués avec preuves."

---

## Milestones

### Milestone 0 : Validation (AVANT de coder)

**Objectif** : Confirmer que les devs Go/SRE en France veulent un Proof Profile.

**Actions** :
1. Refondre la landing page candidat → nouveau positionnement candidat-first
2. Refondre la home page → positionner Baara comme plateforme, pas outil
3. Poster sur LinkedIn, communautés Go/SRE françaises
4. Collecter des emails via le formulaire existant

**Critère de succès** : 50+ inscriptions en 2 semaines.

**Livrables code** :
- Landing page candidat réécrite
- Home page réécrite
- Traductions FR/EN mises à jour

---

### Milestone 1 : Proof Profile autonome

**Objectif** : Un dev Go arrive seul sur Baara, fait le Work Sample, reçoit son Proof Profile.

**Ce qui change** :

| Avant | Après |
|-------|-------|
| Candidat invité par recruteur | Candidat arrive seul |
| Work Sample spécifique à un job | Work Sample générique par rôle |
| Proof Profile lié à un job | Proof Profile lié au candidat |
| Visible uniquement dans l'app | URL publique partageable |
| Aucun benchmark | Percentile vs autres candidats du même rôle |

**Livrables** :

#### 1.1 — Work Samples génériques (Backend)

3 templates pré-générés, stockés en DB :
- **Backend Go** : Scénarios debugging, design, production
- **SRE / Infrastructure** : Scénarios incident response, observabilité, scaling
- **Platform Engineering** : Scénarios CI/CD, IaC, developer experience

Chaque template a :
- Un scorecard standard (5-7 critères)
- Un work sample standard (2-3 sections, 45 min total)
- Un message d'introduction adapté

**Changement DB** :
- Table `work_sample_templates` : id, role_type, scorecard (JSONB), work_sample (JSONB), version
- Ou : utiliser la table `jobs` existante avec un flag `is_template: true` et `org_id: null`

**Endpoints** :
```
GET /api/v1/templates                    → Liste des templates disponibles
GET /api/v1/templates/:role_type         → Détail d'un template
POST /api/v1/templates/:role_type/start  → Créer un attempt autonome
```

#### 1.2 — Candidature autonome (Frontend)

**Nouvelle route** : `/evaluate` ou `/evaluate/:role_type`

Page publique (pas besoin d'être connecté pour voir, auth requise pour commencer) :
- Choix du rôle (Backend Go / SRE / Platform)
- Description de l'évaluation (durée, critères évalués, ce qu'on obtient)
- CTA : "Commencer l'évaluation" → crée un compte (magic link) → redirige vers le Work Sample

**Changements dans l'onboarding** :
- Le candidat qui arrive via `/evaluate/backend-go` a son `role_type` pré-sélectionné
- Après onboarding → redirigé vers le Work Sample (pas vers le dashboard)

#### 1.3 — Proof Profile public

**Nouvelle route** : `/proof/:id` (publique, pas d'auth)

Page publique montrant :
- Score global + percentile
- Critères évalués avec scores
- Points forts (avec preuves)
- Rôle évalué + date
- Badge visuel (Excellent / Bon / Acceptable)
- Bouton "Créer mon Proof Profile" (CTA pour les visiteurs)

**PAS affiché publiquement** :
- Zones d'ombre (privé, visible uniquement par le candidat et les recruteurs)
- Red flags (privé)
- Réponses brutes (privé)

**Changement Backend** :
```
GET /api/v1/proof-profiles/:id/public    → Version publique (score, forces, badge)
```

Le candidat peut activer/désactiver la visibilité publique de son Proof Profile.

#### 1.4 — Benchmark et percentile

Le percentile se calcule :
- Par `role_type` (pas par job)
- Sur tous les Proof Profiles complétés du même role_type
- Mise à jour périodique (pas en temps réel)

Au lancement (< 30 profils) : percentile indicatif basé sur le scoring absolu :
- 86-100 → "Top 10%"
- 76-85 → "Top 25%"
- 61-75 → "Top 50%"
- < 61 → pas de percentile affiché

#### 1.5 — Refaire le Work Sample

Le candidat peut refaire l'évaluation :
- Cooldown de 90 jours entre deux tentatives
- Le nouveau Proof Profile remplace l'ancien
- L'historique est conservé

---

### Milestone 2 : Talent Browser (Recruteur)

**Objectif** : Le recruteur accède aux Proof Profiles et contacte les candidats.

**Déclencheur** : 100+ Proof Profiles complétés.

**Livrables** :

#### 2.1 — Browse anonymisé

**Route** : `/app/talent` (recruteur authentifié)

Liste de Proof Profiles anonymisés :
- Score global + percentile
- Rôle évalué
- Critères top 3 (scores)
- One-liner
- Date de l'évaluation
- Badge recommandation

**Filtres** :
- Rôle (Backend Go, SRE, Infra)
- Score minimum
- Disponibilité (si le candidat la renseigne)

**PAS visible** : nom, email, détails, zones d'ombre

#### 2.2 — Unlock profil

Le recruteur "débloque" un profil pour voir :
- Nom complet, email
- Proof Profile complet (forces + zones d'ombre)
- LinkedIn / GitHub (si renseigné)

Limité par abonnement (ex: 10 unlocks/mois en freemium, illimité en payant).

#### 2.3 — Contact request

Quand le recruteur débloque un profil :
- Notification email au candidat : "L'entreprise X souhaite vous contacter pour un poste Y"
- Le candidat accepte ou refuse
- Si accepté : le recruteur voit les coordonnées, peut proposer un entretien

---

### Milestone 3 : Expansion et monétisation

**Déclencheur** : Recruteurs actifs sur le talent browser.

#### 3.1 — Nouveaux rôles

Ajouter des Work Samples génériques pour :
- Backend Python / Django
- Frontend React / TypeScript
- Data Engineering
- DevOps (généraliste)

Chaque rôle = scorecard standard + work sample standard + message d'intro.

#### 3.2 — Pricing

- **Candidat** : toujours gratuit
- **Recruteur freemium** : browse anonymisé + 3 unlocks/mois
- **Recruteur pro** : unlocks illimités + filtres avancés + notifications nouveau profil
- **Entreprise** : tout le pro + mode entreprise (créer ses propres jobs/work samples, le flow v1 actuel)

#### 3.3 — Enrichissement Proof Profile

- GitHub signal (nombre de PRs, langages, activité)
- Projets déployés (liens, descriptions)
- Feedback loop post-hire (corrélation score → performance)

---

### Milestone 4 : Intelligence

**Déclencheur** : Données de corrélation score → performance.

- Calibration automatique des prompts
- Score prédictif de performance
- Talent matching intelligent (profil candidat ↔ critères recruteur)
- Interview IA (seulement quand la confiance est établie)

---

## Ce qui est conservé de v1

Le "mode entreprise" (tout le flow recruiter-first actuel) est conservé :
- Créer un job custom avec outcome brief
- Générer un scorecard custom
- Générer un work sample custom
- Inviter des candidats spécifiques
- Interview Kit + Decision Memo

Ce mode devient une **feature premium** pour les entreprises qui veulent évaluer leurs propres candidats (pas ceux du pool Baara).

---

## Ordre d'implémentation

```
MAINTENANT    → Milestone 0 : Landing pages (validation)
SI VALIDÉ     → Milestone 1 : Proof Profile autonome
100+ PROFILS  → Milestone 2 : Talent browser
TRACTION      → Milestone 3 : Expansion + monétisation
DONNÉES       → Milestone 4 : Intelligence
```

**Règle** : ne pas commencer Milestone N+1 avant que Milestone N ait des utilisateurs réels.

---

## Métriques clés

| Phase | Métrique | Objectif |
|-------|----------|----------|
| M0 | Inscriptions email | 50+ en 2 semaines |
| M1 | Work Samples complétés | 100 en 2 mois |
| M1 | Taux de complétion | > 60% |
| M1 | Proof Profiles partagés (lien public) | > 20% des profils |
| M2 | Recruteurs inscrits | 20+ |
| M2 | Profils débloqués | 50+ / mois |
| M2 | Taux d'acceptation contact | > 40% |
| M3 | Conversion freemium → payant | > 10% |
