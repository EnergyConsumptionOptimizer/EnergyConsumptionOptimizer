import { test as base, type Page } from "@playwright/test";

const ADMIN_AUTH_FILE = process.env.ADMIN_AUTH_FILE ?? "";
const USER_AUTH_FILE = process.env.USER_AUTH_FILE ?? "";

export const BASE_URL = process.env.BASE_URL || "http://localhost";

type AuthFixtures = {
	adminPage: Page;
	userPage: Page;
};

export const test = base.extend<AuthFixtures>({
	context: async ({ context }, use) => {
		await context.addInitScript(() => {
			window.localStorage.setItem("onboarding_status", "completed");
		});
		await use(context);
	},

	adminPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: ADMIN_AUTH_FILE,
		});
		const page = await context.newPage();
		await use(page);
		await context.close();
	},

	userPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: USER_AUTH_FILE,
		});
		const page = await context.newPage();
		await use(page);
		await context.close();
	},
});

export { expect } from "@playwright/test";
