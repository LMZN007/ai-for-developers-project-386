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
}
