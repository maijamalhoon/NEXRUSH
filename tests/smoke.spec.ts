import { test, expect } from "@playwright/test";

test.describe("NEXRUSH Smoke Tests", () => {
  test("loads splash, navigates menu, launches race, pauses, and resumes", async ({ page }) => {
    await page.goto("/");

    // 1. Verify Page Title
    await expect(page).toHaveTitle(/NEXRUSH/);

    // 2. Splash Screen -> Click Start Engine
    const startButton = page.getByRole("button", { name: /start engine/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // 3. Main Menu
    const raceButton = page.getByRole("button", { name: /^race$/i });
    await expect(raceButton).toBeVisible();
    await expect(page.getByRole("button", { name: /garage/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /settings/i })).toBeVisible();

    // Click Race -> opens Track Select
    await raceButton.click();

    // 4. Circuit Select Screen
    await expect(page.getByText(/select circuit/i)).toBeVisible();
    const chooseCarButton = page.getByRole("button", { name: /choose car/i });
    await expect(chooseCarButton).toBeVisible();
    await chooseCarButton.click();

    // 5. Garage Screen
    await expect(page.getByText(/garage/i)).toBeVisible();
    const launchButton = page.getByRole("button", { name: /launch race/i });
    await expect(launchButton).toBeVisible();
    await launchButton.click();

    // 6. Race HUD
    await expect(page.getByText(/pos/i)).toBeVisible();
    await expect(page.getByText(/lap/i)).toBeVisible();
    await expect(page.getByText(/km\/h/i)).toBeVisible();

    // 7. Pause Game
    const pauseButton = page.getByRole("button", { name: /pause game/i });
    await expect(pauseButton).toBeVisible();
    await pauseButton.click();

    // Verify Pause Modal
    await expect(page.getByText(/^paused$/i)).toBeVisible();
    const resumeButton = page.getByRole("button", { name: /resume/i });
    await expect(resumeButton).toBeVisible();

    // Resume
    await resumeButton.click();
    await expect(page.getByText(/^paused$/i)).not.toBeVisible();
  });
});
