import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class UsersPage extends BasePage {
	async goto() {
		await super.goto("/users");
	}

	// ── Table ──────────────────────────────────────────

	newUserButton(): Locator {
		return this.page.getByRole("button", { name: "New" });
	}

	table(): Locator {
		return this.page.locator("[aria-label='User management table']");
	}

	private tableRows(): Locator {
		return this.table()
			.locator("tbody tr")
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
		return this.page.getByLabel("Search users by username or role");
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

	// ── User form dialog ────────────────────────────────

	private dialog(): Locator {
		return this.page.locator(".p-dialog");
	}

	dialogTitle(): Locator {
		return this.dialog().locator(".p-dialog-title, .p-dialog-header span");
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
		return this.dialog().locator("button[type='submit']");
	}

	cancelButton(): Locator {
		return this.dialog().getByRole("button", { name: "Cancel" });
	}

	errorInDialog(): Locator {
		return this.dialog().locator(
			".p-message-error, .p-message.p-message-error",
		);
	}

	async openNewUserDialog() {
		await this.newUserButton().click();
		await expect(this.dialogTitle()).toHaveText("New User");
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
		await expect(this.dialogTitle()).not.toBeVisible({ timeout: 10_000 });
	}

	async cancelForm() {
		await this.cancelButton().click();
		await expect(this.dialogTitle()).not.toBeVisible({ timeout: 5_000 });
	}

	async assertErrorInDialogVisible() {
		await expect(this.errorInDialog()).toBeVisible({ timeout: 5_000 });
	}

	async editUser(username: string) {
		await this.searchForUser(username);
		await this.editButtonForUser(username).click();
		await expect(this.dialogTitle()).toHaveText("Edit Profile");
	}

	/** Creates a user via the UI dialog and asserts success. */
	async createUserViaUI(username: string, password: string) {
		await this.openNewUserDialog();
		await this.fillUserForm(username, password);
		await this.saveForm();
		await this.assertSaveSucceeded();
	}

	// ── Confirm dialog (PrimeVue 4) ──────────────────────

	private confirmDialog(): Locator {
		return this.page.locator(".p-confirmdialog, .p-confirm-dialog");
	}

	private confirmDialogMessage(): Locator {
		return this.confirmDialog().locator(
			".p-dialog-content, .p-confirm-dialog-message",
		);
	}

	confirmDeleteButton(): Locator {
		return this.confirmDialog().getByRole("button", { name: "Delete" });
	}

	async deleteUser(username: string) {
		await this.searchForUser(username);
		await this.deleteButtonForUser(username).click();

		await expect(this.confirmDialog()).toBeVisible({ timeout: 5_000 });
		await expect(this.confirmDialogMessage()).toContainText(username, {
			timeout: 5_000,
		});
		await this.confirmDeleteButton().click();
		await expect(this.confirmDialog()).not.toBeVisible({ timeout: 5_000 });
	}

	// ── Profile page ─────────────────────────────────────

	async gotoProfile() {
		await super.goto("/profile");
		await expect(this.page).toHaveURL(/\/profile/);
	}

	/** Prefer getByTestId("profile-username") once frontend adds data-testid. */
	profileUsernameDisplay(): Locator {
		return this.page
			.locator("[data-testid='profile-username'], p.text-lg")
			.first();
	}

	async openEditProfileDialog() {
		await this.page.getByRole("button", { name: "Edit Profile" }).click();
		await expect(this.dialog()).toBeVisible({ timeout: 5_000 });
	}
}
