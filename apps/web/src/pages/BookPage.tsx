import { Anchor, Text, Title } from "@mantine/core";
import { Link } from "react-router";

// Stub until the booking step: the list of meeting types comes later (see docs/open-questions.md).
export default function BookPage() {
  return (
    <>
      <Title order={1}>Запись на встречу</Title>
      <Text mt="sm">Скоро здесь появится список типов встреч.</Text>
      <Anchor component={Link} to="/" mt="md" display="inline-block">
        На главную
      </Anchor>
    </>
  );
}
