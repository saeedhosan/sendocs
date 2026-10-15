# Deployment and Releases

## Environments

Sendocs deploys to two separate environments:

- **Stage** deploys the current **stage** branch, on push or on demand.
- **Production** deploys a version tag such as **v1.0.0**.

Both workflows use the cPanel SSH/SCP deployment model. Configure the following secrets in **Settings → Environments** for both the **stage** and **production** environments. Use environment-specific values for URLs and host paths.

| Secret | Purpose |
| --- | --- |
| **API_URL** | Base URL of that environment's Laravel API, without a trailing slash |
| **WEB_URL** | Frontend URL used for the post-deployment health check |
| **SSH_HOST** | SSH hostname |
| **SSH_USER** | SSH username |
| **SSH_PORT** | SSH port |
| **SSH_KEY** | Private key accepted by the server |
| **WEB_PATH** | Absolute remote directory served by the frontend domain |
| **API_PATH** | Absolute remote Laravel application directory |

Do not commit secrets or put production credentials in the staging environment. The workflows read environment-scoped secrets from jobs attached to the matching GitHub Environment. The frontend API URL is embedded in its build, so staging and production must use their own **API_URL**.

## Staging

The **.github/workflows/stage.yml** workflow runs on push to the **stage** branch and on manual **workflow_dispatch**. Both API and web jobs explicitly check out **stage**, so manually dispatching the workflow from another selected branch still deploys the staging branch.

The workflow installs production Composer dependencies and builds the React app before uploading. It deploys the API first, runs migrations, clears Laravel's optimized caches, checks the API health endpoint, then deploys and checks the frontend. Health checks use bounded connection, request, and retry timeouts.

Promote **main** into **stage** only when you want to update staging, so repeated merges to **main** never trigger cPanel deployments.

## Production releases

The **.github/workflows/deploy.yml** workflow runs when a tag matching **v*** is pushed. The release must point to a commit already merged into **main**. API and web jobs use the production GitHub Environment, where required reviewers can be configured under **Settings → Environments → production**.

The workflow installs production Composer dependencies and builds the web assets before each corresponding deployment. After deploying the API, it runs migrations, clears Laravel's optimized caches, and checks API health; the frontend is deployed and checked only after the API job succeeds. These are deployment health checks, not a substitute for the CI test suite.

Create a release tag only after the exact commit has passed CI and been tested on staging:

~~~bash
git switch main
git pull --ff-only origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
~~~

A GitHub Release is optional; pushing the tag is what triggers deployment. Protect release tags through repository rulesets where available.

## Operational limits

The current shared-hosting deployment copies files into the live directories over SCP. It is not an atomic, zero-downtime release and does not automatically roll back uploaded files if a health check fails. The API files are uploaded before migrations run, so a failed migration can leave the new code in the live directory; a failed frontend deployment can also leave API and web versions mismatched. Keep database migrations backward-compatible and retain a known-good copy before production deployments. A later improvement can switch to versioned release directories and an atomic symlink swap if the hosting account supports it.
