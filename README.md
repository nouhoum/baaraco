# Baara

Le recrutement basé sur le travail, pas les CV.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare                                │
│   (Proxy, SSL termination, WAF, Rate Limiting)                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Traefik v3                                  │
│   (Reverse proxy, Load balancer, TLS)                           │
└────────┬─────────────────┬──────────────────┬───────────────────┘
         │                 │                  │
         ▼                 ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────────┐
│   Web       │   │    API      │   │     Worker      │
│  (Remix)    │   │   (Go)      │   │     (Go)        │
│  Port 3000  │   │  Port 8080  │   │  Background     │
└─────────────┘   └──────┬──────┘   └────────┬────────┘
                         │                    │
         ┌───────────────┴────────────────────┤
         │                                    │
         ▼                                    ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  PostgreSQL │   │    Redis    │   │    MinIO    │
│   (DB)      │   │  (Queue)    │   │  (Storage)  │
└─────────────┘   └─────────────┘   └─────────────┘
```

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Web | Remix (React Router v7), Chakra UI v3 |
| API | Go 1.23, Chi, GORM |
| Worker | Go 1.23, Redis queue |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| Storage | MinIO (S3-compatible) |
| Proxy | Traefik v3 |
| CDN | Cloudflare |

## Structure du Projet

```
baara/
├── apps/
│   ├── api/           # API Go
│   ├── worker/        # Worker Go (jobs background)
│   └── web/           # Application Remix
├── pkg/               # Packages Go partagés
│   ├── database/      # Connexion GORM
│   ├── logger/        # Logger Zap
│   ├── mailer/        # SMTP mailer
│   ├── minio/         # Client MinIO
│   ├── redis/         # Client Redis
│   └── models/        # Modèles GORM
├── cmd/
│   ├── migrate/       # Outil de migration
│   └── seed-work-samples/  # Seeder
├── db/
│   ├── migrations/    # Migrations SQL
│   └── seeds/         # Données de seed
├── configs/           # Fichiers de configuration
├── deploy/
│   ├── traefik/       # Config Traefik
│   └── compose/       # Docker Compose
└── .github/workflows/ # CI/CD
```

## Prérequis

### Développement Local

```bash
# Go 1.23+
go version

# Node.js 22+
node --version

# Docker & Docker Compose
docker --version
docker compose version

# Taskfile (optionnel mais recommandé)
# https://taskfile.dev/installation/
brew install go-task/tap/go-task

# Outils Go
task install-tools
# ou manuellement:
go install github.com/air-verse/air@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

## Développement Local

### 1. Configuration

```bash
# Cloner le repo
git clone https://github.com/baaraco/baara.git
cd baara

# Copier le fichier d'environnement
cp .env.example .env

# Éditer les variables si nécessaire
vim .env
```

### 2. Lancer les dépendances

```bash
# Avec Taskfile
task dev:deps

# Ou manuellement
docker compose -f deploy/compose/docker-compose.dev.yml up -d
```

Services disponibles :
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `localhost:9000` (Console: `localhost:9001`)
- MailHog: `localhost:8025` (Web UI pour emails de test)

### 3. Migrations

```bash
# Appliquer les migrations
task db:migrate

# Voir le statut
task db:migrate:status

# Rollback
task db:migrate:down
```

### 4. Lancer l'application

```bash
# Tout en parallèle (API + Worker + Web)
task dev

# Ou séparément dans différents terminaux:
task dev:api     # API sur localhost:8080
task dev:worker  # Worker (background jobs)
task dev:web     # Web sur localhost:3000
```

### 5. Seed des données (optionnel)

```bash
# Dry run (voir ce qui sera créé)
task db:seed:dry-run

# Exécuter le seed
task db:seed
```

## API Endpoints

### Public

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/public/waitlist/recruiter` | Inscription recruteur |
| POST | `/public/waitlist/candidate` | Inscription candidat |

### API v1

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/uploads/presign` | Génère URL upload MinIO |

### Health

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/healthz` | Liveness probe |
| GET | `/readyz` | Readiness probe (vérifie DB, Redis, MinIO) |

### Exemples

```bash
# Inscription waitlist recruteur
curl -X POST http://localhost:8080/public/waitlist/recruiter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","company":"ACME Corp"}'

# Health check
curl http://localhost:8080/healthz

# Readiness check
curl http://localhost:8080/readyz
```

## Déploiement avec Dokploy

### 1. Build des images

```bash
# Build toutes les images
task docker:build

# Ou individuellement
task docker:build:api
task docker:build:worker
task docker:build:web
```

### 2. Push vers un registry

```bash
# Variables à définir
export REGISTRY=ghcr.io/baaraco
export TAG=v1.0.0

task docker:push REGISTRY=$REGISTRY TAG=$TAG
```

### 3. Configuration Dokploy

Dans Dokploy, créer un nouveau projet avec les variables d'environnement:

```env
# Images
API_IMAGE=ghcr.io/baaraco/baara-api:v1.0.0
WEB_IMAGE=ghcr.io/baaraco/baara-web:v1.0.0
WORKER_IMAGE=ghcr.io/baaraco/baara-worker:v1.0.0

# Database
DB_USER=baara
DB_PASSWORD=<strong-password>
DB_NAME=baara

# Redis
REDIS_PASSWORD=<strong-password>

# MinIO
MINIO_ACCESS_KEY=<access-key>
MINIO_SECRET_KEY=<secret-key>
MINIO_BUCKET=baara-uploads

# SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
SMTP_FROM=noreply@baara.co

# Security
JWT_SECRET=<long-random-string>

# Domains
DOMAIN=baara.co
API_DOMAIN=api.baara.co
APP_DOMAIN=app.baara.co
```

### 4. Lancer le stack

```bash
# Via Docker Compose
docker compose -f deploy/compose/docker-compose.prod.yml up -d

# Voir les logs
docker compose -f deploy/compose/docker-compose.prod.yml logs -f

# Status
docker compose -f deploy/compose/docker-compose.prod.yml ps
```

## Cloudflare Configuration

### DNS Records

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | `<VPS_IP>` | Proxied |
| A | app | `<VPS_IP>` | Proxied |
| A | api | `<VPS_IP>` | Proxied |

### SSL/TLS

1. **SSL/TLS > Overview**: Sélectionner **Full (strict)**
2. **SSL/TLS > Edge Certificates**:
   - Always Use HTTPS: ✅
   - Automatic HTTPS Rewrites: ✅
   - Minimum TLS Version: TLS 1.2

### Page Rules / Cache Rules

```
# Cache assets statiques
*baara.co/_next/static/*
Cache Level: Cache Everything, Edge TTL: 1 month

# Ne pas cacher l'API
*api.baara.co/*
Cache Level: Bypass
```

### Rate Limiting (WAF)

```
# Protection auth
URI Path contains: /auth OR /login OR /waitlist
Requests: 20 per 1 minute
Action: Block for 10 minutes
```

## Conventions

### Git

- `main`: Production
- `develop`: Développement
- Feature branches: `feature/<name>`
- Hotfix branches: `hotfix/<name>`

### Commits

Utiliser [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add waitlist registration
fix: correct email validation
docs: update README
chore: update dependencies
```

### Code Go

- Suivre les conventions Go standard
- Utiliser `golangci-lint` avant chaque commit
- Packages internes dans `internal/`
- Packages partagés dans `pkg/`

### Code TypeScript

- ESLint + TypeScript strict
- Composants dans `app/components/`
- Routes dans `app/routes/`

## Tests

```bash
# Tests Go
task test

# Tests avec coverage
task test:coverage

# Tests Web
task test:web

# Linting
task lint
```

## Maintenance

### Migrations

```bash
# Créer une nouvelle migration
# Fichiers à créer manuellement dans db/migrations/
# Format: XXXXXX_description.up.sql / XXXXXX_description.down.sql

# Appliquer
task db:migrate

# Rollback
task db:migrate:down

# Reset complet (dev only!)
task db:reset
```

### Logs en production

```bash
# Tous les services
docker compose -f deploy/compose/docker-compose.prod.yml logs -f

# Service spécifique
docker compose -f deploy/compose/docker-compose.prod.yml logs -f api
docker compose -f deploy/compose/docker-compose.prod.yml logs -f worker
```

### Backup

Les backups sont gérés par l'infrastructure Ansible (voir `/infra`).

## Troubleshooting

### API ne démarre pas

```bash
# Vérifier les logs
docker compose logs api

# Vérifier la connexion DB
docker compose exec postgres psql -U baara -d baara -c "SELECT 1"
```

### Emails non envoyés

```bash
# Vérifier les logs du worker
docker compose logs worker

# En dev, vérifier MailHog: http://localhost:8025
```

### MinIO inaccessible

```bash
# Vérifier le service
docker compose exec minio mc ready local

# Console MinIO: http://localhost:9001 (dev)
```

## License

Propriétaire - Baara © 2024
