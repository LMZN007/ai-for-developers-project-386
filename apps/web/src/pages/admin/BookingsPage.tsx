import { Text, Title } from "@mantine/core";

// Placeholder until the upcoming bookings ticket.
export default function BookingsPage() {
  return (
    <>
      <Title order={1}>Записи</Title>
      <Text mt="sm" c="dimmed">
        Скоро здесь появятся предстоящие записи.
      </Text>
    </>
  );
}
