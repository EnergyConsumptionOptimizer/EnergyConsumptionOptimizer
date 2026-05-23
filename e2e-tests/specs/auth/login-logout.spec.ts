import { expect, test } from "@/fixtures/base-fixtures";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";

test.describe("Feature: Authentication", () => {
	test("Scenario: log in with valid credentials", async ({ page }) => {
		await test.step("Given a user with valid credentials", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.goto();
			await expect(page).toHaveURL(/\/auth\/login/);
		});

		await test.step("When they submit the login form", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.login("admin", "admin");
		});

		await test.step("Then they should see the dashboard", async () => {
			await expect(page).toHaveURL("/");
		});

		await test.step("And the logout button should be visible", async () => {
			await expect(
				page.getByRole("menuitem", { name: "Logout" }),
			).toBeVisible();
		});
	});

	test("Scenario: show error with wrong password", async ({ page }) => {
		await test.step("Given a user with a valid username", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.goto();
		});

		await test.step("When they submit an incorrect password", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.login("admin", "wrong-password");
		});

		await test.step("Then they should see an authentication error", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.assertErrorContains(/invalid|incorrect|wrong/i);
		});
	});

	test("Scenario: show error with non-existent username", async ({ page }) => {
		await test.step("Given a non-existent username", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.goto();
		});

		await test.step("When they attempt to log in", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.login("nonexistent-user", "anything");
		});

		await test.step("Then they should see an authentication error", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.assertErrorContains(/invalid|incorrect|not found/i);
		});
	});
});

test.describe("Feature: Session Management", () => {
	test("Scenario: logout clears the session", async ({ adminPage }) => {
		await test.step("Given the user is logged in", async () => {
			const dashboard = new DashboardPage(adminPage);
			await dashboard.goto();
			await expect(adminPage).toHaveURL("/");
			await dashboard.assertDashboardLoaded();
		});

		await test.step("When they click the logout button", async () => {
			const dashboard = new DashboardPage(adminPage);
			await dashboard.logout();
		});

		await test.step("Then they should be redirected to the login page", async () => {
			await expect(
				adminPage.getByRole("button", { name: "Log In" }),
			).toBeVisible();
		});

		await test.step("And they should not be able to access protected pages", async () => {
			const dashboard = new DashboardPage(adminPage);
			await dashboard.goto();
			await expect(adminPage).toHaveURL(/\/auth\/login/);
		});
	});
});

test.describe("Feature: Route Protection", () => {
	test("Scenario: redirect back to requested page after login", async ({
		page,
	}) => {
		await test.step("Given an unauthenticated user attempts to access a protected page", async () => {
			await page.goto("/users");
			await expect(page).toHaveURL(/\/auth\/login\?redirect=/);
		});

		await test.step("When they log in with valid credentials", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.login("admin", "admin");
		});

		await test.step("Then they should be redirected to the originally requested page", async () => {
			await expect(page).toHaveURL(/\/users/);
		});
	});

	test("Scenario: logged-in user is redirected away from login page", async ({
		adminPage,
	}) => {
		await test.step("Given the user is already logged in", async () => {
			// adminPage fixture provides an authenticated context
		});

		await test.step("When they navigate to the login page", async () => {
			await adminPage.goto("/auth/login");
		});

		await test.step("Then they should be redirected to the dashboard", async () => {
			await expect(adminPage).toHaveURL("/");
		});
	});

	test("Scenario: guest is redirected to login", async ({ page }) => {
		await test.step("Given an unauthenticated user", async () => {
			// page fixture provides an unauthenticated context
		});

		await test.step("When they attempt to access the application", async () => {
			await page.goto("/");
		});

		await test.step("Then they should be redirected to the login page", async () => {
			await expect(page).toHaveURL(/\/auth\/login/);
			await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
		});
	});
});
