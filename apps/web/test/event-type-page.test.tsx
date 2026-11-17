import { renderAt, stubApi } from "../test-utils/app.tsx";
import { screen, userEvent } from "../test-utils/index.ts";

const consultation = {
  slug: "consultation",
  title: "Консультация",
  description: "Разбор вашего вопроса",
  durationMinutes: 30,
};

// The browser zone in tests is Asia/Yekaterinburg (UTC+5), see vitest.setup.mjs.
const slots = [
  { startsAt: "2026-11-25T06:00:00Z", endsAt: "2026-11-25T06:30:00Z" }, // ср 11:00
  { startsAt: "2026-11-25T06:30:00Z", endsAt: "2026-11-25T07:00:00Z" }, // ср 11:30
  { startsAt: "2026-11-25T19:30:00Z", endsAt: "2026-11-25T20:00:00Z" }, // чт 00:30 по местному
  { startsAt: "2026-11-26T06:00:00Z", endsAt: "2026-11-26T06:30:00Z" }, // чт 11:00
];

afterEach(() => {
  vi.unstubAllGlobals();
});

function serve(eventType: unknown, slotList: unknown) {
  return stubApi({
    "GET /event-types/consultation": () => Response.json(eventType),
    "GET /event-types/consultation/slots": () => Response.json(slotList),
  });
}

function slotButtons() {
  return screen
    .getAllByRole("button", { pressed: false })
    .concat(screen.queryAllByRole("button", { pressed: true }))
    .map((button) => button.textContent);
}

test("показывает тип встречи, пояс браузера и слоты первого дня со свободным временем", async () => {
  serve(consultation, slots);
  renderAt("/book/consultation");

  expect(
    await screen.findByRole("heading", { level: 1, name: "Консультация" }),
  ).toBeInTheDocument();
  expect(screen.getByText("30 мин")).toBeInTheDocument();
  expect(screen.getByText("Разбор вашего вопроса")).toBeInTheDocument();
  expect(screen.getByText("Время указано в поясе: Asia/Yekaterinburg")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "Среда, 25 ноября" })).toBeInTheDocument();
  expect(slotButtons()).toEqual(["11:00", "11:30"]);
});

test("группирует слоты по дате в поясе гостя и переключает день в календаре", async () => {
  serve(consultation, slots);
  renderAt("/book/consultation");

  await userEvent.click(await screen.findByRole("button", { name: "Четверг, 26 ноября" }));

  expect(screen.getByRole("heading", { level: 2, name: "Четверг, 26 ноября" })).toBeInTheDocument();
  expect(slotButtons()).toEqual(["00:30", "11:00"]);
});

test("дни без свободных слотов выбрать нельзя", async () => {
  serve(consultation, slots);
  renderAt("/book/consultation");

  expect(await screen.findByRole("button", { name: "Пятница, 27 ноября" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Среда, 25 ноября" })).toBeEnabled();
});

test("выбранный слот подсвечивается", async () => {
  serve(consultation, slots);
  renderAt("/book/consultation");

  await userEvent.click(await screen.findByRole("button", { name: "11:30" }));

  expect(screen.getByRole("button", { name: "11:30" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "11:00" })).toHaveAttribute("aria-pressed", "false");
});

test("без свободного времени сообщает об этом", async () => {
  serve(consultation, []);
  renderAt("/book/consultation");

  expect(await screen.findByText("Свободного времени в ближайшие 14 дней нет")).toBeInTheDocument();
});

test("неизвестный тип встречи: сообщение и ссылка ко всем типам", async () => {
  stubApi({});
  renderAt("/book/consultation");

  expect(
    await screen.findByRole("heading", { level: 1, name: "Такой тип встречи не найден" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ко всем типам встреч" })).toHaveAttribute(
    "href",
    "/book",
  );
});

test("при ошибке загрузки предлагает повторить", async () => {
  stubApi({
    "GET /event-types/consultation": () =>
      Response.json({ code: "internal_error", message: "Ошибка" }, { status: 500 }),
    "GET /event-types/consultation/slots": () => Response.json(slots),
  });
  renderAt("/book/consultation");

  expect(await screen.findByText("Не удалось загрузить данные")).toBeInTheDocument();

  serve(consultation, slots);
  await userEvent.click(screen.getByRole("button", { name: "Повторить" }));

  expect(
    await screen.findByRole("heading", { level: 1, name: "Консультация" }),
  ).toBeInTheDocument();
  expect(slotButtons()).toEqual(["11:00", "11:30"]);
});
