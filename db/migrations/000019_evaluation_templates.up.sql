-- Create evaluation_templates table
CREATE TABLE evaluation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_type VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    seniority VARCHAR(20) DEFAULT 'mid',
    criteria JSONB NOT NULL DEFAULT '[]',
    sections JSONB NOT NULL DEFAULT '[]',
    rules JSONB NOT NULL DEFAULT '[]',
    intro_message TEXT DEFAULT '',
    estimated_time_minutes INT DEFAULT 45,
    is_active BOOLEAN DEFAULT true,
    cooldown_days INT DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add evaluation_template_id to work_sample_attempts
ALTER TABLE work_sample_attempts ADD COLUMN evaluation_template_id UUID REFERENCES evaluation_templates(id);
CREATE INDEX idx_wsa_eval_template ON work_sample_attempts(evaluation_template_id);

-- Make job_id nullable on evaluations, proof_profiles, and interview_kits
ALTER TABLE evaluations ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE proof_profiles ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE interview_kits ALTER COLUMN job_id DROP NOT NULL;

-- Add evaluation_template_id to evaluations and proof_profiles
ALTER TABLE evaluations ADD COLUMN evaluation_template_id UUID REFERENCES evaluation_templates(id);
ALTER TABLE proof_profiles ADD COLUMN evaluation_template_id UUID REFERENCES evaluation_templates(id);

-- Seed templates from existing template jobs
INSERT INTO evaluation_templates (role_type, title, description, seniority, criteria, sections, rules, intro_message, estimated_time_minutes)
SELECT
    j.role_type,
    j.title,
    j.description,
    j.seniority,
    COALESCE(sc.criteria, '[]'::jsonb),
    COALESCE(ws.sections, '[]'::jsonb),
    COALESCE(ws.rules, '[]'::jsonb),
    COALESCE(ws.intro_message, ''),
    COALESCE(ws.estimated_time_minutes, 45)
FROM jobs j
LEFT JOIN scorecards sc ON sc.job_id = j.id
LEFT JOIN job_work_samples ws ON ws.job_id = j.id
WHERE j.is_template = true AND j.status = 'active';

-- Static seed: insert default templates if dynamic seed found nothing
INSERT INTO evaluation_templates (role_type, title, description, seniority, criteria, sections, rules, intro_message, estimated_time_minutes)
SELECT 'backend_go', 'Développeur Backend Go', 'Évaluation technique pour développeurs backend Go. Couvre la conception d''API, la gestion de la concurrence, et les bonnes pratiques Go.', 'mid',
  '[
    {"name":"Conception d''API REST","description":"Capacité à concevoir des API REST claires, cohérentes et bien structurées","weight":"critical","positive_signals":["Endpoints RESTful bien nommés","Gestion correcte des codes HTTP","Validation des entrées"],"negative_signals":["URLs incohérentes","Pas de gestion d''erreurs"],"red_flags":["Aucune notion de REST"]},
    {"name":"Maîtrise du langage Go","description":"Connaissance des idiomes Go, gestion d''erreurs, structures de données","weight":"critical","positive_signals":["Gestion explicite des erreurs","Utilisation correcte des interfaces","Code idiomatique Go"],"negative_signals":["Ignorer les erreurs","Mauvaise utilisation des pointeurs"],"red_flags":["Syntaxe incorrecte","Pas de gestion d''erreurs"]},
    {"name":"Concurrence et goroutines","description":"Compréhension des patterns de concurrence en Go","weight":"important","positive_signals":["Utilisation correcte des channels","Patterns worker pool","Gestion du context"],"negative_signals":["Race conditions potentielles","Goroutine leaks"],"red_flags":["Aucune notion de concurrence"]},
    {"name":"Architecture et design patterns","description":"Capacité à structurer une application maintenable","weight":"important","positive_signals":["Séparation des responsabilités","Injection de dépendances","Code testable"],"negative_signals":["Couplage fort","God objects"],"red_flags":["Architecture monolithique sans structure"]},
    {"name":"Tests et qualité","description":"Approche des tests et de la qualité du code","weight":"important","positive_signals":["Tests unitaires pertinents","Table-driven tests","Mocking approprié"],"negative_signals":["Pas de tests","Tests fragiles"],"red_flags":["Opposition aux tests"]},
    {"name":"Base de données et SQL","description":"Interaction avec les bases de données relationnelles","weight":"nice_to_have","positive_signals":["Requêtes SQL optimisées","Migrations propres","Gestion des transactions"],"negative_signals":["N+1 queries","Pas d''index"],"red_flags":["Injection SQL"]}
  ]'::jsonb,
  '[
    {"title":"Conception d''une API REST","description":"Concevoir les endpoints d''une API pour un système de gestion de tâches collaboratif","instructions":"Décrivez les endpoints REST pour un système permettant aux utilisateurs de créer, assigner et suivre des tâches en équipe. Incluez les routes, les structures de données, et la gestion des erreurs.","estimated_time_minutes":20,"criteria_evaluated":["Conception d''API REST","Architecture et design patterns"],"rubric":"Évaluer la clarté des endpoints, la cohérence des conventions REST, la gestion des cas d''erreur"},
    {"title":"Implémentation d''un service concurrent","description":"Implémenter un service de traitement de jobs en arrière-plan","instructions":"Décrivez comment vous implémenteriez un worker pool en Go pour traiter des jobs depuis une queue Redis. Expliquez la gestion des erreurs, le graceful shutdown, et la limitation de concurrence.","estimated_time_minutes":15,"criteria_evaluated":["Maîtrise du langage Go","Concurrence et goroutines"],"rubric":"Évaluer la compréhension des patterns de concurrence, la gestion du cycle de vie, la robustesse"},
    {"title":"Stratégie de test","description":"Définir une stratégie de test pour un service critique","instructions":"Pour le service de traitement de jobs décrit précédemment, expliquez votre stratégie de test : quels types de tests, comment mocker les dépendances externes, comment tester la concurrence.","estimated_time_minutes":10,"criteria_evaluated":["Tests et qualité","Base de données et SQL"],"rubric":"Évaluer la pertinence de la stratégie, la couverture des cas critiques, l''approche pragmatique"}
  ]'::jsonb,
  '["Répondez en français ou en anglais","Soyez concis mais précis","Donnez des exemples de code quand c''est pertinent","Expliquez vos choix de conception"]'::jsonb,
  'Bienvenue dans cette évaluation technique Backend Go. Vous allez être évalué(e) sur vos compétences en conception d''API, en programmation Go, et en architecture logicielle. Prenez le temps de bien structurer vos réponses.',
  45
WHERE NOT EXISTS (SELECT 1 FROM evaluation_templates WHERE role_type = 'backend_go');

INSERT INTO evaluation_templates (role_type, title, description, seniority, criteria, sections, rules, intro_message, estimated_time_minutes)
SELECT 'sre', 'Ingénieur SRE', 'Évaluation technique pour ingénieurs SRE. Couvre l''observabilité, la fiabilité, l''incident management et l''infrastructure as code.', 'mid',
  '[
    {"name":"Observabilité et monitoring","description":"Capacité à mettre en place et utiliser des systèmes d''observabilité","weight":"critical","positive_signals":["Maîtrise des 3 piliers (logs, métriques, traces)","Définition de SLI/SLO pertinents","Alerting actionable"],"negative_signals":["Monitoring superficiel","Alertes bruyantes"],"red_flags":["Aucune notion d''observabilité"]},
    {"name":"Gestion d''incidents","description":"Capacité à gérer et résoudre des incidents de production","weight":"critical","positive_signals":["Méthodologie structurée","Communication claire pendant l''incident","Post-mortem constructif"],"negative_signals":["Réponse désorganisée","Pas de post-mortem"],"red_flags":["Blâme des individus","Aucune expérience de production"]},
    {"name":"Infrastructure as Code","description":"Maîtrise des outils et pratiques d''IaC","weight":"important","positive_signals":["Utilisation de Terraform/Pulumi","Modules réutilisables","State management propre"],"negative_signals":["Configuration manuelle","Pas de versioning"],"red_flags":["Opposition à l''automatisation"]},
    {"name":"Conteneurisation et orchestration","description":"Compétences Docker et Kubernetes","weight":"important","positive_signals":["Images Docker optimisées","Manifestes Kubernetes bien structurés","Gestion des ressources"],"negative_signals":["Images trop lourdes","Pas de limits/requests"],"red_flags":["Containers en root sans raison"]},
    {"name":"Fiabilité et résilience","description":"Conception de systèmes fiables et résilients","weight":"important","positive_signals":["Patterns de résilience (circuit breaker, retry)","Chaos engineering","Capacity planning"],"negative_signals":["Single points of failure","Pas de redondance"],"red_flags":["Ignorer la haute disponibilité"]},
    {"name":"Automatisation et CI/CD","description":"Mise en place de pipelines et automatisation","weight":"nice_to_have","positive_signals":["Pipelines CI/CD robustes","Déploiements progressifs","Rollback automatisé"],"negative_signals":["Déploiements manuels","Pas de tests dans la CI"],"red_flags":["Déploiement direct en production"]}
  ]'::jsonb,
  '[
    {"title":"Diagnostic d''incident","description":"Analyser et résoudre un incident de production","instructions":"Un service critique retourne des erreurs 503 intermittentes. Le taux d''erreur est passé de 0.1% à 15% en 30 minutes. Décrivez votre approche de diagnostic : quelles métriques regarder, quels outils utiliser, comment communiquer avec l''équipe.","estimated_time_minutes":20,"criteria_evaluated":["Observabilité et monitoring","Gestion d''incidents"],"rubric":"Évaluer la méthodologie de diagnostic, l''utilisation des outils d''observabilité, la communication"},
    {"title":"Architecture d''infrastructure","description":"Concevoir l''infrastructure pour un service à haute disponibilité","instructions":"Décrivez l''infrastructure Kubernetes pour déployer un service API avec base de données PostgreSQL. Le service doit supporter 10k requêtes/seconde avec un SLO de 99.9% de disponibilité. Détaillez la topologie, le scaling, et la gestion des pannes.","estimated_time_minutes":15,"criteria_evaluated":["Infrastructure as Code","Conteneurisation et orchestration","Fiabilité et résilience"],"rubric":"Évaluer la robustesse de l''architecture, la gestion de la haute disponibilité, le réalisme des choix"},
    {"title":"Pipeline CI/CD et déploiement","description":"Concevoir un pipeline de déploiement sûr","instructions":"Décrivez un pipeline CI/CD pour déployer le service précédent. Comment gérez-vous les migrations de base de données, les feature flags, et les rollbacks ? Quelle stratégie de déploiement choisissez-vous et pourquoi ?","estimated_time_minutes":10,"criteria_evaluated":["Automatisation et CI/CD","Fiabilité et résilience"],"rubric":"Évaluer la sécurité du pipeline, la stratégie de rollback, l''approche pragmatique"}
  ]'::jsonb,
  '["Répondez en français ou en anglais","Soyez concis mais précis","Utilisez des exemples concrets de votre expérience","Mentionnez les outils spécifiques que vous utiliseriez"]'::jsonb,
  'Bienvenue dans cette évaluation technique SRE. Vous allez être évalué(e) sur vos compétences en observabilité, gestion d''incidents, et infrastructure. Basez vos réponses sur votre expérience réelle.',
  45
WHERE NOT EXISTS (SELECT 1 FROM evaluation_templates WHERE role_type = 'sre');

INSERT INTO evaluation_templates (role_type, title, description, seniority, criteria, sections, rules, intro_message, estimated_time_minutes)
SELECT 'infra_platform', 'Ingénieur Infrastructure & Platform', 'Évaluation technique pour ingénieurs infrastructure et plateforme. Couvre la conception de plateformes internes, l''automatisation, et la gestion de l''infrastructure cloud.', 'mid',
  '[
    {"name":"Conception de plateforme interne","description":"Capacité à concevoir des plateformes self-service pour les équipes de développement","weight":"critical","positive_signals":["API-first design","Developer experience prioritaire","Documentation claire"],"negative_signals":["Plateforme trop complexe","Pas de self-service"],"red_flags":["Aucune considération pour les utilisateurs"]},
    {"name":"Cloud et infrastructure","description":"Maîtrise des services cloud et de l''infrastructure","weight":"critical","positive_signals":["Multi-cloud ou expertise approfondie d''un cloud","Gestion des coûts","Sécurité by design"],"negative_signals":["Vendor lock-in sans raison","Pas de gestion des coûts"],"red_flags":["Aucune expérience cloud"]},
    {"name":"Automatisation et tooling","description":"Développement d''outils et automatisation de processus","weight":"important","positive_signals":["CLI tools bien conçus","Automatisation end-to-end","Idempotence"],"negative_signals":["Scripts one-shot","Pas de gestion d''erreurs"],"red_flags":["Processus manuels pour tout"]},
    {"name":"Networking et sécurité","description":"Compétences réseau et sécurité infrastructure","weight":"important","positive_signals":["Zero trust architecture","Service mesh","Gestion des secrets"],"negative_signals":["Réseau plat sans segmentation","Secrets en clair"],"red_flags":["Pas de chiffrement en transit"]},
    {"name":"Gestion de la configuration","description":"Stratégies de gestion de configuration à grande échelle","weight":"important","positive_signals":["GitOps","Configuration as Code","Drift detection"],"negative_signals":["Configuration manuelle","Pas de versioning"],"red_flags":["Modification directe en production"]},
    {"name":"Scalabilité et performance","description":"Conception pour la montée en charge","weight":"nice_to_have","positive_signals":["Auto-scaling intelligent","Load testing","Capacity planning"],"negative_signals":["Scaling manuel uniquement","Pas de métriques de performance"],"red_flags":["Ignorer les limites de capacité"]}
  ]'::jsonb,
  '[
    {"title":"Conception d''une plateforme développeur","description":"Concevoir une plateforme interne pour le déploiement d''applications","instructions":"Votre entreprise a 20 équipes de développement qui déploient des microservices. Concevez une plateforme interne qui leur permet de déployer, monitorer et gérer leurs services de manière autonome. Décrivez l''architecture, les API, et l''expérience développeur.","estimated_time_minutes":20,"criteria_evaluated":["Conception de plateforme interne","Cloud et infrastructure"],"rubric":"Évaluer la vision produit, l''expérience développeur, la faisabilité technique"},
    {"title":"Automatisation d''infrastructure","description":"Automatiser le provisioning d''un environnement complet","instructions":"Décrivez comment vous automatiseriez la création d''un nouvel environnement de staging complet (réseau, compute, base de données, monitoring). Quels outils utiliseriez-vous ? Comment gérez-vous les dépendances entre ressources et les secrets ?","estimated_time_minutes":15,"criteria_evaluated":["Automatisation et tooling","Networking et sécurité","Gestion de la configuration"],"rubric":"Évaluer le choix des outils, la gestion des dépendances, la sécurité"},
    {"title":"Stratégie de scaling","description":"Planifier la montée en charge d''une infrastructure","instructions":"Votre plateforme doit passer de 100 à 1000 services déployés. Quels sont les bottlenecks prévisibles ? Comment adaptez-vous l''infrastructure, le networking, et les outils de la plateforme ? Quelle stratégie de migration proposez-vous ?","estimated_time_minutes":10,"criteria_evaluated":["Scalabilité et performance","Cloud et infrastructure"],"rubric":"Évaluer l''anticipation des problèmes, le réalisme de la stratégie, l''approche progressive"}
  ]'::jsonb,
  '["Répondez en français ou en anglais","Soyez concis mais précis","Privilégiez les solutions pragmatiques","Mentionnez les trade-offs de vos choix"]'::jsonb,
  'Bienvenue dans cette évaluation technique Infrastructure & Platform. Vous allez être évalué(e) sur vos compétences en conception de plateformes, automatisation, et gestion d''infrastructure cloud.',
  45
WHERE NOT EXISTS (SELECT 1 FROM evaluation_templates WHERE role_type = 'infra_platform');

-- Backfill existing template-based attempts
UPDATE work_sample_attempts wsa
SET evaluation_template_id = et.id
FROM evaluation_templates et
JOIN jobs j ON j.role_type = et.role_type AND j.is_template = true
WHERE wsa.job_id = j.id;

-- Backfill evaluations
UPDATE evaluations e
SET evaluation_template_id = wsa.evaluation_template_id
FROM work_sample_attempts wsa
WHERE e.attempt_id = wsa.id AND wsa.evaluation_template_id IS NOT NULL;

-- Backfill proof_profiles
UPDATE proof_profiles pp
SET evaluation_template_id = wsa.evaluation_template_id
FROM work_sample_attempts wsa
WHERE pp.attempt_id = wsa.id AND wsa.evaluation_template_id IS NOT NULL;
