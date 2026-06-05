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

export async function deleteAllThresholds() {
	const thresholds = (await listThresholds()) as { id: string }[];
	for (const t of thresholds) {
		try {
			await deleteThreshold(t.id);
		} catch {
			// Ignore individual failures
		}
	}
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

export async function createHookup(payload: {
	name: string;
	utilityType: string;
	endpoint: string;
}) {
	const ctx = await getAdminContext();
	const res = await ctx.post(`${BASE_URL}/hookup/api/smart-furniture-hookups`, {
		data: payload,
	});
	if (res.status() !== 201) {
		throw new Error(
			`Failed to create hookup: ${res.status()} ${await res.text()}`,
		);
	}
	return res.json();
}

export async function deleteHookup(hookupId: string) {
	const ctx = await getAdminContext();
	await ctx.delete(
		`${BASE_URL}/hookup/api/smart-furniture-hookups/${hookupId}`,
	);
}

export async function listHookups() {
	const ctx = await getAdminContext();
	const res = await ctx.get(`${BASE_URL}/hookup/api/smart-furniture-hookups`);
	const body = await res.json();
	return body.smartFurnitureHookups ?? body;
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

export async function createFloorPlan(svgContent: string) {
	const ctx = await getAdminContext();
	const res = await ctx.post(`${BASE_URL}/map/api/floor-plan`, {
		data: { svgContent },
	});
	if (res.status() !== 201) {
		throw new Error(
			`Failed to create floor plan: ${res.status()} ${await res.text()}`,
		);
	}
	return res.json();
}

export async function getHouseMap() {
	const ctx = await getAdminContext();
	const res = await ctx.get(`${BASE_URL}/map/api/house-map`);
	return res.json();
}

export async function createMapZone(payload: {
	name: string;
	color: string;
	vertices: { x: number; y: number }[];
}) {
	const ctx = await getAdminContext();
	const res = await ctx.post(`${BASE_URL}/map/api/zones`, {
		data: payload,
	});
	if (res.status() !== 201) {
		throw new Error(
			`Failed to create map zone: ${res.status()} ${await res.text()}`,
		);
	}
	return res.json();
}

export async function listMapZones() {
	const ctx = await getAdminContext();
	const res = await ctx.get(`${BASE_URL}/map/api/zones`);
	const body = await res.json();
	return (body as { zones?: unknown[] }).zones ?? body;
}

export async function deleteMapZone(zoneId: string) {
	const ctx = await getAdminContext();
	await ctx.delete(`${BASE_URL}/map/api/zones/${zoneId}`);
}

export async function placeHookupOnMap(payload: {
	id: string;
	position: { x: number; y: number };
	zoneID?: string;
}) {
	const ctx = await getAdminContext();
	const res = await ctx.patch(
		`${BASE_URL}/map/api/smart-furniture-hookups/${payload.id}`,
		{ data: { position: payload.position, zoneId: payload.zoneID } },
	);
	if (res.status() !== 200) {
		throw new Error(
			`Failed to place hookup on map: ${res.status()} ${await res.text()}`,
		);
	}
	return res.json();
}

export async function listMapHookups() {
	const ctx = await getAdminContext();
	const res = await ctx.get(`${BASE_URL}/map/api/smart-furniture-hookups`);
	const body = await res.json();
	return (
		(body as { smartFurnitureHookups?: unknown[] }).smartFurnitureHookups ??
		body
	);
}

export async function deleteMapHookup(hookupId: string) {
	const ctx = await getAdminContext();
	await ctx.delete(`${BASE_URL}/map/api/smart-furniture-hookups/${hookupId}`);
}

export async function clearAllMapZones() {
	const zones = (await listMapZones()) as { id: string }[];
	for (const z of zones) {
		try {
			await deleteMapZone(z.id);
		} catch {
			// Ignore individual failures
		}
	}
}

export async function clearAllMapHookups() {
	const hookups = (await listMapHookups()) as { id: string }[];
	for (const h of hookups) {
		try {
			await deleteMapHookup(h.id);
		} catch {
			// Ignore individual failures
		}
	}
}

export async function clearAllServiceHookups() {
	const hookups = (await listHookups()) as { id: string }[];
	for (const h of hookups) {
		try {
			await deleteHookup(h.id);
		} catch {
			// Ignore individual failures
		}
	}
}

export async function ingestMeasurement(
	hookupId: string,
	payload: {
		realTimeConsumption: number;
		timestamp?: string;
		username?: string;
	},
) {
	const ctx = await getAdminContext();
	const res = await ctx.post(
		`${BASE_URL}/monitoring/api/measurements?smart_furniture_hookup_id=${hookupId}`,
		{ data: payload },
	);
	return { status: res.status(), body: await res.json().catch(() => null) };
}

export async function queryUtilityConsumptions(
	utilityType: string,
	params?: {
		from?: string;
		to?: string;
		granularity?: string;
		username?: string;
		zoneID?: string;
	},
) {
	const ctx = await getAdminContext();
	const searchParams = new URLSearchParams();
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) {
				searchParams.set(key, value);
			}
		}
	}
	const qs = searchParams.toString();
	const res = await ctx.get(
		`${BASE_URL}/monitoring/api/internal/measurements/${utilityType}${qs ? `?${qs}` : ""}`,
	);
	return res.json();
}

export async function removeHouseholdUserTag(username: string) {
	const ctx = await getAdminContext();
	const res = await ctx.delete(
		`${BASE_URL}/monitoring/api/internal/measurements/household-user-tags/${username}`,
	);
	return res.status();
}

export async function removeZoneTag(zoneID: string) {
	const ctx = await getAdminContext();
	const res = await ctx.delete(
		`${BASE_URL}/monitoring/api/internal/measurements/zone-tags/${zoneID}`,
	);
	return res.status();
}

export async function listWavesLabDevices() {
	const ctx = await getAdminContext();
	const res = await ctx.get("http://localhost:8000/api/devices");
	return res.json();
}

export async function updateWavesLabDevice(
	deviceId: string,
	endpointUrl: string,
) {
	const ctx = await getAdminContext();
	const res = await ctx.patch(`http://localhost:8000/api/devices/${deviceId}`, {
		data: { endpoint_url: endpointUrl },
	});
	return res.json();
}

export async function checkWavesLabHealth(): Promise<boolean> {
	try {
		const ctx = await getAdminContext();
		const res = await ctx.get("http://localhost:8000/health");
		return res.ok();
	} catch {
		return false;
	}
}

export async function ensureFloorPlan(): Promise<string> {
	const ctx = await getAdminContext();
	const existing = await ctx.get(`${BASE_URL}/map/api/floor-plan`);
	if (existing.ok()) {
		const body = await existing.json();
		if (body?.svgContent) return body.svgContent;
	}
	const svg =
		'<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="#f0f0f0"/></svg>';
	try {
		await createFloorPlan(svg);
	} catch {
		// Floor plan may already exist — that's fine
	}
	return svg;
}

export async function seedNotification(): Promise<{ thresholdId: string; notification: { id: string; sourceId: string; message: string } }> {
	const { waitForNotificationBySourceId } = await import("./kafka-helper");
	const { forecastThresholdPayload, forecastEvaluationPayload } = await import("./test-data");

	const thresholdPayload = forecastThresholdPayload();
	thresholdPayload.value = 1;
	const threshold = await createThreshold(thresholdPayload);

	const evalPayload = forecastEvaluationPayload("ELECTRICITY", [100, 120, 150]);
	await triggerForecastEvaluation(evalPayload);

	const notification = await waitForNotificationBySourceId(threshold.id, 15_000);
	if (!notification) {
		throw new Error("Notification not created within timeout");
	}
	return { thresholdId: threshold.id, notification };
}
