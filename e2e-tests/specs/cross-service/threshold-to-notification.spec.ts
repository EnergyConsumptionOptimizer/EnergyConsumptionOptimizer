import { expect, test } from "@/fixtures/base-fixtures";
import {
	createThreshold,
	deleteAllNotifications,
	deleteAllThresholds,
	deleteThreshold,
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
import { ThresholdsPage } from "@/pages/ThresholdsPage";

const ELECTRICITY = "ELECTRICITY";
const GAS = "GAS";

test.describe("Feature: Threshold Breach Notifications", () => {
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
			} catch {}
		}
	});

	test.afterAll(async () => {
		await deleteAllNotifications();
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
			await notificationsPage.assertNotificationVisible(threshold.id, {
				timeout: 15_000,
			});
			await notificationsPage.assertNotificationMessageContains(
				threshold.id,
				thresholdName,
			);
		});
	});

	test("Scenario: system suppresses duplicate notifications within the suppression window", async ({
		adminPage,
	}) => {
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

		await test.step("When the admin navigates to the notifications page", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
			await notificationsPage.assertNotificationVisible(threshold.id);
		});

		await test.step("When a second breach occurs within the suppression window", async () => {
			await triggerForecastEvaluation(
				forecastEvaluationPayload(GAS, [150, 30, 25]),
			);
		});

		await test.step("Then only one notification should remain visible in the UI", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
			await notificationsPage.assertNotificationVisible(threshold.id);
			await expect(notificationsPage.tableRows()).toHaveCount(1, {
				timeout: 15_000,
			});
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

		await test.step("Given a threshold has triggered a notification", async () => {
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
		});

		await test.step("When the admin marks the notification as read via the alerts page", async () => {
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

	test("Scenario: forecast below threshold creates no notification", async ({
		adminPage,
	}) => {
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

		await test.step("Then no notification should appear on the alerts page", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
			await notificationsPage.assertEmpty();
		});
	});

	test("Scenario: disabled threshold creates no notification", async ({
		adminPage,
	}) => {
		test.setTimeout(60_000);
		let threshold: { id: string; name: string };

		await test.step("Given a threshold has been created", async () => {
			const thresholdName = `e2e-disabled-${Date.now()}`;
			threshold = await createThreshold(
				forecastThresholdPayload({
					name: thresholdName,
					utilityType: ELECTRICITY,
					value: 30,
				}),
			);
			threshold.name = thresholdName;
			createdThresholdIds.push(threshold.id);
		});

		await test.step("When the admin disables the threshold via the thresholds page", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await thresholdsPage.goto();
			await thresholdsPage.assertThresholdInTable(threshold.name);
			await thresholdsPage.toggleSwitchFor(threshold.name).click();
		});

		await test.step("And a forecast evaluation exceeds the threshold value", async () => {
			await triggerForecastEvaluation(
				forecastEvaluationPayload(ELECTRICITY, [80, 40, 30]),
			);
		});

		await test.step("Then no notification should appear on the alerts page", async () => {
			const notificationsPage = new NotificationsPage(adminPage);
			await notificationsPage.goto();
			await expect(adminPage).toHaveURL(/\/alerts/);
			await notificationsPage.assertEmpty();
		});
	});
});
