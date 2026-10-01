# Nexera Group API deployment

| Environment | Public domain | Host port | Deployment folder |
| --- | --- | --- | --- |
| Staging | `staging-api.nexeragroup.rw` | `10151` | `/home/yves/nexera-group/staging/server` |
| Production | `api.nexeragroup.rw` | `10141` | `/home/yves/nexera-group/prod/server` |

The stack has three private services: PostgreSQL 17, Redis 7, and the NestJS API. The API listens on port `3000` in staging and production; Docker exposes only the API to loopback, while Nginx owns public HTTP and HTTPS.

Before a first deployment, create the runtime configuration on the server at the application's root: `.env.staging` or `.env.prod`. These files are deliberately excluded from Git and from synchronization. Use real environment-specific credentials and production secrets—never placeholder values. `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` must exactly match the corresponding `DATABASE_*` values because PostgreSQL reads the first set only when its data directory is empty. Compose passes the file to the services, while explicitly setting the deployed `NODE_ENV`, port, API/worker role, and one trusted Nginx proxy hop.

Both Compose files join the environment network (`nexera-group-staging-network` or `nexera-group-prod-network`). The deployment workflows create it when missing. PostgreSQL and Redis data persist at `/home/yves/nexera-group/staging/data` or `/home/yves/nexera-group/prod/data` and are never published to the host network.

Install the matching Nginx configuration from `deploy/nginx/` in `/etc/nginx/sites-available/`, enable it from `sites-enabled/`, provision the matching Let's Encrypt certificate, run `nginx -t`, and reload Nginx.

The GitHub `staging` and `production` environments require `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`, `DEPLOY_SSH_KEY`, and `DEPLOY_KNOWN_HOSTS`. The workflows create the service/data folders and network, synchronize source without replacing the runtime environment file, build the image, wait for the API health check, and run the idempotent default-administrator seed.

The API starts only after PostgreSQL and Redis report healthy. TypeORM applies the versioned schema migrations on startup; `pnpm test:migrations` verifies them against two disposable PostgreSQL databases when a local PostgreSQL role with `CREATEDB` is available.

```bash
# From server/
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml config
docker compose --env-file deploy/.env.prod -f deploy/compose.prod.yml config
```
