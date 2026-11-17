import { createApiClient } from "@calls-booking/contract";
import { buildApp, type AppOptions } from "../src/app.ts";

// Starts a real server on a random port; each call gets its own store, so tests stay independent.
export async function startServer(options: AppOptions = {}) {
  const app = buildApp(options);
  const baseUrl = await app.listen({ port: 0, host: "127.0.0.1" });

  return {
    baseUrl,
    client: createApiClient(baseUrl),
    close: () => app.close(),
  };
}
