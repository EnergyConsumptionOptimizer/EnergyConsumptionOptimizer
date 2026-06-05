import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class UsersPage extends BasePage {
	async goto() {
		await super.goto("/users");
	}

	newUserButton(): Locator {
		return this.page.getByRole("button", { name: "New" });
	}

	table(): Locator {
		return this.page.locator("[aria-label='User management table']");
	}

	private tableRows(): Locator {
		return this.table()
			.locator("tbody")
			.getByRole("row")
			.filter({ hasNotText: "No users found." });
	}

	private getRowByUsername(username: string): Locator {
		return this.tableRows().filter({ hasText: username });
	}

	editButtonForUser(username: string): Locator {
		return this.getRowByUsername(username).getByRole("button", {
			name: "Edit user",
		});
	}

	deleteButtonForUser(username: string): Locator {
		return this.getRowByUsername(username).getByRole("button", {
			name: `Delete user ${username}`,
		});
	}

	searchInput(): Locator {
		return this.page.getByPlaceholder("Search users...");
	}

	async searchForUser(username: string) {
		await this.searchInput().fill(username);
	}

	async assertUserInTable(username: string) {
		await this.searchForUser(username);
		await expect(this.getRowByUsername(username)).toBeVisible({
			timeout: 5_000,
		});
	}

	async assertUserNotInTable(username: string) {
		await this.searchForUser(username);
		await expect(this.getRowByUsername(username)).not.toBeVisible({
			timeout: 5_000,
		});
	}

	dialog(): Locator {
		return this.page.locator(".p-dialog").first();
	}

	usernameField(): Locator {
		return this.dialog().getByRole("textbox", {
			name: "Username",
			exact: true,
		});
	}

	newPasswordField(): Locator {
		return this.dialog().getByLabel("New Password");
	}

	confirmPasswordField(): Locator {
		return this.dialog().getByLabel("Confirm Password");
	}

	saveButton(): Locator {
		return this.dialog().getByRole("button", { name: /save|create/i });
	}

	cancelButton(): Locator {
		return this.dialog().getByRole("button", { name: "Cancel" });
	}

	errorInDialog(): Locator {
		return this.dialog().getByRole("alert");
	}

	async openNewUserDialog() {
		await this.newUserButton().click();
		await expect(this.dialog()).toBeVisible();
	}

	async fillUserForm(username: string, password: string) {
		await this.usernameField().fill(username);
		await this.newPasswordField().fill(password);
		await this.confirmPasswordField().fill(password);
	}

	async saveForm() {
		await this.saveButton().click();
	}

	async assertSaveSucceeded() {
		await expect(this.dialog()).not.toBeVisible({ timeout: 10_000 });
	}

	async cancelForm() {
		await this.cancelButton().click();
		await expect(this.dialog()).not.toBeVisible({ timeout: 5_000 });
	}

	async assertErrorInDialogVisible() {
		await expect(this.errorInDialog()).toBeVisible({ timeout: 5_000 });
	}

	async editUser(username: string) {
		await this.searchForUser(username);
		await this.editButtonForUser(username).click();
		await expect(this.dialog()).toBeVisible();
	}

	async createUserViaUI(username: string, password: string) {
		await this.openNewUserDialog();
		await this.fillUserForm(username, password);
		await this.saveForm();
		await this.assertSaveSucceeded();
	}

	confirmDialog(): Locator {
		return this.page.locator(".p-confirmdialog, .p-confirm-dialog").first();
	}

	confirmDeleteButton(): Locator {
		return this.confirmDialog().getByRole("button", { name: /delete/i });
	}

	async deleteUser(username: string) {
		await this.searchForUser(username);
		await this.deleteButtonForUser(username).click();

		await expect(this.confirmDialog()).toBeVisible({ timeout: 5_000 });
		await expect(this.confirmDialog()).toContainText(username, {
			timeout: 5_000,
		});
		await this.confirmDeleteButton().click();
		await expect(this.confirmDialog()).not.toBeVisible({ timeout: 5_000 });
	}
}
