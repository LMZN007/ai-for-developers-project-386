import { useEffect, useState } from "react";
import type { components } from "@calls-booking/contract";
import { Alert, Button, Card, Group, Loader, SimpleGrid, Text, Title } from "@mantine/core";
import { Link } from "react-router";
import { api } from "../api.ts";

type EventType = components["schemas"]["EventType"];

type LoadState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "loaded"; eventTypes: EventType[] };

export default function BookPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  // Bumping the attempt re-runs the request effect («Повторить»).
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    api.GET("/event-types").then(
      ({ data }) => {
        if (current) {
          setState(data ? { status: "loaded", eventTypes: data } : { status: "failed" });
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
  }, [attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  };

  return (
    <>
      <Title order={1}>Запись на встречу</Title>
      <Text mt="sm">Выберите тип встречи, чтобы увидеть свободное время.</Text>
      <EventTypeList state={state} onRetry={retry} />
    </>
  );
}

function EventTypeList({ state, onRetry }: { state: LoadState; onRetry: () => void }) {
  if (state.status === "loading") {
    return <Loader mt="xl" aria-label="Загрузка" />;
  }

  if (state.status === "failed") {
    return (
      <Alert color="red" mt="xl" title="Не удалось загрузить данные">
        <Button variant="light" color="red" mt="xs" onClick={onRetry}>
          Повторить
        </Button>
      </Alert>
    );
  }

  if (state.eventTypes.length === 0) {
    return (
      <Text mt="xl" c="dimmed">
        Пока нет типов встреч
      </Text>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} mt="xl">
      {state.eventTypes.map((eventType) => (
        <Card
          key={eventType.slug}
          component={Link}
          to={`/book/${eventType.slug}`}
          withBorder
          padding="lg"
        >
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Text fw={600}>{eventType.title}</Text>
            <Text c="dimmed" style={{ whiteSpace: "nowrap" }}>
              {eventType.durationMinutes} мин
            </Text>
          </Group>
          {eventType.description && (
            <Text size="sm" c="dimmed" mt="xs">
              {eventType.description}
            </Text>
          )}
        </Card>
      ))}
    </SimpleGrid>
  );
}
