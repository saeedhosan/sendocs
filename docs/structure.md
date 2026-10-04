# Repository Structure — Technical Design

Sendocs uses a monorepo containing the API, web UI, and future mobile and desktop clients. Each deployable surface lives in its own top-level directory with independent dependencies and build configuration.

## Layout

```text
sendocs/
├── .github/          Automation
│   ├── workflows/    Dispatch and reusable per-surface workflows
│   ├── actions/      Shared composite steps
│   ├── dependabot.yml
│   └── CODEOWNERS
├── api/              Laravel API application
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   ├── docker/       Container entrypoint and PHP configuration
│   ├── Dockerfile    Development and production images
│   ├── composer.json
│   └── composer.lock
├── web/              React web application
│   ├── src/
│   ├── tests/
│   ├── docker/       Static server and API gateway configuration
│   ├── Dockerfile    Development and production images
│   ├── package.json
│   └── bun.lock
├── mobile/           Mobile client, when scheduled
├── desktop/          Desktop client, when scheduled
├── docs/             Design documents and OpenAPI contract
├── compose.yaml      Service composition for every environment
├── package.json      Root command surface
└── .env.example      Documented environment variables
```

## Ownership

| Directory  | Responsibility                                                                   |
| :--------- | :------------------------------------------------------------------------------- |
| `.github/` | Continuous integration, delivery, dependency updates                             |
| `api/`     | REST API, authentication, business rules, database, storage, queues, image build |
| `web/`     | Owner dashboard and client portal UI, image build                                |
| `mobile/`  | Future mobile client                                                             |
| `desktop/` | Future desktop client                                                            |
| `docs/`    | Product, technical, feature, and API documentation                               |

Each deployable owns its dependencies, configuration, tests, build process, and Dockerfile, including the lint and test commands its surface runs. The root `compose.yaml` owns only how the services are composed and run together, never how an application image is built, and Compose finds it and `.env` there without flags. The root otherwise holds only shared repository tooling.

## Toolchain

| Directory | Manifest        | Lockfile        | Dependencies        | Runtime |
| :-------- | :-------------- | :-------------- | :------------------ | :------ |
| `api/`    | `composer.json` | `composer.lock` | `api/vendor/`       | PHP 8.4 |
| `web/`    | `package.json`  | `bun.lock`      | `web/node_modules/` | Bun     |
| root      | `package.json`  | none            | none                | Node.js |

## Containers

Each surface builds its own image from a multi-stage Dockerfile. The `dev` target carries the toolchain; the `prod` target carries only what runs.

| Image | Dockerfile       | `dev` target                                 | `prod` target                                                     |
| :---- | :--------------- | :------------------------------------------- | :---------------------------------------------------------------- |
| API   | `api/Dockerfile` | PHP and Composer, `artisan serve --no-reload` on `8000`, entrypoint fills in a missing key | PHP-FPM on `9000`, no dev dependencies, configuration cached at start |
| Web   | `web/Dockerfile` | Bun and Vite on `3000`                      | nginx serving built assets, answering `/` and forwarding `/api` and `/health` to the API |

One Compose file, `compose.yaml` at the repository root, defines every service. Development and production differ only in which image each service runs, so there is no second Compose file.

| Service  | Purpose                                                              |
| :------- | :------------------------------------------------------------------- |
| `api`    | Laravel API, as a development server or as PHP-FPM                   |
| `worker` | Laravel queue worker for account email                               |
| `web`    | Vite development server, or the built assets behind nginx             |
| `db`     | PostgreSQL, the only stateful service                                 |

Every service runs in every environment. The API and the web service wait on `db` being healthy before they start; `web` waits only for the API container to exist, and Vite or nginx retries the first request until Laravel answers. Object storage is not part of this Compose file; the application uses local disk until the storage feature lands. Production runs the same file, so a deployment that uses managed PostgreSQL removes `db` from its copy of the file.

Source is never bind-mounted, so the image is the only copy of the code. `npm run dev` starts the services from the images `npm run build` produced, and an edit to application code needs that build to run again before it is visible. `env_file` hands every container the root `.env` as environment variables. The application key is handled by the API image rather than by a root command. `.env.example` ships a fixed development key, so `cp -n .env.example .env` gives every developer a working key without a generation step, and that key never changes while the file exists. The `dev` entrypoint covers a key that is missing or blank: it generates one, writes it to the image's own `.env`, and reuses it on later starts instead of generating again. Production takes `APP_KEY` from the deployment environment and never generates one, so recreating a container cannot invalidate encrypted data.

The browser always sees one origin. In development Vite forwards `/api` and `/health` to the API service; in production nginx forwards them to PHP-FPM. Sessions, cookies, and CSRF therefore behave the same in both. The API is also published on the loopback interface, which gives command-line tools such as `curl` and Laravel's own clients a direct address without involving the web service.

### Compose Variables

Compose reads these variables; the application does not. They live in the same root `.env` as the application variables.

| Variable             | Development         | Production  | Purpose                                                           |
| :------------------- | :------------------ | :---------- | :---------------------------------------------------------------- |
| `SENDOCS_API_IMAGE`  | `sendocs/api:local` | registry    | Image the API and worker run                                      |
| `SENDOCS_WEB_IMAGE`  | `sendocs/web:local` | registry    | Image the web service runs                                        |
| `SENDOCS_API_TARGET` | `dev`               | `prod`      | Dockerfile stage Compose builds                                   |
| `SENDOCS_WEB_TARGET` | `dev`               | `prod`      | Dockerfile stage Compose builds                                   |
| `WEB_PORT`           | `3000`              | `80`        | Port published on the host, and the port the container listens on |
| `WEB_BIND`           | `127.0.0.1`         | `0.0.0.0`   | Address the published web port binds to                           |
| `API_BIND`           | `127.0.0.1`         | `127.0.0.1` | Address the published API port binds to                           |
| `API_PORT`           | `8000`              | `8000`      | Port published on the host for the API                            |
| `POSTGRES_BIND`      | `127.0.0.1`         | `127.0.0.1` | Address the published database port binds to                      |

`artisan serve` keeps `--no-reload` because Laravel otherwise strips the environment from the server process and expects a `.env` file, which the containers do not carry; Compose supplies every variable instead. The flag also lets `PHP_CLI_SERVER_WORKERS` take effect.

`web/docker/nginx.conf` names the API service and its PHP-FPM port directly. Renaming the `api` service or moving it off port `9000` means editing that file.

Production is the same commands with production values in `.env`: set the variables above, then `npm run build` builds those images and `npm run start` runs them.

`nginx.conf` and `api/docker/php.ini` both accept slightly more than the 25 MB cap, so an oversized upload returns the API's documented `413` rather than being refused by a server. The cap itself stays owned by the API documentation.

## Environments

- Each application surface has its own environment configuration.
- `api/` contains application, database, storage, and other server-side configuration.
- `web/` contains only public configuration required by the browser.
- The root `.env` holds the variables Compose passes to every container. It is copied from `.env.example` and never committed.
- The `APP_KEY` in `.env.example` is a published development value, present so a fresh clone works and stable so encrypted data survives restarts. Production supplies its own and never reuses this one.
- Secrets must never appear in client bundles, build artifacts, or runtime payloads.

## Workflow Files

**Workflow Dispatches**

| Workflow file                   | Purpose                               |
| :------------------------------ | :------------------------------------ |
| `.github/workflows/tests.yml`   | Run all tests and checks              |
| `.github/workflows/build.yml`   | Build all available applications      |
| `.github/workflows/release.yml` | Create releases and release artifacts |
| `.github/workflows/deploy.yml`  | Deploy applications to production     |
| `.github/workflows/stage.yml`   | Deploy applications to staging        |
| `.github/workflows/codeql.yml`  | Scan client code and workflow files   |

**Workflow Templates**

Future work. Added per surface when a second surface repeats the same steps.

| Workflow file                         | Purpose                           |
| :------------------------------------ | :-------------------------------- |
| `.github/workflows/api-tests.yml`     | API-specific tests and checks     |
| `.github/workflows/api-build.yml`     | API-specific build steps          |
| `.github/workflows/web-tests.yml`     | Web-specific tests and checks     |
| `.github/workflows/web-build.yml`     | Web-specific build steps          |
| `.github/workflows/mobile-tests.yml`  | Mobile-specific tests and checks  |
| `.github/workflows/mobile-build.yml`  | Mobile-specific build steps       |
| `.github/workflows/desktop-tests.yml` | Desktop-specific tests and checks |
| `.github/workflows/desktop-build.yml` | Desktop-specific build steps      |

## Root Commands

The root `package.json` is the command surface for the whole repository. It orchestrates the applications; it holds no application configuration of its own.

| Command         | Purpose                            | Runs                                                    |
| :-------------- | :--------------------------------- | :------------------------------------------------------ |
| `npm run dev`   | Start every service                | The API, the web UI, the queue worker, and PostgreSQL         |
| `npm run test`  | Run all API and web tests          | Pest for the API, the web suite for the UI               |
| `npm run lint`  | Run all linters and static checks  | Pint for the API, ESLint and TypeScript for the UI       |
| `npm run build` | Build all applications             | The images named in `.env`, which carry Composer dependencies and built assets |

Supporting commands cover the steps around those four.

| Command              | Purpose                                                |
| :------------------- | :----------------------------------------------------- |
| `npm run setup`      | Create `.env`, build images, migrate                  |
| `npm run dev:api`    | Start the API and queue worker                         |
| `npm run dev:web`    | Start the web UI                                       |
| `npm run dev:worker` | Start the queue worker                                 |
| `npm run start`      | Run the configured images without rebuilding           |
| `npm run migrate`    | Run migrations against the local database              |

Every root command runs inside a container, so a green pipeline is reproducible on a developer machine and no host PHP, Bun, or PostgreSQL is needed. Each command delegates to the owning application: `composer test` and `composer lint` for the API, the Bun scripts for the web UI, and `npm run compose -- <arguments>`, which carries the shared Compose flags, for the services. The root holds no application configuration.

Static analysis for the API is not configured yet, so `npm run lint` checks formatting with Pint only. The web test runner is not configured yet, so `npm run test` runs its lint checks.

## Local Services

| Service    | Host port | Purpose                                                            |
| :--------- | :-------- | :----------------------------------------------------------------- |
| Web        | `3000`    | What the browser uses; serves the UI and proxies the API           |
| API        | `8000`    | Direct API address for command-line clients, bound to `127.0.0.1`   |
| PostgreSQL | `5432`    | The database, bound to `127.0.0.1`                                  |

Every published port binds to `127.0.0.1` unless `.env` says otherwise. Browser traffic goes to the web origin at `/api` and `/health`; other clients may use the API port directly.
