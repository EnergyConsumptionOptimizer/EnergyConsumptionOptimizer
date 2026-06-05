import { expect, type Locator, type Page } from "@playwright/test";
import { BASE_URL } from "@/fixtures/base-fixtures";

export class BasePage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto(path: string) {
		await this.page.goto(`${BASE_URL}${path}`);
	}

	toastMessage(): Locator {
		return this.page.getByRole("alert").or(this.page.getByRole("status"));
	}

	toastError(): Locator {
		return this.page.getByRole("alert");
	}

	async assertToastVisible(text?: string) {
		const toast = this.toastMessage().first();
		await expect(toast).toBeVisible({ timeout: 10_000 });
		if (text) {
			await expect(toast).toContainText(text);
		}
	}

	async assertToastErrorVisible(text?: string) {
		const toast = this.toastError().first();
		await expect(toast).toBeVisible({ timeout: 5_000 });
		if (text) {
			await expect(toast).toContainText(text);
		}
	}

	sidebarLink(label: string): Locator {
		return this.page
			.getByRole("navigation")
			.getByRole("link", { name: label });
	}

	async navigateTo(label: string) {
		await this.sidebarLink(label).click();
	}

	heading(): Locator {
		return this.page.getByRole("heading").first();
	}

	async assertUrlContains(path: string) {
		await expect(this.page).toHaveURL(new RegExp(path));
	}
}
