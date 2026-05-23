import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class NotificationsPage extends BasePage {
	async goto() {
		await super.goto("/alerts");
	}

	heading(): Locator {
		return this.page.locator("h2", { hasText: "Notifications" });
	}

	table(): Locator {
		return this.page.locator("[aria-label='Notifications table']");
	}

	tableRows(): Locator {
		return this.table()
			.locator("tbody tr")
			.filter({
				has: this.page.locator("[data-testid='notification-source-id']"),
			});
	}

	getRowByText(text: string): Locator {
		return this.tableRows().filter({ hasText: text });
	}

	getRowBySourceId(sourceId: string): Locator {
		return this.tableRows().filter({ hasText: sourceId });
	}

	markAsReadButton(): Locator {
		return this.tableRows().getByRole("button", { name: "Mark as read" });
	}

	deleteNotificationButton(): Locator {
		return this.tableRows().getByRole("button", {
			name: "Delete notification",
		});
	}

	emptyMessage(): Locator {
		return this.page.getByText("No notifications available.");
	}

	async assertNotificationVisible(sourceId: string) {
		await expect(this.getRowBySourceId(sourceId)).toBeVisible({
			timeout: 5_000,
		});
	}

	async assertNotificationNotVisible(sourceId: string) {
		await expect(this.getRowBySourceId(sourceId)).not.toBeVisible({
			timeout: 5_000,
		});
	}

	async assertNotificationMessageContains(sourceId: string, text: string) {
		await expect(this.getRowBySourceId(sourceId)).toContainText(text);
	}

	async assertRead(sourceId: string) {
		await expect(
			this.getRowBySourceId(sourceId).getByLabel("Read notification"),
		).toBeVisible({ timeout: 5_000 });
	}

	async assertUnread(sourceId: string) {
		await expect(
			this.getRowBySourceId(sourceId).getByLabel("Unread notification"),
		).toBeVisible({ timeout: 5_000 });
	}

	async assertUnreadInRow(row: Locator) {
		await expect(row.getByLabel("Unread notification")).toBeVisible({
			timeout: 5_000,
		});
	}

	async markAsRead(sourceId: string) {
		await this.getRowBySourceId(sourceId)
			.getByRole("button", {
				name: "Mark as read",
			})
			.click();
	}

	async deleteNotification(sourceId: string) {
		await this.getRowBySourceId(sourceId)
			.getByRole("button", {
				name: "Delete notification",
			})
			.click();
	}

	async assertEmpty() {
		await expect(this.emptyMessage()).toBeVisible({ timeout: 5_000 });
	}

	async assertNotEmpty() {
		await expect(this.tableRows().first()).toBeVisible({ timeout: 5_000 });
	}

	markReadBulkButton(): Locator {
		return this.page
			.getByRole("toolbar")
			.getByRole("button", { name: /Mark Read/ });
	}

	deleteBulkButton(): Locator {
		return this.page
			.getByRole("toolbar")
			.getByRole("button", { name: /Delete.*selected notifications/ });
	}

	async selectRow(sourceId: string) {
		await this.getRowBySourceId(sourceId).getByRole("checkbox").check();
	}

	async markSelectedAsRead(sourceIds: string[]) {
		for (const id of sourceIds) {
			await this.selectRow(id);
		}
		await this.markReadBulkButton().click();
	}

	async deleteSelected(sourceIds: string[]) {
		for (const id of sourceIds) {
			await this.selectRow(id);
		}
		await this.deleteBulkButton().click();
	}
}
