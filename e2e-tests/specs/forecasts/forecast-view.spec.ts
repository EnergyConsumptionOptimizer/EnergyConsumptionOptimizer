import { expect, test } from "@/fixtures/base-fixtures";
import {
	clearAllForecastData,
	generateDailyDataPoints,
	seedForecastData,
} from "@/helpers/mongo-seed";
import { ForecastsPage } from "@/pages/ForecastsPage";

test.describe("Feature: Forecast Page Access", () => {
	test("Scenario: guest is redirected to login", async ({ page }) => {
		await test.step("Given an unauthenticated user", async () => {
			// page fixture provides an unauthenticated context
		});

		await test.step("When they attempt to access the forecasts page", async () => {
			await page.goto("/forecasts");
		});

		await test.step("Then they should be redirected to the login page", async () => {
			await expect(page).toHaveURL(/\/auth\/login/);
			await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
		});
	});
});

test.describe("Feature: Forecast Widget Rendering", () => {
	test("Scenario: admin sees all utility widgets", async ({ adminPage }) => {
		await test.step("Given the admin is logged in", async () => {
			// adminPage fixture provides an authenticated admin context
		});

		await test.step("When they navigate to the forecasts page", async () => {
			const forecastsPage = new ForecastsPage(adminPage);
			await forecastsPage.goto();
			await forecastsPage.assertPageLoaded();
		});

		await test.step("Then all utility widgets should be visible", async () => {
			const forecastsPage = new ForecastsPage(adminPage);
			await forecastsPage.assertWidgetVisible("Electricity");
			await forecastsPage.assertWidgetVisible("Gas");
			await forecastsPage.assertWidgetVisible("Water");
		});
	});

	test("Scenario: each forecast widget renders content", async ({
		adminPage,
	}) => {
		await test.step("Given the admin is on the forecasts page", async () => {
			const forecastsPage = new ForecastsPage(adminPage);
			await forecastsPage.goto();
			await forecastsPage.assertPageLoaded();
		});

		await test.step("Then each widget should display either a chart or an empty state", async () => {
			const forecastsPage = new ForecastsPage(adminPage);
			await forecastsPage.assertWidgetHasContent("Electricity");
			await forecastsPage.assertWidgetHasContent("Gas");
			await forecastsPage.assertWidgetHasContent("Water");
		});
	});

	test("Scenario: household user sees all utility widgets", async ({
		userPage,
	}) => {
		await test.step("Given a household user is logged in", async () => {
			// userPage fixture provides an authenticated user context
		});

		await test.step("When they navigate to the forecasts page", async () => {
			const forecastsPage = new ForecastsPage(userPage);
			await forecastsPage.goto();
			await forecastsPage.assertPageLoaded();
		});

		await test.step("Then all utility widgets should be visible", async () => {
			const forecastsPage = new ForecastsPage(userPage);
			await forecastsPage.assertWidgetVisible("Electricity");
			await forecastsPage.assertWidgetVisible("Gas");
			await forecastsPage.assertWidgetVisible("Water");
		});
	});
});

test.describe("Feature: Forecast Data-Driven Rendering", () => {
	test.describe.configure({ retries: 1 });
	test.beforeAll(async ({ browser }) => {
		clearAllForecastData();
		const page = await browser.newPage();
		await page.goto("/forecasts");
		await page.close();
	});

	test.afterAll(() => {
		clearAllForecastData();
	});

	test("Scenario: seeded forecast data renders as bar chart", async ({
		adminPage,
	}) => {
		await test.step("Given forecast data has been seeded for Electricity", async () => {
			const dataPoints = generateDailyDataPoints(30);
			seedForecastData("ELECTRICITY", dataPoints);
		});

		await test.step("When the admin navigates to the forecasts page", async () => {
			const forecastsPage = new ForecastsPage(adminPage);
			await forecastsPage.goto();
			await forecastsPage.assertPageLoaded();
		});

		await test.step("Then the Electricity widget should display a bar chart", async () => {
			const forecastsPage = new ForecastsPage(adminPage);
			await forecastsPage.assertChartRendered("Electricity", 30_000);
		});

		await test.step("And the Gas and Water widgets should show empty states", async () => {
			const forecastsPage = new ForecastsPage(adminPage);
			await forecastsPage.assertEmptyStateVisible("Gas");
			await forecastsPage.assertEmptyStateVisible("Water");
		});
	});

	test("Scenario: switching period aggregates forecast data", async ({
		adminPage,
	}) => {
		let forecastsPage: ForecastsPage;

		await test.step("Given forecast data has been seeded for Electricity", async () => {
			const dataPoints = generateDailyDataPoints(30, 120, 60);
			seedForecastData("ELECTRICITY", dataPoints);
			forecastsPage = new ForecastsPage(adminPage);
			await forecastsPage.goto();
			await forecastsPage.assertPageLoaded();
			await forecastsPage.assertChartRendered("Electricity", 30_000);
			await forecastsPage.assertPeriodSelected("Electricity", "Daily");
		});

		await test.step("When the admin switches the period to Weekly", async () => {
			await forecastsPage.selectPeriod("Electricity", "Weekly");
		});

		await test.step("Then the chart should render with weekly aggregation", async () => {
			await forecastsPage.assertPeriodSelected("Electricity", "Weekly");
			await forecastsPage.assertChartRendered("Electricity");
			await expect(forecastsPage.emptyState("Electricity")).not.toBeVisible();
		});

		await test.step("When the admin switches the period to Monthly", async () => {
			await forecastsPage.selectPeriod("Electricity", "Monthly");
		});

		await test.step("Then the chart should render with monthly aggregation", async () => {
			await forecastsPage.assertPeriodSelected("Electricity", "Monthly");
			await forecastsPage.assertChartRendered("Electricity");
			await expect(forecastsPage.emptyState("Electricity")).not.toBeVisible();
		});
	});
});
