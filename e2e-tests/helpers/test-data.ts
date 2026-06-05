const RUN_TAG = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function workerTag(): string {
	const idx = process.env.TEST_PARALLEL_INDEX;
	return idx ? `w${idx}` : "";
}

export function uniqueUsername(prefix = "e2e-user") {
	const w = workerTag();
	return `${prefix}${w ? `-${w}` : ""}-${RUN_TAG}-${Math.random().toString(36).slice(2, 6)}`;
}

export function validUser(username?: string) {
	return {
		username: username || uniqueUsername(),
		password: "pass123",
	};
}

export function validThreshold(
	overrides?: Partial<{
		name: string;
		utilityType: string;
		thresholdType: string;
		value: number;
		periodType: string;
	}>,
) {
	return {
		name: overrides?.name || `${uniqueThreshold()}`,
		utilityType: overrides?.utilityType || "ELECTRICITY",
		thresholdType: overrides?.thresholdType || "FORECAST",
		value: overrides?.value ?? 100,
		periodType: overrides?.periodType || "ONE_DAY",
	};
}

function uniqueThreshold() {
	const tag = workerTag();
	return `e2e-threshold${tag ? `-${tag}` : ""}-${RUN_TAG}-${Math.random().toString(36).slice(2, 6)}`;
}

export function forecastEvaluationPayload(
	utilityType = "ELECTRICITY",
	values: number[],
) {
	const today = new Date();
	const dataPoints = values.map((value, i) => {
		const date = new Date(today);
		date.setDate(date.getDate() + i);
		return {
			date: date.toISOString().split("T")[0],
			value,
		};
	});

	return { utilityType, dataPoints };
}

export function forecastThresholdPayload(overrides?: {
	name?: string;
	utilityType?: string;
	value?: number;
}) {
	return {
		name: overrides?.name ?? uniqueThreshold(),
		utilityType: overrides?.utilityType ?? "ELECTRICITY",
		thresholdType: "FORECAST",
		value: overrides?.value ?? 50,
		periodType: "ONE_DAY",
	};
}

export function uniqueHookupName(prefix = "e2e-hookup") {
	const tag = workerTag();
	return `${prefix}${tag ? `-${tag}` : ""}-${RUN_TAG}-${Math.random().toString(36).slice(2, 6)}`;
}

const WAVES_LAB_DEVICES: Record<string, string[]> = {
	ELECTRICITY: [
		"refrigerator",
		"electric-oven",
		"washing-machine-electric",
		"electric-water-heater",
		"air-conditioner",
	],
	GAS: [
		"gas-boiler",
		"gas-stove",
		"gas-water-heater",
		"gas-fireplace",
		"gas-dryer",
	],
	WATER: [
		"shower",
		"kitchen-faucet",
		"dishwasher",
		"washing-machine-water",
		"garden-sprinkle",
	],
};

export function wavesLabEndpoint(utilityType = "ELECTRICITY"): string {
	const devices =
		WAVES_LAB_DEVICES[utilityType] || WAVES_LAB_DEVICES.ELECTRICITY;
	const device = devices[Math.floor(Math.random() * devices.length)];
	return `http://localhost:8000/api/devices/${device}`;
}

export function validHookup(
	overrides?: Partial<{
		name: string;
		utilityType: string;
		endpoint: string;
	}>,
) {
	return {
		name: overrides?.name || uniqueHookupName(),
		utilityType: overrides?.utilityType || "ELECTRICITY",
		endpoint:
			overrides?.endpoint ||
			`${wavesLabEndpoint(overrides?.utilityType || "ELECTRICITY")}?t=${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
	};
}

export function minimalFloorPlanSvg(): string {
	return '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="#f0f0f0"/></svg>';
}

export function uniqueZoneName(prefix = "e2e-zone") {
	const tag = workerTag();
	return `${prefix}${tag ? `-${tag}` : ""}-${RUN_TAG}-${Math.random().toString(36).slice(2, 6)}`;
}

export function zoneTriangleVertices(): { x: number; y: number }[] {
	return [
		{ x: 200, y: 150 },
		{ x: 450, y: 150 },
		{ x: 325, y: 420 },
	];
}

export function validZone(overrides?: {
	name?: string;
	color?: string;
	vertices?: { x: number; y: number }[];
}) {
	return {
		name: overrides?.name || uniqueZoneName(),
		color: overrides?.color || "#3b82f6",
		vertices: overrides?.vertices || zoneTriangleVertices(),
	};
}

export function timestampNow(): string {
	return new Date().toISOString();
}

export function validMeasurement(overrides?: {
	realTimeConsumption?: number;
	timestamp?: string;
	username?: string;
}) {
	return {
		realTimeConsumption: overrides?.realTimeConsumption ?? 1.5,
		timestamp: overrides?.timestamp ?? timestampNow(),
		...(overrides?.username !== undefined && { username: overrides.username }),
	};
}
