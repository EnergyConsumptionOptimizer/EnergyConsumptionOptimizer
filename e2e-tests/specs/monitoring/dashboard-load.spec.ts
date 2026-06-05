import { expect, test } from "@/fixtures/base-fixtures";
import { DashboardPage } from "@/pages/DashboardPage";

test.describe("Feature: Monitoring Dashboard", () => {
	test.describe("Dashboard Load", () => {
		test("Scenario: admin sees the monitoring dashboard with all widgets", async ({
			adminPage,
		}) => {
			const dashboard = new DashboardPage(adminPage);

			await test.step("Given the admin is logged in", async () => {
				// adminPage fixture provides an authenticated admin context
			});

			await test.step("When they navigate to the dashboard", async () => {
				await dashboard.goto();
			});

			await test.step("Then the page should show the Dashboard heading", async () => {
				await dashboard.assertPageLoaded();
			});

			await test.step("And utility stats cards should be visible", async () => {
				await dashboard.assertStatsCardsVisible();
			});

			await test.step("And the real-time consumption chart should be visible", async () => {
				await expect(dashboard.realTimeChartSection()).toBeVisible();
			});

			await test.step("And the historical consumption chart should be visible", async () => {
				await expect(dashboard.historicalChartSection()).toBeVisible();
			});

			await test.step("And the house map should be visible", async () => {
				await dashboard.assertHouseMapVisible();
			});

			await test.step("And the user menu should be accessible", async () => {
				await dashboard.assertDashboardLoaded();
			});
		});

		test("Scenario: household user sees the monitoring dashboard", async ({
			userPage,
		}) => {
			const dashboard = new DashboardPage(userPage);

			await test.step("Given a household user is logged in", async () => {
				// userPage fixture provides an authenticated household user context
			});

			await test.step("When they navigate to the dashboard", async () => {
				await dashboard.goto();
			});

			await test.step("Then the dashboard heading should be visible", async () => {
				await dashboard.assertPageLoaded();
			});

			await test.step("And utility stats cards should be visible", async () => {
				await dashboard.assertStatsCardsVisible();
			});

			await test.step("And the charts should be visible", async () => {
				await dashboard.assertChartsVisible();
			});

			await test.step("And the house map should be visible", async () => {
				await dashboard.assertHouseMapVisible();
			});
		});
	});

	test.describe("Authorization", () => {
		test("Scenario: household user cannot access the map editor", async ({
			userPage,
		}) => {
			await test.step("Given a household user is logged in", async () => {
				// userPage fixture provides an authenticated household user context
			});

			await test.step("When they attempt to access the map editor page", async () => {
				await userPage.goto("/mapeditor");
			});

			await test.step("Then they should be redirected away", async () => {
				await expect(userPage).toHaveURL(/\/access-denied|\/dashboard/);
			});
		});
	});
});
