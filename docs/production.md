# Production

How production images are built and deployed. For local development, see [development.md](development.md).

## Images

Each surface has a `prod` Dockerfile target: `dev` carries the toolchain, `prod` carries only what runs.

| Image | Dockerfile       | `dev` target              | `prod` target                                                         |
| :---- | :--------------- | :------------------------ | :-------------------------------------------------------------------- |
| API   | `api/Dockerfile` | `artisan serve` on `8000` | PHP-FPM on `9000`, no dev dependencies, configuration cached at start |
| Web   | `web/Dockerfile` | Vite on `3000`            | nginx serving built assets, forwarding `/api` and `/health` to the API |

## Production Mode

Set `API_TARGET=prod` and `WEB_TARGET=prod` in `.env`, then run the commands from the development Quick Start:

```bash
cp -n .env.example .env          # set API_TARGET=prod and WEB_TARGET=prod
docker compose build             # build production images
docker compose run --rm migrate  # run database migrations
docker compose up -d             # start production services
```

- Web is served at [http://localhost:3000](http://localhost:3000); nginx serves the built bundle and forwards `/api` and `/health` to PHP-FPM, keeping the browser same-origin.
- Set `WEB_BIND=0.0.0.0` to expose the app publicly, and `API_BIND=0.0.0.0` only when the API must be reachable directly.
- Set `APP_KEY` to a production value and never reuse the development key from `.env.example`.

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

## Deployment

Two environments deploy over GitHub Actions using a cPanel SSH/SCP model.

| Environment | Trigger                             | Workflow                       |
| :---------- | :---------------------------------- | :----------------------------- |
| Stage       | push to `stage`, or manual dispatch | `.github/workflows/stage.yml`  |
| Production  | `v*` tag contained in `main`        | `.github/workflows/deploy.yml` |

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

### Staging

Promote `main` into `stage` only to update staging, so repeated merges do not hammer the cPanel SSH endpoint. The workflow builds the React app, installs production Composer dependencies, uploads the API and frontend, runs migrations, clears Laravel's optimized caches, and checks `/health`.

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

Deployment copies files into the live directories over SCP, so it is not atomic or zero-downtime and does not roll back uploaded files when a health check fails. Keep migrations backward-compatible and retain a known-good copy before each production deployment.
