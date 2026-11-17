import type { components } from "@calls-booking/contract";

export type EventType = components["schemas"]["EventType"];

// The only place that knows where data lives. Data is kept in memory and is lost on restart;
// swapping in a file-backed store must touch this module only.
export interface Store {
  /** Event types in the order they were created. */
  listEventTypes(): EventType[];
}

export interface StoreContents {
  eventTypes?: EventType[];
}

export function createMemoryStore(initial: StoreContents = {}): Store {
  const eventTypes = [...(initial.eventTypes ?? [])];

  return {
    listEventTypes: () => eventTypes.map((eventType) => ({ ...eventType })),
  };
}
