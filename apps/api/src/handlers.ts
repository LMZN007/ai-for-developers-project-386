import type { components } from "@calls-booking/contract";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ApiProblem, validationProblem } from "./errors.ts";
import { freeSlots, type Slot } from "./schedule.ts";
import type { EventType, Store } from "./store.ts";

type HealthStatus = components["schemas"]["HealthStatus"];
type NewEventType = components["schemas"]["NewEventType"];

const DURATION_STEP_MINUTES = 15;

export interface HandlerDependencies {
  store: Store;
  /** Current moment; tests pass a fixed clock. */
  now: () => Date;
}

// Method names must match operationId values in the OpenAPI contract.
// Request shapes are already checked against the OpenAPI schema; handlers add the remaining rules.
export function createHandlers({ store, now }: HandlerDependencies) {
  const findEventType = (slug: string): EventType => {
    const eventType = store.getEventType(slug);
    if (!eventType) {
      throw new ApiProblem(404, { code: "not_found", message: "Такой тип встречи не найден" });
    }
    return eventType;
  };

  return {
    async Health_check(): Promise<HealthStatus> {
      return { status: "ok" };
    },

    async EventTypes_list(): Promise<EventType[]> {
      return store.listEventTypes();
    },

    async EventTypes_create(
      request: FastifyRequest<{ Body: NewEventType }>,
      reply: FastifyReply,
    ): Promise<EventType> {
      const eventType = normalizeEventType(request.body);

      if (store.addEventType(eventType) === "slug_taken") {
        throw new ApiProblem(409, { code: "slug_taken", message: "Эта ссылка уже занята" });
      }

      reply.code(201);
      return eventType;
    },

    async EventTypes_get(
      request: FastifyRequest<{ Params: { slug: string } }>,
    ): Promise<EventType> {
      return findEventType(request.params.slug);
    },

    async EventTypes_listSlots(
      request: FastifyRequest<{ Params: { slug: string } }>,
    ): Promise<Slot[]> {
      const { durationMinutes } = findEventType(request.params.slug);
      return freeSlots({ now: now(), durationMinutes });
    },
  };
}

function normalizeEventType(input: NewEventType): EventType {
  const title = input.title.trim();
  const description = input.description?.trim();

  const fields = [];
  if (title === "") {
    fields.push({ field: "title", message: "Обязательное поле" });
  }
  if (input.durationMinutes % DURATION_STEP_MINUTES !== 0) {
    fields.push({
      field: "durationMinutes",
      message: "Длительность должна быть кратна 15 минутам",
    });
  }
  if (fields.length > 0) {
    throw validationProblem(fields);
  }

  return {
    slug: input.slug,
    title,
    ...(description ? { description } : {}),
    durationMinutes: input.durationMinutes,
  };
}
