import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
	readonly mapContainer: Locator;
	readonly consumptionCharts: Locator;

	constructor(page: Page) {
		super(page);
		this.mapContainer = page.locator(
			".map-container, [data-testid='map'], svg, canvas",
		);
		this.consumptionCharts = page.locator(
			".chart, [data-testid='consumption-chart'], canvas",
		);
	}

	async goto() {
		await super.goto("/");
	}

	async assertDashboardLoaded() {
		await expect(this.logoutButton()).toBeVisible({ timeout: 10_000 });
	}

	async assertHasContent() {
		await expect(this.page.locator("body")).toBeVisible();
	}

	logoutButton(): Locator {
		return this.page.getByRole("menuitem", { name: "Logout" });
	}

	async logout() {
		await this.logoutButton().click();
		await expect(this.page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
	}
}
