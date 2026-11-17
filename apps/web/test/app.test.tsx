import { MemoryRouter } from "react-router";
import App from "../src/App.tsx";
import { render, screen, userEvent, within } from "../test-utils/index.ts";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test("главная рассказывает о сервисе и предлагает записаться", () => {
  renderAt("/");

  expect(screen.getByRole("heading", { level: 1, name: "Календарь звонков" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Как это работает" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Записаться" })).toHaveAttribute("href", "/book");
});

test("кнопка «Записаться» открывает страницу записи", async () => {
  renderAt("/");

  await userEvent.click(screen.getByRole("link", { name: "Записаться" }));

  expect(screen.getByRole("heading", { level: 1, name: "Запись на встречу" })).toBeInTheDocument();
  expect(screen.getByText("Скоро здесь появится список типов встреч.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "На главную" })).toHaveAttribute("href", "/");
});

test("неизвестный адрес показывает страницу «Страница не найдена»", () => {
  renderAt("/no-such-page");

  expect(
    screen.getByRole("heading", { level: 1, name: "Страница не найдена" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "На главную" })).toHaveAttribute("href", "/");
});

test("в шапке любой страницы название сервиса ведёт на главную", () => {
  renderAt("/book");

  const header = screen.getByRole("banner");
  expect(within(header).getByRole("link", { name: "Календарь звонков" })).toHaveAttribute(
    "href",
    "/",
  );
});
