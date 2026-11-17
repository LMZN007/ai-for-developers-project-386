import { useEffect, useMemo, useState } from "react";
import type { components } from "@calls-booking/contract";
import { Anchor, Button, Group, Loader, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { DatePicker, DatesProvider } from "@mantine/dates";
import "dayjs/locale/ru";
import { Link, useParams } from "react-router";
import { api } from "../api.ts";
import { browserTimeZone, dayTitle, localDateKey, localTime } from "../browserTime.ts";
import LoadFailed from "../LoadFailed.tsx";

type EventType = components["schemas"]["EventType"];
type Slot = components["schemas"]["Slot"];

type PageState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "failed" }
  | { status: "loaded"; eventType: EventType; slots: Slot[] };

export default function EventTypePage() {
  const { slug = "" } = useParams();
  const { state, retry } = useEventTypeWithSlots(slug);

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

      {slots.length === 0 ? (
        <Text mt="xl">Свободного времени в ближайшие 14 дней нет</Text>
      ) : (
        <SlotPicker slots={slots} />
      )}
    </>
  );
}

function SlotPicker({ slots }: { slots: Slot[] }) {
  const slotsByDate = useMemo(() => groupByLocalDate(slots), [slots]);
  const dates = [...slotsByDate.keys()];
  const firstDate = dates[0] ?? null;
  const [chosenDate, setChosenDate] = useState<string | null>(null);
  const [chosenSlot, setChosenSlot] = useState<string | null>(null);
  const selectedDate = chosenDate ?? firstDate;
  const daySlots = (selectedDate && slotsByDate.get(selectedDate)) || [];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} mt="md" spacing="xl">
      <DatesProvider settings={{ locale: "ru", firstDayOfWeek: 1 }}>
        <DatePicker
          value={selectedDate}
          onChange={(date) => {
            if (date) {
              setChosenDate(date);
              setChosenSlot(null);
            }
          }}
          defaultDate={firstDate ?? undefined}
          minDate={firstDate ?? undefined}
          maxDate={dates.at(-1)}
          excludeDate={(date) => !slotsByDate.has(date)}
          getDayProps={(date) => ({ "aria-label": dayTitle(date) })}
        />
      </DatesProvider>

      {selectedDate && (
        <Stack gap="sm">
          <Title order={2} size="h4">
            {dayTitle(selectedDate)}
          </Title>
          <Group gap="xs">
            {daySlots.map((slot) => (
              <Button
                key={slot.startsAt}
                variant={chosenSlot === slot.startsAt ? "filled" : "default"}
                aria-pressed={chosenSlot === slot.startsAt}
                onClick={() => setChosenSlot(slot.startsAt)}
              >
                {localTime(slot.startsAt)}
              </Button>
            ))}
          </Group>
        </Stack>
      )}
    </SimpleGrid>
  );
}

/** Slots grouped by the guest's local date, both in ascending order. */
function groupByLocalDate(slots: Slot[]): Map<string, Slot[]> {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = localDateKey(slot.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  }
  return groups;
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

  return { state, retry };
}
