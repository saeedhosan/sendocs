# Deployment and Releases

## Environments

Sendocs deploys to two separate environments:

- **Stage** deploys the exact commit tested by the CI workflow after CI succeeds on `main`.
- **Production** deploys a version tag such as `v1.0.0`. The workflow rejects tags whose commit has not been merged into `main`.

Both workflows use the cPanel SSH/SCP deployment model. Configure the following secrets in **Settings → Environments** for both the `stage` and `production` environments. Use environment-specific values for the host paths and API URL.

| Secret | Purpose |
| --- | --- |
| `API_URL` | Base URL of that environment's Laravel API, without a trailing slash |
| `SSH_HOST` | SSH hostname |
| `SSH_USER` | SSH username |
| `SSH_PORT` | SSH port |
| `SSH_KEY` | Private key accepted by the server |
| `WEB_PATH` | Absolute remote directory served by the frontend domain |
| `API_PATH` | Absolute remote Laravel application directory |

Do not commit secrets or put production credentials in the staging environment. The frontend API URL is embedded in its build, so staging and production must use their own `API_URL`.

## Staging

`.github/workflows/stage.yml` listens for completion of the `CI` workflow on `main`. It deploys only when CI succeeds and checks out the exact commit from that CI run, rather than a potentially newer `main` commit.

The workflow builds the React app, installs production Composer dependencies, uploads the API and frontend, runs migrations, clears Laravel's optimized caches, and checks Laravel's standard `/up` health endpoint.

## Production releases

`.github/workflows/deploy.yml` runs when a tag matching `v*` is pushed. The release must point to a commit already merged into `main`. It runs API and web checks before deploying and uses the `production` GitHub Environment, where required reviewers can be configured under **Settings → Environments → production**.

Create a release tag only after the exact commit has been tested on staging:

```bash
git switch main
git pull --ff-only origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

A GitHub Release is optional; pushing the tag is what triggers deployment. Protect release tags through repository rulesets where available.

## Operational limits

The current shared-hosting deployment copies files into the live directories over SCP. It is not an atomic, zero-downtime release and does not automatically roll back uploaded files if a health check fails. Keep database migrations backward-compatible and retain a known-good copy before production deployments. A later improvement can switch to versioned release directories and an atomic symlink swap if the hosting account supports it.
