import { defineConfig } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost";

export default defineConfig({
	testDir: "./specs",

	globalSetup: "./fixtures/global-setup",
	globalTeardown: "./fixtures/global-teardown",

	timeout: 30_000,
	expect: { timeout: 10_000 },

	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 4 : 1,

	reporter: [["html", { open: "never" }], ["list"]],

	use: {
		baseURL: BASE_URL,
		trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
		screenshot: "only-on-failure",
	},

	projects: [
		{
			name: "chromium",
			use: { browserName: "chromium" },
		},
	],
});
