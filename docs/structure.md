# Repository Structure — Technical Design

Sendocs uses a monorepo containing the API, web UI, and future mobile and desktop clients. Each deployable surface lives in its own top-level directory with independent dependencies and build configuration.

## Layout

```text
sendocs/
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
- Secrets must never be included in client bundles, build artifacts, or runtime payloads.

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

## Local Services

| Service    | Port   | Purpose                        |
| :--------- | :----- | :----------------------------- |
| API        | `8000` | Local API server               |
| Web        | `3000` | Vite development server        |
| PostgreSQL | `5432` | Local database                 |
| MinIO API  | `9000` | S3-compatible storage endpoint |
| MinIO UI   | `9001` | Local storage administration   |
