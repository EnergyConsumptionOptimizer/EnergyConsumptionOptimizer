import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ForecastsPage extends BasePage {
	async goto() {
		await super.goto("/forecasts");
	}

	heading(): Locator {
		return this.page.getByTestId("forecast-heading");
	}

	widget(utility: string): Locator {
		return this.page.getByTestId(`forecast-${utility.toLowerCase()}`);
	}

	chart(utility: string): Locator {
		return this.page.getByTestId(`forecast-${utility.toLowerCase()}-chart`);
	}

	emptyState(utility: string): Locator {
		return this.page.getByTestId(`forecast-${utility.toLowerCase()}-empty`);
	}

	periodSelector(utility: string): Locator {
		return this.page.getByTestId(`forecast-${utility.toLowerCase()}-period`);
	}

	async assertPageLoaded() {
		await expect(this.heading()).toBeVisible();
		await expect(this.page).toHaveURL(/\/forecasts/);
	}

	async assertWidgetVisible(utility: string) {
		await expect(this.widget(utility)).toBeVisible();
	}

	async assertWidgetHasContent(utility: string) {
		const lower = utility.toLowerCase();
		const content = this.page.locator(
			`[data-testid="forecast-${lower}-chart"], [data-testid="forecast-${lower}-empty"]`,
		);
		await expect(content.first()).toBeVisible({ timeout: 10_000 });
	}

	async assertChartRendered(utility: string, timeout = 10_000) {
		await expect(this.chart(utility)).toBeVisible({ timeout });
	}

	async assertEmptyStateVisible(utility: string) {
		await expect(this.emptyState(utility)).toBeVisible({ timeout: 10_000 });
	}

	async assertPeriodSelected(utility: string, period: string) {
		const btn = this.periodSelector(utility).getByRole("button", {
			name: period,
			pressed: true,
		});
		await expect(btn).toBeVisible();
	}

	async selectPeriod(utility: string, period: string) {
		await this.periodSelector(utility)
			.getByRole("button", { name: period })
			.click();
	}
}
