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
  // allErrors: report every invalid field at once, so a form can mark all of them.
  // coerceTypes off: a value of the wrong JSON type ("30" for a number) is an error, as the
  // contract says, not something to convert. Path parameters are strings, so nothing needs it.
  const app = Fastify({
    ajv: { customOptions: { allErrors: true, coerceTypes: false } },
    ...fastify,
  });
  // The contract only describes JSON bodies, and the schema only validates parsed JSON: a plain-text
  // body would reach a handler unchecked. Without this parser such a request is rejected up front.
  app.removeContentTypeParser("text/plain");
  // Set before the routes are registered so the openapi-glue plugin inherits the handlers.
  registerErrorHandlers(app);
  app.register(openapiGlue, { specification, serviceHandlers: createHandlers({ store, now }) });
  return app;
}
