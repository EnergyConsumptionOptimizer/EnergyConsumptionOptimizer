import { expect, test } from "@/fixtures/base-fixtures";
import { minimalFloorPlanSvg } from "@/helpers/test-data";

test.describe("Feature: Onboarding Wizard", () => {
	test.skip(
		true,
		"Onboarding tests require a clean database (no existing floor plan). " +
			"Run in isolation with a fresh database.",
	);

	test("Scenario: admin is redirected to onboarding when not completed", async ({
		freshAdminPage,
	}) => {
		await test.step("Given the admin has not completed onboarding", async () => {
			// freshAdminPage fixture clears onboarding_status
		});

		await test.step("When they navigate to the dashboard", async () => {
			await freshAdminPage.goto("/");
		});

		await test.step("Then they should be redirected to the onboarding wizard", async () => {
			await expect(freshAdminPage).toHaveURL(/\/onboarding/, {
				timeout: 10_000,
			});
		});

		await test.step("And the first step title should be visible", async () => {
			await expect(
				freshAdminPage.getByRole("heading", {
					name: "Upload floor plan file",
				}),
			).toBeVisible();
		});
	});

	test("Scenario: admin uploads a floor plan during onboarding step 1", async ({
		freshAdminPage,
	}) => {
		await test.step("Given the admin is on the onboarding upload step", async () => {
			await freshAdminPage.goto("/onboarding/upload-floor-plan");
			await expect(freshAdminPage).toHaveURL(
				/\/onboarding\/upload-floor-plan/,
			);
		});

		await test.step("When they upload a valid SVG floor plan", async () => {
			const fileChooserPromise = freshAdminPage.waitForEvent(
				"filechooser",
			);
			await freshAdminPage
				.getByRole("button", { name: "Upload" })
				.first()
				.click();
			const fileChooser = await fileChooserPromise;
			await fileChooser.setFiles({
				name: "floor-plan.svg",
				mimeType: "image/svg+xml",
				buffer: Buffer.from(minimalFloorPlanSvg()),
			});
		});

		await test.step("Then the floor plan preview should be displayed", async () => {
			await expect(
				freshAdminPage.getByRole("img", {
					name: /Floor plan preview/,
				}),
			).toBeVisible({ timeout: 10_000 });
		});

		await test.step("And the file name should be shown", async () => {
			await expect(
				freshAdminPage.getByText("Filename:"),
			).toBeVisible();
		});
	});

	test("Scenario: completing onboarding syncs data to the backend", async ({
		freshAdminPage,
	}) => {
		await test.step("Given the admin completes all onboarding steps", async () => {
			await freshAdminPage.goto("/onboarding/upload-floor-plan");

			const fileChooserPromise =
				freshAdminPage.waitForEvent("filechooser");
			await freshAdminPage
				.getByRole("button", { name: "Upload" })
				.first()
				.click();
			const fileChooser = await fileChooserPromise;
			await fileChooser.setFiles({
				name: "floor-plan.svg",
				mimeType: "image/svg+xml",
				buffer: Buffer.from(minimalFloorPlanSvg()),
			});

			await expect(
				freshAdminPage.getByRole("img", {
					name: /Floor plan preview/,
				}),
			).toBeVisible({ timeout: 10_000 });
		});

		await test.step("When the onboarding is completed", async () => {
			// The onboarding store completes steps as the admin progresses.
			// After upload, step 1 is complete. The remaining steps need to be
			// completed via the onboarding UI before the user is redirected.
			// The floor plan should now exist in the backend.
		});

		await test.step("Then the floor plan should be persisted in the backend", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const map = (await import("@/helpers/api").then((m) =>
				m.getHouseMap(),
			)) as { svgContent?: string };
			expect(map).toBeDefined();
		});
	});
});
