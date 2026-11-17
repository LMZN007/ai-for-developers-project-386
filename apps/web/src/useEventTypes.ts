import { useEffect, useState } from "react";
import type { components } from "@calls-booking/contract";
import { api } from "./api.ts";

export type EventType = components["schemas"]["EventType"];

export type EventTypesState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "loaded"; eventTypes: EventType[] };

/** Loads the event types; `retry` repeats the request after a failure. */
export function useEventTypes() {
  const [state, setState] = useState<EventTypesState>({ status: "loading" });
  // Bumping the attempt re-runs the request effect.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    api.GET("/event-types").then(
      ({ data }) => {
        if (current) {
          setState(data ? { status: "loaded", eventTypes: data } : { status: "failed" });
        }
      },
      () => {
        if (current) {
          setState({ status: "failed" });
        }
      },
    );
    return () => {
      current = false;
    };
  }, [attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  };

  return { state, retry };
}
