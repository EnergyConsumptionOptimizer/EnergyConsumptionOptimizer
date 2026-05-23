import {
	type APIRequestContext,
	request as playwrightRequest,
} from "@playwright/test";
import { BASE_URL } from "@/fixtures/base-fixtures";

function getAdminAuthFile(): string {
	const fromEnv = process.env.ADMIN_AUTH_FILE;
	if (!fromEnv) {
		throw new Error("ADMIN_AUTH_FILE env var is not set. Did globalSetup run?");
	}
	return fromEnv;
}

let _adminContext: APIRequestContext | null = null;

async function getAdminContext(): Promise<APIRequestContext> {
	if (!_adminContext) {
		_adminContext = await playwrightRequest.newContext({
			storageState: getAdminAuthFile(),
		});
	}
	return _adminContext;
}

export async function disposeApiClient() {
	if (_adminContext) {
		await _adminContext.dispose();
		_adminContext = null;
	}
}

export async function createUser(username: string, password: string) {
	const ctx = await getAdminContext();
	const res = await ctx.post(`${BASE_URL}/user/api/users`, {
		data: { username, password },
	});
	if (res.status() !== 201) {
		throw new Error(
			`Failed to create user: ${res.status()} ${await res.text()}`,
		);
	}
	return res.json();
}

export async function deleteUser(userId: string) {
	const ctx = await getAdminContext();
	await ctx.delete(`${BASE_URL}/user/api/users/${userId}`);
}

export async function listUsers() {
	const ctx = await getAdminContext();
	const res = await ctx.get(`${BASE_URL}/user/api/users`);
	return res.json();
}

export async function createThreshold(payload: {
	name: string;
	utilityType: string;
	thresholdType: string;
	value: number;
	periodType?: string;
}) {
	const ctx = await getAdminContext();
	const res = await ctx.post(`${BASE_URL}/threshold/api/thresholds`, {
		data: payload,
	});
	if (res.status() !== 201) {
		throw new Error(
			`Failed to create threshold: ${res.status()} ${await res.text()}`,
		);
	}
	return res.json();
}

export async function updateThreshold(
	id: string,
	payload: Record<string, unknown>,
) {
	const ctx = await getAdminContext();
	const res = await ctx.put(`${BASE_URL}/threshold/api/thresholds/${id}`, {
		data: payload,
	});
	if (res.status() !== 200) {
		throw new Error(
			`Failed to update threshold: ${res.status()} ${await res.text()}`,
		);
	}
	return res.json();
}

export async function deleteThreshold(thresholdId: string) {
	const ctx = await getAdminContext();
	await ctx.delete(`${BASE_URL}/threshold/api/thresholds/${thresholdId}`);
}

export async function listThresholds() {
	const ctx = await getAdminContext();
	const res = await ctx.get(`${BASE_URL}/threshold/api/thresholds`);
	return res.json();
}

export async function triggerForecastEvaluation(payload: {
	utilityType: string;
	dataPoints: { date: string; value: number }[];
}) {
	const ctx = await getAdminContext();
	const res = await ctx.post(
		`${BASE_URL}/threshold/api/internal/thresholds/evaluations/forecast`,
		{ data: payload },
	);
	return { status: res.status(), body: await res.json().catch(() => null) };
}

export async function getNotifications() {
	const ctx = await getAdminContext();
	const res = await ctx.get(`${BASE_URL}/notification/api/notifications`);
	return res.json();
}

export async function getNotificationById(id: string) {
	const ctx = await getAdminContext();
	const res = await ctx.get(`${BASE_URL}/notification/api/notifications/${id}`);
	return res.json();
}

export async function deleteNotification(id: string) {
	const ctx = await getAdminContext();
	await ctx.delete(`${BASE_URL}/notification/api/notifications/${id}`);
}

export async function deleteAllNotifications() {
	const ctx = await getAdminContext();
	await ctx.delete(`${BASE_URL}/notification/api/notifications`);
}
