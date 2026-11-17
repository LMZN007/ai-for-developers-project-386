import type { components } from "@calls-booking/contract";
import type { FastifyError, FastifyInstance, FastifySchemaValidationError } from "fastify";

type ApiError = components["schemas"]["ApiError"];

// Every error leaves the server in the single contract format `{ code, message, fields? }`.
export function registerErrorHandlers(app: FastifyInstance) {
  app.setNotFoundHandler((_request, reply) => {
    const body: ApiError = { code: "not_found", message: "Ресурс не найден" };
    return reply.code(404).send(body);
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) {
      const body: ApiError = {
        code: "validation_error",
        message: "Проверьте поля запроса",
        fields: error.validation.map((issue) => ({
          field: fieldName(issue),
          message: issue.message ?? "Некорректное значение",
        })),
      };
      return reply.code(400).send(body);
    }

    if (error.statusCode !== undefined && error.statusCode < 500) {
      const body: ApiError = { code: "validation_error", message: "Некорректный запрос" };
      return reply.code(400).send(body);
    }

    request.log.error(error);
    const body: ApiError = { code: "internal_error", message: "Внутренняя ошибка сервера" };
    return reply.code(500).send(body);
  });
}

// Ajv reports the field either in the path (`/guestEmail`) or, for a missing one, in params.
function fieldName(issue: FastifySchemaValidationError): string {
  const missing = issue.params["missingProperty"];
  if (typeof missing === "string") {
    return missing;
  }
  return issue.instancePath.replace(/^\//, "").replaceAll("/", ".");
}
