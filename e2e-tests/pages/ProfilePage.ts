import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ProfilePage extends BasePage {
	async goto() {
		await super.goto("/profile");
		await expect(this.page).toHaveURL(/\/profile/);
	}

	profileUsernameDisplay(): Locator {
		return this.page.getByTestId("profile-username");
	}

	editProfileButton(): Locator {
		return this.page.getByRole("button", { name: "Edit Profile" });
	}

	profileDialog(): Locator {
		return this.page.locator(".p-dialog").first();
	}

	usernameField(): Locator {
		return this.profileDialog().getByRole("textbox", {
			name: "Username",
			exact: true,
		});
	}

	newPasswordField(): Locator {
		return this.profileDialog().getByLabel("New Password");
	}

	confirmPasswordField(): Locator {
		return this.profileDialog().getByLabel("Confirm Password");
	}

	saveButton(): Locator {
		return this.profileDialog().getByRole("button", { name: /save/i });
	}

	cancelButton(): Locator {
		return this.profileDialog().getByRole("button", { name: "Cancel" });
	}

	dialogError(): Locator {
		return this.profileDialog().getByRole("alert");
	}

	async openEditDialog() {
		await this.editProfileButton().click();
		await expect(this.profileDialog()).toBeVisible({ timeout: 5_000 });
	}

	async changeUsername(newUsername: string) {
		await this.openEditDialog();
		await this.usernameField().fill(newUsername);
		await this.saveButton().click();
		await expect(this.profileDialog()).not.toBeVisible({ timeout: 5_000 });
	}

	async changePassword(newPassword: string) {
		await this.openEditDialog();
		await this.newPasswordField().fill(newPassword);
		await this.confirmPasswordField().fill(newPassword);
		await this.saveButton().click();
		await expect(this.profileDialog()).not.toBeVisible({ timeout: 5_000 });
	}

	async assertUsernameVisible(expected: string) {
		await expect(this.profileUsernameDisplay()).toContainText(expected);
	}
}
