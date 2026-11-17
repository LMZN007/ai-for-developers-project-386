import { useEffect, useState } from 'react'
import { Badge, Container, Group, Text, Title } from '@mantine/core'
import { api } from './api.ts'

type ApiStatus = 'checking' | 'ok' | 'unavailable'

const statusColor: Record<ApiStatus, string> = {
  checking: 'gray',
  ok: 'green',
  unavailable: 'red',
}

export default function App() {
  const [status, setStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    api
      .GET('/health')
      .then(({ data }) => setStatus(data?.status === 'ok' ? 'ok' : 'unavailable'))
      .catch(() => setStatus('unavailable'))
  }, [])

  return (
    <Container size="sm" py="xl">
      <Title order={1}>Календарь звонков</Title>
      <Text c="dimmed" mt="xs">
        Каркас приложения
      </Text>
      <Group mt="lg" gap="xs">
        <Text>API:</Text>
        <Badge color={statusColor[status]}>{status}</Badge>
      </Group>
    </Container>
  )
}
