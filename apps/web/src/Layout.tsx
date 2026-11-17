import { Anchor, Box, Container } from "@mantine/core";
import { Link, Outlet } from "react-router";

export default function Layout() {
  return (
    <>
      <Box
        component="header"
        py="sm"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Container size="sm">
          <Anchor component={Link} to="/" fw={700} underline="never">
            Календарь звонков
          </Anchor>
        </Container>
      </Box>
      <Container component="main" size="sm" py="xl">
        <Outlet />
      </Container>
    </>
  );
}
