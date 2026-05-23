import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
	usernameInput(): Locator {
		return this.page.getByLabel("Username");
	}

	passwordInput(): Locator {
		return this.page.getByLabel("Password");
	}

	loginButton(): Locator {
		return this.page.getByRole("button", { name: "Log In" });
	}

	errorMessage(): Locator {
		return this.page.locator(".p-message-error, .p-message.p-message-error");
	}

	resetPasswordLink(): Locator {
		return this.page.getByRole("link", { name: "Reset admin password" });
	}

	async goto() {
		await super.goto("/auth/login");
	}

	async login(username: string, password: string) {
		await this.usernameInput().fill(username);
		await this.passwordInput().fill(password);
		await this.loginButton().click();
	}

	async assertOnLoginPage() {
		await expect(this.loginButton()).toBeVisible({ timeout: 15_000 });
		await expect(this.usernameInput()).toBeVisible();
	}

	async assertErrorContains(pattern: string | RegExp) {
		const error = this.errorMessage();
		await expect(error).toBeVisible({ timeout: 5_000 });
		await expect(error).toContainText(pattern);
	}

	async assertRedirectedToDashboard() {
		await expect(this.page).toHaveURL("/", { timeout: 10_000 });
		await expect(this.loginButton()).not.toBeAttached();
	}
}
