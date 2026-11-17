import { fileURLToPath } from "node:url";
import Fastify, { type FastifyServerOptions } from "fastify";
import openapiGlue from "fastify-openapi-glue";
import { serviceHandlers } from "./handlers.ts";

const specification = fileURLToPath(import.meta.resolve("@calls-booking/contract/openapi.yaml"));

export function buildApp(options: FastifyServerOptions = {}) {
  const app = Fastify(options);
  app.register(openapiGlue, { specification, serviceHandlers });
  return app;
}
