import { buildApp } from "./app.ts";
import { demoData } from "./demo-data.ts";
import { createMemoryStore } from "./store.ts";

const port = Number(process.env.API_PORT ?? 3000);
// `pnpm run dev` (used by `mise run dev`) passes --demo-data; a plain start begins empty.
const withDemoData = process.argv.includes("--demo-data");

const app = buildApp({
  store: createMemoryStore(withDemoData ? demoData : {}),
  fastify: { logger: true },
});

try {
  await app.listen({ port, host: "127.0.0.1" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
