import { expect, test } from "@/fixtures/base-fixtures";
import {
	createThreshold,
	deleteThreshold,
	listThresholds,
} from "@/helpers/api";
import { forecastThresholdPayload } from "@/helpers/test-data";
import { ThresholdsPage } from "@/pages/ThresholdsPage";

test.describe("Feature: Threshold Management", () => {
	test.slow();
	let createdThresholdIds: string[];

	test.beforeEach(async ({ adminPage }) => {
		createdThresholdIds = [];
		const thresholdsPage = new ThresholdsPage(adminPage);
		await thresholdsPage.goto();
		await expect(adminPage).toHaveURL(/\/thresholds/);
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

	test("Scenario: admin views threshold list", async ({ adminPage }) => {
		await test.step("Given the admin is on the thresholds page", async () => {
			// beforeEach handles navigation
		});

		await test.step("Then the threshold table should be visible with rows", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await expect(thresholdsPage.table()).toBeVisible();
			await expect(thresholdsPage.newButton()).toBeVisible();
			await expect(
				thresholdsPage.table().locator("tbody tr").first(),
			).toBeVisible();
		});
	});

	test("Scenario: admin creates a new threshold", async ({ adminPage }) => {
		let payload: ReturnType<typeof forecastThresholdPayload>;

		await test.step("Given the admin opens the new threshold dialog", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			payload = forecastThresholdPayload();
			await thresholdsPage.openNewDialog();
		});

		await test.step("When they fill in the form with valid data and save", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await thresholdsPage.fillForm({
				name: payload.name,
				utilityType: payload.utilityType,
				thresholdType: payload.thresholdType,
				value: payload.value,
				periodType: payload.periodType,
			});
			await thresholdsPage.saveForm();
		});

		await test.step("Then the new threshold should appear in the table", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await thresholdsPage.assertThresholdInTable(payload.name);

			const thresholds = await listThresholds();
			const created = thresholds.find(
				(t: { name: string }) => t.name === payload.name,
			);
			if (created) {
				createdThresholdIds.push(created.id);
			}
		});
	});

	test("Scenario: empty threshold form shows validation errors", async ({
		adminPage,
	}) => {
		await test.step("Given the admin opens the new threshold dialog", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await thresholdsPage.openNewDialog();
		});

		await test.step("When they submit the form without filling any fields", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await thresholdsPage.saveButton().click();
		});

		await test.step("Then validation error messages should appear", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await expect(thresholdsPage.errorInDialog().first()).toBeVisible({
				timeout: 5_000,
			});
			await expect(thresholdsPage.errorInDialog().first()).toContainText(
				/required|must be|mandatory|please|enter/i,
			);
			await thresholdsPage.cancelForm();
		});
	});

	test("Scenario: admin edits threshold name and value", async ({
		adminPage,
	}) => {
		let original: ReturnType<typeof forecastThresholdPayload>;
		let editedName: string;
		const editedValue = 200;

		await test.step("Given a threshold exists", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			original = forecastThresholdPayload();
			const created = await createThreshold(
				forecastThresholdPayload({ name: original.name }),
			);
			createdThresholdIds.push(created.id);

			editedName = forecastThresholdPayload().name;
			await thresholdsPage.openEditDialog(original.name);
		});

		await test.step("When the admin edits its name and value", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await thresholdsPage.nameField().fill(editedName);
			await thresholdsPage.valueField().fill(String(editedValue));
			await thresholdsPage.saveForm();
		});

		await test.step("Then the updated threshold should appear in the table", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await thresholdsPage.assertThresholdInTable(editedName);
			await thresholdsPage.assertThresholdNotInTable(original.name);
		});

		await test.step("And the new value should be persisted in the backend", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await thresholdsPage.searchForThreshold(editedName);
			const row = thresholdsPage.getRowByName(editedName);
			await expect(row).toContainText(String(editedValue));

			const thresholds = await listThresholds();
			const edited = thresholds.find(
				(t: { name: string }) => t.name === editedName,
			);
			expect(edited).toBeDefined();
			expect(edited.value).toBe(editedValue);
		});
	});

	test("Scenario: admin toggles threshold active state", async ({
		adminPage,
	}) => {
		let payload: ReturnType<typeof forecastThresholdPayload>;
		let created: { id: string };

		await test.step("Given a threshold is enabled", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			payload = forecastThresholdPayload();
			created = await createThreshold(
				forecastThresholdPayload({ name: payload.name }),
			);
			createdThresholdIds.push(created.id);
			await thresholdsPage.assertThresholdInTable(payload.name);
		});

		await test.step("When the admin toggles its active state", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			const toggle = thresholdsPage.toggleSwitchFor(payload.name);
			await expect(toggle).toBeVisible();
			await expect(toggle.locator("input")).toHaveAttribute(
				"aria-checked",
				"true",
			);
			await toggle.click();
		});

		await test.step("Then it should be disabled in the backend", async () => {
			const thresholds = await listThresholds();
			const updated = thresholds.find(
				(t: { id: string }) => t.id === created.id,
			);
			expect(updated).toBeDefined();
			const currentState = updated.thresholdState || updated.state;
			expect(currentState).toBe("DISABLED");
		});

		await test.step("And the toggle should visually reflect the disabled state", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			const toggle = thresholdsPage.toggleSwitchFor(payload.name);
			await expect(toggle.locator("input")).toHaveAttribute(
				"aria-checked",
				"false",
			);
		});
	});

	test("Scenario: admin deletes a threshold", async ({ adminPage }) => {
		let payload: ReturnType<typeof forecastThresholdPayload>;
		let created: { id: string };

		await test.step("Given a threshold exists", async () => {
			payload = forecastThresholdPayload();
			created = await createThreshold(
				forecastThresholdPayload({ name: payload.name }),
			);
			createdThresholdIds.push(created.id);
		});

		await test.step("When the admin deletes it", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await thresholdsPage.assertThresholdInTable(payload.name);
			await thresholdsPage.deleteThreshold(payload.name);
		});

		await test.step("Then it should be removed from the table", async () => {
			const thresholdsPage = new ThresholdsPage(adminPage);
			await thresholdsPage.assertThresholdNotInTable(payload.name);
		});

		await test.step("And it should not exist in the backend", async () => {
			const remaining = await listThresholds();
			expect(
				remaining.find((t: { id: string }) => t.id === created.id),
			).toBeUndefined();
		});
	});
});

test.describe("Feature: Threshold Authorization", () => {
	test("Scenario: household user cannot access thresholds page", async ({
		userPage,
	}) => {
		await test.step("Given a household user is logged in", async () => {
			// userPage fixture provides an authenticated user context
		});

		await test.step("When they attempt to access the thresholds page", async () => {
			await userPage.goto("/thresholds");
		});

		await test.step("Then they should be redirected away", async () => {
			await expect(userPage).toHaveURL(/\/access-denied|\/dashboard/);
		});
	});
});
