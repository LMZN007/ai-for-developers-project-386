import "@typespec/http";

using Http;

@service(#{ title: "Calls Booking API" })
namespace CallsBooking;

model HealthStatus {
  status: "ok";
}

/** A meeting template the owner publishes for guests. */
model EventType {
  /** Unique part of the public link `/book/<slug>`. */
  slug: string;

  title: string;
  description?: string;
  durationMinutes: int32;
}

/**
 * What the owner sends to create an event type. The server also trims `title`
 * and requires `durationMinutes` to be a multiple of 15.
 */
model NewEventType {
  @minLength(1)
  @maxLength(50)
  @pattern("^[a-z0-9]+(-[a-z0-9]+)*$")
  slug: string;

  @minLength(1)
  @maxLength(100)
  title: string;

  @maxLength(500)
  description?: string;

  @minValue(15)
  @maxValue(240)
  durationMinutes: int32;
}

model FieldError {
  /** Name of the request field the message is about. */
  field: string;

  message: string;
}

/** The single error body every failing operation returns. */
@error
model ApiError {
  code: "validation_error" | "not_found" | "slug_taken" | "time_conflict" | "internal_error";

  /** Human-readable text in Russian. */
  message: string;

  /** Present only for `validation_error`. */
  fields?: FieldError[];
}

@route("/health")
namespace Health {
  @get
  op check(): {
    @statusCode statusCode: 200;
    @body body: HealthStatus;
  };
}

@route("/event-types")
namespace EventTypes {
  /** All event types in the order they were created. */
  @get
  op list(): {
    @statusCode statusCode: 200;
    @body body: EventType[];
  };

  /** Create an event type; its slug must be unused. */
  @post
  op create(@body body: NewEventType):
    | {
        @statusCode statusCode: 201;
        @body body: EventType;
      }
    | {
        @statusCode statusCode: 400;
        @body body: ApiError;
      }
    | {
        @statusCode statusCode: 409;
        @body body: ApiError;
      };
}
