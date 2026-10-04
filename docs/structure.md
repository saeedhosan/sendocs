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
│   ├── composer.json
│   └── composer.lock
├── web/              React web application
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── package-lock.json
├── mobile/           Mobile client, when scheduled
├── desktop/          Desktop client, when scheduled
├── docker/           Local development containers
│   ├── compose.yaml
│   └── ...
├── docs/             Design documents and OpenAPI contract
├── package.json      Root command surface
├── package-lock.json
└── .env.example      Documented environment variables
```

## Ownership

| Directory  | Responsibility                                                      |
| :--------- | :------------------------------------------------------------------ |
| `.github/` | Continuous integration, delivery, dependency updates                |
| `api/`     | REST API, authentication, business rules, database, storage, queues |
| `web/`     | Owner dashboard and client portal UI                                |
| `mobile/`  | Future mobile client                                                |
| `desktop/` | Future desktop client                                               |
| `docker/`  | Local development services and container configuration              |
| `docs/`    | Product, technical, feature, and API documentation                  |

Each deployable owns its dependencies, configuration, tests, and build process. The root contains only shared repository tooling.

## Toolchain

| Directory | Manifest        | Lockfile            | Dependencies        | Runtime |
| :-------- | :-------------- | :------------------ | :------------------ | :------ |
| `api/`    | `composer.json` | `composer.lock`     | `api/vendor/`       | PHP 8.4 |
| `web/`    | `package.json`  | `package-lock.json` | `web/node_modules/` | Node.js |
| root      | `package.json`  | `package-lock.json` | none                | Node.js |

## Environments

- Each application surface has its own environment configuration.
- `api/` contains application, database, storage, and other server-side configuration.
- `web/` contains only public configuration required by the browser.
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

| Command              | Purpose                                       |
| :------------------- | :-------------------------------------------- |
| `npm run dev`        | Start the local API, web UI, and queue worker |
| `npm run dev:api`    | Start the API and queue worker                |
| `npm run dev:web`    | Start the web UI                              |
| `npm run dev:worker` | Start the queue worker                        |
| `npm run dev:mobile` | Start the mobile client when available        |
| `npm run build`      | Build all available applications              |
| `npm run test`       | Run all tests and checks                      |
| `npm run lint`       | Run all linters                               |

Every root command runs the same checks as its `tests.yml` job, so a green pipeline is reproducible on a developer machine.

## Local Services

| Service    | Port   | Purpose                        |
| :--------- | :----- | :----------------------------- |
| API        | `8000` | Local API server               |
| Web        | `3000` | Vite development server        |
| PostgreSQL | `5432` | Local database                 |
| MinIO API  | `9000` | S3-compatible storage endpoint |
| MinIO UI   | `9001` | Local storage administration   |
