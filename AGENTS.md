# AGENTS.md

Сервис записи на встречи (аналог Cal.com). Сценарий — в README.md.

## Команды

Инструменты и версии — в `mise.toml`. Запускать через mise, не глобальные `node`/`pnpm`.

- `mise install` — поставить инструменты; хук `postinstall` сам выполнит `mise run setup` (pnpm install и git-хуки hk).
- `mise run dev` — API (:3000) и web (:5173) в фоне как daemons; `mise daemons ls | logs api | stop`.
- `mise run check` — все проверки (oxfmt, oxlint, jactionlint, gen, typecheck, test, e2e). CI вызывает ту же команду. Запускать перед завершением задачи. Хук `pre-push` делает то же, но без e2e.
- `mise run e2e` — браузерный сценарий (Playwright, Chromium) с настоящим сервером на портах 3100/4173; Chromium ставит `mise run setup`.
- `mise run lint`, `mise run format`, `mise run typecheck`, `mise run test` — по отдельности.
- `mise run gen` — пересобрать OpenAPI и SDK из контракта.
- Один тест: `pnpm --filter @calls-booking/api exec vitest run -t "<имя теста>"`.

## Устройство

pnpm-монорепо, contract-first:

```
packages/contract/main.tsp ─tsp─▶ generated/openapi.yaml ─openapi-typescript─▶ generated/schema.d.ts
                                        │                                            │
apps/api: fastify-openapi-glue строит   ┘          apps/web: SDK createApiClient() ◀─┘
маршруты и валидацию из openapi.yaml
```

- API меняется только через `main.tsp`, затем `mise run gen`.
- Обработчики — `apps/api/src/handlers.ts`; имя метода = `operationId` из OpenAPI (например, `Health_check`).
- Web ходит в API только через SDK по `/api/*`; в dev Vite проксирует на :3000.
- Дымовой тест `apps/api/test/smoke.test.ts` поднимает сервер и вызывает его через SDK.

## Правила

- Коммиты — Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`; scope — `api`, `web`, `contract`). Проверяется хуком `commit-msg`.
- Коммит, который выполняет тикет, ссылается на него номером в конце заголовка: `feat(api): запись на свободный слот (#14)`. GitHub превращает номер в ссылку, и по истории видно, какой коммит какую задачу делал.
- `packages/contract/generated/` не редактировать и не коммитить — он генерируется.
- `.github/workflows/hexlet-check.yml` и `.github/workflows/README.md` принадлежат Хекслету: не менять, не переименовывать репозиторий.
- Версии и `CHANGELOG.md` ведёт release-please (Release PR после `feat`/`fix` в `main`): руками не править.
- Не отключать правила линтеров; исключение — только узкое (путь + правило) и с причиной.

## Agent skills

### Issue tracker

Задачи хранятся в GitHub Issues репозитория LMZN007/ai-for-developers-project-386 (через `gh`). См. `docs/agents/issue-tracker.md`.

### Triage labels

Стандартные метки: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. См. `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` в корне, решения в `docs/adr/`. См. `docs/agents/domain.md`.
