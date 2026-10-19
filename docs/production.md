# Production

How to run and deploy production. For local development, see [development.md](development.md).

## Production Mode

Set `API_TARGET=prod` and `WEB_TARGET=prod` in `.env`, then run the commands from the development Quick Start:

```bash
cp -n .env.example .env          # set API_TARGET=prod and WEB_TARGET=prod
docker compose build             # build production images
docker compose run --rm migrate  # run database migrations
docker compose up -d             # start production services
```

- Web: [http://localhost:3000](http://localhost:3000); nginx serves the bundle and proxies `/api` and `/health` to PHP-FPM.
- Set `WEB_BIND=0.0.0.0` to expose publicly; `API_BIND=0.0.0.0` only to reach the API directly.
- Set `APP_KEY` to a production value, never the development key.
- Set `S3_BROWSER_ENDPOINT` to the HTTPS S3 API endpoint that clients' browsers can reach.

## Compose Variables

Compose reads these from the root `.env`; the application does not.

| Variable        | Default     | Purpose                                        |
| :-------------- | :---------- | :--------------------------------------------- |
| `API_TARGET`    | `dev`       | Dockerfile stage built for the API and worker  |
| `WEB_TARGET`    | `dev`       | Dockerfile stage built for the web service     |
| `WEB_BIND`      | `127.0.0.1` | Address the published web port binds to        |
| `WEB_PORT`      | `3000`      | Port published for the web service             |
| `API_BIND`      | `127.0.0.1` | Address the published API port binds to        |
| `API_PORT`      | `8000`      | Port published for the API                     |
| `POSTGRES_BIND` | `127.0.0.1` | Address the published PostgreSQL port binds to |
| `S3_BROWSER_ENDPOINT` | `http://localhost:9000` | Browser-reachable S3 endpoint used when signing downloads; HTTPS is required in production |

## Deployment

Two environments deploy over GitHub Actions using a cPanel SSH/SCP model.

| Environment | Trigger                             | Workflow                       |
| :---------- | :---------------------------------- | :----------------------------- |
| Stage       | push to `stage`, or manual dispatch | `.github/workflows/stage.yml`  |
| Production  | `v*` tag contained in `main`        | `.github/workflows/deploy.yml` |

The published [API reference](https://saeedhosan.github.io/sendocs/) is built by `.github/workflows/docs.yml`. Its build job reads `API_URL` from the `production` GitHub Actions environment and substitutes that value into the generated copy of `api/docs/openapi.yaml`. The source contract keeps `http://127.0.0.1:8000` for local development; the workflow does not modify the source file.

Configure these secrets per environment under **Settings → Environments**:

| Secret     | Purpose                                                              |
| :--------- | :------------------------------------------------------------------- |
| `API_URL`  | Base URL of that environment's Laravel API, without a trailing slash |
| `SSH_HOST` | SSH hostname                                                         |
| `SSH_USER` | SSH username                                                         |
| `SSH_PORT` | SSH port                                                             |
| `SSH_KEY`  | Private key accepted by the server                                   |
| `WEB_PATH` | Absolute remote directory served by the frontend domain              |
| `API_PATH` | Absolute remote Laravel application directory                        |

Each environment uses its own `API_URL` because the URL is embedded in the frontend build. Never place production credentials in the staging environment.

### Release

The tag must point to a commit already in `main`. The workflow runs API and web checks, then deploys through the `production` Environment, where reviewers can be required.

```bash
git switch main
git pull --ff-only origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

The tag triggers deployment; a GitHub Release is optional. Protect release tags with repository rulesets.

### Limits

- SCP copies into the live directories: not atomic, not zero-downtime, no rollback when a health check fails.
- Keep migrations backward-compatible.
- Retain a known-good copy before each production deployment.
