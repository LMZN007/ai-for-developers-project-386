import "@typespec/http";

using Http;

@service(#{ title: "Calls Booking API" })
namespace CallsBooking;

model HealthStatus {
  status: "ok";
}

@route("/health")
namespace Health {
  @get
  op check(): {
    @statusCode statusCode: 200;
    @body body: HealthStatus;
  };
}
