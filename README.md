# Projects Microservice

Микросервис управления проектами и релизами в составе **Developer Platform (OnlySpans)**. Входит в конфигурационный слой
платформы и отвечает за хранение метаданных проектов, версионирование релизов и координацию с сервисами доставки.

## Описание

**Projects** — центральный сервис для работы с проектами разработки: CRUD проектов и релизов, тегирование, жизненный
цикл (development → testing → staging → production) и передача структуры релиза в **Snapper** для создания снапшотов и
доставки.

### Роль в архитектуре

```
targets-plane → projects → processes / variables / assets
                      ↓
                    snapper
```

- **REST API** — для фронтенда: управление проектами, релизами и тегами через HTTP/JSON.
- **gRPC API** — для микросервисов: типобезопасное взаимодействие (targets-plane, snapper и др.), получение структуры
  релиза.
- В потоке **создания релиза**: валидация конфигурации и передача структуры релиза в Snapper после создания снапшота.
- В потоке **доставки релиза**: хранение и обновление метаданных проектов и релизов, координация с processes.

### Основные сущности

| Сущность        | Описание                                                                                                                                                                                                                                           |
|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Project**     | Проект: название, slug (уникальный), imageUrl, emoji, статус (active/archived/suspended), владелец, **environmentIds** (привязка к пайплайну окружений), теги, произвольные metadata. Связан с релизами и тегами. Иконку можно загрузить через S3. |
| **Release**     | Релиз версии проекта: semver, снапшот из Snapper, changelog, notes, структура конфигурации (processes, variables, assets) для доставки. Статус и продвижение по стадиям (dev → prod) ведёт сервис ответсвенный за деплой.                          |
| **Tag**         | Тег для категоризации проектов: имя, описание, цвет (hex). Связь многие-ко-многим с проектами.                                                                                                                                                     |
| **Environment** | Окружение (этап пайплайна): имя, описание, цвет (hex), **position** (глобальный порядок в каталоге). Проекты ссылаются на окружения через `Project.environmentIds` (массив UUID).                                                                  |

### Стек

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** [NestJS](https://nestjs.com) 11
- **Database:** PostgreSQL
- **ORM:** Prisma
- **API:** REST (Express), gRPC (Protocol Buffers), [Swagger](https://swagger.io) (OpenAPI)
- **Хранилище файлов:** S3-совместимое (Yandex Object Storage) — иконки проектов
- **Валидация:** class-validator, class-transformer

Подробные требования и описание API — в [.agents/guide.md](.agents/guide.md). Спецификация и обсуждение в
репозитории [onlyspans/issues](https://github.com/onlyspans/issues) (issues по projects).

---

## Требования

- [Bun](https://bun.sh) ≥ 1.0
- PostgreSQL 16 (или использовать Docker)
- (опционально) Docker / Docker Compose — для запуска PostgreSQL или полного стека

---

## Быстрый старт

### 1. Установка зависимостей

```bash
bun install
```

### 2. Переменные окружения

Скопируйте пример и при необходимости отредактируйте:

```bash
cp .env.example .env
```

Основные переменные (значения по умолчанию из `.env.example`):

| Переменная             | Описание                                        | По умолчанию                                                |
|------------------------|-------------------------------------------------|-------------------------------------------------------------|
| `NODE_ENV`             | Окружение                                       | `development`                                               |
| `PORT`                 | Порт HTTP API                                   | `4000`                                                      |
| `GRPC_PORT`            | Порт gRPC                                       | `4001`                                                      |
| `DATABASE_URL`         | DSN подключения к PostgreSQL                    | `postgresql://postgres:postgres@localhost:5432/projects_db` |
| `CORS_ORIGIN`          | Разрешённые origins для CORS                    | см. `.env.example`                                          |
| `S3_BUCKET`            | Имя бакета S3 (обязательно для загрузки иконок) | —                                                           |
| `S3_ACCESS_KEY_ID`     | Ключ доступа S3                                 | —                                                           |
| `S3_SECRET_ACCESS_KEY` | Секретный ключ S3                               | —                                                           |
| `S3_ENDPOINT`          | (опц.) Endpoint S3                              | `https://storage.yandexcloud.net`                           |
| `S3_REGION`            | (опц.) Регион                                   | `ru-central1`                                               |
| `DB_LOG_QUERIES`       | (опц.) Prisma query logging                     | `false`                                                     |
| `DB_LOG_LEVEL`         | (опц.) Prisma log level                         | `warn`                                                      |
| `RUN_SEED`             | (опц.) Выполнить сид при старте                 | `false`                                                     |

Для загрузки иконок проектов (`POST /api/projects/:id/icon`) нужны переменные S3; без них эндпоинт вернёт ошибку.

### 3. Запуск PostgreSQL (Docker)

Если PostgreSQL не установлен локально:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Проверка: `docker compose -f docker-compose.dev.yml ps` — сервис `postgres` должен быть в состоянии `running`.

### 4. Запуск приложения

```bash
# Режим разработки (watch)
bun run start:dev
```

После запуска:

- REST API: `http://localhost:${PORT}/api`
- Swagger: `http://localhost:${PORT}/api-docs`
- gRPC: `0.0.0.0:${GRPC_PORT}`
- Liveness probe: `GET /healthz`
- Readiness probe (проверяет БД): `GET /readyz`

---

## Скрипты

| Команда                         | Описание                                          |
|---------------------------------|---------------------------------------------------|
| `bun run start`                 | Запуск без watch                                  |
| `bun run start:dev`             | Запуск в режиме разработки (watch)                |
| `bun run start:debug`           | Запуск с отладчиком                               |
| `bun run start:prod`            | Запуск собранного приложения (`bun dist/main`)    |
| `bun run build`                 | Генерация Prisma client + сборка Nest + tsc-alias |
| `bun run lint`                  | ESLint с автоисправлением                         |
| `bun run format`                | Prettier по `src` и `test`                        |
| `bun run test`                  | Unit-тесты                                        |
| `bun run test:e2e`              | E2E-тесты                                         |
| `bun run test:cov`              | Покрытие тестами                                  |
| `bun run prisma:studio`         | Prisma Studio                                     |
| `bun run prisma:migrate:dev`    | Prisma migrate dev (локальная разработка)         |
| `bun run prisma:migrate:deploy` | Prisma migrate deploy (staging/production)        |
| `bun run db:seed`               | Запуск сида (Prisma)                              |

### Миграции (Prisma)

Для development обычно используют `prisma migrate dev`. Для staging/production — `prisma migrate deploy`.

```bash
# development (создаёт/применяет миграции)
bun run prisma:migrate:dev

# production/staging (только применяет уже существующие миграции)
bun run prisma:migrate:deploy
```

---

## Сидер

Сид можно запустить вручную:

```bash
bun run db:seed
```

Также можно включить автозапуск при старте через `RUN_SEED=true` (см. `.env.example`).

---

## API

### REST

- Базовый префикс: `/api`
- Документация: **GET** `/api-docs` (Swagger UI)

Примеры эндпоинтов:

- **Projects:** `GET/POST /api/projects`, `GET /api/projects/by-slug/:slug`, `GET/PATCH/DELETE /api/projects/:id`,
  `POST /api/projects/:id/icon` (загрузка иконки, multipart/form-data, поле `file`, PNG/JPEG/GIF/WebP до 2 MB)
- **Releases:** `GET/POST /api/releases`, `GET/PATCH/DELETE /api/releases/:id`
- **Tags:** `GET/POST /api/tags`, `GET/PATCH/DELETE /api/tags/:id`
- **Environments:** `GET/POST /api/environments`, `GET/PATCH/DELETE /api/environments/:id`,
  `PUT /api/environments/reorder`

Поддерживаются query-параметры для пагинации и фильтрации (в т.ч. поиск по name, slug, description). Подробнее — в
Swagger.

### gRPC

- Proto-файл: `src/proto/projects.proto`
- Пакет: `projects.v1`
- В development включён gRPC Reflection для интроспекции (например, через `grpcurl`).

Пример проверки списка сервисов (при запущенном приложении):

```bash
grpcurl -plaintext localhost:4001 list projects.v1
```

---

## Docker

### Сборка образа

```bash
docker build -t projects-microservice .
```

### Запуск полного стека (app + PostgreSQL)

В корневом `docker-compose.yml` контейнер приложения по умолчанию слушает **3000 (HTTP)** и **5000 (gRPC)**, а здоровье
проверяется по `GET /healthz` на HTTP-порту (см. `Dockerfile`).

Запуск:

```bash
docker compose up --build -d
```

Если хотите те же порты, что и локально (4000/4001), просто задайте их переменными окружения перед запуском:

```bash
PORT=4000 GRPC_PORT=4001 docker compose up --build -d
```

---

## Деплой (Kubernetes)

Деплой в Kubernetes выполняется через Helm. CI/CD настроен в `.github/workflows/release.yaml` — при пуше в `main`
собирается Docker-образ, пушится в registry и разворачивается через `helm upgrade --install`.

### Helm chart

```
helm/
├── Chart.yaml
├── values.yaml          # Дефолтные значения (порты, ресурсы, проверки)
├── ci-values.yaml       # CI-оверрайды (тег образа, секреты через envsubst)
└── templates/
    ├── deployment.yaml
    ├── service.yaml     # HTTP (3000) + gRPC (5000)
    ├── ingress.yaml
    ├── secret.yaml      # K8s Secret с чувствительными переменными
    ├── serviceaccount.yaml
    └── vmservicescrape.yaml
```

### Kubernetes-пробы

- **Liveness:** `GET /healthz` — всегда возвращает `200 OK`.
- **Readiness:** `GET /readyz` — проверяет подключение к БД, возвращает `503` если БД недоступна.

### Необходимые секреты и переменные в GitHub

**Secrets** (`Settings → Secrets`):

| Имя                             | Описание                                          |
|---------------------------------|---------------------------------------------------|
| `DOCKER_REGISTRY_USERNAME`      | Логин в container registry                        |
| `DOCKER_REGISTRY_TOKEN`         | Пароль / токен registry                           |
| `KUBECONFIG`                    | kubeconfig в base64 (`base64 -w0 ~/.kube/config`) |
| `PROJECTS_DATABASE_URL`         | DSN PostgreSQL (`postgresql://user:pass@host/db`) |
| `PROJECTS_S3_ACCESS_KEY_ID`     | Ключ доступа S3                                   |
| `PROJECTS_S3_SECRET_ACCESS_KEY` | Секретный ключ S3                                 |
| `PROJECTS_S3_BUCKET`            | Имя бакета S3                                     |

**Variables** (`Settings → Variables`):

| Имя                    | Описание                                               |
|------------------------|--------------------------------------------------------|
| `REGISTRY`             | Адрес container registry                               |
| `IMAGE_PULL_SECRET`    | Имя imagePullSecret в кластере                         |
| `PROJECTS_S3_ENDPOINT` | (опц.) Endpoint S3, по умолчанию Yandex Object Storage |
| `PROJECTS_S3_REGION`   | (опц.) Регион S3, по умолчанию `ru-central1`           |

---

## Структура проекта

```
src/
├── main.ts                 # Точка входа, HTTP + gRPC + Swagger
├── app.module.ts
├── config/                 # Конфигурация (env, app, database, storage)
├── database/               # Prisma (schema, миграции, сидер)
├── common/                 # Фильтры, пагинация, утилиты
├── projects/               # Модуль проектов (REST, gRPC, сервис, репозиторий)
├── releases/               # Модуль релизов
├── tags/                   # Модуль тегов
├── environments/           # Каталог окружений (пайплайн), CRUD + reorder
├── storage/                # Загрузка файлов в S3 (иконки проектов)
└── proto/
    └── projects.proto      # gRPC-контракт
```
