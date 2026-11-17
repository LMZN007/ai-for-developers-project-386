import { useCallback, useEffect, useState } from "react";
import type { components } from "@calls-booking/contract";
import { Alert, Anchor, Loader, Text, Title } from "@mantine/core";
import { Link, useParams } from "react-router";
import { api } from "../api.ts";
import { browserTimeZone } from "../browserTime.ts";
import LoadFailed from "../LoadFailed.tsx";
import BookingConfirmation from "./booking/BookingConfirmation.tsx";
import BookingForm from "./booking/BookingForm.tsx";
import { emptyGuest, type GuestValues } from "./booking/guestRules.ts";
import SlotPicker from "./booking/SlotPicker.tsx";

type EventType = components["schemas"]["EventType"];
type Slot = components["schemas"]["Slot"];
type Booking = components["schemas"]["Booking"];

type PageState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "failed" }
  | { status: "loaded"; eventType: EventType; slots: Slot[] };

// The guest's way through the page; the confirmation has no address of its own (spec).
type Step = { kind: "choose" } | { kind: "form"; slot: Slot } | { kind: "done"; booking: Booking };

export default function EventTypePage() {
  const { slug = "" } = useParams();
  const { state, retry, reloadSlots } = useEventTypeWithSlots(slug);

  if (state.status === "loading") {
    return <Loader mt="xl" aria-label="Загрузка" />;
  }
  if (state.status === "failed") {
    return <LoadFailed onRetry={retry} />;
  }
  if (state.status === "not_found") {
    return (
      <>
        <Title order={1}>Такой тип встречи не найден</Title>
        <Anchor component={Link} to="/book" mt="md" display="inline-block">
          Ко всем типам встреч
        </Anchor>
      </>
    );
  }

  const { eventType, slots } = state;
  return (
    <>
      <Title order={1}>{eventType.title}</Title>
      <Text c="dimmed" mt={4}>
        {eventType.durationMinutes} мин
      </Text>
      {eventType.description && <Text mt="sm">{eventType.description}</Text>}
      <Text size="sm" c="dimmed" mt="lg">
        Время указано в поясе: {browserTimeZone()}
      </Text>

      <BookingSteps eventType={eventType} slots={slots} reloadSlots={reloadSlots} />
    </>
  );
}

function BookingSteps({
  eventType,
  slots,
  reloadSlots,
}: {
  eventType: EventType;
  slots: Slot[];
  reloadSlots: () => void;
}) {
  const [step, setStep] = useState<Step>({ kind: "choose" });
  const [date, setDate] = useState<string | null>(null);
  const [guest, setGuest] = useState<GuestValues>(emptyGuest);
  const [conflict, setConflict] = useState(false);

  if (step.kind === "done") {
    return (
      <BookingConfirmation
        booking={step.booking}
        onBookAgain={() => {
          setGuest({ ...guest, comment: "" });
          setStep({ kind: "choose" });
        }}
      />
    );
  }

  if (step.kind === "form") {
    return (
      <BookingForm
        eventType={eventType}
        slot={step.slot}
        values={guest}
        onChange={setGuest}
        onBack={() => setStep({ kind: "choose" })}
        onBooked={(booking) => {
          reloadSlots();
          setStep({ kind: "done", booking });
        }}
        onConflict={() => {
          reloadSlots();
          setConflict(true);
          setStep({ kind: "choose" });
        }}
      />
    );
  }

  return (
    <>
      {conflict && (
        <Alert color="orange" mt="lg" title="Это время уже заняли. Выберите другое время." />
      )}
      <SlotPicker
        slots={slots}
        date={date}
        onDateChange={setDate}
        onPick={(slot) => {
          setConflict(false);
          setStep({ kind: "form", slot });
        }}
      />
    </>
  );
}

function useEventTypeWithSlots(slug: string) {
  const [state, setState] = useState<PageState>({ status: "loading" });
  // Bumping the attempt re-runs the request effect («Повторить»).
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    const path = { params: { path: { slug } } };
    Promise.all([
      api.GET("/event-types/{slug}", path),
      api.GET("/event-types/{slug}/slots", path),
    ]).then(
      ([eventType, slots]) => {
        if (!current) {
          return;
        }
        if (eventType.response.status === 404) {
          setState({ status: "not_found" });
        } else if (eventType.data && slots.data) {
          setState({ status: "loaded", eventType: eventType.data, slots: slots.data });
        } else {
          setState({ status: "failed" });
        }
      },
      () => {
        if (current) {
          setState({ status: "failed" });
        }
      },
    );
    return () => {
      current = false;
    };
  }, [slug, attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  };

  // Refreshes the slots in place, without a loading screen; on failure the old slots stay.
  const reloadSlots = useCallback(() => {
    api.GET("/event-types/{slug}/slots", { params: { path: { slug } } }).then(
      ({ data }) => {
        if (data) {
          setState((current) =>
            current.status === "loaded" ? { ...current, slots: data } : current,
          );
        }
      },
      () => {},
    );
  }, [slug]);

  return { state, retry, reloadSlots };
}
