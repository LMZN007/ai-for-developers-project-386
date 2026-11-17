import { afterAll, beforeAll, expect, test } from "vitest";
import { createApiClient } from "@calls-booking/contract";
import { buildApp } from "../src/app.ts";

const app = buildApp();
let baseUrl = "";

beforeAll(async () => {
  baseUrl = await app.listen({ port: 0, host: "127.0.0.1" });
});

afterAll(async () => {
  await app.close();
});

test("server starts and answers GET /health through the generated SDK", async () => {
  const client = createApiClient(baseUrl);
  const { data, response } = await client.GET("/health");

  expect(response.status).toBe(200);
  expect(data).toEqual({ status: "ok" });
});
