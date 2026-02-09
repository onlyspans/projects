# Projects Microservice

Микросервис управления проектами и релизами в составе **Developer Platform (OnlySpans)**. Входит в конфигурационный слой платформы и отвечает за хранение метаданных проектов, версионирование релизов и координацию с сервисами доставки.

## Описание

**Projects** — центральный сервис для работы с проектами разработки: CRUD проектов и релизов, тегирование, жизненный цикл (development → testing → staging → production) и передача структуры релиза в **Snapper** для создания снапшотов и доставки.

### Роль в архитектуре

```
targets-plane → projects → processes / variables / assets
                      ↓
                    snapper
```

- **REST API** — для фронтенда: управление проектами, релизами и тегами через HTTP/JSON.
- **gRPC API** — для микросервисов: типобезопасное взаимодействие (targets-plane, snapper и др.), получение структуры релиза, обновление статусов.
- В потоке **создания релиза**: валидация конфигурации и передача структуры релиза в Snapper после создания снапшота.
- В потоке **доставки релиза**: хранение и обновление метаданных проектов и релизов, координация с processes.

### Основные сущности

| Сущность   | Описание |
|-----------|----------|
| **Project** | Проект: название, slug, статус (active/archived/suspended), владелец, стадии жизненного цикла, теги, произвольные metadata. Связан с релизами и тегами. |
| **Release** | Релиз версии проекта: semver, снапшот из Snapper, статус (draft → created → scheduled → delivering → delivered/deployed/failed/rolled_back/cancelled), changelog, notes, структура конфигурации (processes, variables, assets) для доставки. |
| **Tag**     | Тег для категоризации проектов: имя, описание, цвет (hex). Связь многие-ко-многим с проектами. |

### Стек

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** [NestJS](https://nestjs.com) 11
- **ORM:** TypeORM, PostgreSQL
- **API:** REST (Express), gRPC (Protocol Buffers), [Swagger](https://swagger.io) (OpenAPI)
- **Валидация:** class-validator, class-transformer

Подробные требования и описание API — в [.agents/guide.md](.agents/guide.md). Спецификация и обсуждение в репозитории [onlyspans/issues](https://github.com/onlyspans/issues) (issues по projects).

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

| Переменная        | Описание              | По умолчанию   |
|-------------------|-----------------------|----------------|
| `NODE_ENV`        | Окружение             | `development`  |
| `PORT`            | Порт HTTP API         | `4000`         |
| `GRPC_PORT`       | Порт gRPC             | `4001`         |
| `POSTGRES_HOST`   | Хост PostgreSQL       | `localhost`   |
| `POSTGRES_PORT`   | Порт PostgreSQL       | `5432`         |
| `POSTGRES_USER`   | Пользователь БД       | `postgres`     |
| `POSTGRES_PASSWORD` | Пароль БД          | `postgres`     |
| `POSTGRES_DB`     | Имя базы              | `projects_db`  |
| `AUTO_MIGRATE`    | Запуск миграций при старте | `false`  |
| `CORS_ORIGIN`     | Разрешённые origins для CORS | см. `.env.example` |

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

| Команда | Описание |
|--------|----------|
| `bun run start` | Запуск без watch |
| `bun run start:dev` | Запуск в режиме разработки (watch) |
| `bun run start:debug` | Запуск с отладчиком |
| `bun run start:prod` | Запуск собранного приложения (`bun dist/main`) |
| `bun run build` | Сборка в `dist/` |
| `bun run lint` | ESLint с автоисправлением |
| `bun run format` | Prettier по `src` и `test` |
| `bun run test` | Unit-тесты |
| `bun run test:e2e` | E2E-тесты |
| `bun run test:cov` | Покрытие тестами |

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

В режиме `NODE_ENV=development` или при `RUN_SEED=true` при старте приложения выполняется сидер: если таблицы проектов пустые, создаются тестовые теги, проекты и релизы. Для принудительного сида можно запустить с `RUN_SEED=true`.

---

## API

### REST

- Базовый префикс: `/api`
- Документация: **GET** `/api-docs` (Swagger UI)

Примеры эндпоинтов:

- `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id`
- `GET/POST /api/releases`, `GET/PATCH/DELETE /api/releases/:id`
- `GET/POST /api/tags`, `GET/PATCH/DELETE /api/tags/:id`

Поддерживаются query-параметры для пагинации и фильтрации (см. Swagger).

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

Для полного стека (приложение + PostgreSQL) используйте `docker-compose.yml` в корне репозитория (если настроен).

---

## Структура проекта

```
src/
├── main.ts                 # Точка входа, HTTP + gRPC + Swagger
├── app.module.ts
├── config/                 # Конфигурация (env, app, database)
├── database/               # TypeORM, миграции, сидер
├── common/                 # Фильтры, пагинация, утилиты
├── projects/               # Модуль проектов (REST, gRPC, сервис, репозиторий)
├── releases/               # Модуль релизов
├── tags/                   # Модуль тегов
└── proto/
    └── projects.proto      # gRPC-контракт
```
