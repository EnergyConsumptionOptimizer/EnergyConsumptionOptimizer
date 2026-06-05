import { test as base, type BrowserContext, type Page } from "@playwright/test";

const ADMIN_AUTH_FILE = process.env.ADMIN_AUTH_FILE ?? "";
const USER_AUTH_FILE = process.env.USER_AUTH_FILE ?? "";

export const BASE_URL = process.env.BASE_URL || "http://localhost";

type AuthFixtures = {
	adminPage: Page;
	userPage: Page;
	freshAdminPage: Page;
	freshUserPage: Page;
};

function injectOnboardingCompleted(context: BrowserContext) {
	return context.addInitScript(() => {
		window.localStorage.setItem("onboarding_status", "completed");
	});
}

export const test = base.extend<AuthFixtures>({
	context: async ({ context }, use) => {
		await injectOnboardingCompleted(context);
		await use(context);
	},

	adminPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: ADMIN_AUTH_FILE,
		});
		await injectOnboardingCompleted(context);
		const page = await context.newPage();
		await use(page);
		await context.close();
	},

	userPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: USER_AUTH_FILE,
		});
		await injectOnboardingCompleted(context);
		const page = await context.newPage();
		await use(page);
		await context.close();
	},

	freshAdminPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: ADMIN_AUTH_FILE,
		});
		await context.addInitScript(() => {
			window.localStorage.removeItem("onboarding_status");
		});
		const page = await context.newPage();
		await use(page);
		await context.close();
	},

	freshUserPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: USER_AUTH_FILE,
		});
		await context.addInitScript(() => {
			window.localStorage.removeItem("onboarding_status");
		});
		const page = await context.newPage();
		await use(page);
		await context.close();
	},
});

export { expect } from "@playwright/test";
