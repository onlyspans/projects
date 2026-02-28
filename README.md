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

| Сущность    | Описание                                                                                                                                                                                                                  |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Project** | Проект: название, slug (уникальный), imageUrl, emoji, статус (active/archived/suspended), владелец, стадии жизненного цикла, теги, произвольные metadata. Связан с релизами и тегами. Иконку можно загрузить через S3.    |
| **Release** | Релиз версии проекта: semver, снапшот из Snapper, changelog, notes, структура конфигурации (processes, variables, assets) для доставки. Статус и продвижение по стадиям (dev → prod) ведёт сервис ответсвенный за деплой. |
| **Tag**     | Тег для категоризации проектов: имя, описание, цвет (hex). Связь многие-ко-многим с проектами.                                                                                                                            |

### Стек

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** [NestJS](https://nestjs.com) 11
- **ORM:** TypeORM, PostgreSQL
- **API:** REST (Express), gRPC (Protocol Buffers), [Swagger](https://swagger.io) (OpenAPI)
- **Хранилище файлов:** S3-совместимое (Yandex Object Storage) — иконки проектов
- **Валидация:** class-validator, class-transformer

Подробные требования и описание API — в [.agents/guide.md](.agents/guide.md). Спецификация и обсуждение в
репозитории [onlyspans/issues](https://github.com/onlyspans/issues) (issues по projects).

---

## Требования

- [Bun](https://bun.sh) ≥ 1.0
- PostgreSQL 16 (или использовать Docker)

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
| `AUTO_MIGRATE`         | Запуск миграций при старте                      | `false`                                                     |
| `CORS_ORIGIN`          | Разрешённые origins для CORS                    | см. `.env.example`                                          |
| `S3_BUCKET`            | Имя бакета S3 (обязательно для загрузки иконок) | —                                                           |
| `S3_ACCESS_KEY_ID`     | Ключ доступа S3                                 | —                                                           |
| `S3_SECRET_ACCESS_KEY` | Секретный ключ S3                               | —                                                           |
| `S3_ENDPOINT`          | (опц.) Endpoint S3                              | `https://storage.yandexcloud.net`                           |
| `S3_REGION`            | (опц.) Регион                                   | `ru-central1`                                               |

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

В режиме разработки:

- Включена синхронизация схемы TypeORM с БД (`synchronize: true`)
- При первом запуске с пустой БД выполняется сидер с тестовыми данными
- REST API: **http://localhost:4000/api**
- Swagger: **http://localhost:4000/api-docs**
- gRPC: **localhost:4001**

---

## Скрипты

| Команда               | Описание                                       |
|-----------------------|------------------------------------------------|
| `bun run start`       | Запуск без watch                               |
| `bun run start:dev`   | Запуск в режиме разработки (watch)             |
| `bun run start:debug` | Запуск с отладчиком                            |
| `bun run start:prod`  | Запуск собранного приложения (`bun dist/main`) |
| `bun run build`       | Сборка в `dist/`                               |
| `bun run lint`        | ESLint с автоисправлением                      |
| `bun run format`      | Prettier по `src` и `test`                     |
| `bun run test`        | Unit-тесты                                     |
| `bun run test:e2e`    | E2E-тесты                                      |
| `bun run test:cov`    | Покрытие тестами                               |

### Миграции (TypeORM)

Миграции используются в staging/production. В development по умолчанию используется `synchronize: true`.

```bash
# Создать миграцию по изменениям сущностей
bun run migration:generate -- src/database/migrations/MigrationName

# Применить миграции
bun run migration:run

# Откатить последнюю миграцию
bun run migration:revert

# Список миграций
bun run migration:show
```

---

## Сидер

В режиме `NODE_ENV=development` или при `RUN_SEED=true` при старте приложения выполняется сидер: если таблицы проектов
пустые, создаются тестовые теги, проекты и релизы. Для принудительного сида можно запустить с `RUN_SEED=true`.

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

Сборка образа приложения:

```bash
docker build -t projects-microservice .
```

Для полного стека (приложение + PostgreSQL) используйте `docker-compose.yml` в корне репозитория.

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

- **Liveness:** `GET /healthz` — всегда возвращает `200 OK`
- **Readiness:** `GET /readyz` — проверяет подключение к БД, возвращает `503` если БД недоступна

### Необходимые секреты и переменные в GitHub

**Secrets** (`Settings → Secrets`):

| Имя                            | Описание                                              |
|--------------------------------|-------------------------------------------------------|
| `DOCKER_REGISTRY_USERNAME`     | Логин в container registry                            |
| `DOCKER_REGISTRY_TOKEN`        | Пароль / токен registry                               |
| `KUBECONFIG`                   | kubeconfig в base64 (`base64 -w0 ~/.kube/config`)     |
| `PROJECTS_DATABASE_URL`        | DSN PostgreSQL (`postgresql://user:pass@host/db`)     |
| `PROJECTS_S3_ACCESS_KEY_ID`    | Ключ доступа S3                                       |
| `PROJECTS_S3_SECRET_ACCESS_KEY`| Секретный ключ S3                                     |
| `PROJECTS_S3_BUCKET`           | Имя бакета S3                                         |

**Variables** (`Settings → Variables`):

| Имя                    | Описание                                                    |
|------------------------|-------------------------------------------------------------|
| `REGISTRY`             | Адрес container registry                                    |
| `IMAGE_PULL_SECRET`    | Имя imagePullSecret в кластере                              |
| `PROJECTS_S3_ENDPOINT` | (опц.) Endpoint S3, по умолчанию Yandex Object Storage      |
| `PROJECTS_S3_REGION`   | (опц.) Регион S3, по умолчанию `ru-central1`                |

---

## Структура проекта

```
src/
├── main.ts                 # Точка входа, HTTP + gRPC + Swagger
├── app.module.ts
├── config/                 # Конфигурация (env, app, database, storage)
├── database/               # TypeORM, миграции, сидер
├── common/                 # Фильтры, пагинация, утилиты
├── projects/               # Модуль проектов (REST, gRPC, сервис, репозиторий)
├── releases/               # Модуль релизов
├── tags/                   # Модуль тегов
├── storage/                # Загрузка файлов в S3 (иконки проектов)
└── proto/
    └── projects.proto      # gRPC-контракт
```
