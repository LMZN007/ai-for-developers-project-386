import { fileURLToPath } from "node:url";
import Fastify, { type FastifyServerOptions } from "fastify";
import openapiGlue from "fastify-openapi-glue";
import { registerErrorHandlers } from "./errors.ts";
import { createHandlers } from "./handlers.ts";
import { createMemoryStore, type Store } from "./store.ts";

const specification = fileURLToPath(import.meta.resolve("@calls-booking/contract/openapi.yaml"));

export interface AppOptions {
  /** Where data lives; an empty in-memory store by default. */
  store?: Store;
  /** Current moment; the real clock by default, tests pass a fixed one. */
  now?: () => Date;
  fastify?: FastifyServerOptions;
}

export function buildApp({
  store = createMemoryStore(),
  now = () => new Date(),
  fastify = {},
}: AppOptions = {}) {
  const app = Fastify(fastify);
  // Set before the routes are registered so the openapi-glue plugin inherits the handlers.
  registerErrorHandlers(app);
  app.register(openapiGlue, { specification, serviceHandlers: createHandlers({ store, now }) });
  return app;
}
