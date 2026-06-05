import { expect, test } from "@/fixtures/base-fixtures";
import {
	deleteAllNotifications,
	deleteAllThresholds,
	deleteThreshold,
	getNotifications,
} from "@/helpers/api";
import { seedNotification } from "@/helpers/notification-helper";
import { NotificationsPage } from "@/pages/NotificationsPage";

test.describe("Feature: Notification Lifecycle", () => {
	test.describe.configure({ retries: 1 });
	test.slow();
	let createdThresholdIds: string[];

	test.beforeAll(async () => {
		await deleteAllNotifications();
		await deleteAllThresholds();
	});

	test.beforeEach(async () => {
		createdThresholdIds = [];
		await deleteAllNotifications();
	});

	test.afterEach(async () => {
		for (const id of createdThresholdIds) {
			try {
				await deleteThreshold(id);
			} catch {
				// Ignore cleanup failures
			}
		}
	});

	test.afterAll(async () => {
		await deleteAllNotifications();
	});

	async function createNotification(): Promise<string> {
		const result = await seedNotification();
		createdThresholdIds.push(result.thresholdId);
		return result.notification.sourceId;
	}

	test("Scenario: admin views notification list with data", async ({
		adminPage,
	}) => {
		await test.step("Given a notification has been created", async () => {
			await createNotification();
		});

		await test.step("When the admin navigates to the alerts page", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
		});

		await test.step("Then the notification list should display at least one entry", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await expect(notificationsPage.heading()).toBeVisible();
			await expect(notificationsPage.table()).toBeVisible();
			await expect(notificationsPage.tableRows().first()).toBeVisible({ timeout: 15_000 });
		});
	});

	test("Scenario: admin marks a single notification as read", async ({
		adminPage,
	}) => {
		let sourceId: string;

		await test.step("Given a notification exists", async () => {
			sourceId = await createNotification();
		});

		await test.step("When the admin marks it as read", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
			await notificationsPage.assertUnread(sourceId);
			await notificationsPage.markAsRead(sourceId);
		});

		await test.step("Then it should show as read", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.assertRead(sourceId);
		});
	});

	test("Scenario: admin bulk marks notifications as read", async ({
		adminPage,
	}) => {
		let sourceIds: string[];

		await test.step("Given multiple unread notifications exist", async () => {
			sourceIds = [await createNotification(), await createNotification()];
		});

		await test.step("When the admin selects and marks them as read", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
			await notificationsPage.assertUnread(sourceIds[0]);
			await notificationsPage.assertUnread(sourceIds[1]);
			await notificationsPage.markSelectedAsRead(sourceIds);
		});

		await test.step("Then all selected notifications should show as read", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.assertRead(sourceIds[0]);
			await notificationsPage.assertRead(sourceIds[1]);
		});
	});

	test("Scenario: admin deletes a single notification while others persist", async ({
		adminPage,
	}) => {
		let sourceIds: string[];

		await test.step("Given multiple notifications exist", async () => {
			sourceIds = [await createNotification(), await createNotification()];
		});

		await test.step("When the admin deletes one notification", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
			await notificationsPage.deleteNotification(sourceIds[1]);
		});

		await test.step("Then the deleted notification should be removed", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.assertNotificationNotVisible(sourceIds[1]);
			const notifications = await getNotifications();
			expect(
				notifications.find(
					(n: { sourceId: string }) => n.sourceId === sourceIds[1],
				),
			).toBeUndefined();
		});

		await test.step("And the remaining notifications should persist", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.assertNotificationVisible(sourceIds[0]);
		});
	});

	test("Scenario: admin bulk deletes notifications and sees empty state", async ({
		adminPage,
	}) => {
		let sourceIds: string[];

		await test.step("Given multiple notifications exist", async () => {
			sourceIds = [await createNotification(), await createNotification()];
		});

		await test.step("When the admin selects and deletes all of them", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
			await notificationsPage.deleteSelected(sourceIds);
		});

		await test.step("Then the notifications list should be empty", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.assertEmpty();

			const remaining = await getNotifications();
			for (const id of sourceIds) {
				expect(
					remaining.find((n: { sourceId: string }) => n.sourceId === id),
				).toBeUndefined();
			}
		});
	});
});

test.describe("Feature: Notification Authorization", () => {
	test("Scenario: household user cannot access alerts page", async ({
		userPage,
	}) => {
		await test.step("Given a household user is logged in", async () => {
			// userPage fixture provides an authenticated user context
		});

		await test.step("When they attempt to access the alerts page", async () => {
			await userPage.goto("/alerts");
		});

		await test.step("Then they should be redirected away", async () => {
			await expect(userPage).toHaveURL(/\/(access-denied|dashboard)/);
		});
	});
});
