import type { components } from "@calls-booking/contract";
import type { EventType, Store } from "./store.ts";

type HealthStatus = components["schemas"]["HealthStatus"];

export interface HandlerDependencies {
  store: Store;
  /** Current moment; tests pass a fixed clock. */
  now: () => Date;
}

// Method names must match operationId values in the OpenAPI contract.
export function createHandlers({ store }: HandlerDependencies) {
  return {
    async Health_check(): Promise<HealthStatus> {
      return { status: "ok" };
    },

    async EventTypes_list(): Promise<EventType[]> {
      return store.listEventTypes();
    },
  };
}
