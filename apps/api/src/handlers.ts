import type { components } from "@calls-booking/contract";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ApiProblem, validationProblem } from "./errors.ts";
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
export function createHandlers({ store }: HandlerDependencies) {
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
