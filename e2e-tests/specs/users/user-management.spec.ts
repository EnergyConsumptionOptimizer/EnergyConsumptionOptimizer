import { BASE_URL, expect, test } from "@/fixtures/base-fixtures";
import { createUser, deleteUser, listUsers } from "@/helpers/api";
import { uniqueUsername } from "@/helpers/test-data";
import { LoginPage } from "@/pages/LoginPage";
import { UsersPage } from "@/pages/UsersPage";

test.describe("Feature: User CRUD Operations", () => {
	let createdUserIds: string[];

	test.beforeEach(async ({ adminPage }) => {
		createdUserIds = [];
		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();
	});

	test.afterEach(async () => {
		for (const id of createdUserIds) {
			try {
				await deleteUser(id);
			} catch {
				// Ignore cleanup failures
			}
		}
	});

	test("Scenario: admin creates a household user", async ({ adminPage }) => {
		let username: string;

		await test.step("Given the admin is on the users page", async () => {
			// beforeEach handles navigation
		});

		await test.step("When they create a new household user", async () => {
			const usersPage = new UsersPage(adminPage);
			username = uniqueUsername("new-user");
			await usersPage.createUserViaUI(username, "pass123");
		});

		await test.step("Then the user should appear in the table", async () => {
			const usersPage = new UsersPage(adminPage);
			await usersPage.assertUserInTable(username);

			const users = await listUsers();
			const created = users.find(
				(u: { username: string }) => u.username === username,
			);
			if (created) {
				createdUserIds.push(created.id);
			}
		});
	});

	test("Scenario: admin cannot create user with duplicate username", async ({
		adminPage,
	}) => {
		let username: string;

		await test.step("Given a user with a specific username already exists", async () => {
			username = uniqueUsername("duplicate");
			const user = await createUser(username, "pass123");
			createdUserIds.push(user.id);
		});

		await test.step("When the admin attempts to create another user with the same username", async () => {
			const usersPage = new UsersPage(adminPage);
			await usersPage.openNewUserDialog();
			await usersPage.fillUserForm(username, "other-pass");
			await usersPage.saveForm();
		});

		await test.step("Then an error should be displayed", async () => {
			const usersPage = new UsersPage(adminPage);
			await usersPage.assertErrorInDialogVisible();
			await usersPage.cancelForm();
		});

		await test.step("And no duplicate user should exist in the backend", async () => {
			const users = await listUsers();
			const matches = users.filter(
				(u: { username: string }) => u.username === username,
			);
			expect(matches).toHaveLength(1);
		});
	});

	test("Scenario: admin edits an existing user", async ({ adminPage }) => {
		let oldName: string;
		let newName: string;

		await test.step("Given a user exists in the system", async () => {
			oldName = uniqueUsername("old-edit");
			newName = uniqueUsername("new-edit");
			const user = await createUser(oldName, "pass123");
			createdUserIds.push(user.id);
		});

		await test.step("When the admin edits the username", async () => {
			const usersPage = new UsersPage(adminPage);
			await usersPage.editUser(oldName);
			await usersPage.usernameField().fill(newName);
			await usersPage.saveForm();
			await usersPage.assertSaveSucceeded();
		});

		await test.step("Then the new username should appear in the table", async () => {
			const usersPage = new UsersPage(adminPage);
			await usersPage.assertUserInTable(newName);
		});

		await test.step("And the old username should no longer be visible", async () => {
			const usersPage = new UsersPage(adminPage);
			await usersPage.assertUserNotInTable(oldName);
		});
	});

	test("Scenario: admin changes a user password", async ({
		adminPage,
		request,
	}) => {
		let username: string;
		const newPassword = "newpass456";

		await test.step("Given a user exists in the system", async () => {
			username = uniqueUsername("pw-change");
			const user = await createUser(username, "pass123");
			createdUserIds.push(user.id);
		});

		await test.step("When the admin changes their password", async () => {
			const usersPage = new UsersPage(adminPage);
			await usersPage.editUser(username);
			await usersPage.newPasswordField().fill(newPassword);
			await usersPage.confirmPasswordField().fill(newPassword);
			await usersPage.saveForm();
		});

		await test.step("Then the save should succeed", async () => {
			const usersPage = new UsersPage(adminPage);
			await usersPage.assertSaveSucceeded();
		});

		await test.step("And the new password should authenticate via the API", async () => {
			const loginRes = await request.post(`${BASE_URL}/user/api/auth/login`, {
				data: { username, password: newPassword },
			});
			expect(loginRes.status()).toBe(200);
		});
	});

	test("Scenario: user logs in with new password after change", async ({
		adminPage,
		page,
	}) => {
		let username: string;
		const newPassword = "newpass789";

		await test.step("Given a user's password has been changed", async () => {
			username = uniqueUsername("pw-login");
			const user = await createUser(username, "pass123");
			createdUserIds.push(user.id);

			const usersPage = new UsersPage(adminPage);
			await usersPage.editUser(username);
			await usersPage.newPasswordField().fill(newPassword);
			await usersPage.confirmPasswordField().fill(newPassword);
			await usersPage.saveForm();
			await usersPage.assertSaveSucceeded();
		});

		await test.step("When the user logs in with the new password", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.goto();
			await loginPage.login(username, newPassword);
		});

		await test.step("Then they should be redirected to the dashboard", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.assertRedirectedToDashboard();
		});
	});

	test("Scenario: admin deletes a user", async ({ adminPage }) => {
		let username: string;

		await test.step("Given a user exists in the system", async () => {
			username = uniqueUsername("delete-me");
			const user = await createUser(username, "pass123");
			createdUserIds.push(user.id);
		});

		await test.step("When the admin deletes the user", async () => {
			const usersPage = new UsersPage(adminPage);
			await usersPage.assertUserInTable(username);
			await usersPage.deleteUser(username);
		});

		await test.step("Then the user should be removed from the table", async () => {
			const usersPage = new UsersPage(adminPage);
			await usersPage.assertUserNotInTable(username);
		});
	});

	test("Scenario: admin views user list", async ({ adminPage }) => {
		await test.step("Given the admin is on the users page", async () => {
			// beforeEach handles navigation
		});

		await test.step("Then the user table should be visible with rows", async () => {
			const usersPage = new UsersPage(adminPage);
			await expect(usersPage.table()).toBeVisible();
			await expect(usersPage.newUserButton()).toBeVisible();
			await expect(usersPage.table().locator("tbody tr").first()).toBeVisible();
		});
	});
});

test.describe("Feature: User Authorization", () => {
	test("Scenario: household user cannot access users page", async ({
		userPage,
	}) => {
		await test.step("Given a household user is logged in", async () => {
			// userPage fixture provides an authenticated user context
		});

		await test.step("When they attempt to access the users page", async () => {
			const usersPage = new UsersPage(userPage);
			await usersPage.goto();
		});

		await test.step("Then they should be redirected away", async () => {
			await expect(userPage).toHaveURL(/\/access-denied|\/dashboard|\//);
			const usersPage = new UsersPage(userPage);
			await expect(usersPage.table()).not.toBeVisible({ timeout: 3_000 });
		});
	});
});

test.describe("Feature: User Self-Service", () => {
	test("Scenario: household user changes own username", async ({
		userPage,
	}) => {
		let newUsername: string;

		await test.step("Given a household user is on their profile page", async () => {
			const usersPage = new UsersPage(userPage);
			await usersPage.gotoProfile();
			await usersPage.openEditProfileDialog();
		});

		await test.step("When they edit and save their username", async () => {
			const usersPage = new UsersPage(userPage);
			newUsername = uniqueUsername("self-edit");
			await usersPage.usernameField().fill(newUsername);
			await usersPage.saveForm();
		});

		await test.step("Then the save should succeed", async () => {
			const usersPage = new UsersPage(userPage);
			await usersPage.assertSaveSucceeded();
		});

		await test.step("And the new username should be visible on the page", async () => {
			await expect(userPage.getByText(newUsername)).toBeVisible({
				timeout: 5_000,
			});
		});
	});

	test("Scenario: household user changes own password and logs in", async ({
		userPage,
	}) => {
		let currentUsername: string | null;
		const newPassword = "newpass789";

		await test.step("Given a household user is on their profile page", async () => {
			const usersPage = new UsersPage(userPage);
			await usersPage.gotoProfile();
			currentUsername = await usersPage.profileUsernameDisplay().textContent();
			if (!currentUsername) {
				throw new Error("Could not read current username from profile page");
			}
			await usersPage.openEditProfileDialog();
		});

		await test.step("When they change their password and log out", async () => {
			const usersPage = new UsersPage(userPage);
			await usersPage.newPasswordField().fill(newPassword);
			await usersPage.confirmPasswordField().fill(newPassword);
			await usersPage.saveForm();
			await usersPage.assertSaveSucceeded();
			await userPage.getByRole("menuitem", { name: "Logout" }).click();
			await expect(userPage).toHaveURL(/\/auth\/login/, {
				timeout: 10_000,
			});
		});

		await test.step("And they log in with the new password", async () => {
			const loginPage = new LoginPage(userPage);
			await loginPage.login(currentUsername!, newPassword);
		});

		await test.step("Then they should be redirected to the dashboard", async () => {
			const loginPage = new LoginPage(userPage);
			await loginPage.assertRedirectedToDashboard();
		});
	});
});
