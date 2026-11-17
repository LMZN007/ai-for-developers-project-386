import type { components } from "@calls-booking/contract";
import { Loader, Table, Text, Title } from "@mantine/core";
import { api } from "../../api.ts";
import { browserTimeZone, intervalLabel } from "../../browserTime.ts";
import LoadFailed from "../../LoadFailed.tsx";
import { useLoad } from "../../useLoad.ts";

type Booking = components["schemas"]["Booking"];

const loadBookings = () => api.GET("/bookings").then(({ data }) => data);

export default function BookingsPage() {
  const { state, retry } = useLoad(loadBookings);

  return (
    <>
      <Title order={1}>Записи</Title>
      <Text c="dimmed" mt="xs">
        Предстоящие встречи всех типов. Время указано в поясе: {browserTimeZone()}
      </Text>

      {state.status === "loading" && <Loader mt="xl" aria-label="Загрузка" />}
      {state.status === "failed" && <LoadFailed onRetry={retry} />}
      {state.status === "loaded" && state.data.length === 0 && (
        <Text mt="xl" c="dimmed">
          Предстоящих записей нет
        </Text>
      )}
      {state.status === "loaded" && state.data.length > 0 && (
        <BookingsTable bookings={state.data} />
      )}
    </>
  );
}

function BookingsTable({ bookings }: { bookings: Booking[] }) {
  return (
    // On a phone the table scrolls sideways inside its own block, not the whole page.
    <Table.ScrollContainer minWidth={720} mt="xl">
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Дата и время</Table.Th>
            <Table.Th>Тип встречи</Table.Th>
            <Table.Th>Имя</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Комментарий</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {bookings.map((booking) => (
            <Table.Tr key={booking.id}>
              <Table.Td>{intervalLabel(booking)}</Table.Td>
              <Table.Td>{booking.eventType.title}</Table.Td>
              <Table.Td>{booking.guestName}</Table.Td>
              <Table.Td>{booking.guestEmail}</Table.Td>
              <Table.Td>{booking.comment ?? "—"}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
