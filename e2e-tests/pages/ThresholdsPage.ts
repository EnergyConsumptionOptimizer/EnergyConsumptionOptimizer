import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ThresholdsPage extends BasePage {
	async goto() {
		await super.goto("/thresholds");
	}

	newButton(): Locator {
		return this.page.getByRole("button", { name: "New" });
	}

	table(): Locator {
		return this.page.locator("[aria-label='Threshold management table']");
	}

	tableRows(): Locator {
		return this.table()
			.locator("tbody")
			.getByRole("row")
			.filter({ hasNotText: "No thresholds found." });
	}

	getRowByName(name: string): Locator {
		return this.tableRows().filter({ hasText: name });
	}

	editButtonFor(name: string): Locator {
		return this.getRowByName(name).getByRole("button", {
			name: "Edit threshold",
		});
	}

	deleteButtonFor(name: string): Locator {
		return this.getRowByName(name).getByRole("button", {
			name: `Delete threshold ${name}`,
		});
	}

	toggleSwitchFor(name: string): Locator {
		return this.getRowByName(name).locator(".p-toggleswitch");
	}

	dialog(): Locator {
		return this.page.locator(".p-dialog").first();
	}

	nameField(): Locator {
		return this.dialog().getByLabel("Name");
	}

	utilitySelect(): Locator {
		return this.dialog().getByLabel("Utility");
	}

	typeSelect(): Locator {
		return this.dialog().getByLabel("Threshold Type");
	}

	valueField(): Locator {
		return this.dialog().locator("#value input, [data-pc-name='inputnumber'] input");
	}

	periodSelect(): Locator {
		return this.dialog().getByLabel("Period Type");
	}

	stateSelect(): Locator {
		return this.dialog().getByLabel("State");
	}

	saveButton(): Locator {
		return this.dialog().getByRole("button", { name: /save|create/i });
	}

	cancelButton(): Locator {
		return this.dialog().getByRole("button", { name: /cancel/i });
	}

	confirmDialog(): Locator {
		return this.page.locator(".p-confirmdialog, .p-confirm-dialog").first();
	}

	confirmDeleteButton(): Locator {
		return this.confirmDialog().getByRole("button", { name: /delete/i });
	}

	errorInDialog(): Locator {
		return this.dialog().getByRole("alert");
	}

	async selectDropdownOption(label: string, optionText: string) {
		const select = this.dialog().getByLabel(label);
		await select.click();
		const option = this.page
			.getByRole("listbox")
			.getByRole("option", { name: optionText, exact: true });
		await option.click();
	}

	async openNewDialog() {
		await this.newButton().click();
		await expect(this.dialog()).toBeVisible();
	}

	async openEditDialog(name: string) {
		await this.editButtonFor(name).click();
		await expect(this.dialog()).toBeVisible();
	}

	async fillForm(fields: {
		name: string;
		utilityType: string;
		thresholdType: string;
		value: number;
		periodType?: string;
	}) {
		await this.nameField().fill(fields.name);
		await this.selectDropdownOption("Utility", fields.utilityType);
		await this.selectDropdownOption("Threshold Type", fields.thresholdType);
		await this.valueField().fill(String(fields.value));

		if (fields.periodType) {
			await this.selectDropdownOption("Period Type", fields.periodType);
		}
	}

	async saveForm() {
		await this.saveButton().click();
		await expect(this.dialog()).not.toBeVisible({ timeout: 10_000 });
	}

	async cancelForm() {
		await this.cancelButton().click();
		await expect(this.dialog()).not.toBeVisible({ timeout: 5_000 });
	}

	async deleteThreshold(name: string) {
		await this.deleteButtonFor(name).click();
		await expect(this.confirmDialog()).toBeVisible({ timeout: 3_000 });
		await this.confirmDeleteButton().click();
		await expect(this.getRowByName(name)).toHaveCount(0, { timeout: 5_000 });
	}

	searchInput(): Locator {
		return this.page.getByLabel(
			"Search thresholds by name, type, or utility",
		);
	}

	async searchForThreshold(name: string) {
		await this.searchInput().fill(name);
		await expect(this.tableRows()).toHaveCount(1, { timeout: 5_000 });
	}

	async assertThresholdInTable(name: string) {
		await this.searchForThreshold(name);
		await expect(this.getRowByName(name)).toBeVisible({ timeout: 5_000 });
	}

	async assertThresholdNotInTable(name: string) {
		await this.searchInput().fill(name);
		await expect(this.tableRows()).toHaveCount(0, { timeout: 5_000 });
	}

	async assertErrorInDialogVisible() {
		await expect(this.errorInDialog().first()).toBeVisible({ timeout: 5_000 });
	}
}
