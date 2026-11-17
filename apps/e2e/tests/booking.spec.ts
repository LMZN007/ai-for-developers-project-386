import { expect, test } from "@playwright/test";

// The whole path from README: the owner creates an event type → a guest books a slot →
// the owner sees the booking → the slot is no longer offered. Real server, real browser,
// real clock: the guest takes the first free slot, which always exists within 14 days.
test("владелец создаёт тип встречи, гость записывается, владелец видит запись", async ({
  page,
}) => {
  const title = "Созвон из браузерного теста";
  const slug = "e2e-call";

  await test.step("владелец создаёт тип встречи", async () => {
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "Для владельца" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Типы встреч" })).toBeVisible();

    await page.getByRole("link", { name: "Создать" }).first().click();
    await page.getByRole("textbox", { name: /Название/ }).fill(title);
    await page.getByRole("textbox", { name: /Ссылка/ }).fill(slug);
    await page.getByRole("textbox", { name: /Описание/ }).fill("Проверка всего пути записи");
    await page.getByRole("textbox", { name: /Длительность/ }).fill("30");
    await page.getByRole("button", { name: "Сохранить" }).click();

    await expect(page.getByText("Тип встречи создан")).toBeVisible();
    await expect(page.getByRole("article", { name: title })).toContainText(`/book/${slug}`);
  });

  const guest = { name: "Иван Петров", email: "ivan@example.com", comment: "Обсудим проект" };
  let day = "";
  let time = "";

  await test.step("гость выбирает тип, день и первый свободный слот и записывается", async () => {
    await page.goto("/book");
    await page.getByRole("link", { name: new RegExp(title) }).click();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("Время указано в поясе: Asia/Yekaterinburg")).toBeVisible();

    day = (await page.getByRole("heading", { level: 2 }).textContent()) ?? "";
    const firstSlot = page
      .getByRole("group", { name: "Свободное время" })
      .getByRole("button")
      .first();
    time = (await firstSlot.textContent()) ?? "";
    await firstSlot.click();

    await page.getByRole("textbox", { name: /Имя/ }).fill(guest.name);
    await page.getByRole("textbox", { name: /Email/ }).fill(guest.email);
    await page.getByRole("textbox", { name: /Комментарий/ }).fill(guest.comment);
    await page.getByRole("button", { name: "Подтвердить" }).click();

    const confirmation = page.getByRole("region", { name: "✓ Встреча запланирована" });
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText(`${title}, 30 мин`);
    await expect(confirmation).toContainText(`${time}–`);
    await expect(confirmation).toContainText(`Владелец и ${guest.name} (${guest.email})`);
  });

  await test.step("владелец видит запись в «Записях»", async () => {
    await page.getByRole("banner").getByRole("link", { name: "Для владельца" }).click();
    await page.getByRole("tab", { name: "Записи" }).click();

    const row = page.getByRole("row").filter({ hasText: guest.name });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(`${day}, ${time}–`);
    await expect(row).toContainText(title);
    await expect(row).toContainText(guest.email);
    await expect(row).toContainText(guest.comment);
  });

  await test.step("занятый слот больше не предлагается", async () => {
    await page.goto(`/book/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    // The booked day either has fewer slots now or, if that was its last one, is not bookable.
    const bookedDay = page.getByRole("button", { name: day, exact: true });
    if (await bookedDay.isEnabled()) {
      await bookedDay.click();
      await expect(page.getByRole("heading", { level: 2, name: day })).toBeVisible();
      await expect(
        page.getByRole("group", { name: "Свободное время" }).getByRole("button", {
          name: time,
          exact: true,
        }),
      ).toHaveCount(0);
    } else {
      await expect(bookedDay).toBeDisabled();
    }
  });
});
