# Deployment Guide (AWS EC2 + Docker + Nginx + GitHub Actions)

## 1) EC2 setup

- Recommended instance: **t3.small** (2 vCPU burst, 2GB RAM).
- OS: **Ubuntu 22.04 LTS**.
- Security group inbound rules:
  - TCP **22** (SSH) from your IP
  - TCP **80** (HTTP) from 0.0.0.0/0
  - TCP **443** (HTTPS) from 0.0.0.0/0

## 2) Run one-time server bootstrap

On the EC2 host, run:

- Copy [scripts/setup-ec2.sh](scripts/setup-ec2.sh) to the server
- Execute it once to install Docker, Docker Compose plugin, and Certbot

After completion, reconnect to the server (or run `newgrp docker`) so docker-group membership is active.

## 3) Clone repo and configure environment

On EC2:

1. Clone this repository into `/home/ubuntu/app`.
2. Create `/home/ubuntu/app/.env.production` from [.env.production.example](.env.production.example).
3. Fill all values with real production credentials.

## 4) Required GitHub Secrets

Set these repository secrets:

### Infrastructure
- `EC2_HOST`
- `EC2_SSH_KEY`
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

### Public build-time vars (`NEXT_PUBLIC_*`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_EDITOR_DEFAULT_TITLE`
- `NEXT_PUBLIC_ALLOW_GUEST_WRITE`
- `NEXT_PUBLIC_DEFAULT_WORKSPACE_ID`

### Runtime private/server vars (store in EC2 `.env.production`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_DB_URL`
- `COLLAB_TOKEN_SECRET`
- `COLLAB_TOKEN_TTL_SECONDS`
- `COLLAB_DISABLE_PERSISTENCE`
- `COLLAB_UPDATE_FLUSH_MS`
- `COLLAB_VERSION_INTERVAL`
- `GROQ_API_KEY`
- `GROQ_MODEL_NAME`
- `HOCUSPOCUS_HOST`
- `HOCUSPOCUS_PORT`
- `DOCKER_USERNAME`

## 5) SSL certificate setup (Let's Encrypt)

Initial certificate issuance (before HTTPS container traffic):

1. Point DNS `A` records for `pruthvi.tech` and `www.pruthvi.tech` to EC2 public IP.
2. Obtain certs on host:
   - `sudo certbot certonly --standalone -d pruthvi.tech -d www.pruthvi.tech`
3. Copy cert files into [nginx/ssl/.gitkeep](nginx/ssl/.gitkeep) directory location on server:
   - `/home/ubuntu/app/nginx/ssl/fullchain.pem`
   - `/home/ubuntu/app/nginx/ssl/privkey.pem`

The Nginx config keeps `/.well-known/acme-challenge/` available on HTTP for renewal workflows.

## 6) First deploy

From `/home/ubuntu/app` on EC2:

1. Pull or build images:
   - `docker compose --env-file .env.production pull`
   - `docker compose --env-file .env.production up -d --remove-orphans`
2. Verify:
   - `docker compose ps`
   - Health endpoint through proxy: `https://pruthvi.tech/api/health`

## 7) CI/CD flow after first deploy

- Workflow file: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- Trigger: push to `main`
- Pipeline:
  1. Test (`npm ci`, `tsc --noEmit`, lint if present)
  2. Build and push Docker images to Docker Hub
  3. SSH into EC2 and run:
     - `docker compose pull`
   - `docker compose --env-file .env.production up -d --remove-orphans`
     - `docker system prune -f`

After this, deployment is automatic on every push to `main`.
