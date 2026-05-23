import { expect, test } from "@/fixtures/base-fixtures";
import {
	createThreshold,
	deleteAllNotifications,
	deleteThreshold,
	disposeApiClient,
	getNotifications,
	triggerForecastEvaluation,
	updateThreshold,
} from "@/helpers/api";
import {
	waitForNotification,
	waitForNotificationCount,
	waitForNotificationMatching,
} from "@/helpers/kafka-helper";
import {
	forecastEvaluationPayload,
	forecastThresholdPayload,
} from "@/helpers/test-data";
import { NotificationsPage } from "@/pages/NotificationsPage";

const ELECTRICITY = "ELECTRICITY";
const GAS = "GAS";

test.describe("Feature: Threshold Breach Notifications", () => {
	test.slow();
	let createdThresholdIds: string[];

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
		await disposeApiClient();
	});

	test("Scenario: admin sees notification when forecast exceeds threshold", async ({
		adminPage,
	}) => {
		test.setTimeout(60_000);
		let thresholdName: string;
		let threshold: { id: string };

		await test.step("Given a configured forecast threshold", async () => {
			thresholdName = `e2e-cross-${Date.now()}`;
			threshold = await createThreshold(
				forecastThresholdPayload({
					name: thresholdName,
					utilityType: ELECTRICITY,
					value: 50,
				}),
			);
			createdThresholdIds.push(threshold.id);
		});

		await test.step("When a forecast evaluation exceeds the threshold value", async () => {
			await triggerForecastEvaluation(
				forecastEvaluationPayload(ELECTRICITY, [80, 40, 30]),
			);
		});

		await test.step("Then a notification should be created within 30s", async () => {
			expect(await waitForNotification(threshold.id, 30_000)).toBe(true);
		});

		await test.step("And the notification should be visible in the alerts page", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
			await notificationsPage.assertNotificationVisible(threshold.id);
			await notificationsPage.assertNotificationMessageContains(
				threshold.id,
				thresholdName,
			);
		});
	});

	test("Scenario: system suppresses duplicate notifications within the suppression window", async () => {
		test.setTimeout(60_000);
		let threshold: { id: string };

		await test.step("Given a threshold that has already generated a notification", async () => {
			const thresholdName = `e2e-spam-${Date.now()}`;
			threshold = await createThreshold(
				forecastThresholdPayload({
					name: thresholdName,
					utilityType: GAS,
					value: 30,
				}),
			);
			createdThresholdIds.push(threshold.id);

			await triggerForecastEvaluation(
				forecastEvaluationPayload(GAS, [100, 20, 20]),
			);
			expect(await waitForNotification(threshold.id, 30_000)).toBe(true);
		});

		await test.step("When a second breach occurs within the suppression window", async () => {
			await triggerForecastEvaluation(
				forecastEvaluationPayload(GAS, [150, 30, 25]),
			);
		});

		await test.step("Then no duplicate notification should be created within 35s", async () => {
			const deadline = Date.now() + 35_000;
			let sameSourceCount = 1;
			while (Date.now() < deadline) {
				const notifications = await getNotifications();
				sameSourceCount = notifications.filter(
					(n: { sourceId: string }) => n.sourceId === threshold.id,
				).length;
				if (sameSourceCount > 1) break;
				await new Promise((r) => setTimeout(r, 500));
			}
			expect(sameSourceCount).toBe(1);
		});
	});

	test("Scenario: admin views, marks read, and deletes a notification", async ({
		adminPage,
	}) => {
		test.setTimeout(90_000);
		let threshold: { id: string };
		let notificationsPage: NotificationsPage;

		await test.step("Given a notification exists for a breached threshold", async () => {
			const thresholdName = `e2e-full-${Date.now()}`;
			threshold = await createThreshold(
				forecastThresholdPayload({
					name: thresholdName,
					utilityType: ELECTRICITY,
					value: 25,
				}),
			);
			createdThresholdIds.push(threshold.id);

			await triggerForecastEvaluation(
				forecastEvaluationPayload(ELECTRICITY, [80, 40, 30]),
			);
			expect(await waitForNotification(threshold.id, 60_000)).toBe(true);

			notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
		});

		await test.step("Then the notification should be visible and unread", async () => {
			await notificationsPage.assertNotificationVisible(threshold.id);
			await notificationsPage.assertUnread(threshold.id);
		});

		await test.step("When the admin marks the notification as read", async () => {
			await notificationsPage.markAsRead(threshold.id);
		});

		await test.step("Then it should show as read", async () => {
			await notificationsPage.assertRead(threshold.id);
		});

		await test.step("When the admin deletes the notification", async () => {
			await notificationsPage.deleteNotification(threshold.id);
		});

		await test.step("Then the notifications list should be empty", async () => {
			await notificationsPage.assertEmpty();
		});
	});

	test("Scenario: reading a notification allows a new breach notification", async ({
		adminPage,
	}) => {
		test.setTimeout(90_000);
		let threshold: { id: string };

		await test.step("Given a notification has been marked as read", async () => {
			const thresholdName = `e2e-read-spam-${Date.now()}`;
			threshold = await createThreshold(
				forecastThresholdPayload({
					name: thresholdName,
					utilityType: ELECTRICITY,
					value: 20,
				}),
			);
			createdThresholdIds.push(threshold.id);

			await triggerForecastEvaluation(
				forecastEvaluationPayload(ELECTRICITY, [100, 20, 20]),
			);
			expect(await waitForNotification(threshold.id, 60_000)).toBe(true);

			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
			await notificationsPage.assertNotificationVisible(threshold.id);
			await notificationsPage.markAsRead(threshold.id);

			const readConfirmed = await waitForNotificationMatching(
				(n) => n.sourceId === threshold.id && n.isRead === true,
				10_000,
			);
			expect(readConfirmed).not.toBeNull();

			await updateThreshold(threshold.id, { thresholdState: "ENABLED" });
		});

		await test.step("When a second breach occurs after the notification was read", async () => {
			await triggerForecastEvaluation(
				forecastEvaluationPayload(ELECTRICITY, [150, 30, 25]),
			);
		});

		await test.step("Then a new notification should be created", async () => {
			const count = await waitForNotificationCount(2, 60_000);
			expect(count).toBe(2);
		});
	});

	test("Scenario: forecast below threshold creates no notification", async () => {
		test.setTimeout(60_000);
		let threshold: { id: string };

		await test.step("Given a configured forecast threshold", async () => {
			threshold = await createThreshold(
				forecastThresholdPayload({ utilityType: ELECTRICITY, value: 100 }),
			);
			createdThresholdIds.push(threshold.id);
		});

		await test.step("When a forecast evaluation stays below the threshold value", async () => {
			await triggerForecastEvaluation(
				forecastEvaluationPayload(ELECTRICITY, [30, 25, 20]),
			);
		});

		await test.step("Then no notification should be created within 30s", async () => {
			expect(await waitForNotification(threshold.id, 30_000)).toBe(false);
		});
	});

	test("Scenario: disabled threshold creates no notification", async () => {
		test.setTimeout(60_000);
		let threshold: { id: string };

		await test.step("Given a threshold that has been disabled", async () => {
			threshold = await createThreshold(
				forecastThresholdPayload({ utilityType: ELECTRICITY, value: 30 }),
			);
			createdThresholdIds.push(threshold.id);
			await updateThreshold(threshold.id, { thresholdState: "DISABLED" });
		});

		await test.step("When a forecast evaluation exceeds the threshold value", async () => {
			await triggerForecastEvaluation(
				forecastEvaluationPayload(ELECTRICITY, [80, 40, 30]),
			);
		});

		await test.step("Then no notification should be created within 30s", async () => {
			expect(await waitForNotification(threshold.id, 30_000)).toBe(false);
		});
	});
});
