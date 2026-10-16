# Production

Building and running Sendocs with production images, and how releases ship. For local development, see [development.md](development.md).

## Production Images

Each surface has a `prod` Dockerfile target, separate from `dev`:

| Image | Dockerfile       | `dev` target              | `prod` target                                                 |
| :---- | :--------------- | :------------------------ | :------------------------------------------------------------ |
| API   | `api/Dockerfile` | `artisan serve` on `8000` | PHP-FPM on `9000`, no dev dependencies, config cached at start |
| Web   | `web/Dockerfile` | Vite on `3000`            | nginx serving built assets, forwarding `/api` and `/health` to the API |

## Running in Production Mode

Set `API_TARGET=prod` and `WEB_TARGET=prod` in `.env`, then use the same commands as the development quick start:

```bash
cp -n .env.example .env          # set API_TARGET=prod and WEB_TARGET=prod
docker compose build             # Build production images
docker compose run --rm migrate  # Run database migrations
docker compose up -d             # Start production services
```

The app is served at [http://localhost:3000](http://localhost:3000). In production the web image's nginx serves the built bundle and forwards `/api` and `/health` to the API's PHP-FPM, so the browser stays same-origin.

To expose the app publicly, bind the published ports to all interfaces by setting `WEB_BIND=0.0.0.0` (and `API_BIND=0.0.0.0` if the API must be reachable) in `.env` before starting.

## Environment Variables

Compose reads these variables from the root `.env`; the application does not.

| Variable        | Default     | Purpose                                        |
| :-------------- | :---------- | :--------------------------------------------- |
| `API_TARGET`    | `dev`       | Dockerfile stage built for the API and worker  |
| `WEB_TARGET`    | `dev`       | Dockerfile stage built for the web service     |
| `WEB_BIND`      | `127.0.0.1` | Address the published web port binds to        |
| `WEB_PORT`      | `3000`      | Port published for the web service             |
| `API_BIND`      | `127.0.0.1` | Address the published API port binds to        |
| `API_PORT`      | `8000`      | Port published for the API                     |
| `POSTGRES_BIND` | `127.0.0.1` | Address the published PostgreSQL port binds to |

Set `APP_KEY` to a production value; never reuse the development key from `.env.example`.

## Deployment

Releases deploy automatically over GitHub Actions:

- Pushing to `stage` updates staging.
- Pushing a `v*` tag already in `main` releases production.

See [deployment.md](deployment.md) for required secrets, release steps, health checks, and limitations of the current SCP-based deployment.
