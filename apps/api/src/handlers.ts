import type { components } from "@calls-booking/contract";

type HealthStatus = components["schemas"]["HealthStatus"];

// Method names must match operationId values in the OpenAPI contract.
export const serviceHandlers = {
  async Health_check(): Promise<HealthStatus> {
    return { status: "ok" };
  },
};
