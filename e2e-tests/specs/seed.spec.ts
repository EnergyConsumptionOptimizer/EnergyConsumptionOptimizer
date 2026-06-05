import { test, expect } from "@/fixtures/base-fixtures";

test("seed", async ({ adminPage }) => {
	await adminPage.goto("/");
	await expect(adminPage).toHaveURL("/");
	await expect(
		adminPage.getByRole("heading", { name: "Dashboard" }),
	).toBeVisible();
});
