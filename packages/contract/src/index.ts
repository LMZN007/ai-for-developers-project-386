import createClient from "openapi-fetch";
import type { paths } from "../generated/schema.js";

export type { paths, components } from "../generated/schema.js";

export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}
