import fs from "node:fs";
import { type FullConfig, request } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost";

async function globalTeardown(_config: FullConfig) {
	const userInfoFile = process.env.USER_INFO_FILE;
	const adminAuthFile = process.env.ADMIN_AUTH_FILE;

	if (!userInfoFile || !fs.existsSync(userInfoFile)) {
		console.warn("[teardown] No user-info file — skipping cleanup");
		return;
	}

	if (!adminAuthFile || !fs.existsSync(adminAuthFile)) {
		console.warn("[teardown] No admin auth file — skipping cleanup");
		return;
	}

	const { id, username } = JSON.parse(
		fs.readFileSync(userInfoFile, "utf-8"),
	) as { id: string; username: string };

	const adminContext = await request.newContext({
		storageState: adminAuthFile,
	});

	try {
		const deleteRes = await adminContext.delete(
			`${BASE_URL}/user/api/users/${id}`,
		);
		if (deleteRes.ok()) {
			console.log(`[teardown] Deleted user ${username} (${id})`);
		} else {
			console.warn(
				`[teardown] Delete user returned ${deleteRes.status()}: ${await deleteRes.text()}`,
			);
		}
	} finally {
		await adminContext.dispose();
	}
}

export default globalTeardown;
