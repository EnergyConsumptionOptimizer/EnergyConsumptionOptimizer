import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type FullConfig, request } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost";

function injectOnboardingCompleted(filePath: string) {
	const raw = fs.readFileSync(filePath, "utf-8");
	const state = JSON.parse(raw);

	for (const origin of state.origins || []) {
		origin.localStorage = origin.localStorage || [];
		const existing = origin.localStorage.find(
			(e: { name: string }) => e.name === "onboarding_status",
		);
		if (existing) {
			existing.value = "completed";
		} else {
			origin.localStorage.push({
				name: "onboarding_status",
				value: "completed",
			});
		}
	}

	if (!state.origins?.length) {
		state.origins = [
			{
				origin: BASE_URL,
				localStorage: [{ name: "onboarding_status", value: "completed" }],
			},
		];
	}

	fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

async function globalSetup(_config: FullConfig) {
	const runId =
		process.env.GITHUB_RUN_ID || process.env.CI_JOB_ID || Date.now().toString();
	const authDir = path.join(os.tmpdir(), "eco-e2e", runId);
	fs.mkdirSync(authDir, { recursive: true });

	const adminAuthFile = path.join(authDir, "admin.json");
	const userAuthFile = path.join(authDir, "user.json");
	const userInfoFile = path.join(authDir, "user-info.json");

	// ── Authenticate as admin ──────────────────────────────────────────
	const anonContext = await request.newContext();
	const loginRes = await anonContext.post(`${BASE_URL}/user/api/auth/login`, {
		data: { username: "admin", password: "admin" },
	});
	if (loginRes.status() !== 200) {
		throw new Error(
			`Admin login failed: ${loginRes.status()} ${await loginRes.text()}`,
		);
	}
	const body = await loginRes.json();
	if (body.role !== "ADMIN") {
		throw new Error(`Expected ADMIN role, got ${body.role}`);
	}
	await anonContext.storageState({ path: adminAuthFile });
	await anonContext.dispose();
	injectOnboardingCompleted(adminAuthFile);

	// ── Create household user ───────────────────────────────────────────
	const adminContext = await request.newContext({
		storageState: adminAuthFile,
	});
	const testUsername = `e2e-household-${Date.now()}`;
	const testPassword = "pass123";
	const createRes = await adminContext.post(`${BASE_URL}/user/api/users`, {
		data: { username: testUsername, password: testPassword },
	});
	if (createRes.status() !== 201) {
		throw new Error(
			`Create user failed: ${createRes.status()} ${await createRes.text()}`,
		);
	}
	const createdUser = await createRes.json();

	// ── Authenticate as household user ──────────────────────────────────
	const userLoginRes = await adminContext.post(
		`${BASE_URL}/user/api/auth/login`,
		{
			data: { username: testUsername, password: testPassword },
		},
	);
	if (userLoginRes.status() !== 200) {
		throw new Error(
			`User login failed: ${userLoginRes.status()} ${await userLoginRes.text()}`,
		);
	}
	await adminContext.storageState({ path: userAuthFile });
	await adminContext.dispose();
	injectOnboardingCompleted(userAuthFile);

	// ── Save user metadata for teardown ─────────────────────────────────
	fs.writeFileSync(
		userInfoFile,
		JSON.stringify({
			id: createdUser.id,
			username: testUsername,
			password: testPassword,
		}),
	);

	// ── Expose paths to downstream test workers ─────────────────────────
	process.env.ADMIN_AUTH_FILE = adminAuthFile;
	process.env.USER_AUTH_FILE = userAuthFile;
	process.env.USER_INFO_FILE = userInfoFile;
}

export default globalSetup;
