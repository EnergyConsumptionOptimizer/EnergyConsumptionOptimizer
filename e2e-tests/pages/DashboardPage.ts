import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
	async goto() {
		await super.goto("/");
	}

	heading(): Locator {
		return this.page.getByRole("heading", { name: "Dashboard" });
	}

	statsCard(label: string): Locator {
		return this.page.getByRole("region", { name: `${label} statistics` });
	}

	realTimeChartSection(): Locator {
		return this.page.locator(
			'[aria-labelledby="real-time-consumptions-title"]',
		);
	}

	historicalChartSection(): Locator {
		return this.page.locator(
			'[aria-labelledby="historical-consumptions-title"]',
		);
	}

	houseMap(): Locator {
		return this.page.getByRole("img", {
			name: "Interactive floor plan map",
		});
	}

	hookupMarker(name: string): Locator {
		return this.page.locator(
			`[data-testid="hookup-marker"][data-hookup-name="${name}"]`,
		);
	}

	activeHookupMarker(name: string): Locator {
		return this.hookupMarker(name).filter({
			has: this.page.locator("title", { hasText: "(Active)" }),
		});
	}

	logoutButton(): Locator {
		return this.page.getByRole("menuitem", { name: "Logout" });
	}

	async assertPageLoaded() {
		await expect(this.heading()).toBeVisible();
		await expect(this.page).toHaveURL("/");
	}

	async assertStatsCardsVisible() {
		for (const label of ["Gas", "Water", "Electricity"]) {
			await this.assertStatsCardVisible(label);
		}
	}

	async assertStatsCardVisible(label: string, timeout = 10_000) {
		await expect(this.statsCard(label)).toBeVisible({ timeout });
	}

	async assertChartsVisible() {
		await expect(this.realTimeChartSection()).toBeVisible();
		await expect(this.historicalChartSection()).toBeVisible();
	}

	async assertHouseMapVisible() {
		await expect(this.houseMap()).toBeVisible();
	}

	async assertHookupVisible(name: string) {
		await expect(this.hookupMarker(name)).toBeVisible({ timeout: 5_000 });
	}

	async assertHookupActive(name: string, timeoutMs = 30_000) {
		await expect(this.activeHookupMarker(name)).toBeVisible({
			timeout: timeoutMs,
		});
	}

	async assertHookupNotVisible(name: string) {
		await expect(this.hookupMarker(name)).not.toBeVisible({ timeout: 5_000 });
	}

	realTimeChartCanvas(): Locator {
		return this.realTimeChartSection().locator("canvas");
	}

	historicalChartCanvas(): Locator {
		return this.historicalChartSection().locator("canvas");
	}

	async assertDashboardLoaded() {
		await expect(this.logoutButton()).toBeVisible({ timeout: 10_000 });
	}

	async logout() {
		await this.logoutButton().click();
		await expect(this.page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
	}
}
