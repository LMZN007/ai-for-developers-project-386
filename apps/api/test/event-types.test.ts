import { afterEach, expect, test } from "vitest";
import { createMemoryStore, type EventType } from "../src/store.ts";
import { startServer } from "./start-server.ts";

const intro: EventType = {
  slug: "intro",
  title: "Знакомство",
  description: "Короткий созвон",
  durationMinutes: 15,
};
const consultation: EventType = {
  slug: "consultation",
  title: "Консультация",
  durationMinutes: 30,
};

let server: Awaited<ReturnType<typeof startServer>> | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
});

test("GET /event-types отдаёт типы встреч в порядке создания", async () => {
  server = await startServer({ store: createMemoryStore({ eventTypes: [intro, consultation] }) });

  const { data, response } = await server.client.GET("/event-types");

  expect(response.status).toBe(200);
  expect(data).toEqual([intro, consultation]);
});

test("GET /event-types с пустым хранилищем отдаёт пустой список", async () => {
  server = await startServer();

  const { data, response } = await server.client.GET("/event-types");

  expect(response.status).toBe(200);
  expect(data).toEqual([]);
});

test("неизвестный адрес отвечает 404 в едином формате ошибки", async () => {
  server = await startServer();

  const response = await fetch(`${server.baseUrl}/no-such-resource`);

  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ code: "not_found", message: "Ресурс не найден" });
});
